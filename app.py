"""
MapToPoster Web Application
A Flask-based webapp for generating beautiful map posters.
"""

import os
import io
import gc
import json
import time
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file, Response
from geopy.geocoders import Nominatim
import osmnx as ox
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
import matplotlib.colors as mcolors
import numpy as np

app = Flask(__name__)

# Memory optimization settings
MAX_DISTANCE = 15000  # Limit max radius to 15km for memory
LOW_MEMORY_MODE = os.environ.get('LOW_MEMORY', 'true').lower() == 'true'

# Configuration
THEMES_DIR = "themes"
FONTS_DIR = "fonts"
EXPORTS_DIR = "exports"

# Ensure exports directory exists
os.makedirs(EXPORTS_DIR, exist_ok=True)

# Global cache for fonts
FONTS = None

def load_fonts():
    """Load Roboto fonts from the fonts directory."""
    global FONTS
    fonts = {
        'bold': os.path.join(FONTS_DIR, 'Roboto-Bold.ttf'),
        'regular': os.path.join(FONTS_DIR, 'Roboto-Regular.ttf'),
        'light': os.path.join(FONTS_DIR, 'Roboto-Light.ttf')
    }

    for weight, path in fonts.items():
        if not os.path.exists(path):
            print(f"Warning: Font not found: {path}")
            return None

    FONTS = fonts
    return fonts

# Load fonts on startup
load_fonts()


def get_available_themes():
    """Get list of available themes."""
    if not os.path.exists(THEMES_DIR):
        return []

    themes = []
    for file in sorted(os.listdir(THEMES_DIR)):
        if file.endswith('.json'):
            theme_name = file[:-5]
            theme_path = os.path.join(THEMES_DIR, f"{theme_name}.json")
            try:
                with open(theme_path, 'r') as f:
                    theme_data = json.load(f)
                    themes.append({
                        'id': theme_name,
                        'name': theme_data.get('name', theme_name),
                        'description': theme_data.get('description', ''),
                        'bg': theme_data.get('bg', '#FFFFFF'),
                        'text': theme_data.get('text', '#000000')
                    })
            except Exception:
                themes.append({
                    'id': theme_name,
                    'name': theme_name,
                    'description': '',
                    'bg': '#FFFFFF',
                    'text': '#000000'
                })
    return themes


def load_theme(theme_name):
    """Load theme from JSON file."""
    theme_file = os.path.join(THEMES_DIR, f"{theme_name}.json")

    if not os.path.exists(theme_file):
        return {
            "name": "Default",
            "bg": "#FFFFFF",
            "text": "#000000",
            "gradient_color": "#FFFFFF",
            "water": "#C0C0C0",
            "parks": "#F0F0F0",
            "road_motorway": "#0A0A0A",
            "road_primary": "#1A1A1A",
            "road_secondary": "#2A2A2A",
            "road_tertiary": "#3A3A3A",
            "road_residential": "#4A4A4A",
            "road_default": "#3A3A3A"
        }

    with open(theme_file, 'r') as f:
        return json.load(f)


def create_gradient_fade(ax, color, location='bottom', zorder=10):
    """Creates a fade effect at the top or bottom of the map."""
    vals = np.linspace(0, 1, 256).reshape(-1, 1)
    gradient = np.hstack((vals, vals))

    rgb = mcolors.to_rgb(color)
    my_colors = np.zeros((256, 4))
    my_colors[:, 0] = rgb[0]
    my_colors[:, 1] = rgb[1]
    my_colors[:, 2] = rgb[2]

    if location == 'bottom':
        my_colors[:, 3] = np.linspace(1, 0, 256)
        extent_y_start = 0
        extent_y_end = 0.25
    else:
        my_colors[:, 3] = np.linspace(0, 1, 256)
        extent_y_start = 0.75
        extent_y_end = 1.0

    custom_cmap = mcolors.ListedColormap(my_colors)

    xlim = ax.get_xlim()
    ylim = ax.get_ylim()
    y_range = ylim[1] - ylim[0]

    y_bottom = ylim[0] + y_range * extent_y_start
    y_top = ylim[0] + y_range * extent_y_end

    ax.imshow(gradient, extent=[xlim[0], xlim[1], y_bottom, y_top],
              aspect='auto', cmap=custom_cmap, zorder=zorder, origin='lower')


def get_edge_colors_by_type(G, theme):
    """Assigns colors to edges based on road type hierarchy."""
    edge_colors = []

    for u, v, data in G.edges(data=True):
        highway = data.get('highway', 'unclassified')
        if isinstance(highway, list):
            highway = highway[0] if highway else 'unclassified'

        if highway in ['motorway', 'motorway_link']:
            color = theme['road_motorway']
        elif highway in ['trunk', 'trunk_link', 'primary', 'primary_link']:
            color = theme['road_primary']
        elif highway in ['secondary', 'secondary_link']:
            color = theme['road_secondary']
        elif highway in ['tertiary', 'tertiary_link']:
            color = theme['road_tertiary']
        elif highway in ['residential', 'living_street', 'unclassified']:
            color = theme['road_residential']
        else:
            color = theme['road_default']

        edge_colors.append(color)

    return edge_colors


def get_edge_widths_by_type(G):
    """Assigns line widths to edges based on road type."""
    edge_widths = []

    for u, v, data in G.edges(data=True):
        highway = data.get('highway', 'unclassified')
        if isinstance(highway, list):
            highway = highway[0] if highway else 'unclassified'

        if highway in ['motorway', 'motorway_link']:
            width = 1.2
        elif highway in ['trunk', 'trunk_link', 'primary', 'primary_link']:
            width = 1.0
        elif highway in ['secondary', 'secondary_link']:
            width = 0.8
        elif highway in ['tertiary', 'tertiary_link']:
            width = 0.6
        else:
            width = 0.4

        edge_widths.append(width)

    return edge_widths


def generate_poster(lat, lon, city_name, country_name, theme_name, distance, export_format='png'):
    """
    Generate a map poster and return as bytes.

    Args:
        lat: Latitude
        lon: Longitude
        city_name: Display name for the city
        country_name: Display name for the country
        theme_name: Theme to use
        distance: Map radius in meters
        export_format: 'png' or 'svg'

    Returns:
        tuple: (bytes_io, mimetype, filename)
    """
    # Memory optimization: limit distance
    distance = min(distance, MAX_DISTANCE)

    theme = load_theme(theme_name)
    point = (lat, lon)

    # Fetch map data - use simpler network type in low memory mode
    network_type = 'drive' if LOW_MEMORY_MODE else 'all'
    G = ox.graph_from_point(point, dist=distance, dist_type='bbox', network_type=network_type)
    time.sleep(0.3)

    water = None
    parks = None

    # Skip water/parks in low memory mode to save RAM
    if not LOW_MEMORY_MODE:
        try:
            water = ox.features_from_point(point, tags={'natural': 'water', 'waterway': 'riverbank'}, dist=distance)
        except Exception:
            water = None
        time.sleep(0.2)

        try:
            parks = ox.features_from_point(point, tags={'leisure': 'park', 'landuse': 'grass'}, dist=distance)
        except Exception:
            parks = None

    # Setup plot - smaller figure in low memory mode
    figsize = (10, 13) if LOW_MEMORY_MODE else (12, 16)
    fig, ax = plt.subplots(figsize=figsize, facecolor=theme['bg'])
    ax.set_facecolor(theme['bg'])
    ax.set_position([0, 0, 1, 1])

    # Plot layers
    if water is not None and not water.empty:
        water.plot(ax=ax, facecolor=theme['water'], edgecolor='none', zorder=1)
    if parks is not None and not parks.empty:
        parks.plot(ax=ax, facecolor=theme['parks'], edgecolor='none', zorder=2)

    # Roads
    edge_colors = get_edge_colors_by_type(G, theme)
    edge_widths = get_edge_widths_by_type(G)

    ox.plot_graph(
        G, ax=ax, bgcolor=theme['bg'],
        node_size=0,
        edge_color=edge_colors,
        edge_linewidth=edge_widths,
        show=False, close=False
    )

    # Gradients
    create_gradient_fade(ax, theme['gradient_color'], location='bottom', zorder=10)
    create_gradient_fade(ax, theme['gradient_color'], location='top', zorder=10)

    # Typography
    if FONTS:
        font_main = FontProperties(fname=FONTS['bold'], size=60)
        font_sub = FontProperties(fname=FONTS['light'], size=22)
        font_coords = FontProperties(fname=FONTS['regular'], size=14)
        font_attr = FontProperties(fname=FONTS['light'], size=8)
    else:
        font_main = FontProperties(family='monospace', weight='bold', size=60)
        font_sub = FontProperties(family='monospace', weight='normal', size=22)
        font_coords = FontProperties(family='monospace', size=14)
        font_attr = FontProperties(family='monospace', size=8)

    spaced_city = "  ".join(list(city_name.upper()))

    ax.text(0.5, 0.14, spaced_city, transform=ax.transAxes,
            color=theme['text'], ha='center', fontproperties=font_main, zorder=11)

    ax.text(0.5, 0.10, country_name.upper(), transform=ax.transAxes,
            color=theme['text'], ha='center', fontproperties=font_sub, zorder=11)

    coords_text = f"{lat:.4f}{'° N' if lat >= 0 else '° S'} / {abs(lon):.4f}{'° E' if lon >= 0 else '° W'}"

    ax.text(0.5, 0.07, coords_text, transform=ax.transAxes,
            color=theme['text'], alpha=0.7, ha='center', fontproperties=font_coords, zorder=11)

    ax.plot([0.4, 0.6], [0.125, 0.125], transform=ax.transAxes,
            color=theme['text'], linewidth=1, zorder=11)

    ax.text(0.98, 0.02, "© OpenStreetMap contributors", transform=ax.transAxes,
            color=theme['text'], alpha=0.5, ha='right', va='bottom',
            fontproperties=font_attr, zorder=11)

    # Generate output
    buffer = io.BytesIO()
    city_slug = city_name.lower().replace(' ', '_').replace(',', '')
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if export_format == 'svg':
        plt.savefig(buffer, format='svg', facecolor=theme['bg'])
        mimetype = 'image/svg+xml'
        filename = f"{city_slug}_{theme_name}_{timestamp}.svg"
    else:
        # Lower DPI in low memory mode (150 vs 300)
        dpi = 150 if LOW_MEMORY_MODE else 300
        plt.savefig(buffer, format='png', dpi=dpi, facecolor=theme['bg'])
        mimetype = 'image/png'
        filename = f"{city_slug}_{theme_name}_{timestamp}.png"

    plt.close(fig)
    plt.close('all')  # Close any remaining figures

    # Memory cleanup
    del G
    if water is not None:
        del water
    if parks is not None:
        del parks
    gc.collect()

    buffer.seek(0)
    return buffer, mimetype, filename


# Routes
@app.route('/')
def index():
    """Serve the main page."""
    return render_template('index.html')


@app.route('/api/themes')
def api_themes():
    """Get available themes."""
    themes = get_available_themes()
    return jsonify(themes)


@app.route('/api/geocode')
def api_geocode():
    """Geocode a location query."""
    query = request.args.get('q', '')
    if not query:
        return jsonify({'error': 'Query parameter q is required'}), 400

    try:
        geolocator = Nominatim(user_agent="maptoposter_webapp")
        time.sleep(1)  # Rate limiting
        location = geolocator.geocode(query, addressdetails=True)

        if location:
            address = location.raw.get('address', {})
            city = address.get('city') or address.get('town') or address.get('village') or address.get('municipality') or query.split(',')[0].strip()
            country = address.get('country', '')

            return jsonify({
                'lat': location.latitude,
                'lon': location.longitude,
                'display_name': location.address,
                'city': city,
                'country': country
            })
        else:
            return jsonify({'error': 'Location not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate', methods=['POST'])
def api_generate():
    """Generate a map poster."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'JSON body is required'}), 400

    lat = data.get('lat')
    lon = data.get('lon')
    city_name = data.get('city', 'City')
    country_name = data.get('country', '')
    theme_name = data.get('theme', 'feature_based')
    distance = data.get('distance', 10000)
    export_format = data.get('format', 'png')

    if lat is None or lon is None:
        return jsonify({'error': 'lat and lon are required'}), 400

    if export_format not in ['png', 'svg']:
        return jsonify({'error': 'format must be png or svg'}), 400

    try:
        buffer, mimetype, filename = generate_poster(
            lat=float(lat),
            lon=float(lon),
            city_name=city_name,
            country_name=country_name,
            theme_name=theme_name,
            distance=int(distance),
            export_format=export_format
        )

        return send_file(
            buffer,
            mimetype=mimetype,
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("MapToPoster Web Application")
    print("=" * 50)
    print(f"Themes available: {len(get_available_themes())}")
    print(f"Fonts loaded: {'Yes' if FONTS else 'No'}")
    print("Starting server at http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)

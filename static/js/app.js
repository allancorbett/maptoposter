/**
 * MapToPoster Web Application
 * Interactive map-based poster generator
 */

// State
const state = {
    map: null,
    marker: null,
    radiusCircle: null,
    selectedLocation: null,
    selectedTheme: 'feature_based',
    distance: 10000,
    themes: []
};

// DOM Elements
const elements = {
    searchInput: null,
    searchBtn: null,
    searchResults: null,
    locationInfo: null,
    cityName: null,
    countryName: null,
    coordsLat: null,
    coordsLon: null,
    distanceSlider: null,
    distanceValue: null,
    themeGrid: null,
    exportPng: null,
    exportSvg: null,
    loadingOverlay: null,
    loadingStatus: null,
    instructionsOverlay: null,
    dismissInstructions: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initMap();
    loadThemes();
    bindEvents();
    checkInstructions();
});

function initElements() {
    elements.searchInput = document.getElementById('search-input');
    elements.searchBtn = document.getElementById('search-btn');
    elements.searchResults = document.getElementById('search-results');
    elements.locationInfo = document.getElementById('location-info');
    elements.cityName = document.getElementById('city-name');
    elements.countryName = document.getElementById('country-name');
    elements.coordsLat = document.getElementById('coords-lat');
    elements.coordsLon = document.getElementById('coords-lon');
    elements.distanceSlider = document.getElementById('distance-slider');
    elements.distanceValue = document.getElementById('distance-value');
    elements.themeGrid = document.getElementById('theme-grid');
    elements.exportPng = document.getElementById('export-png');
    elements.exportSvg = document.getElementById('export-svg');
    elements.loadingOverlay = document.getElementById('loading-overlay');
    elements.loadingStatus = document.getElementById('loading-status');
    elements.instructionsOverlay = document.getElementById('instructions-overlay');
    elements.dismissInstructions = document.getElementById('dismiss-instructions');
}

function initMap() {
    // Create the map centered on world view
    state.map = L.map('map', {
        center: [30, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18
    });

    // Add tile layer (CartoDB Positron for clean look)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(state.map);

    // Handle map clicks
    state.map.on('click', handleMapClick);
}

async function loadThemes() {
    try {
        const response = await fetch('/api/themes');
        state.themes = await response.json();
        renderThemes();
    } catch (error) {
        console.error('Failed to load themes:', error);
    }
}

function renderThemes() {
    elements.themeGrid.innerHTML = '';

    state.themes.forEach(theme => {
        const card = document.createElement('div');
        card.className = 'theme-card' + (theme.id === state.selectedTheme ? ' selected' : '');
        card.style.background = theme.bg;
        card.setAttribute('data-name', theme.id.replace(/_/g, ' '));
        card.setAttribute('data-theme', theme.id);
        card.title = theme.description || theme.name;

        // Add a small indicator for text color
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: absolute;
            top: 6px;
            right: 6px;
            width: 10px;
            height: 10px;
            background: ${theme.text};
            border-radius: 50%;
            border: 1px solid rgba(128, 128, 128, 0.3);
        `;
        card.appendChild(indicator);

        card.addEventListener('click', () => selectTheme(theme.id));
        elements.themeGrid.appendChild(card);
    });
}

function selectTheme(themeId) {
    state.selectedTheme = themeId;

    // Update UI
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('selected', card.getAttribute('data-theme') === themeId);
    });
}

function bindEvents() {
    // Search
    elements.searchBtn.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Distance slider
    elements.distanceSlider.addEventListener('input', (e) => {
        state.distance = parseInt(e.target.value);
        elements.distanceValue.textContent = (state.distance / 1000) + 'km';
        updateRadiusCircle();
    });

    // Export buttons
    elements.exportPng.addEventListener('click', () => exportPoster('png'));
    elements.exportSvg.addEventListener('click', () => exportPoster('svg'));

    // Dismiss instructions
    elements.dismissInstructions.addEventListener('click', () => {
        elements.instructionsOverlay.classList.add('hidden');
        localStorage.setItem('maptoposter_instructions_seen', 'true');
    });

    // Update location names on input change
    elements.cityName.addEventListener('change', updateExportButtons);
    elements.countryName.addEventListener('change', updateExportButtons);
}

function checkInstructions() {
    if (localStorage.getItem('maptoposter_instructions_seen')) {
        elements.instructionsOverlay.classList.add('hidden');
    }
}

async function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;

    elements.searchResults.innerHTML = '<div class="search-result-item">Searching...</div>';

    try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (response.ok) {
            selectLocation({
                lat: data.lat,
                lon: data.lon,
                city: data.city,
                country: data.country,
                display_name: data.display_name
            });
            elements.searchResults.innerHTML = '';
        } else {
            elements.searchResults.innerHTML = `<div class="search-result-item">${data.error || 'Location not found'}</div>`;
        }
    } catch (error) {
        elements.searchResults.innerHTML = '<div class="search-result-item">Search failed. Please try again.</div>';
        console.error('Search error:', error);
    }
}

async function handleMapClick(e) {
    const { lat, lng } = e.latlng;

    // Show loading in search results
    elements.searchResults.innerHTML = '<div class="search-result-item">Looking up location...</div>';

    try {
        // Reverse geocode the clicked location
        const response = await fetch(`/api/geocode?q=${lat},${lng}`);
        const data = await response.json();

        if (response.ok) {
            selectLocation({
                lat: lat,
                lon: lng,
                city: data.city || 'Unknown',
                country: data.country || '',
                display_name: data.display_name
            });
        } else {
            // Use coordinates directly if geocoding fails
            selectLocation({
                lat: lat,
                lon: lng,
                city: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                country: '',
                display_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            });
        }
        elements.searchResults.innerHTML = '';
    } catch (error) {
        console.error('Reverse geocode error:', error);
        // Use coordinates directly
        selectLocation({
            lat: lat,
            lon: lng,
            city: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            country: '',
            display_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        });
        elements.searchResults.innerHTML = '';
    }
}

function selectLocation(location) {
    state.selectedLocation = location;

    // Update marker
    if (state.marker) {
        state.map.removeLayer(state.marker);
    }

    state.marker = L.circleMarker([location.lat, location.lon], {
        radius: 10,
        fillColor: '#2563eb',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 3
    }).addTo(state.map);

    // Update radius circle
    updateRadiusCircle();

    // Pan to location
    state.map.setView([location.lat, location.lon], 12);

    // Update sidebar
    elements.locationInfo.classList.remove('hidden');
    elements.cityName.value = location.city;
    elements.countryName.value = location.country;
    elements.coordsLat.textContent = location.lat.toFixed(6);
    elements.coordsLon.textContent = location.lon.toFixed(6);

    // Enable export buttons
    updateExportButtons();

    // Hide instructions if visible
    elements.instructionsOverlay.classList.add('hidden');
    localStorage.setItem('maptoposter_instructions_seen', 'true');
}

function updateRadiusCircle() {
    if (!state.selectedLocation) return;

    if (state.radiusCircle) {
        state.map.removeLayer(state.radiusCircle);
    }

    state.radiusCircle = L.circle([state.selectedLocation.lat, state.selectedLocation.lon], {
        radius: state.distance,
        color: '#2563eb',
        fillColor: '#2563eb',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '8, 8',
        className: 'radius-circle'
    }).addTo(state.map);
}

function updateExportButtons() {
    const enabled = state.selectedLocation !== null;
    elements.exportPng.disabled = !enabled;
    elements.exportSvg.disabled = !enabled;
}

async function exportPoster(format) {
    if (!state.selectedLocation) return;

    // Show loading
    elements.loadingOverlay.classList.remove('hidden');
    elements.loadingStatus.textContent = 'Fetching map data...';

    const cityName = elements.cityName.value || state.selectedLocation.city;
    const countryName = elements.countryName.value || state.selectedLocation.country;

    try {
        // Update status
        setTimeout(() => {
            elements.loadingStatus.textContent = 'Rendering poster...';
        }, 2000);

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lat: state.selectedLocation.lat,
                lon: state.selectedLocation.lon,
                city: cityName,
                country: countryName,
                theme: state.selectedTheme,
                distance: state.distance,
                format: format
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Generation failed');
        }

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `poster.${format}`;
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match) {
                filename = match[1];
            }
        }

        // Download the file
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        elements.loadingStatus.textContent = 'Done!';
        setTimeout(() => {
            elements.loadingOverlay.classList.add('hidden');
        }, 500);

    } catch (error) {
        console.error('Export error:', error);
        elements.loadingStatus.textContent = `Error: ${error.message}`;
        setTimeout(() => {
            elements.loadingOverlay.classList.add('hidden');
        }, 3000);
    }
}

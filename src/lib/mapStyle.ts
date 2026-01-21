import type { Theme } from './themes';
import type { StyleSpecification } from 'maplibre-gl';

// Base style URL - we'll modify it with our theme colors
export const BASE_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty/style.json';

export function createMapStyle(theme: Theme): StyleSpecification {
  return {
    version: 8,
    sources: {
      openmaptiles: {
        type: 'vector',
        tiles: ['https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf'],
        maxzoom: 14,
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': theme.bg }
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: { 'fill-color': theme.water }
      },
      {
        id: 'landuse-park',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        filter: ['in', 'class', 'park', 'grass'],
        paint: { 'fill-color': theme.parks }
      },
      {
        id: 'road-residential',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'minor', 'service'],
        paint: {
          'line-color': theme.roads.residential,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 14, 2]
        }
      },
      {
        id: 'road-tertiary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['==', 'class', 'tertiary'],
        paint: {
          'line-color': theme.roads.tertiary,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 14, 3]
        }
      },
      {
        id: 'road-secondary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['==', 'class', 'secondary'],
        paint: {
          'line-color': theme.roads.secondary,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 4]
        }
      },
      {
        id: 'road-primary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['==', 'class', 'primary'],
        paint: {
          'line-color': theme.roads.primary,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 14, 5]
        }
      },
      {
        id: 'road-motorway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'motorway', 'trunk'],
        paint: {
          'line-color': theme.roads.motorway,
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 14, 6]
        }
      }
    ]
  };
}

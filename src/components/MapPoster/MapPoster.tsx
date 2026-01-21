'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { themes, type ThemeId } from '@/lib/themes';
import { createMapStyle } from '@/lib/mapStyle';
import type { Location } from '@/lib/types';
import styles from './MapPoster.module.css';

interface MapPosterProps {
  location: Location | null;
  themeId: ThemeId;
  onMapClick?: (lat: number, lng: number) => void;
}

export interface MapPosterRef {
  getContainer: () => HTMLDivElement | null;
}

export const MapPoster = forwardRef<MapPosterRef, MapPosterProps>(
  function MapPoster({ location, themeId, onMapClick }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const theme = themes[themeId];

    useImperativeHandle(ref, () => ({
      getContainer: () => containerRef.current,
    }));

    // Initialize map
    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: 'map-container',
        style: createMapStyle(theme),
        center: [0, 30],
        zoom: 1,
        attributionControl: false,
        // preserveDrawingBuffer is needed for html-to-image export
        // @ts-expect-error - preserveDrawingBuffer exists at runtime but not in types
        preserveDrawingBuffer: true,
      });

      map.on('click', (e) => {
        if (onMapClick) {
          onMapClick(e.lngLat.lat, e.lngLat.lng);
        }
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    }, []);

    // Update map style when theme changes
    useEffect(() => {
      if (mapRef.current) {
        mapRef.current.setStyle(createMapStyle(theme));
      }
    }, [themeId, theme]);

    // Fly to location when it changes
    useEffect(() => {
      if (mapRef.current && location) {
        mapRef.current.flyTo({
          center: [location.lng, location.lat],
          zoom: 12,
        });
      }
    }, [location?.lat, location?.lng]);

    const formatCoordinates = () => {
      if (!location) return "0.0000° N / 0.0000° E";
      const latDir = location.lat >= 0 ? 'N' : 'S';
      const lngDir = location.lng >= 0 ? 'E' : 'W';
      return `${Math.abs(location.lat).toFixed(4)}° ${latDir} / ${Math.abs(location.lng).toFixed(4)}° ${lngDir}`;
    };

    return (
      <div className={styles.container} ref={containerRef}>
        <div id="map-container" className={styles.map} />
        <div
          className={styles.gradientTop}
          style={{
            background: `linear-gradient(to bottom, ${theme.bg} 0%, transparent 100%)`,
          }}
        />
        <div
          className={styles.gradientBottom}
          style={{
            background: `linear-gradient(to top, ${theme.bg} 0%, ${theme.bg}dd 20%, transparent 100%)`,
          }}
        />
        <div
          className={styles.overlay}
          style={{
            background: `linear-gradient(to top, ${theme.bg} 0%, ${theme.bg}ee 30%, transparent 100%)`,
          }}
        >
          <div className={styles.cityName} style={{ color: theme.text }}>
            {location?.city.toUpperCase() || 'CITY'}
          </div>
          <div className={styles.countryName} style={{ color: theme.text }}>
            {location?.country.toUpperCase() || 'COUNTRY'}
          </div>
          <div className={styles.divider} style={{ background: theme.text }} />
          <div className={styles.coordinates} style={{ color: theme.text }}>
            {formatCoordinates()}
          </div>
        </div>
        <div className={styles.attribution} style={{ color: theme.text }}>
          © OpenStreetMap
        </div>
      </div>
    );
  }
);

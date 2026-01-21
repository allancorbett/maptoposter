'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
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
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<unknown>(null);
    const onMapClickRef = useRef(onMapClick);
    const [mapLoaded, setMapLoaded] = useState(false);
    const theme = themes[themeId];

    // Keep callback ref updated
    useEffect(() => {
      onMapClickRef.current = onMapClick;
    }, [onMapClick]);

    useImperativeHandle(ref, () => ({
      getContainer: () => containerRef.current,
    }));

    // Initialize map once on mount - dynamic import to ensure client-side only
    useEffect(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      let map: unknown = null;

      const initMap = async () => {
        const maplibregl = (await import('maplibre-gl')).default;

        if (!mapContainerRef.current) return;

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.openfreemap.org/styles/liberty/style.json',
          center: [0, 30],
          zoom: 1,
          attributionControl: false,
          // @ts-expect-error - preserveDrawingBuffer exists at runtime
          preserveDrawingBuffer: true,
        });

        (map as maplibregl.Map).on('load', () => {
          setMapLoaded(true);
        });

        (map as maplibregl.Map).on('click', (e: maplibregl.MapMouseEvent) => {
          onMapClickRef.current?.(e.lngLat.lat, e.lngLat.lng);
        });

        mapRef.current = map;
      };

      initMap();

      return () => {
        if (map && typeof (map as { remove?: () => void }).remove === 'function') {
          (map as { remove: () => void }).remove();
        }
        mapRef.current = null;
      };
    }, []);

    // Update map style when theme changes
    useEffect(() => {
      if (!mapLoaded || !mapRef.current) return;

      const map = mapRef.current as { setStyle: (style: unknown) => void };
      map.setStyle(createMapStyle(theme));
    }, [themeId, theme, mapLoaded]);

    // Fly to location when it changes
    useEffect(() => {
      if (!mapRef.current || !location) return;

      const map = mapRef.current as { flyTo: (options: { center: [number, number]; zoom: number }) => void };
      map.flyTo({
        center: [location.lng, location.lat],
        zoom: 12,
      });
    }, [location?.lat, location?.lng]);

    const formatCoordinates = () => {
      if (!location) return "0.0000° N / 0.0000° E";
      const latDir = location.lat >= 0 ? 'N' : 'S';
      const lngDir = location.lng >= 0 ? 'E' : 'W';
      return `${Math.abs(location.lat).toFixed(4)}° ${latDir} / ${Math.abs(location.lng).toFixed(4)}° ${lngDir}`;
    };

    return (
      <div className={styles.container} ref={containerRef}>
        <div
          ref={mapContainerRef}
          className={styles.map}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        />
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

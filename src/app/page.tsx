'use client';

import { useState, useRef, useCallback } from 'react';
import { toPng, toSvg } from 'html-to-image';
import {
  Sidebar,
  ControlSection,
  SearchInput,
  LocationInfo,
  ThemeGrid,
  ExportButtons,
  MapPoster,
  LoadingSpinner,
} from '@/components';
import type { MapPosterRef } from '@/components';
import type { Location, GeocodingResult } from '@/lib/types';
import type { ThemeId } from '@/lib/themes';
import styles from './page.module.css';

export default function Home() {
  const [location, setLocation] = useState<Location | null>(null);
  const [themeId, setThemeId] = useState<ThemeId>('noir');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const mapPosterRef = useRef<MapPosterRef>(null);

  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`,
        {
          headers: { 'User-Agent': 'MapToPoster/1.0' },
        }
      );
      const data: GeocodingResult[] = await response.json();

      if (data.length > 0) {
        const result = data[0];
        const city =
          result.address.city ||
          result.address.town ||
          result.address.village ||
          result.address.municipality ||
          query.split(',')[0];
        const country = result.address.country || '';

        setLocation({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          city,
          country,
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
    setIsLoading(false);
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: { 'User-Agent': 'MapToPoster/1.0' },
        }
      );
      const data = await response.json();

      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        'Unknown';
      const country = data.address?.country || '';

      setLocation({ lat, lng, city, country });
    } catch (error) {
      setLocation({ lat, lng, city: 'Location', country: '' });
    }
    setIsLoading(false);
  }, []);

  const handleCityChange = useCallback((city: string) => {
    setLocation((prev) => (prev ? { ...prev, city } : null));
  }, []);

  const handleCountryChange = useCallback((country: string) => {
    setLocation((prev) => (prev ? { ...prev, country } : null));
  }, []);

  const handleExport = useCallback(
    async (format: 'png' | 'svg') => {
      const container = mapPosterRef.current?.getContainer();
      if (!container) return;

      setIsExporting(true);

      const citySlug = (location?.city || 'map')
        .toLowerCase()
        .replace(/\s+/g, '_');
      const filename = `${citySlug}_${themeId}_${Date.now()}`;

      try {
        // Wait for map to finish rendering
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (format === 'png') {
          const dataUrl = await toPng(container, {
            pixelRatio: 3,
            quality: 1,
          });
          downloadFile(dataUrl, `${filename}.png`);
        } else {
          const dataUrl = await toSvg(container);
          downloadFile(dataUrl, `${filename}.svg`);
        }
      } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
      }

      setIsExporting(false);
    },
    [location, themeId]
  );

  const downloadFile = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className={styles.container}>
      <Sidebar>
        <ControlSection title="Location">
          <SearchInput onSearch={handleSearch} isLoading={isLoading} />
          <LocationInfo
            location={location}
            onCityChange={handleCityChange}
            onCountryChange={handleCountryChange}
          />
        </ControlSection>

        <ControlSection title="Theme">
          <ThemeGrid selectedTheme={themeId} onSelectTheme={setThemeId} />
        </ControlSection>

        <ControlSection title="Export">
          <ExportButtons
            onExportPng={() => handleExport('png')}
            onExportSvg={() => handleExport('svg')}
            disabled={!location}
            isExporting={isExporting}
          />
        </ControlSection>
      </Sidebar>

      <main className={styles.mainContent}>
        <MapPoster
          ref={mapPosterRef}
          location={location}
          themeId={themeId}
          onMapClick={handleMapClick}
        />
        <LoadingSpinner visible={isLoading} />
      </main>
    </div>
  );
}

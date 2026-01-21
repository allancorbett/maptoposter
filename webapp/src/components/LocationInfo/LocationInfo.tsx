'use client';

import type { Location } from '@/lib/types';
import styles from './LocationInfo.module.css';

interface LocationInfoProps {
  location: Location | null;
  onCityChange: (city: string) => void;
  onCountryChange: (country: string) => void;
}

export function LocationInfo({
  location,
  onCityChange,
  onCountryChange,
}: LocationInfoProps) {
  if (!location) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.detail}>
        <label className={styles.label}>City Name</label>
        <input
          type="text"
          className={styles.input}
          placeholder="City"
          value={location.city}
          onChange={(e) => onCityChange(e.target.value)}
        />
      </div>
      <div className={styles.detail}>
        <label className={styles.label}>Country</label>
        <input
          type="text"
          className={styles.input}
          placeholder="Country"
          value={location.country}
          onChange={(e) => onCountryChange(e.target.value)}
        />
      </div>
      <div className={styles.detail}>
        <label className={styles.label}>Coordinates</label>
        <div className={styles.coords}>
          <span>{location.lat.toFixed(6)}</span>, <span>{location.lng.toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
}

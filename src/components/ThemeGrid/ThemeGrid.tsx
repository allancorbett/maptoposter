'use client';

import { themes, themeIds, type ThemeId } from '@/lib/themes';
import styles from './ThemeGrid.module.css';

interface ThemeGridProps {
  selectedTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export function ThemeGrid({ selectedTheme, onSelectTheme }: ThemeGridProps) {
  return (
    <div className={styles.grid}>
      {themeIds.map((id) => {
        const theme = themes[id];
        const isSelected = id === selectedTheme;

        return (
          <button
            key={id}
            className={`${styles.card} ${isSelected ? styles.selected : ''}`}
            style={{ backgroundColor: theme.bg }}
            onClick={() => onSelectTheme(id)}
            data-name={theme.name}
            aria-label={`Select ${theme.name} theme`}
            aria-pressed={isSelected}
          />
        );
      })}
    </div>
  );
}

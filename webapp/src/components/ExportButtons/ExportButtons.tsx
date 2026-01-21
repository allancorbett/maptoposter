'use client';

import styles from './ExportButtons.module.css';

interface ExportButtonsProps {
  onExportPng: () => void;
  onExportSvg: () => void;
  disabled: boolean;
  isExporting: boolean;
}

export function ExportButtons({
  onExportPng,
  onExportSvg,
  disabled,
  isExporting,
}: ExportButtonsProps) {
  return (
    <div className={styles.container}>
      <button
        className={`${styles.button} ${styles.primary}`}
        onClick={onExportPng}
        disabled={disabled || isExporting}
      >
        <span className={styles.label}>
          {isExporting ? 'Exporting...' : 'Download PNG'}
        </span>
        <small className={styles.subtitle}>High Resolution Image</small>
      </button>
      <button
        className={`${styles.button} ${styles.secondary}`}
        onClick={onExportSvg}
        disabled={disabled || isExporting}
      >
        <span className={styles.label}>Download SVG</span>
        <small className={styles.subtitle}>Vector Format</small>
      </button>
    </div>
  );
}

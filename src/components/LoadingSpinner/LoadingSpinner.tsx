import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  visible: boolean;
}

export function LoadingSpinner({ visible }: LoadingSpinnerProps) {
  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.spinner} />
    </div>
  );
}

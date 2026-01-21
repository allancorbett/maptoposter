import { ReactNode } from 'react';
import styles from './ControlSection.module.css';

interface ControlSectionProps {
  title: string;
  children: ReactNode;
}

export function ControlSection({ title, children }: ControlSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </section>
  );
}

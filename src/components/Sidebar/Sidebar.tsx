'use client';

import { ReactNode } from 'react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  children: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h1 className={styles.logo}>MapToPoster</h1>
        <p className={styles.tagline}>Create beautiful map posters</p>
      </div>
      <div className={styles.content}>{children}</div>
      <div className={styles.footer}>
        <p>
          Map data ©{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenStreetMap
          </a>
        </p>
      </div>
    </aside>
  );
}

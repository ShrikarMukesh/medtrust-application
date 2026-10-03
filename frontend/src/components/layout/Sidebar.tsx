'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  ScrollText,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Activity,
  UserCog,
} from 'lucide-react';
import { getCurrentUserRole } from '@/lib/api/auth';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  /** Roles allowed to see this item. Empty = all authenticated users. */
  roles: string[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: [], // all roles
  },
  {
    href: '/patients',
    icon: Users,
    label: 'Patients',
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
  },
  {
    href: '/appointments',
    icon: CalendarDays,
    label: 'Appointments',
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'],
  },
  {
    href: '/clinical',
    icon: Stethoscope,
    label: 'Clinical',
    roles: ['ADMIN', 'DOCTOR', 'NURSE'],
  },
  {
    href: '/consents',
    icon: ShieldCheck,
    label: 'Consents',
    roles: ['ADMIN', 'DOCTOR', 'PATIENT'],
  },
  {
    href: '/users',
    icon: UserCog,
    label: 'User Management',
    roles: ['ADMIN'],
  },
  {
    href: '/audit',
    icon: ScrollText,
    label: 'Audit Log',
    roles: ['ADMIN'],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(getCurrentUserRole());
  }, []);

  const visibleNavItems = ALL_NAV_ITEMS.filter(
    (item) => item.roles.length === 0 || (role && item.roles.includes(role))
  );

  return (
    <aside className={clsx(styles.sidebar, collapsed && styles.collapsed)}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.logo}>
          <Activity size={24} />
        </div>
        {!collapsed && <span className={styles.brandText}>MedTrust</span>}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {visibleNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(styles.navItem, isActive && styles.active)}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && <div className={styles.activeIndicator} />}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button className={styles.toggle} onClick={onToggle} aria-label="Toggle sidebar">
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}

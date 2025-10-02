/**
 * Dashboard Layout Component
 * Modern dashboard layout with sidebar, top navigation, and responsive design
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';
import { cn } from '../../utils/cn';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeItem?: string;
  onItemChange?: (item: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeItem = 'generate',
  onItemChange = () => {},
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Generation Complete',
      message: 'Your batch generation has finished successfully',
      time: '2 minutes ago',
      read: false,
    },
    {
      id: '2',
      title: 'New Template Available',
      message: 'Check out the new "Cyberpunk Portrait" template',
      time: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      title: 'System Update',
      message: 'LexiGraph has been updated to version 2.0.0',
      time: '3 hours ago',
      read: true,
    },
  ]);

  // Handle responsive sidebar collapse
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const handleNotificationClick = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const layoutVariants = {
    expanded: { marginLeft: 280 },
    collapsed: { marginLeft: 80 },
  };

  return (
    <div className="min-h-screen">
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
      <div className="fixed inset-0 bg-gradient-to-tr from-primary-950/20 via-transparent to-secondary-950/20" />
      <div className="fixed inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      {/* Animated gradient overlay */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-transparent to-secondary-500/10 animate-pulse" />
      </div>
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-30">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeItem={activeItem}
          onItemChange={onItemChange}
        />
      </div>

      {/* Main Content Area */}
      <motion.div
        variants={layoutVariants}
        animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative z-10"
      >
        {/* Top Navigation */}
        <div className="sticky top-0 z-20">
          <TopNavigation
            theme={theme}
            onThemeChange={setTheme}
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
          />
        </div>

        {/* Page Content */}
        <main className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="p-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {!sidebarCollapsed && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarCollapsed(true)}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 z-30 lg:hidden">
        <motion.button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500',
            'rounded-full shadow-lg flex items-center justify-center',
            'text-white hover:shadow-xl transition-shadow'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </motion.button>
      </div>

      {/* Keyboard Shortcuts Overlay */}
      <div className="fixed bottom-4 left-4 z-20 hidden lg:block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-xs text-neutral-500 dark:text-neutral-400"
        >
          Press <kbd className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded">⌘K</kbd> to search
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardLayout;

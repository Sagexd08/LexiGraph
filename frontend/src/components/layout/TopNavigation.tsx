/**
 * Top Navigation Component
 * Modern navigation bar with user profile, notifications, and quick actions
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Plus,
  Download,
  Share,
  Command,
  ChevronDown,
} from 'lucide-react';
import { GlassCard, AdvancedButton } from '../../design-system';
import { cn } from '../../lib/utils';

interface TopNavigationProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
  }>;
  onNotificationClick: (id: string) => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({
  user: propUser,
  theme,
  onThemeChange,
  notifications = [],
  onNotificationClick,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use prop user or default user data
  const user = propUser || { name: 'Demo User', email: 'demo@lexigraph.ai' };

  const unreadCount = notifications.filter(n => !n.read).length;

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const quickActions = [
    { label: 'New Generation', icon: Plus, action: () => console.log('New generation') },
    { label: 'Export', icon: Download, action: () => console.log('Export') },
    { label: 'Share', icon: Share, action: () => console.log('Share') },
  ];

  return (
    <div className="relative">
      {/* Background with proper glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/95 via-neutral-800/95 to-neutral-900/95 backdrop-blur-xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-secondary-500/5" />

      <div className="relative h-16 flex items-center justify-between px-6 border-b border-white/10">
        {/* Glass reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
        {/* Left Section - Search */}
        <div className="relative flex items-center space-x-4 flex-1 z-10">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search generations, templates, styles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2',
                'bg-white/10 backdrop-blur-sm',
                'border border-white/20 rounded-xl',
                'text-white placeholder-neutral-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50',
                'hover:bg-white/15 transition-all duration-200'
              )}
            />

            {/* Search shortcut hint */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-neutral-500">
              <Command className="h-3 w-3" />
              <span className="text-xs">K</span>
            </div>
          </div>
        </div>

        {/* Center Section - Quick Actions */}
        <div className="relative flex items-center space-x-2 z-10">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={index}
                onClick={action.action}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-xl',
                  'bg-white/10 backdrop-blur-sm border border-white/20',
                  'text-neutral-300 hover:text-white hover:bg-white/20',
                  'transition-all duration-200 text-sm font-medium'
                )}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{action.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Right Section - User Actions */}
        <div className="relative flex items-center space-x-4 z-10">
          {/* Theme Selector */}
          <div className="relative">
            <motion.button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={cn(
                'p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20',
                'hover:bg-white/20 transition-all duration-200'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {theme === 'light' && <Sun className="h-5 w-5 text-neutral-300" />}
              {theme === 'dark' && <Moon className="h-5 w-5 text-neutral-300" />}
              {theme === 'system' && <Monitor className="h-5 w-5 text-neutral-300" />}
            </motion.button>

          <AnimatePresence>
            {showThemeMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowThemeMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 z-50"
                >
                  <GlassCard className="p-2 min-w-[150px]">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            onThemeChange(option.value as any);
                            setShowThemeMenu(false);
                          }}
                          className={cn(
                            'w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                            'hover:bg-white/10 dark:hover:bg-white/5',
                            theme === option.value && 'bg-primary-500/20 text-primary-400'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{option.label}</span>
                        </button>
                      );
                    })}
                  </GlassCard>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                'relative p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20',
                'hover:bg-white/20 transition-all duration-200'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="h-5 w-5 text-neutral-300" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-lg"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 z-50"
                >
                  <GlassCard className="p-4 w-80 max-h-96 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-white mb-3">Notifications</h3>

                    {notifications.length === 0 ? (
                      <p className="text-neutral-400 text-center py-4">No notifications</p>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map((notification) => (
                          <motion.div
                            key={notification.id}
                            onClick={() => onNotificationClick(notification.id)}
                            className={cn(
                              'p-3 rounded-lg cursor-pointer transition-colors',
                              'hover:bg-white/10 dark:hover:bg-white/5',
                              !notification.read && 'bg-primary-500/10 border-l-2 border-primary-500'
                            )}
                            whileHover={{ x: 4 }}
                          >
                            <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                            <p className="text-xs text-neutral-400 mt-1">{notification.message}</p>
                            <p className="text-xs text-neutral-500 mt-2">{notification.time}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

          {/* User Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                'flex items-center space-x-3 p-2 rounded-xl',
                'bg-white/10 backdrop-blur-sm border border-white/20',
                'hover:bg-white/20 transition-all duration-200'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-neutral-400">{user.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-neutral-400" />
            </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 z-50"
                >
                  <GlassCard className="p-2 min-w-[200px]">
                    <div className="px-3 py-2 border-b border-white/10 dark:border-white/5 mb-2">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-neutral-400">{user.email}</p>
                    </div>

                    <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                      <Settings className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm text-white">Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        console.log('Sign out clicked (auth disabled)');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </GlassCard>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;

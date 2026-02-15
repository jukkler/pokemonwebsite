'use client';

/**
 * Theme Toggle Component
 * Ermöglicht Wechsel zwischen Dark und Light Mode
 * Speichert Präferenz in localStorage
 */

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Load from localStorage or system preference
    const stored = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = (stored as 'light' | 'dark') || (systemPrefersDark ? 'dark' : 'light');

    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-[90px] h-[40px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 bg-[var(--card-bg)] border border-[var(--border-default)] hover:border-[var(--player-color)] hover:shadow-[0_0_15px_rgba(var(--player-color-rgb),0.3)]"
      title={theme === 'dark' ? 'Zu Hell-Modus wechseln' : 'Zu Dunkel-Modus wechseln'}
      aria-label={theme === 'dark' ? 'Zu Hell-Modus wechseln' : 'Zu Dunkel-Modus wechseln'}
    >
      {theme === 'dark' ? (
        // Sun Icon (Light Mode)
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        // Moon Icon (Dark Mode)
        <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
      <span className="text-sm font-medium hidden lg:inline text-[var(--foreground)]">
        {theme === 'dark' ? 'Hell' : 'Dunkel'}
      </span>
    </button>
  );
}

"use client";

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-gray-100 dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-semibold text-gray-700 dark:text-white">
          سایت من
        </Link>
        <div className="flex items-center space-x-4 space-x-reverse">
          <Link href="/" className="text-gray-700 dark:text-white hover:text-blue-500 dark:hover:text-blue-400">
            صفحه اصلی
          </Link>
          <Link href="/about" className="text-gray-700 dark:text-white hover:text-blue-500 dark:hover:text-blue-400">
            درباره ما
          </Link>
          <Link href="/contact" className="text-gray-700 dark:text-white hover:text-blue-500 dark:hover:text-blue-400">
            تماس با ما
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              // Moon icon (example)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              // Sun icon (example)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-8.66l-.707.707M4.04 4.04l-.707.707m15.92 0l-.707-.707M5.75 18.25l-.707-.707M12 6a6 6 0 100 12 6 6 0 000-12z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

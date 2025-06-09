"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Import icons (example using heroicons, assuming they are installed or will be)
import {
  HomeIcon, CogIcon, ShoppingBagIcon, UsersIcon, DocumentTextIcon, BriefcaseIcon, XMarkIcon, Bars3Icon
} from '@heroicons/react/24/outline'; // Adjust path if using a different icon library

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'داشبورد', icon: HomeIcon },
  { href: '/admin/settings/integrations', label: 'تنظیمات یکپارچه‌سازی', icon: CogIcon },
  { href: '/admin/products', label: 'مدیریت محصولات', icon: ShoppingBagIcon },
  { href: '/admin/product-bundles', label: 'مدیریت پک‌ها', icon: BriefcaseIcon },
  { href: '/admin/orders', label: 'سفارشات فروشگاه', icon: DocumentTextIcon },
  { href: '/admin/bookings', label: 'رزروهای اساتید', icon: DocumentTextIcon },
  { href: '/admin/users', label: 'مدیریت کاربران', icon: UsersIcon },
];

const AdminLayoutClient = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-30 flex flex-col space-y-6 bg-gray-800 dark:bg-gray-950 text-white w-64 p-4 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:static md:inset-0`}>
        <div className="flex items-center justify-between p-3">
          <Link href="/admin" className="text-2xl font-semibold text-white">
            پنل مدیریت
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-white hover:bg-gray-700 rounded">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center space-x-2 space-x-reverse py-2.5 px-4 rounded-md transition-colors duration-200 hover:bg-gray-700 dark:hover:bg-gray-800 ${
                pathname === item.href ? 'bg-indigo-600 dark:bg-indigo-500 text-white' : 'text-gray-300 hover:text-white'
              }`}
              onClick={() => setSidebarOpen(false)} // Close sidebar on item click on mobile
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-gray-700 dark:border-gray-800">
            <Link href="/" className="flex items-center space-x-2 space-x-reverse py-2.5 px-4 rounded-md text-gray-300 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white">
                {/* Return to site icon - could be different */}
                <HomeIcon className="h-5 w-5 transform -scale-x-100" />
                <span>بازگشت به سایت</span>
            </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar for mobile (menu button) */}
        <header className="md:hidden bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-end">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 dark:text-gray-300 focus:outline-none">
            <Bars3Icon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayoutClient;

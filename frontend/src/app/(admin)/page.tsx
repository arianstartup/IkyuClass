"use client"; // Can be client or server, making it client for now for consistency if we add client hooks

import React from 'react';

const AdminDashboardPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">داشبورد مدیریت</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">آمار بازدید (نمونه)</h2>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">۱۲,۳۴۵</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">سفارشات جدید (نمونه)</h2>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">۶۷</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">کاربران آنلاین (نمونه)</h2>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">۱۲۳</p>
        </div>
      </div>
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">پیام خوش آمدید</h2>
        <p className="text-gray-600 dark:text-gray-300">
          به پنل مدیریت خوش آمدید. از این بخش می‌توانید تنظیمات مختلف سایت، محصولات، سفارشات و کاربران را مدیریت کنید.
          لطفاً از منوی سمت راست برای دسترسی به بخش‌های مختلف استفاده نمایید.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

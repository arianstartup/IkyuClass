"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import Link from 'next/link'; // For future edit/view user actions
import { adminApiFetch } from '@/utils/adminApi';

interface User {
  id: string;
  role: 'teacher' | 'student_proxy' | string; // student_proxy is for verified phones without full profile
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  phoneNumberVerified?: boolean;
  createdAt: string | { toDate: () => Date }; // Firestore Timestamp or ISO string
  isActive?: boolean;
}

const AdminUsersListPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all'); // 'all', 'teacher', 'student_proxy'
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchUsers = useCallback(async (filterRole: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = filterRole === 'all' ? '' : `?role=${filterRole}`;
      const data = await adminApiFetch(`/api/admin/users${query}`);
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(roleFilter);
  }, [fetchUsers, roleFilter]);

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      (user.firstName?.toLowerCase().includes(searchTerm)) ||
      (user.lastName?.toLowerCase().includes(searchTerm)) ||
      (user.email?.toLowerCase().includes(searchTerm)) ||
      (user.phoneNumber?.includes(searchTerm)) ||
      (user.id.toLowerCase().includes(searchTerm))
    );
  }, [users, searchTerm]);

  const getRoleText = (role: string) => {
    if (role === 'teacher') return 'معلم';
    if (role === 'student_proxy') return 'کاربر تایید شده (موبایل)';
    return role;
  };

  const formatDate = (dateInput: string | { toDate: () => Date }) => {
    if (!dateInput) return 'نامشخص';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput.toDate();
    return date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  };


  if (loading) {
    return <div className="text-center py-10 text-gray-300">در حال بارگذاری لیست کاربران...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">مدیریت کاربران</h1>
        <div className="flex items-center space-x-3 space-x-reverse">
          <select
            value={roleFilter}
            onChange={handleRoleFilterChange}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="all">همه نقش‌ها</option>
            <option value="teacher">معلمان</option>
            <option value="student_proxy">کاربران تایید شده (موبایل)</option>
          </select>
          <input
            type="text"
            placeholder="جستجو (نام، ایمیل، شماره)..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      {error && (
         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-800 dark:text-red-200 dark:border-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">خطا</p>
          <p>{error}</p>
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          کاربری با این مشخصات یافت نشد یا هیچ کاربری ثبت نشده است.
        </p>
      )}

      {filteredUsers.length > 0 && (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">نام</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ایمیل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">شماره موبایل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">نقش</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">تاریخ عضویت/تایید</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">وضعیت</th>
                {/* <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">عملیات</th> */}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user.role === 'student_proxy' ? 'کاربر موبایلی' : 'نامشخص')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 ltr">{user.phoneNumber || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getRoleText(user.role)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    {user.phoneNumberVerified && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                            موبایل تایید شده
                        </span>
                    )}
                    {user.role === 'teacher' && (
                         <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                            {user.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                    )}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-3 space-x-reverse">
                    <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">ویرایش</button>
                    <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">حذف</button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsersListPage;

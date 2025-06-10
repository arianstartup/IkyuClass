"use client";

import React, { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm'; // To be created
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const { currentUser, loadingAuth } = useAuth();
  const router = useRouter();

  if (loadingAuth) {
    return <div className="text-center py-20">در حال بررسی وضعیت ورود...</div>;
  }

  if (currentUser) {
    // Redirect if already logged in
    router.replace('/'); // Or to a dashboard page
    return <div className="text-center py-20">شما قبلا وارد شده اید. در حال انتقال...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          ورود به حساب کاربری
        </h1>
        <Suspense fallback={<div className="text-center">در حال بارگذاری فرم ورود...</div>}>
            <LoginForm />
        </Suspense>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            حساب کاربری ندارید؟{' '}
            <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              ثبت نام کنید
            </Link>
          </p>
           <p className="mt-2 text-sm">
            <Link href="/auth/forgot-password" className="font-medium text-gray-500 hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-300 text-xs">
              فراموشی رمز عبور؟
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

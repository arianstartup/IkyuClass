"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const UnauthorizedPage = () => {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-16 text-center flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-red-500 dark:text-red-400 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
         <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
      </svg>
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
        عدم دسترسی
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md">
        متاسفانه شما مجوز دسترسی به صفحه درخواستی را ندارید. ممکن است نیاز به ورود با حساب کاربری با سطح دسترسی بالاتری داشته باشید.
      </p>
      <div className="flex space-x-4 space-x-reverse">
        <button
          onClick={() => router.back()}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2.5 px-6 rounded-md transition duration-150 ease-in-out"
        >
          بازگشت به صفحه قبلی
        </button>
        <Link href="/" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-md transition duration-150 ease-in-out">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;

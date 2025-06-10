"use client";

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const ResearchOrderPaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const refId = searchParams.get('refId');

  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <div className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 p-8 rounded-lg shadow-xl max-w-lg mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-500 dark:text-green-400 mx-auto mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-3xl font-bold mb-4">پرداخت هزینه تحقیق با موفقیت انجام شد!</h1>
        <p className="mb-3 text-lg">از پرداخت شما سپاسگزاریم.</p>

        {orderId && (
          <p className="text-md mb-1">
            شناسه سفارش تحقیق: <span className="font-semibold tracking-wider">{orderId}</span>
          </p>
        )}
        {refId && (
          <p className="text-md mb-6">
            شماره پیگیری پرداخت: <span className="font-semibold tracking-wider">{refId}</span>
          </p>
        )}

        <p className="mb-5 text-sm">
          فایل تحقیق شما اکنون آماده دانلود است. می‌توانید از طریق پنل کاربری خود در بخش "سفارش‌های تحقیق من" به آن دسترسی پیدا کنید.
        </p>

        <div className="space-y-3 mt-8">
          <Link href="/my-account/research-orders"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition duration-150 ease-in-out text-lg">
              مشاهده و دانلود تحقیق
          </Link>
          <Link href="/"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-semibold py-3 px-4 rounded-md transition duration-150 ease-in-out">
              بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResearchOrderPaymentSuccessPage;

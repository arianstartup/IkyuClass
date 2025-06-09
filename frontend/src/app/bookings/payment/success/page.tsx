"use client";

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const refId = searchParams.get('refId');

  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <div className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 p-8 rounded-lg shadow-xl max-w-md mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 dark:text-green-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-3xl font-bold mb-4">پرداخت با موفقیت انجام شد!</h1>
        <p className="mb-2">از اعتماد شما سپاسگزاریم.</p>
        {bookingId && <p className="text-sm mb-1">شناسه رزرو: <span className="font-semibold">{bookingId}</span></p>}
        {refId && <p className="text-sm mb-6">شماره پیگیری پرداخت: <span className="font-semibold">{refId}</span></p>}

        <p className="mb-4">جزئیات رزرو و هرگونه اطلاعات تکمیلی به زودی از طریق پروفایل کاربری شما قابل مشاهده خواهد بود.</p>

        <div className="space-y-3">
          <Link href="/my-bookings" // Assuming a future page for user's bookings
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition duration-150 ease-in-out">
              مشاهده رزروهای من
          </Link>
          <Link href="/teachers"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-semibold py-3 px-4 rounded-md transition duration-150 ease-in-out">
              بازگشت به لیست معلمان
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;

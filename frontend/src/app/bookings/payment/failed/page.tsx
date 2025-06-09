"use client";

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const PaymentFailedPage = () => {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const error = searchParams.get('error');
  const status = searchParams.get('status');

  let errorMessage = "پرداخت شما ناموفق بود یا توسط شما لغو شده است.";
  if (error) {
    switch (error) {
      case 'InvalidCallbackParams':
        errorMessage = "اطلاعات بازگشتی از درگاه پرداخت نامعتبر است.";
        break;
      case 'BookingNotFoundForAuthority':
        errorMessage = "رزروی برای این تراکنش یافت نشد. لطفاً با پشتیبانی تماس بگیرید.";
        break;
      case 'BookingAlreadyProcessed':
        errorMessage = "این رزرو قبلاً پردازش شده است.";
        break;
      case 'VerificationFailed':
        errorMessage = `تایید پرداخت با درگاه ناموفق بود. کد وضعیت: ${status || 'N/A'}`;
        break;
      case 'PaymentCancelled':
        errorMessage = `پرداخت توسط شما لغو شد یا در درگاه به مشکل برخورد. کد وضعیت: ${status || 'N/A'}`;
        break;
      case 'VerificationException':
        errorMessage = "خطای سیستمی در هنگام تایید پرداخت رخ داد. لطفاً با پشتیبانی تماس بگیرید.";
        break;
      default:
        errorMessage = `پرداخت ناموفق بود. دلیل: ${error}`;
    }
  }


  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <div className="bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 p-8 rounded-lg shadow-xl max-w-md mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-3xl font-bold mb-4">پرداخت ناموفق بود</h1>
        <p className="mb-2">{errorMessage}</p>
        {bookingId && <p className="text-sm mb-6">شناسه رزرو مربوطه: <span className="font-semibold">{bookingId}</span></p>}

        <p className="mb-4">در صورت کسر وجه از حساب شما، معمولاً طی ساعات آینده به حسابتان بازگردانده خواهد شد. می‌توانید مجدداً تلاش کنید یا با پشتیبانی تماس بگیرید.</p>

        <div className="space-y-3">
          {bookingId && (
            <Link href={`/teachers`} // Or back to the specific teacher's page if teacherId is available
              className="block w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-md transition duration-150 ease-in-out">
                تلاش مجدد برای رزرو (یا بازگشت به پروفایل معلم)
            </Link>
          )}
          <Link href="/"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-semibold py-3 px-4 rounded-md transition duration-150 ease-in-out">
              بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;

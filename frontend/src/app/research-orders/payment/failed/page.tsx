"use client";

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const ResearchOrderPaymentFailedPage = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const error = searchParams.get('error');
  const status = searchParams.get('status'); // Zarinpal status code

  let userFriendlyMessage = "پرداخت هزینه تحقیق ناموفق بود یا توسط شما لغو شده است.";

  if (error) {
    switch (error) {
      case 'InvalidCallbackParams':
        userFriendlyMessage = "اطلاعات بازگشتی از درگاه پرداخت برای پردازش پرداخت شما نامعتبر است.";
        break;
      case 'OrderNotFoundForAuthority':
        userFriendlyMessage = "سفارش تحقیقی برای این تراکنش یافت نشد. اگر وجهی از حساب شما کسر شده، لطفاً با پشتیبانی تماس بگیرید.";
        break;
      case 'OrderAlreadyProcessed':
        userFriendlyMessage = "پرداخت این سفارش تحقیق قبلاً پردازش شده است.";
        break;
      case 'VerificationFailed':
        userFriendlyMessage = `تایید پرداخت با درگاه ناموفق بود. کد وضعیت درگاه: ${status || 'N/A'}.`;
        break;
      case 'PaymentCancelled':
        userFriendlyMessage = `پرداخت توسط شما لغو شد یا در اتصال به درگاه مشکلی پیش آمد. کد وضعیت درگاه: ${status || 'N/A'}.`;
        break;
      case 'VerificationException':
      default:
        userFriendlyMessage = "خطای سیستمی در هنگام تایید پرداخت سفارش تحقیق شما رخ داد. لطفاً با پشتیبانی تماس بگیرید.";
        break;
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <div className="bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 p-8 rounded-lg shadow-xl max-w-lg mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-red-500 dark:text-red-400 mx-auto mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-3xl font-bold mb-4">پرداخت هزینه تحقیق ناموفق بود</h1>
        <p className="mb-3 text-md">{userFriendlyMessage}</p>

        {orderId && (
          <p className="text-md mb-6">
            شناسه سفارش تحقیق مربوطه: <span className="font-semibold tracking-wider">{orderId}</span>
          </p>
        )}

        <p className="mb-5 text-sm">
          در صورتی که وجهی از حساب شما کسر شده است، معمولاً طی چند ساعت آینده به حساب شما بازگردانده خواهد شد.
          می‌توانید به صفحه "سفارش‌های تحقیق من" بازگردید و مجدداً برای پرداخت تلاش کنید یا با پشتیبانی تماس بگیرید.
        </p>

        <div className="space-y-3 mt-8">
          <Link href="/my-account/research-orders"
            className="block w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-md transition duration-150 ease-in-out text-lg">
              بازگشت به سفارش‌های تحقیق من
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

export default ResearchOrderPaymentFailedPage;

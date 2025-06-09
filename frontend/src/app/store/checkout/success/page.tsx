"use client";

import React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation'; // useRouter for potential cart clearing
import { useCart } from '@/contexts/CartContext'; // To clear cart
import { useEffect } from 'react';

const StorePaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter(); // Not used directly, but good for context
  const { clearCart, getItemCount } = useCart();

  const orderId = searchParams.get('orderId');
  const refId = searchParams.get('refId'); // Zarinpal reference ID

  // Clear cart only once when this page loads after a successful payment
  useEffect(() => {
    if (getItemCount() > 0) { // Only clear if there's something to clear
        // clearCart(); // This was moved to before redirecting to payment gateway
        // If not cleared before redirect, clear it here.
        // However, it's better to clear before redirect to avoid issues if user navigates away from gateway.
        console.log("Payment successful for store order. Cart should have been cleared before redirect.");
    }
  }, [clearCart, getItemCount]);


  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <div className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 p-8 rounded-lg shadow-xl max-w-lg mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-500 dark:text-green-400 mx-auto mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-3xl font-bold mb-4">پرداخت سفارش فروشگاه با موفقیت انجام شد!</h1>
        <p className="mb-3 text-lg">از خرید شما سپاسگزاریم.</p>

        {orderId && (
          <p className="text-md mb-1">
            شماره سفارش شما: <span className="font-semibold tracking-wider">{orderId}</span>
          </p>
        )}
        {refId && (
          <p className="text-md mb-6">
            شماره پیگیری پرداخت: <span className="font-semibold tracking-wider">{refId}</span>
          </p>
        )}

        <p className="mb-5 text-sm">
          جزئیات کامل سفارش به زودی در پنل کاربری شما (بخش "سفارش‌های من") قابل مشاهده خواهد بود.
          در صورت نیاز به پشتیبانی، لطفاً شماره سفارش خود را اعلام فرمایید.
        </p>

        <div className="space-y-3 mt-8">
          <Link href="/my-orders" // Placeholder for future "My Orders" page
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition duration-150 ease-in-out text-lg">
              پیگیری سفارش‌ها
          </Link>
          <Link href="/store"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-semibold py-3 px-4 rounded-md transition duration-150 ease-in-out">
              بازگشت به فروشگاه
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StorePaymentSuccessPage;

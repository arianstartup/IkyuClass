"use client"; // This page uses client-side context

import React, { Suspense } from 'react'; // Import Suspense
import ShoppingCart from '@/components/store/ShoppingCart';
import Link from 'next/link';

const CartPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/store" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
          &larr; بازگشت به فروشگاه
        </Link>
      </div>
      {/* Wrap ShoppingCart with Suspense if it or its children use hooks like useSearchParams */}
      {/* For now, assuming ShoppingCart itself does not trigger suspense directly. */}
      <Suspense fallback={<div className="text-center py-10">در حال بارگذاری سبد خرید...</div>}>
        <ShoppingCart />
      </Suspense>
    </div>
  );
};

export default CartPage;

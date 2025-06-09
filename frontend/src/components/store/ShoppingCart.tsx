"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, CartItem } from '@/contexts/CartContext';

const ShoppingCart = () => {
  const { items, removeFromCart, updateQuantity, clearCart, getItemCount, getTotalPrice } = useCart();

  if (getItemCount() === 0) {
    return (
      <div className="text-center py-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">سبد خرید شما خالی است</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">به نظر می‌رسد هنوز هیچ محصولی به سبد خرید خود اضافه نکرده‌اید.</p>
        <Link href="/store" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-md transition duration-150 ease-in-out">
          مشاهده محصولات فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 md:p-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 border-b dark:border-gray-700 pb-3">سبد خرید شما</h2>

      <div className="space-y-4 mb-6">
        {items.map(item => (
          <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border dark:border-gray-700 rounded-md hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="relative w-20 h-20 rounded-md overflow-hidden mr-4 shrink-0">
                <Image
                  src={item.images && item.images.length > 0 ? item.images[0] : '/images/placeholder-product.png'}
                  alt={item.name}
                  layout="fill"
                  objectFit="cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }}
                />
              </div>
              <div>
                <Link
                  href={item.isBundle ? `/store/bundles/${item.id}` : `/store/products/${item.id}`}
                  className="text-lg font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  {item.name} {item.isBundle && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100 px-2 py-0.5 rounded-full ml-2">پک</span>}
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.isBundle ? `${item.bundleItems?.length || 0} محصول در این پک` : item.brand}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                  {item.price.toLocaleString('fa-IR')} تومان
                </p>
                {item.isBundle && item.bundleItems && (
                  <div className="mt-1">
                    <ul className="list-disc list-inside pl-1">
                      {item.bundleItems.slice(0, 2).map(pItem => ( // Show first 2 items for brevity
                        <li key={pItem.productId} className="text-xs text-gray-500 dark:text-gray-400">
                          {pItem.productName} (x{pItem.quantity})
                        </li>
                      ))}
                      {item.bundleItems.length > 2 && <li className="text-xs text-gray-500 dark:text-gray-400">و موارد دیگر...</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              {/* Quantity controls for bundles might be disabled or limited if bundles are sold as single units */}
              <div className={`flex items-center border border-gray-300 dark:border-gray-600 rounded-md ${item.isBundle ? 'opacity-70' : ''}`}>
                <button
                  onClick={() => updateQuantity(item.id, item.quantityInCart - 1)}
                  disabled={item.quantityInCart <= 1 || item.isBundle} // Disable for bundles if they are single unit add
                  className="px-3 py-1.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-md transition-colors disabled:opacity-50"
                >
                  -
                </button>
                <input
                  type="number"
                  value={item.quantityInCart}
                  onChange={(e) => {
                    if (item.isBundle) return; // Prevent manual input for bundles for now
                    const newQuantity = parseInt(e.target.value, 10);
                    if (!isNaN(newQuantity) && newQuantity > 0) {
                      updateQuantity(item.id, newQuantity);
                    } else if (!isNaN(newQuantity) && newQuantity <= 0) {
                      updateQuantity(item.id, 1);
                    }
                  }}
                  min="1"
                  max={item.isBundle ? 1 : item.stockQuantity} // Example: Max 1 for bundle, product stock for others
                  readOnly={item.isBundle} // Make readonly for bundles if quantity is fixed
                  className="w-12 text-center border-x border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm py-1.5"
                />
                <button
                  onClick={() => updateQuantity(item.id, item.quantityInCart + 1)}
                  disabled={item.isBundle || item.quantityInCart >= item.stockQuantity} // Disable for bundles or if max stock reached
                  className="px-3 py-1.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-md transition-colors disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 transition-colors text-sm">
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t dark:border-gray-700 pt-6 space-y-4">
        <div className="flex justify-between text-lg font-semibold text-gray-800 dark:text-white">
          <span>جمع کل ({getItemCount().toLocaleString('fa-IR')} کالا):</span>
          <span>{getTotalPrice().toLocaleString('fa-IR')} تومان</span>
        </div>
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
          <button
            onClick={clearCart}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 font-medium py-2.5 px-5 rounded-md transition duration-150 ease-in-out text-sm"
          >
            پاک کردن سبد خرید
          </button>
          <Link
            href="/store/checkout" // Assuming a checkout page
            className="bg-green-600 hover:bg-green-700 text-white text-center font-semibold py-3 px-6 rounded-md transition duration-150 ease-in-out"
          >
            ادامه جهت تسویه حساب
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;

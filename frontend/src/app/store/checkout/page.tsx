"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import ShippingAddressForm from '@/components/store/ShippingAddressForm'; // To be created
import Image from 'next/image';

const CheckoutPage = () => {
  const { items, getItemCount, getTotalPrice, clearCart } = useCart();
  const [orderProcessing, setOrderProcessing] = React.useState(false);
  const [processingError, setProcessingError] = React.useState<string | null>(null);

  // This function will be passed to ShippingAddressForm to handle the full checkout process
  const handleCheckoutSubmit = async (shippingAddressData: any, userId: string = "temp_user_123") => {
    setOrderProcessing(true);
    setProcessingError(null);

    const orderItems = items.map(item => ({
      id: item.id, // productId or bundleId
      name: item.name, // For error messages or records, not strictly needed by backend if fetching by ID
      quantityInCart: item.quantityInCart,
      priceAtPurchase: item.price, // Price per unit (bundle price for bundles)
      isBundle: item.isBundle || false,
      // Backend will fetch/verify details using ID, but sending priceAtPurchase is good practice
    }));

    try {
      // Step 1: Create the order (checkout)
      const checkoutResponse = await fetch('/api/orders/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          items: orderItems,
          shippingAddress: shippingAddressData,
        }),
      });

      const checkoutResult = await checkoutResponse.json();
      if (!checkoutResponse.ok) {
        throw new Error(checkoutResult.message || 'خطا در ثبت اولیه سفارش.');
      }

      const { orderId } = checkoutResult;

      // Step 2: Initiate payment for the created order
      const paymentResponse = await fetch(`/api/payments/store-orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }), // Send userId for backend validation
      });

      const paymentResult = await paymentResponse.json();
      if (!paymentResponse.ok) {
        throw new Error(paymentResult.message || 'خطا در شروع فرآیند پرداخت.');
      }

      if (paymentResult.paymentGatewayURL) {
        clearCart(); // Clear cart before redirecting to payment gateway
        window.location.href = paymentResult.paymentGatewayURL;
      } else {
        throw new Error('URL درگاه پرداخت دریافت نشد.');
      }

    } catch (error: any) {
      console.error("Checkout process error:", error);
      setProcessingError(error.message || 'یک خطای پیش بینی نشده در فرآیند تسویه حساب رخ داد.');
      setOrderProcessing(false);
    }
  };


  if (getItemCount() === 0 && !orderProcessing) { // Don't show if processing an order that just cleared the cart
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">سبد خرید شما خالی است</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">برای ادامه، ابتدا محصولاتی را به سبد خرید خود اضافه کنید.</p>
        <Link href="/store" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-md">
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-10 text-gray-800 dark:text-white">
        تکمیل سفارش و پرداخت
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-1 order-last lg:order-first bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-xl font-semibold mb-4 border-b pb-3 dark:border-gray-700">خلاصه سفارش</h2>
          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <div className="relative w-12 h-12 rounded overflow-hidden mr-3 shrink-0">
                    <Image
                        src={item.images && item.images.length > 0 ? item.images[0] : '/images/placeholder-product.png'}
                        alt={item.name}
                        layout="fill"
                        objectFit="cover"
                    />
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{item.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 block"> (x{item.quantityInCart.toLocaleString('fa-IR')})</span>
                  </div>
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-200">{(item.price * item.quantityInCart).toLocaleString('fa-IR')} ت</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 dark:border-gray-700">
            <div className="flex justify-between font-semibold text-lg">
              <span>جمع کل:</span>
              <span>{getTotalPrice().toLocaleString('fa-IR')} تومان</span>
            </div>
            {/* Shipping cost can be added here once calculated */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">هزینه ارسال در مرحله بعد محاسبه خواهد شد (فعلاً رایگان).</p>
          </div>
        </div>

        {/* Shipping Address Form */}
        <div className="lg:col-span-2">
            <Suspense fallback={<div className="text-center py-10">در حال بارگذاری فرم آدرس...</div>}>
                <ShippingAddressForm
                    onSubmitAddress={handleCheckoutSubmit}
                    isProcessing={orderProcessing}
                    processingError={processingError}
                />
            </Suspense>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

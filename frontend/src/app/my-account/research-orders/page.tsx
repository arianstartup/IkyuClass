"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
// Assuming a generic API fetch utility, or create one for user-specific calls if needed
// For now, using a basic fetch, but adminApiFetch structure can be adapted if auth headers are needed for users.
// Let's assume user auth will eventually be handled by a context or cookies.

// Define ResearchOrderType based on backend model including new fields
interface ResearchOrderType {
  id: string;
  subject: string;
  educationLevel: string;
  description: string;
  status: string; // Overall status
  contentGenerationStatus: 'pending_approval' | 'approved_for_generation' | 'in_progress' | 'completed' | 'failed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  finalPrice?: number;
  generatedContentFileUrl?: string | null;
  generatedContentFileName?: string | null;
  createdAt: string; // Assuming ISO string from Firestore/JS Date
  paymentDetails?: { authority?: string | null; refId?: string | null; };
  // Add other relevant fields from your model
}

const MyResearchOrdersPage = () => {
  const [orders, setOrders] = useState<ResearchOrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessingOrderId, setPaymentProcessingOrderId] = useState<string | null>(null);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  // TODO: Replace with actual userId from auth context/session
  const MOCK_USER_ID = "temp_user_123";

  const fetchMyOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Adjust API call if user auth is handled via headers
      const response = await fetch(`/api/orders/research/my-orders?userId=${MOCK_USER_ID}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `خطا در دریافت لیست سفارشات تحقیق: ${response.statusText}`);
      }
      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching research orders:", err);
    } finally {
      setLoading(false);
    }
  }, [MOCK_USER_ID]);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const handlePayForOrder = async (orderId: string) => {
    setPaymentProcessingOrderId(orderId);
    setError(null);
    try {
      const response = await fetch(`/api/payments/research-orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: MOCK_USER_ID }), // Send userId for backend validation
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'خطا در شروع فرآیند پرداخت.');
      }
      if (result.paymentGatewayURL) {
        window.location.href = result.paymentGatewayURL;
      } else {
        throw new Error('URL درگاه پرداخت دریافت نشد.');
      }
    } catch (err: any) {
      setError(`پرداخت سفارش ${orderId}: ${err.message}`);
      console.error(`Payment initiation error for order ${orderId}:`, err);
    } finally {
      setPaymentProcessingOrderId(null);
    }
  };

  const handleDownloadFile = async (order: ResearchOrderType) => {
    if (!order.generatedContentFileUrl || !order.generatedContentFileName) {
        setError(`فایل برای سفارش ${order.id} موجود نیست.`);
        return;
    }
    setDownloadingOrderId(order.id);
    setError(null);
    try {
        // For direct download via GET and backend streaming with Content-Disposition
        // We need to simulate a click on an anchor tag or use window.open for GET request.
        // Or, if API returns blob/file data directly:
        const response = await fetch(`/api/orders/research/${order.id}/download`, {
            method: 'POST', // Changed to POST to easily send userId in body without relying on auth for now
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: MOCK_USER_ID }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `خطا در دانلود فایل: ${response.statusText}`);
        }

        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = order.generatedContentFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);

    } catch (err: any) {
        setError(`دانلود فایل سفارش ${order.id}: ${err.message}`);
        console.error(`File download error for order ${order.id}:`, err);
    } finally {
        setDownloadingOrderId(null);
    }
};


  const getPaymentStatusText = (status: ResearchOrderType['paymentStatus']) => {
    switch (status) {
      case 'pending': return 'در انتظار پرداخت';
      case 'paid': return 'پرداخت شده';
      case 'failed': return 'پرداخت ناموفق';
      case 'refunded': return 'بازپرداخت شده';
      default: return status;
    }
  };

  const getContentGenerationStatusText = (status: ResearchOrderType['contentGenerationStatus']) => {
     switch (status) {
      case 'pending_approval': return 'در انتظار تایید';
      case 'approved_for_generation': return 'تایید شده برای تولید';
      case 'in_progress': return 'در حال تولید محتوا';
      case 'completed': return 'تکمیل شده';
      case 'failed': return 'خطا در تولید محتوا';
      default: return status;
    }
  };


  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">در حال بارگذاری سفارشات تحقیق شما...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">سفارش‌های تحقیق من</h1>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">خطا</p>
          <p>{error}</p>
        </div>
      )}
      {orders.length === 0 && !loading && (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400 mb-4">شما هنوز هیچ سفارش تحقیقی ثبت نکرده‌اید.</p>
          <Link href="/orders/research/new" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md">
            ثبت سفارش تحقیق جدید
          </Link>
        </div>
      )}
      {orders.length > 0 && (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-5 hover:shadow-lg transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-1">{order.subject}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">مقطع: {order.educationLevel}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">شناسه: {order.id}</p>
                </div>
                <div className="space-y-1 text-sm">
                    <p>تاریخ سفارش: <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(order.createdAt).toLocaleDateString('fa-IR')}</span></p>
                    <p>وضعیت تولید: <span className={`font-semibold ${order.contentGenerationStatus === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{getContentGenerationStatusText(order.contentGenerationStatus)}</span></p>
                    <p>وضعیت پرداخت: <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{getPaymentStatusText(order.paymentStatus)}</span></p>
                    {order.finalPrice && <p>هزینه نهایی: <span className="font-semibold text-gray-700 dark:text-gray-300">{order.finalPrice.toLocaleString('fa-IR')} تومان</span></p>}
                </div>
                <div className="flex flex-col space-y-2 md:items-end">
                  {order.contentGenerationStatus === 'completed' && order.paymentStatus === 'pending' && (
                    <button
                      onClick={() => handlePayForOrder(order.id)}
                      disabled={paymentProcessingOrderId === order.id}
                      className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md text-sm w-full md:w-auto transition-colors disabled:opacity-70"
                    >
                      {paymentProcessingOrderId === order.id ? 'در حال پردازش...' : 'پرداخت هزینه تحقیق'}
                    </button>
                  )}
                  {order.contentGenerationStatus === 'completed' && order.paymentStatus === 'paid' && order.generatedContentFileUrl && (
                     <button
                        onClick={() => handleDownloadFile(order)}
                        disabled={downloadingOrderId === order.id}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md text-sm w-full md:w-auto transition-colors disabled:opacity-70"
                    >
                        {downloadingOrderId === order.id ? 'در حال آماده سازی...' : 'دانلود تحقیق'}
                    </button>
                  )}
                  {/* Placeholder for viewing details or re-trying failed payment if applicable */}
                   {(order.paymentStatus === 'failed' || order.contentGenerationStatus === 'failed') && (
                     <p className="text-xs text-red-500 dark:text-red-400 text-center md:text-right">مشکلی در این سفارش وجود دارد. لطفاً با پشتیبانی تماس بگیرید.</p>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyResearchOrdersPage;

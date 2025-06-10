"use client";

import React, { useEffect, useState, useCallback } from 'react';
// import Link from 'next/link'; // If needed for linking to student profiles etc.
import { adminApiFetch } from '@/utils/adminApi'; // Using admin fetch for now, assuming teacher is admin or has similar auth

// TODO: Replace with actual teacherId from auth context/session for a dedicated teacher panel
const MOCK_TEACHER_ID = "temp_teacher_id_from_admin_panel_or_specific_teacher_auth";

interface StudentInfo {
  id: string;
  name?: string; // Placeholder name for now
}

interface BookingTypeForTeacher {
  id: string;
  teacherId: string;
  studentId: string;
  bookingStartTime: string; // ISO string
  bookingEndTime: string;   // ISO string
  bookingType: 'online' | 'in-person';
  status: 'pending_payment' | 'confirmed' | 'cancelled_by_student' | 'cancelled_by_teacher' | 'completed' | 'payment_failed';
  price: number;
  studentInfo?: StudentInfo;
  createdAt: string;
}

const TeacherBookedClassesPage = () => {
  const [bookings, setBookings] = useState<BookingTypeForTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchTeacherBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Using adminApiFetch implies admin auth headers are sent.
      // The backend route GET /api/bookings/my-teacher-bookings expects userId in query.
      const data = await adminApiFetch(`/api/bookings/my-teacher-bookings?userId=${MOCK_TEACHER_ID}`);
      setBookings(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching teacher bookings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeacherBookings();
  }, [fetchTeacherBookings]);

  const handleCancelBookingByTeacher = async (bookingId: string) => {
    if (!window.confirm("آیا از لغو این جلسه رزرو شده اطمینان دارید؟")) return;

    setCancellingId(bookingId);
    setError(null);
    try {
      // Using adminApiFetch implies admin auth headers.
      // The backend route PUT /api/bookings/:bookingId/cancel expects userId and role in body.
      const response = await adminApiFetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: MOCK_TEACHER_ID, role: 'teacher' }),
      });
      // alert('جلسه با موفقیت لغو شد.');
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: response.newStatus || 'cancelled_by_teacher' } : b));
    } catch (err: any) {
      setError(`لغو جلسه ${bookingId}: ${err.message}`);
      alert(`خطا: ${err.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusStyle = (status: BookingTypeForTeacher['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled_by_student':
      case 'cancelled_by_teacher':
      case 'payment_failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 line-through';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusText = (status: BookingTypeForTeacher['status']) => {
    // Same as student's page, can be refactored into a shared util
    switch (status) {
      case 'pending_payment': return 'در انتظار پرداخت دانش‌آموز';
      case 'confirmed': return 'تایید شده و قطعی';
      case 'cancelled_by_student': return 'لغو شده توسط دانش‌آموز';
      case 'cancelled_by_teacher': return 'لغو شده توسط شما';
      case 'completed': return 'تکمیل شده';
      case 'payment_failed': return 'پرداخت ناموفق';
      default: return status;
    }
  };

  const isCancellableByTeacher = (booking: BookingTypeForTeacher) => {
    const now = new Date();
    const startTime = new Date(booking.bookingStartTime);
    const hoursDifference = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    // Allow cancellation if confirmed (student paid) or pending_payment (student not yet paid)
    return (booking.status === 'confirmed' || booking.status === 'pending_payment') && hoursDifference > 1; // e.g., > 1 hour before
  };


  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری کلاس‌های رزرو شده...</div>;
  }


  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-8">کلاس‌های رزرو شده برای شما</h1>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">خطا</p>
          <p>{error}</p>
        </div>
      )}
      {bookings.length === 0 && !loading && (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">در حال حاضر هیچ کلاسی برای شما رزرو نشده است.</p>
          {/* Maybe link to availability settings */}
        </div>
      )}
      {bookings.length > 0 && (
        <div className="space-y-6">
          {bookings.map(booking => (
            <div key={booking.id} className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg p-5 hover:shadow-xl transition-shadow ${isCancellableByTeacher(booking) && (booking.status === 'cancelled_by_student' || booking.status === 'cancelled_by_teacher') ? 'opacity-60' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
                <div className="lg:col-span-1">
                  <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
                    جلسه با {booking.studentInfo?.name || `دانش‌آموز (${booking.studentId})`}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">شناسه رزرو: {booking.id}</p>
                </div>

                <div className="space-y-1 text-sm lg:col-span-1">
                   <p>تاریخ و ساعت:
                    <span className="font-medium text-gray-700 dark:text-gray-300 block sm:inline">
                       {new Date(booking.bookingStartTime).toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300 block sm:inline">
                       ، ساعت {new Date(booking.bookingStartTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })} تا {new Date(booking.bookingEndTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </p>
                  <p>نوع جلسه: <span className="font-medium text-gray-700 dark:text-gray-300">{booking.bookingType === 'online' ? 'آنلاین' : 'حضوری'}</span></p>
                  <p>هزینه جلسه: <span className="font-semibold text-gray-700 dark:text-gray-300">{booking.price.toLocaleString('fa-IR')} تومان</span></p>
                </div>

                 <div className="lg:col-span-1">
                    <p className="text-sm">وضعیت:
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusStyle(booking.status)}`}>
                            {getStatusText(booking.status)}
                        </span>
                    </p>
                </div>

                <div className="lg:col-span-1 flex flex-col items-end space-y-2">
                  {isCancellableByTeacher(booking) && (
                    <button
                      onClick={() => handleCancelBookingByTeacher(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md text-sm w-full sm:w-auto transition-colors disabled:opacity-70"
                    >
                      {cancellingId === booking.id ? 'در حال لغو...' : 'لغو این جلسه'}
                    </button>
                  )}
                   {booking.status === 'confirmed' && new Date(booking.bookingStartTime) > new Date() && (
                     <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md text-sm w-full sm:w-auto">
                        مدیریت جلسه (آینده)
                    </button>
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

export default TeacherBookedClassesPage;

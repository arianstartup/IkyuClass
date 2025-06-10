"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import withAuth from '@/components/auth/withAuth'; // Import HOC
import { useAuth } from '@/contexts/AuthContext'; // To get actual studentId

interface TeacherInfo {
  firstName?: string;
  lastName?: string;
  subjectTaught?: string[] | string;
  name?: string; // Fallback
}

interface BookingType {
  id: string;
  teacherId: string;
  studentId: string;
  bookingStartTime: string; // ISO string
  bookingEndTime: string;   // ISO string
  bookingType: 'online' | 'in-person';
  status: 'pending_payment' | 'confirmed' | 'cancelled_by_student' | 'cancelled_by_teacher' | 'completed' | 'payment_failed';
  price: number;
  teacherInfo?: TeacherInfo;
  createdAt: string;
}

const reviewSchema = z.object({
  rating: z.coerce.number().min(1, "امتیاز الزامی است (حداقل ۱ ستاره)").max(5, "امتیاز نمی‌تواند بیشتر از ۵ ستاره باشد"),
  comment: z.string().max(2000, "متن نظر نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد").optional(),
});
type ReviewFormInputs = z.infer<typeof reviewSchema>;

const MyStudentBookingsPageContent: React.FC = () => { // Renamed original component
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showReviewModalForBooking, setShowReviewModalForBooking] = useState<BookingType | null>(null);
  const [userReviewedBookingIds, setUserReviewedBookingIds] = useState<string[]>([]);
  const { currentUser, loadingAuth: authLoading } = useAuth();

  const fetchMyBookings = useCallback(async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`/api/bookings/my-student-bookings`, { // Backend uses req.user.uid
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `خطا در دریافت لیست رزروها: ${response.statusText}`);
      }
      const data = await response.json();
      setBookings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!authLoading && currentUser) {
        fetchMyBookings();
    } else if (!authLoading && !currentUser) {
        setBookings([]);
        setLoading(false);
    }
  }, [fetchMyBookings, authLoading, currentUser]);

  const handleReviewSubmitted = (bookingId: string) => {
    setUserReviewedBookingIds(prev => [...prev, bookingId]);
    setShowReviewModalForBooking(null);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("آیا از لغو این رزرو اطمینان دارید؟") || !currentUser) return;
    setCancellingId(bookingId);
    setError(null);
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        // Body for userId/role is no longer needed as backend uses req.user
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'خطا در لغو رزرو.');
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: result.newStatus || 'cancelled_by_student' } : b));
    } catch (err: any) {
      setError(`لغو رزرو ${bookingId}: ${err.message}`);
      alert(`خطا: ${err.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusStyle = (status: BookingType['status']) => { /* ... (same as before) ... */
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled_by_student': case 'cancelled_by_teacher': case 'payment_failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 line-through';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  const getStatusText = (status: BookingType['status']) => { /* ... (same as before) ... */
    switch (status) {
      case 'pending_payment': return 'در انتظار پرداخت';
      case 'confirmed': return 'تایید شده';
      case 'cancelled_by_student': return 'لغو شده توسط شما';
      case 'cancelled_by_teacher': return 'لغو شده توسط معلم';
      case 'completed': return 'تکمیل شده';
      case 'payment_failed': return 'پرداخت ناموفق';
      default: return status;
    }
  };
  const isCancellable = (booking: BookingType) => { /* ... (same as before) ... */
    const now = new Date();
    const startTime = new Date(booking.bookingStartTime);
    const hoursDifference = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return (booking.status === 'confirmed' || booking.status === 'pending_payment') && hoursDifference > 1;
  };

  if (authLoading || loading) return <div className="container mx-auto px-4 py-8 text-center">در حال بارگذاری رزروهای شما...</div>;
  if (!currentUser && !authLoading) return <div className="container mx-auto px-4 py-8 text-center">برای مشاهده این صفحه باید وارد شوید. <Link href="/login" className="text-indigo-500">ورود</Link></div>;


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-8">رزروهای کلاس من</h1>
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert"><p className="font-bold">خطا</p><p>{error}</p></div>}
      {bookings.length === 0 && !loading && (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400 mb-4">شما هنوز هیچ کلاسی رزرو نکرده‌اید.</p>
          <Link href="/teachers" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md">مشاهده لیست معلمان و رزرو کلاس</Link>
        </div>
      )}
      {bookings.length > 0 && (
        <div className="space-y-6">
          {bookings.map(booking => (
            <div key={booking.id} className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg p-5 hover:shadow-xl transition-shadow ${(booking.status === 'cancelled_by_student' || booking.status === 'cancelled_by_teacher') ? 'opacity-60' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
                <div className="lg:col-span-1">
                  <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-1">کلاس با {booking.teacherInfo?.firstName || ''} {booking.teacherInfo?.lastName || booking.teacherInfo?.name || 'نامشخص'}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">موضوع: {Array.isArray(booking.teacherInfo?.subjectTaught) ? booking.teacherInfo?.subjectTaught.join('، ') : booking.teacherInfo?.subjectTaught || 'عمومی'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">شناسه رزرو: {booking.id}</p>
                </div>
                <div className="space-y-1 text-sm lg:col-span-1">
                  <p>تاریخ و ساعت: <span className="font-medium text-gray-700 dark:text-gray-300 block sm:inline">{new Date(booking.bookingStartTime).toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span><span className="font-medium text-gray-700 dark:text-gray-300 block sm:inline">، ساعت {new Date(booking.bookingStartTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })} تا {new Date(booking.bookingEndTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span></p>
                  <p>نوع جلسه: <span className="font-medium text-gray-700 dark:text-gray-300">{booking.bookingType === 'online' ? 'آنلاین' : 'حضوری'}</span></p>
                  <p>هزینه: <span className="font-semibold text-gray-700 dark:text-gray-300">{booking.price.toLocaleString('fa-IR')} تومان</span></p>
                </div>
                <div className="lg:col-span-1"><p className="text-sm">وضعیت: <span className={`px-3 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusStyle(booking.status)}`}>{getStatusText(booking.status)}</span></p>
                    {booking.status === 'pending_payment' && (<button onClick={() => alert(`پرداخت برای رزرو ${booking.id} - نیاز به پیاده‌سازی مشابه سایر پرداخت‌ها یا استفاده از /api/payments/bookings/:bookingId/pay`)} className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-1.5 px-3 rounded-md text-xs w-full sm:w-auto">پرداخت هزینه جلسه</button>)}
                </div>
                <div className="lg:col-span-1 flex flex-col items-end space-y-2">
                  {isCancellable(booking) && (<button onClick={() => handleCancelBooking(booking.id)} disabled={cancellingId === booking.id} className="bg-red-500 hover:bg-red-600 text-white font-medium py-1.5 px-3 rounded-md text-xs w-full sm:w-auto transition-colors disabled:opacity-70">{cancellingId === booking.id ? 'لغو...' : 'لغو رزرو'}</button>)}
                  {booking.status === 'completed' && !userReviewedBookingIds.includes(booking.id) && (<button onClick={() => setShowReviewModalForBooking(booking)} className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-1.5 px-3 rounded-md text-xs w-full sm:w-auto transition-colors">ثبت نظر و امتیاز</button>)}
                  {booking.status === 'completed' && userReviewedBookingIds.includes(booking.id) && (<p className="text-xs text-green-600 dark:text-green-400">نظر شما ثبت شده</p>)}
                  {booking.status === 'confirmed' && new Date(booking.bookingStartTime) > new Date() && (<button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1.5 px-3 rounded-md text-xs w-full sm:w-auto">ورود به جلسه</button>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showReviewModalForBooking && <ReviewModal booking={showReviewModalForBooking} onClose={() => setShowReviewModalForBooking(null)} onReviewSubmitted={handleReviewSubmitted} />}
    </div>
  );
};

interface ReviewModalProps {
  booking: BookingType;
  onClose: () => void;
  onReviewSubmitted: (bookingId: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ booking, onClose, onReviewSubmitted }) => {
  const { currentUser } = useAuth(); // Get current user for studentId
  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<ReviewFormInputs>({ // Added setValue
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' }
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const currentRating = watch("rating");

  const handleActualSubmitReview: SubmitHandler<ReviewFormInputs> = async (data) => {
    if (!currentUser) {
      setReviewError("برای ثبت نظر باید وارد شده باشید. لطفاً صفحه را رفرش کنید.");
      return;
    }
    if (data.rating === 0) { // Should be caught by Zod, but good fallback
      setValue("rating", 0, {shouldValidate: true}); // Trigger RHF validation
      return;
    }
    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`/api/reviews/teachers/${booking.teacherId}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}` // Send token for auth
        },
        body: JSON.stringify({
            // studentId: currentUser.uid, // Backend gets this from req.user.uid
            bookingId: booking.id,
            rating: data.rating,
            comment: data.comment
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "خطا در ثبت نظر.");
      onReviewSubmitted(booking.id);
    } catch (error: any) { setReviewError(error.message); } finally { setIsSubmittingReview(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-3">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">ثبت نظر برای جلسه با {booking.teacherInfo?.firstName} {booking.teacherInfo?.lastName}</h3>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">&times;</button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">تاریخ جلسه: {new Date(booking.bookingStartTime).toLocaleDateString('fa-IR')}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">موضوع: {Array.isArray(booking.teacherInfo?.subjectTaught) ? booking.teacherInfo?.subjectTaught.join('، ') : booking.teacherInfo?.subjectTaught}</p>

        <form onSubmit={handleSubmit(handleActualSubmitReview)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">امتیاز شما (از ۱ تا ۵):<span className="text-red-500">*</span></label>
            <div className="flex space-x-1 space-x-reverse"> {/* Removed {...register("rating")} from here */}
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => setValue("rating", star, { shouldValidate: true, shouldDirty: true })}
                  className={`text-3xl ${star <= currentRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'} hover:text-yellow-400 transition-colors`}>★</button>
              ))}
            </div>
            <input type="hidden" {...register("rating")} /> {/* Hidden input for RHF to track rating value */}
            {errors.rating && <p className="text-red-500 text-xs mt-1">{errors.rating.message}</p>}
            {/* Removed redundant reviewError check for rating as RHF handles it */}
          </div>
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">نظر شما (اختیاری):</label>
            <textarea id="comment" {...register("comment")} rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="تجربه خود را از این جلسه بنویسید..."
            ></textarea>
            {errors.comment && <p className="text-red-500 text-xs mt-1">{errors.comment.message}</p>}
          </div>
          {reviewError && <p className="text-red-500 text-sm p-2 bg-red-50 dark:bg-red-900 rounded">{reviewError}</p>}
          <div className="flex justify-end space-x-3 space-x-reverse pt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md shadow-sm">انصراف</button>
            <button type="submit" disabled={isSubmittingReview} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm disabled:opacity-70">
              {isSubmittingReview ? 'در حال ارسال...' : 'ثبت نظر'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default withAuth(MyStudentBookingsPageContent, ['student', 'university_student']); // Protect this page

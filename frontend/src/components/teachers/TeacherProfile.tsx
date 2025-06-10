"use client";

import React, { useState, useEffect } from 'react';
import { TeacherProfileData, AvailabilitySlot } from '@/app/teachers/[teacherId]/page'; // Ensure this path is correct
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext'; // For potential use if student books from here

// Define ReviewType based on backend structure (or import from a shared types file)
interface Review {
    id: string;
    studentId: string;
    rating: number;
    comment: string;
    reviewDate: { toDate: () => Date } | string; // Firestore Timestamp or ISO string
    // studentInfo?: { name?: string }; // If backend populates student name
}

interface TeacherProfileProps {
  teacher: TeacherProfileData;
}

const availabilitySlotSchema = z.object({
  dayOfWeek: z.string().min(1, "روز هفته الزامی است"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "فرمت زمان شروع صحیح نیست (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "فرمت زمان پایان صحیح نیست (HH:MM)"),
  type: z.enum(['online', 'in-person'], { required_error: "نوع جلسه الزامی است" }),
});

const updateAvailabilitySchema = z.object({
  availability: z.array(availabilitySlotSchema),
});

type UpdateAvailabilityFormInputs = z.infer<typeof updateAvailabilitySchema>;

const daysOfWeekPersian = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

const TeacherProfile: React.FC<TeacherProfileProps> = ({ teacher }) => {
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [bookingStatus, setBookingStatus] = useState<{ success: boolean; message: string; bookingId?: string } | null>(null);
  const [paymentInitiationLoading, setPaymentInitiationLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const { currentUser } = useAuth(); // Get current user for studentId if needed for booking

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UpdateAvailabilityFormInputs>({
    resolver: zodResolver(updateAvailabilitySchema),
    defaultValues: {
      availability: teacher.availability || [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "availability" });

  useEffect(() => {
    if (teacher && teacher.id) {
      const fetchReviews = async () => {
        setReviewsLoading(true);
        setReviewsError(null);
        try {
          // This API is public, no auth header needed
          const response = await fetch(`/api/reviews/teachers/${teacher.id}/reviews`);
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || "خطا در دریافت نظرات");
          }
          const data = await response.json();
          setReviews(data);
        } catch (error: any) {
          setReviewsError(error.message);
        } finally {
          setReviewsLoading(false);
        }
      };
      fetchReviews();
    }
  }, [teacher]);

  const onAvailabilitySubmit: SubmitHandler<UpdateAvailabilityFormInputs> = async (data) => {
    setSubmissionStatus(null);
    // TODO: This should be an admin-only or teacher-owner action.
    // Use adminApiFetch or ensure current user is teacher owner.
    // For now, assuming it's accessible for demo.
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.uid !== teacher.id)) {
        setSubmissionStatus({ success: false, message: "شما مجاز به ویرایش این برنامه نیستید." });
        return;
    }
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`/api/teachers/${teacher.id}/availability`, { // This API needs protection
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'خطا در به‌روزرسانی برنامه زمانی');
      setSubmissionStatus({ success: true, message: 'برنامه زمانی با موفقیت به‌روزرسانی شد.' });
      setIsEditingAvailability(false);
      // TODO: Propagate availability change to parent or refetch teacher data
    } catch (error: any) {
      setSubmissionStatus({ success: false, message: error.message || 'یک خطای پیش بینی نشده رخ داد.' });
    }
  };

  const handleBookSlot = async (slot: AvailabilitySlot) => {
    setBookingStatus(null); setPaymentError(null);
    if (!currentUser) {
      setBookingStatus({ success: false, message: "برای رزرو جلسه ابتدا باید وارد شوید." });
      return;
    }
    const studentId = currentUser.uid;

    const today = new Date();
    const dayIndexMap: { [key: string]: number } = { "شنبه": 6, "یکشنبه": 0, "دوشنبه": 1, "سه‌شنبه": 2, "چهارشنبه": 3, "پنجشنبه": 4, "جمعه": 5 };
    const targetDayIndex = dayIndexMap[slot.dayOfWeek];
    if (targetDayIndex === undefined) { setBookingStatus({success: false, message: "روز هفته نامعتبر است."}); return; }
    let bookingDate = new Date(today);
    bookingDate.setDate(today.getDate() + (targetDayIndex - today.getDay() + 7) % 7);
    if (bookingDate.setHours(0,0,0,0) === today.setHours(0,0,0,0)) {
        const tempBookingStartTime = new Date(bookingDate);
        const [startHourCheck, startMinuteCheck] = slot.startTime.split(':').map(Number);
        tempBookingStartTime.setHours(startHourCheck, startMinuteCheck, 0, 0);
        if (tempBookingStartTime <= new Date()) { bookingDate.setDate(bookingDate.getDate() + 7); }
    } else if (bookingDate < today) { bookingDate.setDate(bookingDate.getDate() + 7); }

    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const [endHour, endMinute] = slot.endTime.split(':').map(Number);
    const bookingStartTime = new Date(bookingDate); bookingStartTime.setHours(startHour, startMinute, 0, 0);
    const bookingEndTime = new Date(bookingDate); bookingEndTime.setHours(endHour, endMinute, 0, 0);

    if (bookingStartTime <= new Date()) { setBookingStatus({success: false, message: "امکان رزرو این زمان در گذشته وجود ندارد."}); return; }

    const bookingData = {
      teacherId: teacher.id, studentId, bookingStartTime: bookingStartTime.toISOString(),
      bookingEndTime: bookingEndTime.toISOString(), bookingType: slot.type, price: teacher.hourlyRate || 0,
    };
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/bookings/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(bookingData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'خطا در ثبت رزرو');
      setBookingStatus({ success: true, message: result.message || 'رزرو با موفقیت ثبت شد و در انتظار پرداخت است.', bookingId: result.bookingId });
    } catch (error: any) {
      setBookingStatus({ success: false, message: error.message || 'خطای پیش بینی نشده در رزرو.' });
    }
  };

  const handlePayment = async (bookingId: string) => {
    setPaymentInitiationLoading(true); setPaymentError(null);
    if (!currentUser) {
      setPaymentError("برای پرداخت باید وارد شده باشید.");
      setPaymentInitiationLoading(false);
      return;
    }
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`/api/payments/bookings/${bookingId}/pay`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        // body: JSON.stringify({ userId: currentUser.uid }) // Backend uses req.user.uid
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'خطا در شروع پرداخت');
      if (result.paymentGatewayURL) window.location.href = result.paymentGatewayURL;
      else throw new Error('URL درگاه پرداخت دریافت نشد.');
    } catch (error: any) {
      setPaymentError(error.message || 'خطای پیش بینی نشده در اتصال به درگاه.');
    } finally {
      setPaymentInitiationLoading(false);
    }
  };

  const subjects = Array.isArray(teacher.subjectTaught) ? teacher.subjectTaught.join('، ') : teacher.subjectTaught;
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white";
  const errorClass = "text-red-500 text-sm mt-1 dark:text-red-400";
  const buttonClass = "py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white";

  const isTeacherViewingOwnProfile = currentUser?.uid === teacher.id && currentUser?.role === 'teacher';

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
      <div className="md:flex md:space-x-8 space-x-reverse">
        <div className="md:w-1/3 text-center md:text-right mb-6 md:mb-0">
          <div className="w-32 h-32 md:w-48 md:h-48 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto md:mx-0 mb-4 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400 text-3xl">{teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{teacher.firstName} {teacher.lastName}</h2>
          <p className="text-md text-indigo-600 dark:text-indigo-400">{subjects}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{teacher.email}</p>
          {/* Display Average Rating */}
          {(teacher.totalRatings || 0) > 0 ? (
            <div className="mt-3 flex items-center justify-center md:justify-start">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={`w-5 h-5 ${star <= (teacher.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="mr-2 text-sm text-gray-600 dark:text-gray-400">({(teacher.averageRating || 0).toFixed(1).toLocaleString('fa-IR')} از {(teacher.totalRatings || 0).toLocaleString('fa-IR')} رای)</span>
            </div>
          ) : <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center md:text-right">هنوز امتیازی ثبت نشده</p>}
        </div>

        <div className="md:w-2/3">
          <div className="mb-6"><h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 border-b pb-2 border-gray-200 dark:border-gray-700">سوابق و مدارک</h3><p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{teacher.qualifications || 'ارائه نشده'}</p></div>
          {teacher.bio && (<div className="mb-6"><h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 border-b pb-2 border-gray-200 dark:border-gray-700">درباره من</h3><p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{teacher.bio}</p></div>)}
          {teacher.hourlyRate !== undefined && (<div className="mb-6"><h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 border-b pb-2 border-gray-200 dark:border-gray-700">هزینه تدریس (ساعتی)</h3><p className="text-gray-700 dark:text-gray-300">{teacher.hourlyRate > 0 ? `${teacher.hourlyRate.toLocaleString('fa-IR')} تومان` : 'توافقی'}</p></div>)}

          <div className="mb-6">
            <div className="flex justify-between items-center border-b pb-2 border-gray-200 dark:border-gray-700 mb-3">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">برنامه زمانی و هماهنگی</h3>
              {(isTeacherViewingOwnProfile || currentUser?.role === 'admin') && ( // Show edit button to teacher owner or admin
                <button onClick={() => { reset({ availability: teacher.availability || [] }); setIsEditingAvailability(!isEditingAvailability); setSubmissionStatus(null); setBookingStatus(null);}}
                  className={`${buttonClass} ${isEditingAvailability ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'} text-xs`}>
                  {isEditingAvailability ? 'لغو ویرایش' : 'ویرایش برنامه'}
                </button>
              )}
            </div>
            {isEditingAvailability ? (
              <form onSubmit={handleSubmit(onAvailabilitySubmit)} className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center p-3 border dark:border-gray-600 rounded">
                    <div><label htmlFor={`availability.${index}.dayOfWeek`} className="block text-xs font-medium mb-1">روز</label><select {...register(`availability.${index}.dayOfWeek`)} className={`${inputClass} text-xs`}>{daysOfWeekPersian.map(day => <option key={day} value={day}>{day}</option>)}</select>{errors.availability?.[index]?.dayOfWeek && <p className={errorClass}>{errors.availability[index]?.dayOfWeek?.message}</p>}</div>
                    <div><label htmlFor={`availability.${index}.startTime`} className="block text-xs font-medium mb-1">از ساعت</label><input type="time" {...register(`availability.${index}.startTime`)} className={`${inputClass} text-xs`} />{errors.availability?.[index]?.startTime && <p className={errorClass}>{errors.availability[index]?.startTime?.message}</p>}</div>
                    <div><label htmlFor={`availability.${index}.endTime`} className="block text-xs font-medium mb-1">تا ساعت</label><input type="time" {...register(`availability.${index}.endTime`)} className={`${inputClass} text-xs`} />{errors.availability?.[index]?.endTime && <p className={errorClass}>{errors.availability[index]?.endTime?.message}</p>}</div>
                    <div className="flex flex-col space-y-1"><label className="block text-xs font-medium">نوع</label><select {...register(`availability.${index}.type`)} className={`${inputClass} text-xs`}><option value="online">آنلاین</option><option value="in-person">حضوری</option></select>{errors.availability?.[index]?.type && <p className={errorClass}>{errors.availability[index]?.type?.message}</p>}<button type="button" onClick={() => remove(index)} className={`${buttonClass} bg-red-600 hover:bg-red-700 text-xs`}>حذف</button></div>
                  </div>
                ))}
                <button type="button" onClick={() => append({ dayOfWeek: 'شنبه', startTime: '09:00', endTime: '10:00', type: 'online' })} className={`${buttonClass} bg-green-500 hover:bg-green-600 text-xs`}>افزودن ساعت جدید</button>
                <button type="submit" disabled={isSubmitting} className={`${buttonClass} bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs`}>{isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات برنامه'}</button>
                {submissionStatus && (<div className={`p-3 rounded-md text-xs ${submissionStatus.success ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'}`}>{submissionStatus.message}</div>)}
              </form>
            ) : (
              teacher.availability && teacher.availability.length > 0 ? (
                <div className="space-y-3">
                  {teacher.availability.map((slot, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center">
                      <div><p className="font-semibold text-gray-800 dark:text-white">{slot.dayOfWeek}: <span className="font-normal text-gray-700 dark:text-gray-300">{slot.startTime} - {slot.endTime}</span></p><p className="text-sm text-gray-600 dark:text-gray-400">نوع جلسه: {slot.type === 'online' ? 'آنلاین' : 'حضوری'}</p></div>
                      <button onClick={() => handleBookSlot(slot)} className="mt-3 sm:mt-0 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out text-sm disabled:opacity-50"
                        disabled={!currentUser || currentUser.uid === teacher.id} // Disable if not logged in or is the teacher themselves
                        title={currentUser?.uid === teacher.id ? "شما نمی‌توانید با خودتان جلسه رزرو کنید." : (!currentUser ? "برای رزرو وارد شوید" : "رزرو این زمان")}
                      >رزرو این زمان</button>
                    </div>
                  ))}
                </div>
              ) : (<p className="text-gray-500 dark:text-gray-400 text-center py-4">برنامه زمانی هنوز توسط این معلم تنظیم نشده است.</p>)
            )}
            {bookingStatus && (<div className={`mt-4 p-3 rounded-md text-sm ${bookingStatus.success ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'}`}><p className="font-semibold">{bookingStatus.message}</p>{bookingStatus.success && bookingStatus.bookingId && (<><p className="text-xs">شناسه رزرو: {bookingStatus.bookingId}.</p><button onClick={() => handlePayment(bookingStatus.bookingId!)} className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-md text-xs" disabled={paymentInitiationLoading}>{paymentInitiationLoading ? 'در حال انتقال به درگاه...' : 'پرداخت هزینه جلسه'}</button></>)}{paymentError && <p className="text-red-500 text-xs mt-1">{paymentError}</p>}</div>)}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-10 pt-6 border-t dark:border-gray-700">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">نظرات و امتیازات کاربران</h3>
        {reviewsLoading && <p className="text-center text-gray-500 dark:text-gray-400">در حال بارگذاری نظرات...</p>}
        {reviewsError && <p className="text-center text-red-500 dark:text-red-400">خطا در دریافت نظرات: {reviewsError}</p>}
        {!reviewsLoading && !reviewsError && reviews.length === 0 && (teacher.totalRatings === 0 || teacher.totalRatings === undefined) && (
          <p className="text-center text-gray-500 dark:text-gray-400">هنوز نظری برای این معلم ثبت نشده است.</p>
        )}
        {!reviewsLoading && !reviewsError && reviews.length > 0 && (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 shadow">
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                  </div>
                  <p className="mr-3 text-sm font-semibold text-gray-700 dark:text-gray-200">دانش‌آموز (ناشناس)</p>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{review.comment || "بدون نظر متنی."}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-left">
                  تاریخ ثبت: {new Date(typeof review.reviewDate === 'string' ? review.reviewDate : review.reviewDate.toDate()).toLocaleDateString('fa-IR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherProfile;

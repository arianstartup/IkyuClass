"use client";

import React, { useState } from 'react';
import { TeacherProfileData, AvailabilitySlot } from '@/app/teachers/[teacherId]/page'; // Import types
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UpdateAvailabilityFormInputs>({
    resolver: zodResolver(updateAvailabilitySchema),
    defaultValues: {
      availability: teacher.availability || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "availability",
  });

  const onAvailabilitySubmit: SubmitHandler<UpdateAvailabilityFormInputs> = async (data) => {
    setSubmissionStatus(null);
    try {
      const response = await fetch(`/api/teachers/${teacher.id}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'خطا در به‌روزرسانی برنامه زمانی');
      }
      setSubmissionStatus({ success: true, message: 'برنامه زمانی با موفقیت به‌روزرسانی شد.' });
      setIsEditingAvailability(false);
      // Ideally, refresh teacher data here or update state if API returns the full updated teacher object
    } catch (error: any) {
      setSubmissionStatus({ success: false, message: error.message || 'یک خطای پیش بینی نشده رخ داد.' });
    }
  };

  const subjects = Array.isArray(teacher.subjectTaught)
    ? teacher.subjectTaught.join('، ')
    : teacher.subjectTaught;

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white";
  const errorClass = "text-red-500 text-sm mt-1 dark:text-red-400";
  const buttonClass = "py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white";


  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
      <div className="md:flex md:space-x-8 space-x-reverse">
        <div className="md:w-1/3 text-center md:text-right mb-6 md:mb-0">
          {/* Placeholder for profile picture */}
          <div className="w-32 h-32 md:w-48 md:h-48 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto md:mx-0 mb-4 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400 text-3xl">{teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {teacher.firstName} {teacher.lastName}
          </h2>
          <p className="text-md text-indigo-600 dark:text-indigo-400">{subjects}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{teacher.email}</p>
        </div>

        <div className="md:w-2/3">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 border-b pb-2 border-gray-200 dark:border-gray-700">سوابق و مدارک</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{teacher.qualifications || 'ارائه نشده'}</p>
          </div>

          {teacher.bio && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 border-b pb-2 border-gray-200 dark:border-gray-700">درباره من</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{teacher.bio}</p>
            </div>
          )}

          {teacher.hourlyRate !== undefined && (
             <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 border-b pb-2 border-gray-200 dark:border-gray-700">هزینه تدریس (ساعتی)</h3>
                <p className="text-gray-700 dark:text-gray-300">{teacher.hourlyRate > 0 ? `${teacher.hourlyRate.toLocaleString('fa-IR')} تومان` : 'توافقی'}</p>
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between items-center border-b pb-2 border-gray-200 dark:border-gray-700 mb-3">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">برنامه زمانی و هماهنگی</h3>
              {/* This button should ideally only be shown if the logged-in user is this teacher */}
              <button
                onClick={() => {
                  reset({ availability: teacher.availability || [] }); // Reset form with current teacher availability
                  setIsEditingAvailability(!isEditingAvailability);
                  setSubmissionStatus(null); // Clear previous messages
                }}
                className={`${buttonClass} ${isEditingAvailability ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'} text-xs`}
              >
                {isEditingAvailability ? 'لغو ویرایش' : 'ویرایش برنامه'}
              </button>
            </div>

            {isEditingAvailability ? (
              <form onSubmit={handleSubmit(onAvailabilitySubmit)} className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center p-3 border dark:border-gray-600 rounded">
                    <div>
                      <label htmlFor={`availability.${index}.dayOfWeek`} className="block text-xs font-medium mb-1">روز</label>
                      <select {...register(`availability.${index}.dayOfWeek`)} className={`${inputClass} text-xs`}>
                        {daysOfWeekPersian.map(day => <option key={day} value={day}>{day}</option>)}
                      </select>
                      {errors.availability?.[index]?.dayOfWeek && <p className={errorClass}>{errors.availability[index]?.dayOfWeek?.message}</p>}
                    </div>
                    <div>
                      <label htmlFor={`availability.${index}.startTime`} className="block text-xs font-medium mb-1">از ساعت</label>
                      <input type="time" {...register(`availability.${index}.startTime`)} className={`${inputClass} text-xs`} />
                      {errors.availability?.[index]?.startTime && <p className={errorClass}>{errors.availability[index]?.startTime?.message}</p>}
                    </div>
                    <div>
                      <label htmlFor={`availability.${index}.endTime`} className="block text-xs font-medium mb-1">تا ساعت</label>
                      <input type="time" {...register(`availability.${index}.endTime`)} className={`${inputClass} text-xs`} />
                      {errors.availability?.[index]?.endTime && <p className={errorClass}>{errors.availability[index]?.endTime?.message}</p>}
                    </div>
                    <div className="flex flex-col space-y-1">
                        <label className="block text-xs font-medium">نوع</label>
                        <select {...register(`availability.${index}.type`)} className={`${inputClass} text-xs`}>
                            <option value="online">آنلاین</option>
                            <option value="in-person">حضوری</option>
                        </select>
                        {errors.availability?.[index]?.type && <p className={errorClass}>{errors.availability[index]?.type?.message}</p>}
                        <button type="button" onClick={() => remove(index)} className={`${buttonClass} bg-red-600 hover:bg-red-700 text-xs`}>حذف</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => append({ dayOfWeek: 'شنبه', startTime: '09:00', endTime: '10:00', type: 'online' })} className={`${buttonClass} bg-green-500 hover:bg-green-600 text-xs`}>
                  افزودن ساعت جدید
                </button>
                <button type="submit" disabled={isSubmitting} className={`${buttonClass} bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs`}>
                  {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات برنامه'}
                </button>
                {submissionStatus && (
                  <div className={`p-3 rounded-md text-xs ${submissionStatus.success ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'}`}>
                    {submissionStatus.message}
                  </div>
                )}
              </form>
            ) : (
              teacher.availability && teacher.availability.length > 0 ? (
                <div className="space-y-3">
                  {teacher.availability.map((slot, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {slot.dayOfWeek}: <span className="font-normal text-gray-700 dark:text-gray-300">{slot.startTime} - {slot.endTime}</span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          نوع جلسه: {slot.type === 'online' ? 'آنلاین' : 'حضوری'}
                        </p>
                      </div>
                      <button
                        // onClick={() => handleBookSlot(slot)} // To be implemented
                        className="mt-3 sm:mt-0 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out text-sm"
                        onClick={() => handleBookSlot(slot)}
                      >
                        رزرو این زمان
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">برنامه زمانی هنوز توسط این معلم تنظیم نشده است.</p>
              )
            )}
            {bookingStatus && (
              <div className={`mt-4 p-3 rounded-md text-sm ${bookingStatus.success ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'}`}>
                <p className="font-semibold">{bookingStatus.message}</p>
                {bookingStatus.success && bookingStatus.bookingId && (
                  <>
                    <p className="text-xs">شناسه رزرو: {bookingStatus.bookingId}.</p>
                    <button
                      onClick={() => handlePayment(bookingStatus.bookingId!)}
                      className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-md text-xs"
                      disabled={paymentInitiationLoading}
                    >
                      {paymentInitiationLoading ? 'در حال انتقال به درگاه...' : 'پرداخت هزینه جلسه'}
                    </button>
                  </>
                )}
                {paymentError && <p className="text-red-500 text-xs mt-1">{paymentError}</p>}
              </div>
            )}
          </div>
          {/* The general booking button below might be removed or repurposed if all bookings happen via slots */}
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;

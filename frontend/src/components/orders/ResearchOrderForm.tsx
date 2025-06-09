"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Zod schema for validation
const researchOrderSchema = z.object({
  userId: z.string().min(1, "شناسه کاربری الزامی است"), // Temporary, will be from auth state later
  educationLevel: z.string().min(1, "پایه تحصیلی الزامی است"),
  subject: z.string().min(1, "موضوع تحقیق الزامی است"),
  description: z.string().min(10, "توضیحات باید حداقل ۱۰ کاراکتر باشد"),
  deadline: z.string().refine(val => !isNaN(Date.parse(val)), { message: "تاریخ تحویل نامعتبر است" }),
  // price is optional and can be set by admin or backend logic later
});

type ResearchOrderFormInputs = z.infer<typeof researchOrderSchema>;

const educationLevels = [
  "ابتدایی",
  "متوسطه اول (راهنمایی)",
  "متوسطه دوم (دبیرستان)",
  "کاردانی",
  "کارشناسی",
  "کارشناسی ارشد",
  "دکتری",
  "سایر",
];

const ResearchOrderForm = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ResearchOrderFormInputs>({
    resolver: zodResolver(researchOrderSchema),
    defaultValues: {
      userId: "temp_user_123", // Temporary placeholder User ID
      educationLevel: "",
      subject: "",
      description: "",
      deadline: new Date().toISOString().split('T')[0], // Default to today
    }
  });
  const [submissionStatus, setSubmissionStatus] = useState<{ success: boolean; message: string; orderId?: string } | null>(null);

  const onSubmit: SubmitHandler<ResearchOrderFormInputs> = async (data) => {
    setSubmissionStatus(null);
    try {
      const response = await fetch('/api/orders/research/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'خطا در ثبت سفارش');
      }

      setSubmissionStatus({
        success: true,
        message: result.message || 'سفارش تحقیق با موفقیت ثبت شد!',
        orderId: result.orderId
      });
      reset(); // Reset form on successful submission
    } catch (error: any) {
      setSubmissionStatus({ success: false, message: error.message || 'یک خطای پیش بینی نشده رخ داد.' });
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-400 dark:focus:border-indigo-400";
  const errorClass = "text-red-500 text-sm mt-1 dark:text-red-400";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-8 shadow-xl rounded-lg">
      {/* Temporary UserID field - will be removed when auth is implemented */}
      <div>
        <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">شناسه کاربری (موقت)</label>
        <input id="userId" type="text" {...register("userId")} className={inputClass} />
        {errors.userId && <p className={errorClass}>{errors.userId.message}</p>}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">این فیلد پس از پیاده‌سازی سیستم احراز هویت حذف خواهد شد.</p>
      </div>

      <div>
        <label htmlFor="educationLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">پایه تحصیلی</label>
        <select id="educationLevel" {...register("educationLevel")} className={inputClass}>
          <option value="">یک گزینه را انتخاب کنید...</option>
          {educationLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
        {errors.educationLevel && <p className={errorClass}>{errors.educationLevel.message}</p>}
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">موضوع تحقیق</label>
        <input id="subject" type="text" {...register("subject")} className={inputClass} placeholder="مثال: بررسی تاثیر هوش مصنوعی بر بازار کار" />
        {errors.subject && <p className={errorClass}>{errors.subject.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">توضیحات کامل پروژه</label>
        <textarea
          id="description"
          {...register("description")}
          rows={5}
          className={inputClass}
          placeholder="لطفاً جزئیات کامل سفارش خود را شرح دهید، از جمله ساختار مورد نظر، منابع پیشنهادی (اختیاری) و هر نکته دیگری که لازم می‌دانید."
        />
        {errors.description && <p className={errorClass}>{errors.description.message}</p>}
      </div>

      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">تاریخ تحویل</label>
        <input id="deadline" type="date" {...register("deadline")} className={inputClass} />
        {errors.deadline && <p className={errorClass}>{errors.deadline.message}</p>}
      </div>

      {submissionStatus && (
        <div className={`p-4 rounded-md ${submissionStatus.success ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-100' : 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-100'}`}>
          <p className="font-semibold">{submissionStatus.message}</p>
          {submissionStatus.success && submissionStatus.orderId && (
            <p className="text-sm">شناسه سفارش شما: {submissionStatus.orderId}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 transition-opacity"
      >
        {isSubmitting ? 'در حال ارسال سفارش...' : 'ثبت سفارش تحقیق'}
      </button>
    </form>
  );
};

export default ResearchOrderForm;

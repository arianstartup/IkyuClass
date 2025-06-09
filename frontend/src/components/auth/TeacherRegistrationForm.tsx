"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Zod schema for validation
const teacherSchema = z.object({
  firstName: z.string().min(1, "نام الزامی است"),
  lastName: z.string().min(1, "نام خانوادگی الزامی است"),
  email: z.string().email("ایمیل نامعتبر است"),
  subjectTaught: z.string().min(1, "درس تخصصی الزامی است"), // Can be an array or comma-separated string later
  qualifications: z.string().min(1, "رزومه/مدارک الزامی است"),
  password: z.string().min(6, "پسورد باید حداقل ۶ کاراکتر باشد"),
  // confirmPassword: z.string() // Add if password confirmation is needed
})
// .refine(data => data.password === data.confirmPassword, { // Example for confirm password
//   message: "پسوردها مطابقت ندارند",
//   path: ["confirmPassword"],
// });

type TeacherFormInputs = z.infer<typeof teacherSchema>;

const TeacherRegistrationForm = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TeacherFormInputs>({
    resolver: zodResolver(teacherSchema),
  });
  const [submissionStatus, setSubmissionStatus] = useState<{ success: boolean; message: string } | null>(null);

  const onSubmit: SubmitHandler<TeacherFormInputs> = async (data) => {
    setSubmissionStatus(null);
    try {
      const response = await fetch('/api/users/register/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'خطا در ثبت نام');
      }

      setSubmissionStatus({ success: true, message: result.message || 'ثبت نام معلم با موفقیت انجام شد!' });
      // Optionally reset form: reset();
    } catch (error: any) {
      setSubmissionStatus({ success: false, message: error.message || 'یک خطای پیش بینی نشده رخ داد.' });
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-400 dark:focus:border-indigo-400";
  const errorClass = "text-red-500 text-sm mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-8 shadow-xl rounded-lg">
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">نام</label>
        <input id="firstName" type="text" {...register("firstName")} className={inputClass} />
        {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">نام خانوادگی</label>
        <input id="lastName" type="text" {...register("lastName")} className={inputClass} />
        {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">ایمیل</label>
        <input id="email" type="email" {...register("email")} className={inputClass} />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="subjectTaught" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">درس تخصصی</label>
        <input id="subjectTaught" type="text" {...register("subjectTaught")} className={inputClass} placeholder="مثال: ریاضی، فیزیک" />
        {errors.subjectTaught && <p className={errorClass}>{errors.subjectTaught.message}</p>}
      </div>

      <div>
        <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">رزومه/مدارک</label>
        <textarea id="qualifications" {...register("qualifications")} rows={3} className={inputClass} placeholder="توضیح مختصری از سوابق و مدارک تحصیلی"></textarea>
        {errors.qualifications && <p className={errorClass}>{errors.qualifications.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">پسورد</label>
        <input id="password" type="password" {...register("password")} className={inputClass} />
        {errors.password && <p className={errorClass}>{errors.password.message}</p>}
      </div>

      {/* Add confirmPassword field if needed */}

      {submissionStatus && (
        <div className={`p-4 rounded-md ${submissionStatus.success ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'}`}>
          {submissionStatus.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50"
      >
        {isSubmitting ? 'در حال ارسال...' : 'ثبت نام معلم'}
      </button>
    </form>
  );
};

export default TeacherRegistrationForm;

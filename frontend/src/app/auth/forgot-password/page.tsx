"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseClientInit';

const forgotPasswordSchema = z.object({
  email: z.string().email("ایمیل وارد شده نامعتبر است."),
});
type ForgotPasswordInputs = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordForm = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInputs>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit: SubmitHandler<ForgotPasswordInputs> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setMessage("ایمیل بازیابی رمز عبور ارسال شد. لطفاً صندوق ورودی و اسپم خود را بررسی کنید.");
    } catch (err: any) {
      console.error("Firebase sendPasswordResetEmail error:", err);
      if (err.code === 'auth/user-not-found') {
        setError("کاربری با این ایمیل یافت نشد.");
      } else {
        setError("خطا در ارسال ایمیل بازیابی. لطفاً دوباره تلاش کنید.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-400 dark:focus:border-indigo-400 transition-colors";
  const errorClass = "text-red-500 dark:text-red-400 text-sm mt-1";

  return (
     <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-xl rounded-lg w-full max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">ایمیل ثبت شده<span className="text-red-500">*</span></label>
        <input id="email" type="email" {...register("email")} className={inputClass} autoComplete="email" />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      {error && <p className={`p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-md`}>{error}</p>}
      {message && <p className={`p-3 text-sm text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-200 rounded-md`}>{message}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-70 transition-opacity"
      >
        {isSubmitting ? 'در حال ارسال...' : 'ارسال ایمیل بازیابی رمز'}
      </button>
    </form>
  );
};


const ForgotPasswordPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          بازیابی رمز عبور
        </h1>
        <Suspense fallback={<div className="text-center">در حال بارگذاری فرم...</div>}>
            <ForgotPasswordForm />
        </Suspense>
         <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            بازگشت به صفحه{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              ورود
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

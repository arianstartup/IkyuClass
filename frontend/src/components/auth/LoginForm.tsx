"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseClientInit'; // Your Firebase auth instance
import { useRouter } from 'next/navigation'; // Corrected import

// Zod schema for login form
const loginSchema = z.object({
  email: z.string().email("ایمیل وارد شده نامعتبر است."),
  password: z.string().min(6, "پسورد باید حداقل ۶ کاراکتر باشد."),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsSubmitting(true);
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // onAuthStateChanged in AuthContext will handle setting currentUser and role.
      // Redirect to home page or dashboard after successful login.
      router.push('/'); // Or a specific dashboard page like /my-account
    } catch (error: any) {
      console.error("Firebase login error:", error);
      // Map Firebase auth errors to user-friendly messages
      let errorMessage = "خطا در ورود. لطفاً اطلاعات خود را بررسی کنید و دوباره تلاش نمایید.";
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = "ایمیل یا پسورد وارد شده صحیح نمی‌باشد.";
          break;
        case 'auth/invalid-email':
          errorMessage = "فرمت ایمیل وارد شده نامعتبر است.";
          break;
        case 'auth/invalid-credential':
             errorMessage = "ایمیل یا پسورد وارد شده صحیح نمی‌باشد (اعتبارنامه نامعتبر).";
            break;
        case 'auth/too-many-requests':
            errorMessage = "تعداد درخواست‌ها بیش از حد مجاز بوده است. لطفاً چند دقیقه دیگر دوباره امتحان کنید.";
            break;
        // Add more specific Firebase error codes as needed
      }
      setLoginError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-400 dark:focus:border-indigo-400 transition-colors";
  const errorClass = "text-red-500 dark:text-red-400 text-sm mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-xl rounded-lg">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">ایمیل<span className="text-red-500">*</span></label>
        <input id="email" type="email" {...register("email")} className={inputClass} autoComplete="email" />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">پسورد<span className="text-red-500">*</span></label>
        <input id="password" type="password" {...register("password")} className={inputClass} autoComplete="current-password"/>
        {errors.password && <p className={errorClass}>{errors.password.message}</p>}
      </div>

      {loginError && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-200">
              {loginError}
          </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-70 transition-opacity"
      >
        {isSubmitting ? 'در حال ورود...' : 'ورود'}
      </button>
    </form>
  );
};

export default LoginForm;

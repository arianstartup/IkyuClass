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
  phoneNumber: z.string().regex(/^(09\d{9}|(\+98|0098)9\d{9})$/, "شماره موبایل نامعتبر است (مثال: 09123456789)"),
  subjectTaught: z.string().min(1, "درس تخصصی الزامی است"),
  qualifications: z.string().min(1, "رزومه/مدارک الزامی است"),
  password: z.string().min(6, "پسورد باید حداقل ۶ کاراکتر باشد"),
  otpCode: z.string().optional(), // OTP code, optional initially
});

type TeacherFormInputs = z.infer<typeof teacherSchema>;

const TeacherRegistrationForm = () => {
  const [formStep, setFormStep] = useState(1); // 1 for initial info, 2 for OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [finalSubmissionStatus, setFinalSubmissionStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isVerifyingOtpAndRegistering, setIsVerifyingOtpAndRegistering] = useState(false);


  const { register, handleSubmit, formState: { errors }, getValues, trigger, watch } = useForm<TeacherFormInputs>({
    resolver: zodResolver(teacherSchema),
    mode: "onChange" // Validate on change for better UX
  });

  const watchedPhoneNumber = watch("phoneNumber"); // To disable button if phone number is invalid

  const handleSendOtp = async () => {
    setOtpError(null);
    setFinalSubmissionStatus(null);
    // Trigger validation for all fields up to phoneNumber
    const isValidPhoneNumber = await trigger("phoneNumber");
    const isValidFirstName = await trigger("firstName");
    const isValidLastName = await trigger("lastName");
    const isValidEmail = await trigger("email");
    const isValidPassword = await trigger("password");


    if (!isValidPhoneNumber || !isValidFirstName || !isValidLastName || !isValidEmail || !isValidPassword) {
      setOtpError("لطفاً تمام فیلدهای ستاره‌دار را به درستی پر کنید.");
      return;
    }

    setIsOtpSending(true);
    try {
      const phoneNumber = getValues("phoneNumber");
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'خطا در ارسال کد تایید');
      }
      setOtpSent(true);
      setFormStep(2); // Move to OTP entry step
      setOtpError(null); // Clear previous errors
    } catch (error: any) {
      setOtpError(error.message || 'یک خطای پیش بینی نشده در ارسال کد رخ داد.');
      setOtpSent(false);
    } finally {
      setIsOtpSending(false);
    }
  };

  const onSubmit: SubmitHandler<TeacherFormInputs> = async (data) => {
    if (formStep === 1) { // Should not happen if button calls handleSendOtp directly
      handleSendOtp();
      return;
    }

    // FormStep is 2, proceed with OTP verification and final registration
    setFinalSubmissionStatus(null);
    setOtpError(null);
    setIsVerifyingOtpAndRegistering(true);

    try {
      // Step 1: Verify OTP
      const otpResponse = await fetch('/api/auth/verify-otp-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: data.phoneNumber, otpCode: data.otpCode }),
      });
      const otpResult = await otpResponse.json();
      if (!otpResponse.ok) {
        throw new Error(otpResult.message || 'خطا در تایید کد OTP');
      }

      // Step 2: If OTP is verified, proceed to register the teacher
      const { otpCode, ...teacherDataForRegistration } = data; // Exclude otpCode from final registration data
      const finalRegisterPayload = {
        ...teacherDataForRegistration,
        // temporaryAuthToken: otpResult.temporaryAuthToken, // Send this if backend expects it
      };

      const registerResponse = await fetch('/api/users/register/teacher-final', { // New endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalRegisterPayload),
      });
      const registerResult = await registerResponse.json();
      if (!registerResponse.ok) {
        throw new Error(registerResult.message || 'خطا در ثبت نام نهایی معلم');
      }

      setFinalSubmissionStatus({ success: true, message: registerResult.message || 'ثبت نام معلم با موفقیت کامل شد!' });
      setFormStep(1); // Reset form to initial state or redirect
      setOtpSent(false);
      // reset(); // Optionally reset all form fields
    } catch (error: any) {
      setFinalSubmissionStatus({ success: false, message: error.message || 'یک خطای پیش بینی نشده رخ داد.' });
    } finally {
      setIsVerifyingOtpAndRegistering(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-400 dark:focus:border-indigo-400";
  const errorClass = "text-red-500 dark:text-red-400 text-sm mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-xl rounded-lg">
      {/* Step 1 Fields: Basic Info + Phone */}
      {formStep === 1 && (
        <>
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">نام<span className="text-red-500">*</span></label>
            <input id="firstName" type="text" {...register("firstName")} className={inputClass} />
            {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">نام خانوادگی<span className="text-red-500">*</span></label>
            <input id="lastName" type="text" {...register("lastName")} className={inputClass} />
            {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">ایمیل<span className="text-red-500">*</span></label>
            <input id="email" type="email" {...register("email")} className={inputClass} />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">شماره موبایل (جهت تایید)<span className="text-red-500">*</span></label>
            <input id="phoneNumber" type="tel" {...register("phoneNumber")} className={inputClass} placeholder="09123456789" />
            {errors.phoneNumber && <p className={errorClass}>{errors.phoneNumber.message}</p>}
          </div>

          <div>
            <label htmlFor="subjectTaught" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">درس تخصصی<span className="text-red-500">*</span></label>
            <input id="subjectTaught" type="text" {...register("subjectTaught")} className={inputClass} placeholder="مثال: ریاضی، فیزیک" />
            {errors.subjectTaught && <p className={errorClass}>{errors.subjectTaught.message}</p>}
          </div>

          <div>
            <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">رزومه/مدارک<span className="text-red-500">*</span></label>
            <textarea id="qualifications" {...register("qualifications")} rows={3} className={inputClass} placeholder="توضیح مختصری از سوابق و مدارک تحصیلی"></textarea>
            {errors.qualifications && <p className={errorClass}>{errors.qualifications.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">پسورد<span className="text-red-500">*</span></label>
            <input id="password" type="password" {...register("password")} className={inputClass} />
            {errors.password && <p className={errorClass}>{errors.password.message}</p>}
          </div>

          {otpError && <p className={`${errorClass} p-3 bg-red-50 dark:bg-red-900 rounded-md`}>{otpError}</p>}

          <button
            type="button" // Important: type="button" to prevent form submission
            onClick={handleSendOtp}
            disabled={isOtpSending || !watchedPhoneNumber || !!errors.phoneNumber || !!errors.firstName || !!errors.lastName || !!errors.email || !!errors.password}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600 disabled:opacity-60"
          >
            {isOtpSending ? 'در حال ارسال کد...' : 'ارسال کد تایید به موبایل'}
          </button>
        </>
      )}

      {/* Step 2 Fields: OTP Entry */}
      {formStep === 2 && otpSent && (
        <>
          <p className="text-sm text-gray-700 dark:text-gray-200">
            یک کد ۶ رقمی به شماره <span className="font-semibold">{getValues("phoneNumber")}</span> ارسال شد. لطفاً آن را وارد کنید.
            <button type="button" onClick={() => { setFormStep(1); setOtpSent(false); setOtpError(null);}} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-2">(ویرایش شماره موبایل)</button>
          </p>
          <div>
            <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">کد تایید<span className="text-red-500">*</span></label>
            <input id="otpCode" type="text" {...register("otpCode")} className={inputClass} maxLength={6} placeholder="------" />
            {errors.otpCode && <p className={errorClass}>{errors.otpCode.message}</p>}
          </div>

          {otpError && <p className={`${errorClass} p-3 bg-red-50 dark:bg-red-900 rounded-md`}>{otpError}</p>}

          <button
            type="submit" // This button submits the whole form
            disabled={isVerifyingOtpAndRegistering}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-60"
          >
            {isVerifyingOtpAndRegistering ? 'در حال تایید و ثبت نام...' : 'تایید کد و ثبت نام نهایی معلم'}
          </button>
        </>
      )}

      {finalSubmissionStatus && (
        <div className={`mt-4 p-4 rounded-md ${finalSubmissionStatus.success ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'}`}>
          {finalSubmissionStatus.message}
        </div>
      )}
    </form>
  );
};

export default TeacherRegistrationForm;

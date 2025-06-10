"use client";

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adminApiFetch } from '@/utils/adminApi'; // Utility for admin calls

// Zod schema for Zarinpal settings
const zarinpalSettingsSchema = z.object({
  zarinpalMerchantId: z.string().min(20, "کد پذیرنده (Merchant ID) معتبر نیست.").max(36, "کد پذیرنده بیش از حد طولانی است."), // Typical length is 36 chars
  isZarinpalSandbox: z.boolean().default(true),
});

// Zod schema for SMS provider settings
const smsProviderSettingsSchema = z.object({
  smsApiKey: z.string().min(10, "کلید API پیامک معتبر نیست.").optional().or(z.literal('')),
  smsSenderNumber: z.string().min(5, "شماره فرستنده پیامک معتبر نیست.").optional().or(z.literal('')),
});

// Zod schema for AI Service (Gemini)
const aiServiceSettingsSchema = z.object({
  geminiApiKey: z.string().min(20, "کلید API هوش مصنوعی (Gemini) معتبر نیست.").optional().or(z.literal('')), // Gemini keys are typically long
});

// Combined schema for the page
const integrationsSettingsSchema = zarinpalSettingsSchema
  .merge(smsProviderSettingsSchema)
  .merge(aiServiceSettingsSchema);

type IntegrationsSettingsInputs = z.infer<typeof integrationsSettingsSchema>;

interface PlatformSettings {
    zarinpalMerchantId?: string;
    isZarinpalSandbox?: boolean;
    smsApiKey?: string;
    smsSenderNumber?: string;
    geminiApiKey?: string;
    // Add other settings fields as they are defined
}


const IntegrationsSettingsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<IntegrationsSettingsInputs>({
    resolver: zodResolver(integrationsSettingsSchema),
    defaultValues: { // Will be overridden by fetched settings
      isZarinpalSandbox: true,
      zarinpalMerchantId: '',
      smsApiKey: '',
      smsSenderNumber: '',
      geminiApiKey: '',
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await adminApiFetch('/api/admin/settings');
        if (response && response.settings) {
          reset(response.settings); // Populate form with fetched settings
        } else if (response && response.message && Object.keys(response.settings).length === 0) {
          // Settings not found, but API call was successful (e.g. first time setup)
          console.log(response.message); // "Platform settings not found. Please configure them."
        }
      } catch (error: any) {
        console.error("Failed to load settings:", error);
        setLoadError(error.message || "خطا در بارگذاری تنظیمات اولیه.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [reset]);

  const onSubmit: SubmitHandler<IntegrationsSettingsInputs> = async (data) => {
    setIsSubmitting(true);
    setUpdateStatus(null);
    setLoadError(null);
    try {
      await adminApiFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setUpdateStatus({ success: true, message: 'تنظیمات با موفقیت به‌روزرسانی شد.' });
      reset(data); // Re-populate form with the successfully saved data
    } catch (error: any) {
      console.error("Failed to update settings:", error);
      setUpdateStatus({ success: false, message: error.message || 'خطا در به‌روزرسانی تنظیمات.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white";
  const errorClass = "text-red-500 dark:text-red-400 text-xs mt-1";
  const checkboxClass = "h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:focus:ring-offset-gray-800";


  if (isLoading) {
    return <div className="text-center py-10">در حال بارگذاری تنظیمات...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">تنظیمات یکپارچه‌سازی</h1>

      {loadError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900 dark:text-red-200 dark:border-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">خطا در بارگذاری</p>
          <p>{loadError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Zarinpal Settings Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-1">تنظیمات درگاه پرداخت زرین‌پال</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">این تنظیمات برای اتصال به درگاه پرداخت زرین‌پال استفاده می‌شود.</p>

          <div>
            <label htmlFor="zarinpalMerchantId" className="block text-sm font-medium text-gray-700 dark:text-gray-200">کد پذیرنده (Merchant ID)</label>
            <input type="text" id="zarinpalMerchantId" {...register("zarinpalMerchantId")} className={inputClass} placeholder="مثال: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/>
            {errors.zarinpalMerchantId && <p className={errorClass}>{errors.zarinpalMerchantId.message}</p>}
          </div>

          <div className="mt-4 flex items-center">
            <input id="isZarinpalSandbox" type="checkbox" {...register("isZarinpalSandbox")} className={checkboxClass} />
            <label htmlFor="isZarinpalSandbox" className="mr-2 block text-sm text-gray-900 dark:text-gray-300">فعال‌سازی حالت آزمایشی (Sandbox) زرین‌پال</label>
          </div>
           {errors.isZarinpalSandbox && <p className={errorClass}>{errors.isZarinpalSandbox.message}</p>}
        </div>

        {/* SMS Provider Settings Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-1">تنظیمات پنل پیامک (شبیه‌سازی شده)</h2>
           <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">این تنظیمات برای ارسال پیامک‌های سیستمی (مانند کد تایید) استفاده می‌شود.</p>

          <div>
            <label htmlFor="smsApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-200">کلید API پنل پیامک</label>
            <input type="text" id="smsApiKey" {...register("smsApiKey")} className={inputClass} placeholder="کلید API دریافت شده از سرویس‌دهنده"/>
            {errors.smsApiKey && <p className={errorClass}>{errors.smsApiKey.message}</p>}
          </div>

          <div className="mt-4">
            <label htmlFor="smsSenderNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-200">شماره فرستنده پیامک</label>
            <input type="text" id="smsSenderNumber" {...register("smsSenderNumber")} className={inputClass} placeholder="مثال: 3000123456 یا +981000123"/>
            {errors.smsSenderNumber && <p className={errorClass}>{errors.smsSenderNumber.message}</p>}
          </div>
        </div>

        {/* AI Service (Gemini) Settings Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-1">تنظیمات سرویس هوش مصنوعی (Gemini)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">این کلید API برای تولید محتوای تحقیقات استفاده خواهد شد.</p>

          <div>
            <label htmlFor="geminiApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Gemini API Key</label>
            <input type="password" id="geminiApiKey" {...register("geminiApiKey")} className={inputClass} placeholder="کلید API دریافت شده از Google AI Studio"/>
            {errors.geminiApiKey && <p className={errorClass}>{errors.geminiApiKey.message}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">این کلید به صورت امن در سمت سرور ذخیره می‌شود.</p>
          </div>
        </div>

        {updateStatus && (
          <div className={`p-3 my-3 text-sm rounded-md ${updateStatus.success ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'}`}>
            {updateStatus.message}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full md:w-auto flex justify-center py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-70"
          >
            {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IntegrationsSettingsPage;

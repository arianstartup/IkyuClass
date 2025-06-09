"use client";

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Zod schema for shipping address validation
const shippingAddressSchema = z.object({
  fullName: z.string().min(3, "نام و نام خانوادگی حداقل باید ۳ کاراکتر باشد"),
  addressLine1: z.string().min(5, "آدرس پستی حداقل باید ۵ کاراکتر باشد"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "نام شهر حداقل باید ۲ کاراکتر باشد"),
  state: z.string().min(2, "نام استان حداقل باید ۲ کاراکتر باشد"), // استان
  postalCode: z.string().regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"),
  country: z.string().min(2, "نام کشور الزامی است").default("ایران"), // Default to Iran
  phoneNumber: z.string().regex(/^(09\d{9}|(\+98|0098)9\d{9})$/, "شماره موبایل نامعتبر است (مثال: 09123456789)"),
});

type ShippingAddressFormInputs = z.infer<typeof shippingAddressSchema>;

interface ShippingAddressFormProps {
  onSubmitAddress: (data: ShippingAddressFormInputs, userId?: string) => Promise<void>;
  isProcessing: boolean;
  processingError: string | null;
}

const ShippingAddressForm: React.FC<ShippingAddressFormProps> = ({ onSubmitAddress, isProcessing, processingError }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<ShippingAddressFormInputs>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      country: "ایران", // Pre-fill country
    }
  });

  // This internal submit handler calls the one passed via props
  const handleFormSubmit: SubmitHandler<ShippingAddressFormInputs> = (data) => {
    // Here, userId would ideally come from auth context. For now, it's handled in the parent.
    onSubmitAddress(data);
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-400 dark:focus:border-indigo-400 transition-colors";
  const errorClass = "text-red-500 dark:text-red-400 text-sm mt-1";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-5">
      <h2 className="text-xl font-semibold mb-5 text-gray-800 dark:text-white border-b pb-3 dark:border-gray-700">اطلاعات ارسال سفارش</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">نام و نام خانوادگی گیرنده<span className="text-red-500">*</span></label>
          <input id="fullName" type="text" {...register("fullName")} className={inputClass} />
          {errors.fullName && <p className={errorClass}>{errors.fullName.message}</p>}
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">شماره تماس<span className="text-red-500">*</span></label>
          <input id="phoneNumber" type="tel" {...register("phoneNumber")} className={inputClass} placeholder="09123456789" />
          {errors.phoneNumber && <p className={errorClass}>{errors.phoneNumber.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">آدرس پستی (خیابان اصلی، کوچه، پلاک، واحد)<span className="text-red-500">*</span></label>
        <input id="addressLine1" type="text" {...register("addressLine1")} className={inputClass} />
        {errors.addressLine1 && <p className={errorClass}>{errors.addressLine1.message}</p>}
      </div>
      <div>
        <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">آدرس (ادامه - اختیاری)</label>
        <input id="addressLine2" type="text" {...register("addressLine2")} className={inputClass} />
        {errors.addressLine2 && <p className={errorClass}>{errors.addressLine2.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">شهر<span className="text-red-500">*</span></label>
          <input id="city" type="text" {...register("city")} className={inputClass} />
          {errors.city && <p className={errorClass}>{errors.city.message}</p>}
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">استان<span className="text-red-500">*</span></label>
          <input id="state" type="text" {...register("state")} className={inputClass} />
          {errors.state && <p className={errorClass}>{errors.state.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">کد پستی<span className="text-red-500">*</span></label>
          <input id="postalCode" type="text" {...register("postalCode")} className={inputClass} maxLength={10} />
          {errors.postalCode && <p className={errorClass}>{errors.postalCode.message}</p>}
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">کشور<span className="text-red-500">*</span></label>
          <input id="country" type="text" {...register("country")} className={inputClass} />
          {errors.country && <p className={errorClass}>{errors.country.message}</p>}
        </div>
      </div>

      {processingError && (
          <div className="p-3 my-3 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-200">
              خطا در پردازش: {processingError}
          </div>
      )}

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600 disabled:opacity-70 transition-opacity"
      >
        {isProcessing ? 'در حال پردازش سفارش...' : 'ثبت سفارش و پرداخت'}
      </button>
    </form>
  );
};

export default ShippingAddressForm;

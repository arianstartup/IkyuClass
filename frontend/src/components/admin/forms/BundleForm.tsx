"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adminApiFetch } from '@/utils/adminApi';
import { useRouter } from 'next/navigation';
import { BundleType, ProductInBundle } from '@/components/store/BundleCard'; // Re-use types
import { ProductType } from '@/app/store/page';

// Zod schema for an item within the bundle form
const bundleItemSchema = z.object({
  productId: z.string().min(1, "شناسه محصول الزامی است"),
  quantity: z.coerce.number().int().positive("تعداد باید عدد صحیح مثبت باشد"),
  // productName and originalPricePerItem will be populated or validated against backend
  productName: z.string().optional(), // For display, can be fetched
  originalPricePerItem: z.coerce.number().optional(), // For display/reference, fetched from product
});

// Zod schema for Product Bundle
const bundleFormSchema = z.object({
  name: z.string().min(3, "نام پک حداقل باید ۳ کاراکتر باشد"),
  description: z.string().min(10, "توضیحات پک حداقل باید ۱۰ کاراکتر باشد"),
  sku: z.string().optional(),
  images: z.array(z.string().url("آدرس تصویر نامعتبر است")).min(1, "حداقل یک تصویر برای پک نیاز است"),
  items: z.array(bundleItemSchema).min(1, "حداقل یک محصول باید در پک باشد"),
  bundlePrice: z.coerce.number().positive("قیمت پک باید یک عدد مثبت باشد"),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).optional().default([]),
});

type BundleFormInputs = z.infer<typeof bundleFormSchema>;

interface BundleFormProps {
  bundleId?: string;
  initialData?: Partial<BundleType>;
}

const BundleForm: React.FC<BundleFormProps> = ({ bundleId, initialData }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<ProductType[]>([]); // For product selector

  const { register, handleSubmit, control, reset, watch, setValue } = useForm<BundleFormInputs>({
    resolver: zodResolver(bundleFormSchema),
    defaultValues: initialData ? {
        ...initialData,
        items: initialData.items?.map(item => ({ // Ensure items map correctly
            productId: item.productId,
            quantity: item.quantity,
            productName: item.productName,
            originalPricePerItem: item.originalPricePerItem
        })) || [],
        images: Array.isArray(initialData.images) ? initialData.images : [],
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
    } : {
      name: '',
      description: '',
      sku: '',
      images: [],
      items: [],
      bundlePrice: 0,
      isActive: true,
      tags: [],
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: "items" });
  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({ control, name: "images" });
  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({ control, name: "tags" });

  // Fetch available products for item selection (simplified: fetches all products)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await adminApiFetch('/api/products');
        setAvailableProducts(productsData || []);
      } catch (error) {
        console.error("Failed to fetch products for bundle form:", error);
        // Handle error (e.g., show a notification)
      }
    };
    fetchProducts();
  }, []);


  useEffect(() => {
    if (initialData) {
        reset({
            ...initialData,
            items: initialData.items?.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                productName: item.productName, // These should be part of initialData if editing
                originalPricePerItem: item.originalPricePerItem
            })) || [],
            images: Array.isArray(initialData.images) ? initialData.images : [],
            tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        });
    }
  }, [initialData, reset]);

  // Auto-update productName and price when productId changes in an item row
  const watchedItems = watch("items");
  useEffect(() => {
    watchedItems.forEach((item, index) => {
      if (item.productId) {
        const product = availableProducts.find(p => p.id === item.productId);
        if (product) {
          // Check if productName or originalPricePerItem in the form is different from the fetched product
          // This avoids unnecessary re-renders or overwriting if data is already correct (e.g. from initialData)
          const currentFormItem = getValues(`items.${index}`);
          if (currentFormItem.productName !== product.name || currentFormItem.originalPricePerItem !== product.price) {
            setValue(`items.${index}.productName`, product.name, { shouldValidate: false, shouldDirty: true });
            setValue(`items.${index}.originalPricePerItem`, product.price, { shouldValidate: false, shouldDirty: true });
          }
        }
      }
    });
  }, [watchedItems, availableProducts, setValue, getValues]);


  const onSubmit: SubmitHandler<BundleFormInputs> = async (data) => {
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    // Prepare items payload: backend expects originalPricePerItem to be sent for calculation/validation
    // The backend `addProductBundle` controller will re-fetch product prices to ensure accuracy.
    // So, sending productName and originalPricePerItem from frontend is mainly for reference or if backend logic changes.
    const payloadItems = data.items.map(item => {
        const product = availableProducts.find(p => p.id === item.productId);
        return {
            productId: item.productId,
            quantity: item.quantity,
            // Send current price from fetched product data as originalPricePerItem
            originalPricePerItem: product ? product.price : 0,
            productName: product ? product.name : 'محصول یافت نشد', // For backend reference
            sku: product ? product.sku : ''
        };
    });

    const payload = { ...data, items: payloadItems };

    try {
      let response;
      if (bundleId) { // Edit mode
        response = await adminApiFetch(`/api/product-bundles/${bundleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setFormSuccess('پک با موفقیت به‌روزرسانی شد.');
      } else { // Create mode
        response = await adminApiFetch('/api/product-bundles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setFormSuccess(`پک "${payload.name}" با موفقیت ایجاد شد. شناسه: ${response.bundleId}`);
        if(!bundleId) reset(); // Reset form only on successful creation
      }
      setTimeout(() => router.push('/admin/products'), 1500); // Redirect to main product/bundle list
    } catch (error: any) {
      console.error("Error submitting bundle form:", error);
      setFormError(error.message || `خطا در ${bundleId ? 'به‌روزرسانی' : 'ایجاد'} پک.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white";
  const errorClass = "text-red-500 dark:text-red-400 text-xs mt-1";
  const buttonClass = "py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-xl rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-3">
        {bundleId ? 'ویرایش پک محصول' : 'افزودن پک محصول جدید'}
      </h2>

      <div>
        <label htmlFor="name" className="block text-sm font-medium">نام پک<span className="text-red-500">*</span></label>
        <input type="text" id="name" {...register("name")} className={inputClass} />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">توضیحات پک<span className="text-red-500">*</span></label>
        <textarea id="description" {...register("description")} rows={3} className={inputClass}></textarea>
        {errors.description && <p className={errorClass}>{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label htmlFor="sku" className="block text-sm font-medium">SKU پک (اختیاری)</label>
            <input type="text" id="sku" {...register("sku")} className={inputClass} />
            {errors.sku && <p className={errorClass}>{errors.sku.message}</p>}
        </div>
        <div>
            <label htmlFor="bundlePrice" className="block text-sm font-medium">قیمت پک (تومان)<span className="text-red-500">*</span></label>
            <input type="number" id="bundlePrice" {...register("bundlePrice")} className={inputClass} />
            {errors.bundlePrice && <p className={errorClass}>{errors.bundlePrice.message}</p>}
        </div>
      </div>

      {/* Images for Bundle */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">آدرس تصاویر پک<span className="text-red-500">*</span></label>
        {imageFields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2 space-x-reverse">
            <input {...register(`images.${index}` as const)} className={inputClass + " flex-grow"} placeholder={`URL تصویر ${index + 1}`}/>
            <button type="button" onClick={() => removeImage(index)} className={`${buttonClass} bg-red-500 hover:bg-red-600 text-white text-xs`}>حذف</button>
          </div>
        ))}
        <button type="button" onClick={() => appendImage("")} className={`${buttonClass} bg-blue-500 hover:bg-blue-600 text-white text-xs`}>افزودن تصویر پک</button>
        {errors.images && <p className={errorClass}>{errors.images.root?.message || errors.images.message}</p>}
      </div>

      {/* Items in Bundle */}
      <div className="space-y-4 border p-4 rounded-md dark:border-gray-700">
        <h3 className="text-lg font-medium">محصولات داخل پک<span className="text-red-500">*</span></h3>
        {itemFields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border dark:border-gray-600 rounded-md relative">
            <button type="button" onClick={() => removeItem(index)} className={`${buttonClass} bg-red-500 hover:bg-red-600 text-white text-xs absolute -top-2 -right-2 px-1.5 py-0.5`}>X</button>
            <div className="md:col-span-2">
              <label htmlFor={`items.${index}.productId`} className="block text-xs font-medium">انتخاب محصول</label>
               <Controller
                name={`items.${index}.productId`}
                control={control}
                render={({ field: controllerField }) => (
                    <select
                        {...controllerField}
                        className={inputClass + " text-xs"}
                        onChange={(e) => {
                            controllerField.onChange(e); // RHF internal update
                            const selectedProduct = availableProducts.find(p => p.id === e.target.value);
                            if (selectedProduct) {
                                setValue(`items.${index}.productName`, selectedProduct.name, { shouldDirty: true });
                                setValue(`items.${index}.originalPricePerItem`, selectedProduct.price, { shouldDirty: true });
                            }
                        }}
                    >
                        <option value="">یک محصول انتخاب کنید...</option>
                        {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name} (موجودی: {p.stockQuantity})</option>)}
                    </select>
                )}
              />
              {errors.items?.[index]?.productId && <p className={errorClass}>{errors.items[index]?.productId?.message}</p>}
            </div>
            <div>
              <label htmlFor={`items.${index}.quantity`} className="block text-xs font-medium">تعداد</label>
              <input type="number" {...register(`items.${index}.quantity` as const)} className={inputClass + " text-xs"} min="1"/>
              {errors.items?.[index]?.quantity && <p className={errorClass}>{errors.items[index]?.quantity?.message}</p>}
            </div>
             <div className="text-xs pt-5">
                <p className="dark:text-gray-300">نام: {getValues(`items.${index}.productName`) || "-"}</p>
                <p className="dark:text-gray-300">قیمت واحد: {(getValues(`items.${index}.originalPricePerItem`) || 0).toLocaleString('fa-IR')} ت</p>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => appendItem({ productId: "", quantity: 1, productName: '', originalPricePerItem: 0 })} className={`${buttonClass} bg-green-500 hover:bg-green-600 text-white text-xs`}>افزودن محصول به پک</button>
        {errors.items && <p className={errorClass}>{errors.items.root?.message || errors.items.message}</p>}
      </div>

       {/* Tags */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">تگ‌های پک (اختیاری)</label>
        {tagFields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2 space-x-reverse">
            <input {...register(`tags.${index}` as const)} className={inputClass + " flex-grow"} placeholder={`تگ ${index + 1}`}/>
            <button type="button" onClick={() => removeTag(index)} className={`${buttonClass} bg-red-500 hover:bg-red-600 text-white text-xs`}>حذف</button>
          </div>
        ))}
        <button type="button" onClick={() => appendTag("")} className={`${buttonClass} bg-blue-500 hover:bg-blue-600 text-white text-xs`}>افزودن تگ</button>
         {errors.tags && <p className={errorClass}>{errors.tags.message}</p>}
      </div>

      <div className="flex items-center">
        <input id="isActiveBundle" type="checkbox" {...register("isActive")} className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:bg-gray-700" />
        <label htmlFor="isActiveBundle" className="mr-2 block text-sm font-medium">پک فعال باشد (قابل نمایش در سایت)</label>
      </div>

      {formError && <p className={`${errorClass} p-3 bg-red-50 dark:bg-red-900 rounded-md`}>{formError}</p>}
      {formSuccess && <p className={`text-green-600 dark:text-green-400 text-sm p-3 bg-green-50 dark:bg-green-900 rounded-md`}>{formSuccess}</p>}

      <div className="pt-5">
        <button type="submit" disabled={isSubmitting} className={`${buttonClass} w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70`}>
          {isSubmitting ? 'در حال ذخیره...' : (bundleId ? 'به‌روزرسانی پک' : 'افزودن پک')}
        </button>
         <button type="button" onClick={() => router.back()} disabled={isSubmitting} className={`${buttonClass} mr-3 w-full md:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200`}>
          انصراف
        </button>
      </div>
    </form>
  );
};

export default BundleForm;

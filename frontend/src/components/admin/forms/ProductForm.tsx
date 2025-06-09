"use client";

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adminApiFetch } from '@/utils/adminApi';
import { useRouter } from 'next/navigation'; // For navigation after submit
import { ProductType } from '@/app/store/page'; // Assuming this is the most complete ProductType

// Zod schema for Product
const productFormSchema = z.object({
  name: z.string().min(3, "نام محصول حداقل باید ۳ کاراکتر باشد"),
  description: z.string().min(10, "توضیحات محصول حداقل باید ۱۰ کاراکتر باشد"),
  price: z.coerce.number().positive("قیمت باید یک عدد مثبت باشد"),
  category: z.array(z.string().min(1, "دسته بندی نمی تواند خالی باشد")).min(1, "حداقل یک دسته بندی انتخاب کنید"),
  brand: z.string().min(1, "برند الزامی است").default("متفرقه"),
  images: z.array(z.string().url("آدرس تصویر نامعتبر است")).min(1, "حداقل یک تصویر برای محصول نیاز است"),
  stockQuantity: z.coerce.number().int().nonnegative("موجودی باید یک عدد صحیح غیرمنفی باشد"),
  sku: z.string().min(3, "SKU حداقل باید ۳ کاراکتر باشد"),
  tags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  // additionalDetails can be more complex if needed
});

type ProductFormInputs = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  productId?: string; // If provided, it's an edit form
  initialData?: Partial<ProductType>; // For edit mode
}

const ProductForm: React.FC<ProductFormProps> = ({ productId, initialData }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ProductFormInputs>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData ? {
        ...initialData,
        price: initialData.price || 0,
        stockQuantity: initialData.stockQuantity || 0,
        category: Array.isArray(initialData.category) ? initialData.category : (initialData.category ? [initialData.category as string] : []),
        images: Array.isArray(initialData.images) ? initialData.images : [],
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
    } : {
      name: '',
      description: '',
      price: 0,
      category: [],
      brand: 'متفرقه',
      images: [],
      stockQuantity: 0,
      sku: '',
      tags: [],
      isFeatured: false,
      isActive: true,
    },
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({ control, name: "images" });
  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({ control, name: "category" });
  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({ control, name: "tags" });


  useEffect(() => {
    if (initialData) {
        const categories = Array.isArray(initialData.category) ? initialData.category : (initialData.category ? [initialData.category as string] : []);
        reset({
            ...initialData,
            price: initialData.price || 0,
            stockQuantity: initialData.stockQuantity || 0,
            category: categories,
            images: Array.isArray(initialData.images) ? initialData.images : [],
            tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        });
    }
  }, [initialData, reset]);


  const onSubmit: SubmitHandler<ProductFormInputs> = async (data) => {
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      let response;
      const payload = { ...data };

      if (productId) { // Edit mode
        response = await adminApiFetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setFormSuccess('محصول با موفقیت به‌روزرسانی شد.');
      } else { // Create mode
        response = await adminApiFetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setFormSuccess(`محصول "${payload.name}" با موفقیت ایجاد شد. شناسه: ${response.productId}`);
        if (!productId) reset(); // Reset form only on successful creation
      }
      // Optionally redirect after a delay or on button click
      setTimeout(() => router.push('/admin/products'), 1500);

    } catch (error: any) {
      console.error("Error submitting product form:", error);
      setFormError(error.message || `خطا در ${productId ? 'به‌روزرسانی' : 'ایجاد'} محصول.`);
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
        {productId ? 'ویرایش محصول' : 'افزودن محصول جدید'}
      </h2>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">نام محصول<span className="text-red-500">*</span></label>
          <input type="text" id="name" {...register("name")} className={inputClass} />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="sku" className="block text-sm font-medium">SKU (شناسه کالا)<span className="text-red-500">*</span></label>
          <input type="text" id="sku" {...register("sku")} className={inputClass} />
          {errors.sku && <p className={errorClass}>{errors.sku.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">توضیحات محصول<span className="text-red-500">*</span></label>
        <textarea id="description" {...register("description")} rows={4} className={inputClass}></textarea>
        {errors.description && <p className={errorClass}>{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="price" className="block text-sm font-medium">قیمت (تومان)<span className="text-red-500">*</span></label>
          <input type="number" id="price" {...register("price")} className={inputClass} />
          {errors.price && <p className={errorClass}>{errors.price.message}</p>}
        </div>
        <div>
          <label htmlFor="stockQuantity" className="block text-sm font-medium">موجودی انبار<span className="text-red-500">*</span></label>
          <input type="number" id="stockQuantity" {...register("stockQuantity")} className={inputClass} />
          {errors.stockQuantity && <p className={errorClass}>{errors.stockQuantity.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="brand" className="block text-sm font-medium">برند<span className="text-red-500">*</span></label>
        <input type="text" id="brand" {...register("brand")} className={inputClass} />
        {errors.brand && <p className={errorClass}>{errors.brand.message}</p>}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">دسته‌بندی‌ها<span className="text-red-500">*</span></label>
        {categoryFields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2 space-x-reverse">
            <input {...register(`category.${index}` as const)} className={inputClass + " flex-grow"} placeholder={`دسته بندی ${index + 1}`}/>
            <button type="button" onClick={() => removeCategory(index)} className={`${buttonClass} bg-red-500 hover:bg-red-600 text-white text-xs`}>حذف</button>
          </div>
        ))}
        <button type="button" onClick={() => appendCategory("")} className={`${buttonClass} bg-blue-500 hover:bg-blue-600 text-white text-xs`}>افزودن دسته‌بندی</button>
        {errors.category && <p className={errorClass}>{errors.category.root?.message || errors.category.message}</p>}
      </div>

      {/* Images */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">آدرس تصاویر محصول<span className="text-red-500">*</span></label>
        {imageFields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2 space-x-reverse">
            <input {...register(`images.${index}` as const)} className={inputClass + " flex-grow"} placeholder={`URL تصویر ${index + 1}`}/>
            <button type="button" onClick={() => removeImage(index)} className={`${buttonClass} bg-red-500 hover:bg-red-600 text-white text-xs`}>حذف</button>
          </div>
        ))}
        <button type="button" onClick={() => appendImage("")} className={`${buttonClass} bg-blue-500 hover:bg-blue-600 text-white text-xs`}>افزودن تصویر</button>
        {errors.images && <p className={errorClass}>{errors.images.root?.message || errors.images.message}</p>}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">تگ‌ها (اختیاری)</label>
        {tagFields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2 space-x-reverse">
            <input {...register(`tags.${index}` as const)} className={inputClass + " flex-grow"} placeholder={`تگ ${index + 1}`}/>
            <button type="button" onClick={() => removeTag(index)} className={`${buttonClass} bg-red-500 hover:bg-red-600 text-white text-xs`}>حذف</button>
          </div>
        ))}
        <button type="button" onClick={() => appendTag("")} className={`${buttonClass} bg-blue-500 hover:bg-blue-600 text-white text-xs`}>افزودن تگ</button>
         {errors.tags && <p className={errorClass}>{errors.tags.message}</p>}
      </div>

      {/* Status Flags */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <div className="flex items-center">
          <input id="isActive" type="checkbox" {...register("isActive")} className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:bg-gray-700" />
          <label htmlFor="isActive" className="mr-2 block text-sm font-medium">محصول فعال باشد (قابل نمایش در سایت)</label>
        </div>
        <div className="flex items-center">
          <input id="isFeatured" type="checkbox" {...register("isFeatured")} className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:bg-gray-700" />
          <label htmlFor="isFeatured" className="mr-2 block text-sm font-medium">محصول ویژه (نمایش خاص)</label>
        </div>
      </div>

      {formError && <p className={`${errorClass} p-3 bg-red-50 dark:bg-red-900 rounded-md`}>{formError}</p>}
      {formSuccess && <p className={`text-green-600 dark:text-green-400 text-sm p-3 bg-green-50 dark:bg-green-900 rounded-md`}>{formSuccess}</p>}

      <div className="pt-5">
        <button type="submit" disabled={isSubmitting} className={`${buttonClass} w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70`}>
          {isSubmitting ? 'در حال ذخیره...' : (productId ? 'به‌روزرسانی محصول' : 'افزودن محصول')}
        </button>
        <button type="button" onClick={() => router.back()} disabled={isSubmitting} className={`${buttonClass} mr-3 w-full md:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200`}>
          انصراف
        </button>
      </div>
    </form>
  );
};

export default ProductForm;

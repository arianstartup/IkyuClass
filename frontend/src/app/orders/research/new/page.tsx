import ResearchOrderForm from '@/components/orders/ResearchOrderForm';

export default function NewResearchOrderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
        ثبت سفارش تحقیق جدید
      </h1>
      <div className="max-w-2xl mx-auto">
        <ResearchOrderForm />
      </div>
    </div>
  );
}

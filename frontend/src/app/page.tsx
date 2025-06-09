export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            به سایت ما خوش آمدید!
          </h1>
          <p className="text-xl mb-8">
            این یک نمونه اولیه از صفحه اصلی با Next.js و Tailwind CSS است.
          </p>
          <button className="bg-white text-indigo-600 font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-gray-100 transition duration-300">
            شروع کنید
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">ویژگی‌ها</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">چند نمونه از قابلیت‌های ما.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-white">ویژگی ۱</h3>
              <p className="text-gray-600 dark:text-gray-300">توضیح مختصر در مورد این ویژگی فوق‌العاده.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-white">ویژگی ۲</h3>
              <p className="text-gray-600 dark:text-gray-300">توضیح مختصر در مورد این ویژگی فوق‌العاده.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-white">ویژگی ۳</h3>
              <p className="text-gray-600 dark:text-gray-300">توضیح مختصر در مورد این ویژگی فوق‌العاده.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Placeholder for more sections */}
      <section className="py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">بخش بعدی</h2>
        <p className="text-gray-600 dark:text-gray-300">محتوای بیشتر در اینجا قرار خواهد گرفت.</p>
      </section>
    </div>
  );
}

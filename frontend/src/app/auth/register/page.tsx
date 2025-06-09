import TeacherRegistrationForm from '@/components/auth/TeacherRegistrationForm';

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
        ثبت نام کاربر جدید
      </h1>
      {/*
        Future enhancement: Add tabs or logic to switch between
        student, university student, and teacher registration forms.
        For now, directly showing TeacherRegistrationForm.
      */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700 dark:text-gray-200">
          ثبت نام به عنوان معلم
        </h2>
        <TeacherRegistrationForm />
      </div>
    </div>
  );
}

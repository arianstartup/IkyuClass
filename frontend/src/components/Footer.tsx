const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4 mt-8">
      <p className="text-gray-600 dark:text-gray-300">
        &copy; {new Date().getFullYear()} تمامی حقوق محفوظ است.
      </p>
    </footer>
  );
};

export default Footer;

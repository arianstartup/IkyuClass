const { getAiConfig } = require('../config/aiConfig');

/**
 * Generates research content based on a prompt using a simulated AI service.
 * @param {string} prompt The prompt for the AI.
 * @returns {Promise<string>} A promise that resolves with the generated text content.
 */
async function generateResearchContent(prompt) {
  const currentAiConfig = getAiConfig();
  console.log(`Simulating AI content generation with API Key: ${currentAiConfig.geminiApiKey ? currentAiConfig.geminiApiKey.substring(0,5) + '...' : 'NOT SET'}`);
  console.log(`Received prompt for AI: "${prompt.substring(0, 100)}..."`);

  return new Promise((resolve, reject) => {
    // Simulate API call delay
    const delay = 2000 + Math.random() * 3000; // 2-5 seconds
    setTimeout(() => {
      // Simulate some content generation based on the prompt
      const keywords = prompt.split(' ').slice(0, 5).join(', '); // Extract some keywords
      const simulatedContent = `
# تحقیق در مورد: ${prompt.substring(0, 50)}...

## مقدمه
این یک متن شبیه‌سازی شده است که توسط سرویس هوش مصنوعی تولید گردیده. هدف از این متن، نمایش قابلیت تولید محتوای خودکار بر اساس پرامپت ورودی می‌باشد. پرامپت اصلی شامل کلمات کلیدی مانند "${keywords}" بوده است.

## بدنه اصلی تحقیق
لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می‌باشد. کتابهای زیادی در شصت و سه درصد گذشته حال و آینده، شناخت فراوان جامعه و متخصصان را می طلبد، تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی، و فرهنگ پیشرو در زبان فارسی ایجاد کرد.

### بخش ۱.۱: تحلیل موضوع
در این بخش به تحلیل عمیق‌تر موضوع "${keywords}" پرداخته می‌شود. مباحث شامل تاریخچه، اهمیت، و چالش‌های مرتبط با آن است.

### بخش ۱.۲: روش‌شناسی
روش تحقیق مورد استفاده در این پژوهش شبیه‌سازی شده، ترکیبی از تحلیل داده‌های موجود و بررسی متون تخصصی است. البته، چون این یک شبیه‌سازی است، هیچ داده واقعی تحلیل نشده است.

## نتیجه‌گیری
در نهایت، این تحقیق شبیه‌سازی شده نشان می‌دهد که تولید محتوای خودکار می‌تواند به عنوان یک ابزار کمکی مفید واقع شود. محتوای تولید شده بر اساس پرامپت "${prompt.substring(0, 30)}..." بوده و سعی شده تا ساختار یک مقاله استاندارد را تقلید کند.

---
پایان محتوای شبیه‌سازی شده.
تاریخ تولید: ${new Date().toLocaleString('fa-IR')}
      `.trim();

      console.log("Simulated AI content generated successfully.");
      resolve(simulatedContent);
      // To simulate failure:
      // reject(new Error("Simulated AI content generation failed."));
    }, delay);
  });
}

module.exports = {
  generateResearchContent,
};

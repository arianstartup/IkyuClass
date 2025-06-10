/**
 * Generates a simple HTML welcome email template.
 * @param {string} userName The name of the user.
 * @param {string} role The role of the user (e.g., 'teacher', 'student').
 * @returns {object} An object with subject, text, and html content for the email.
 */
function getWelcomeEmailTemplate(userName, role) {
  const subject = `به خانواده IkyuClass خوش آمدید، ${userName}!`;

  const platformName = "IkyuClass";
  let roleSpecificMessage = "اکنون می‌توانید از امکانات متنوع پلتفرم استفاده کنید.";
  if (role === 'teacher') {
    roleSpecificMessage = "اکنون می‌توانید پروفایل خود را تکمیل کرده و برنامه زمانی خود را برای رزرو شاگردان تنظیم نمایید.";
  } else if (role === 'student' || role === 'university_student') {
    roleSpecificMessage = "اکنون می‌توانید در کلاس‌های اساتید شرکت کرده، سفارش تحقیق دهید و از فروشگاه ما خرید کنید.";
  }

  const html = `
    <div style="font-family: Arial, 'Tahoma', sans-serif; direction: rtl; text-align: right; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #4A90E2; font-size: 24px; text-align: center; margin-bottom: 10px;">خوش آمدید به ${platformName}!</h1>
        <p style="font-size: 18px; margin-bottom: 20px;">سلام ${userName} عزیز،</p>
        <p style="font-size: 16px;">ثبت نام شما در ${platformName} با موفقیت انجام شد. بسیار خوشحالیم که به جمع ما پیوستید.</p>
        <p style="font-size: 16px;">${roleSpecificMessage}</p>
        <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #4A90E2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
            ورود به سایت
          </a>
        </div>
        <p style="font-size: 14px;">اگر سوالی داشتید یا نیاز به راهنمایی داشتید، لطفاً با پشتیبانی ما تماس بگیرید.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #777; text-align: center;">با احترام،<br/>تیم ${platformName}</p>
      </div>
    </div>
  `;

  const text = `
    خوش آمدید به ${platformName}، ${userName} عزیز!

    ثبت نام شما در ${platformName} با موفقیت انجام شد. بسیار خوشحالیم که به جمع ما پیوستید.
    ${roleSpecificMessage}

    برای ورود به سایت، از لینک زیر استفاده کنید:
    ${process.env.FRONTEND_URL || 'http://localhost:3000'}

    با احترام،
    تیم ${platformName}
  `;

  return { subject, html, text };
}

module.exports = {
  getWelcomeEmailTemplate,
};

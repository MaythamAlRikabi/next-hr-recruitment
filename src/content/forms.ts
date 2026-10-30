import type { Locale } from "@/lib/i18n";

export type FormLabels = {
  name: string; email: string; phone: string; phoneHint: string; company: string; subject: string; message: string;
  consent: string; submit: string; sending: string;
  successTitle: string; successBody: string; refLabel: string; again: string;
  industry: string; vacancies: string; locations: string; locationsHint: string; timeline: string; timelineOptions: [string, string][];
  service: string; serviceOptions: [string, string][]; abuseTarget: string; abuseTargetHint: string; select: string;
  errors: Record<string, string>; formErrors: Record<string, string>;
};

export const formLabels: Record<Locale, FormLabels> = {
  en: {
    name: "Full name", email: "Email", phone: "Phone (optional)", phoneHint: "Example: +964 7XX XXX XXXX",
    company: "Company name", subject: "Subject (optional)", message: "Message",
    consent: "I agree to the Privacy Policy and allow NEXT to contact me about this request.",
    submit: "Send", sending: "Sending…",
    successTitle: "Request received", successBody: "Thank you. NEXT will follow up using the email you provided.",
    refLabel: "Your reference number", again: "Send another request",
    industry: "Industry (optional)", vacancies: "Number of vacancies", locations: "Job locations", locationsHint: "City or cities where the roles are based",
    timeline: "Expected timeline",
    timelineOptions: [["asap", "As soon as possible"], ["1_month", "Within 1 month"], ["1_3_months", "1–3 months"], ["3_plus_months", "More than 3 months"]],
    service: "What do you need?",
    serviceOptions: [["consultation", "Career consultation"], ["cv_review", "CV review"], ["interview_prep", "Interview preparation"], ["profile_review", "Professional profile review"]],
    abuseTarget: "Link or reference (optional)", abuseTargetHint: "The page address, job reference or account you are reporting",
    select: "Select…",
    errors: {
      short: "This field is too short.", long: "This field is too long.", email: "Enter a valid email address.",
      phone: "Enter a valid phone number.", consent: "You must agree to continue.", required: "Please choose an option.",
      number: "Enter a number between 1 and 1000.", invalid_type: "This field is required.",
    },
    formErrors: {
      rate: "Too many requests from this email. Please try again later.",
      server: "We could not save your request. Please try again in a moment.",
      unavailable: "The service is temporarily unavailable. Please try again later.",
    },
  },
  ar: {
    name: "الاسم الكامل", email: "البريد الإلكتروني", phone: "رقم الهاتف (اختياري)", phoneHint: "مثال: ‎+964 7XX XXX XXXX",
    company: "اسم الشركة", subject: "الموضوع (اختياري)", message: "الرسالة",
    consent: "أوافق على سياسة الخصوصية وأسمح لـ NEXT بالتواصل معي بخصوص هذا الطلب.",
    submit: "إرسال", sending: "جارٍ الإرسال…",
    successTitle: "تم استلام طلبك", successBody: "شكرًا لك. سيتواصل معك فريق NEXT عبر البريد الإلكتروني الذي أدخلته.",
    refLabel: "رقمك المرجعي", again: "إرسال طلب آخر",
    industry: "القطاع (اختياري)", vacancies: "عدد الوظائف الشاغرة", locations: "مواقع العمل", locationsHint: "المدينة أو المدن التي تقع فيها الوظائف",
    timeline: "الإطار الزمني المتوقع",
    timelineOptions: [["asap", "في أقرب وقت ممكن"], ["1_month", "خلال شهر"], ["1_3_months", "من شهر إلى 3 أشهر"], ["3_plus_months", "أكثر من 3 أشهر"]],
    service: "ما الذي تحتاجه؟",
    serviceOptions: [["consultation", "استشارة مهنية"], ["cv_review", "مراجعة السيرة الذاتية"], ["interview_prep", "التحضير للمقابلة"], ["profile_review", "مراجعة الملف المهني"]],
    abuseTarget: "رابط أو مرجع (اختياري)", abuseTargetHint: "عنوان الصفحة أو مرجع الوظيفة أو الحساب الذي تبلّغ عنه",
    select: "اختر…",
    errors: {
      short: "هذا الحقل قصير جدًا.", long: "هذا الحقل طويل جدًا.", email: "أدخل بريدًا إلكترونيًا صحيحًا.",
      phone: "أدخل رقم هاتف صحيحًا.", consent: "يجب الموافقة للمتابعة.", required: "يرجى اختيار أحد الخيارات.",
      number: "أدخل رقمًا بين 1 و1000.", invalid_type: "هذا الحقل مطلوب.",
    },
    formErrors: {
      rate: "عدد الطلبات من هذا البريد كبير. حاول مجددًا لاحقًا.",
      server: "تعذّر حفظ طلبك. حاول مرة أخرى بعد قليل.",
      unavailable: "الخدمة غير متاحة مؤقتًا. حاول لاحقًا.",
    },
  },
};

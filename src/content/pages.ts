import type { Locale } from "@/lib/i18n";

type Service = { title: string; body: string; points: string[] };

export type PagesContent = {
  about: {
    title: string; intro: string; whatTitle: string; services: Service[];
    candidatesTitle: string; candidatesBody: string; employersTitle: string; employersBody: string;
    findTitle: string; findBody: string; contactCta: string;
  };
  services: {
    title: string; intro: string; companiesTitle: string; companiesIntro: string; consultingTitle: string; consultingIntro: string;
    recruitmentMsg: string; consultingMsg: string;
  };
  contact: { title: string; intro: string; formTitle: string; detailsTitle: string; location: string; linkedin: string; moreChannels: string };
  employers: {
    title: string; intro: string; canTitle: string; items: [string, string][]; statusNote: string;
    ctaRegister: string; ctaService: string;
  };
  cv: {
    title: string; intro: string; principlesTitle: string; principles: [string, string][];
    planTitle: string; plan: string[]; statusNote: string; ctaRegister: string;
  };
  jobs: {
    title: string; intro: string; keyword: string; city: string; search: string; resultsFor: string;
    emptyTitle: string; emptyBody: string; ctaRegister: string; ctaService: string;
  };
  faq: { title: string; intro: string; items: [string, string][] };
  report: { title: string; intro: string; message: string };
  legal: { draftNotice: string; updated: string };
  privacy: { title: string; sections: [string, string][] };
  terms: { title: string; sections: [string, string][] };
  errors: {
    notFoundTitle: string; notFoundBody: string; errorTitle: string; errorBody: string; retry: string; home: string;
    notAuthorizedTitle: string; notAuthorizedBody: string; loading: string; offline: string; ref: string;
  };
};

export const pages: Record<Locale, PagesContent> = {
  en: {
    about: {
      title: "About NEXT | HR & Recruitment",
      intro: "A human resources and recruitment company based in Karrada, Baghdad, Iraq.",
      whatTitle: "What we do",
      services: [
        { title: "Tailored Recruitment Solutions", body: "Recruitment services designed around each organization's hiring requirements.", points: [] },
        { title: "Talent Acquisition", body: "Helping organizations identify and connect with suitable candidates.", points: [] },
        { title: "Workforce Planning", body: "Supporting organizations in evaluating staffing needs and planning workforce requirements.", points: [] },
        { title: "Career Consulting", body: "Supporting professionals in career development, job search preparation, and professional positioning.", points: [] },
      ],
      candidatesTitle: "For candidates",
      candidatesBody: "We help candidates take their next step toward meaningful and sustainable careers: finding opportunities, preparing a stronger CV, and getting career guidance.",
      employersTitle: "For employers",
      employersBody: "We support companies with tailored recruitment solutions, workforce planning, and a professional hiring process.",
      findTitle: "Find us",
      findBody: "Karrada, Baghdad, Iraq.",
      contactCta: "Contact NEXT",
    },
    services: {
      title: "HR & Recruitment services",
      intro: "We support companies by delivering tailored recruitment solutions, workforce planning, and career consulting, while helping candidates take their next step.",
      companiesTitle: "For companies: request recruitment services",
      companiesIntro: "Tell us what you need. Your request is saved with a reference number and reviewed by the NEXT team.",
      consultingTitle: "For candidates: career consulting",
      consultingIntro: "Request a career consultation, CV review, interview preparation or a professional profile review.",
      recruitmentMsg: "Hiring requirements",
      consultingMsg: "Tell us about your situation and goals",
    },
    contact: {
      title: "Contact us", intro: "Send us a message and the NEXT team will get back to you.",
      formTitle: "Send a message", detailsTitle: "Company details",
      location: "Karrada, Baghdad, Iraq", linkedin: "LinkedIn",
      moreChannels: "Other official contact channels will appear here once they are verified.",
    },
    employers: {
      title: "Hire the right talent",
      intro: "Post vacancies and manage recruitment through a professional hiring system, or let NEXT run the search for you.",
      canTitle: "What employers will be able to do on NEXT",
      items: [
        ["Register your company", "Create an employer account and submit your company for verification."],
        ["Publish vacancies", "Create job posts with requirements, salary range and screening questions."],
        ["Manage applicants", "Review applications, add internal notes and move candidates through hiring stages."],
        ["Work with the NEXT team", "Request tailored recruitment, talent acquisition or workforce planning support."],
      ],
      statusNote: "Status: employer registration and the NEXT service request form are available now. Job publishing and the applicant tracking tools are still being built and are not yet usable.",
      ctaRegister: "Create an employer account", ctaService: "Request recruitment services",
    },
    cv: {
      title: "AI CV Studio",
      intro: "Create, improve and tailor your CV with AI assistance, without inventing anything about you.",
      principlesTitle: "Our rules for AI on your CV",
      principles: [
        ["Never invents information", "The AI does not make up employers, job titles, degrees, dates, achievements or numbers. Missing details are flagged for you to complete."],
        ["You approve every change", "Suggested edits are shown next to your original text, and nothing is saved until you accept it."],
        ["Guidance, not a verdict", "Any score is an internal guidance score, not an official ATS score, and never a hiring decision."],
      ],
      planTitle: "Planned functions",
      plan: ["Create a CV from scratch", "Upload an existing PDF or DOCX CV", "Analyze and improve your CV", "Tailor your CV to a specific job", "Save versions and compare them", "Export to PDF and DOCX, Arabic and English"],
      statusNote: "Status: in development. You can create an account now; the CV tools are not available yet and no CV is analyzed or stored today.",
      ctaRegister: "Create an account",
    },
    jobs: {
      title: "Find your next job", intro: "Search available career opportunities across Iraq.",
      keyword: "Job title or keyword", city: "City or location", search: "Search Jobs", resultsFor: "Search",
      emptyTitle: "No vacancies are published yet",
      emptyBody: "Job listings will appear here as employers publish them. We never show invented vacancies.",
      ctaRegister: "Create an account", ctaService: "Need a role filled? Talk to NEXT",
    },
    faq: {
      title: "Frequently asked questions", intro: "Short answers about NEXT and how the platform works.",
      items: [
        ["What is NEXT | HR & Recruitment?", "NEXT is a human resources and recruitment company in Karrada, Baghdad, Iraq. This platform connects candidates, employers and NEXT's HR services."],
        ["What is available on the platform today?", "You can browse the public pages, create an account, and send contact, recruitment-service, career-consulting and abuse-report requests. Job posting, applications and the AI CV Studio are being built in stages and are marked as such where they appear."],
        ["How do I request recruitment services for my company?", "Use the form on the HR Services page. Your request gets a reference number and is reviewed by the NEXT team."],
        ["Will the AI invent details on my CV?", "No. The AI CV Studio is designed never to invent employers, titles, degrees, dates or results. Missing details are flagged for you to confirm, and you approve every change."],
        ["Who can see my CV and profile?", "Your profile and CVs are private. They are shared with an employer only when you apply to that employer's vacancy and confirm data sharing."],
        ["How do I report a problem or a suspicious vacancy?", "Use the Report Abuse page. Include the page address or reference if you have it."],
        ["Which languages are supported?", "Arabic and English, with right-to-left and left-to-right layouts."],
      ],
    },
    report: { title: "Report abuse", intro: "Tell us about a suspicious vacancy, a fraudulent account, or other misuse of the platform.", message: "What happened?" },
    legal: { draftNotice: "Draft pending professional legal review. Do not rely on this text as final legal terms.", updated: "Draft version" },
    privacy: {
      title: "Privacy Policy",
      sections: [
        ["Who we are", "NEXT | HR & Recruitment is a human resources and recruitment company in Karrada, Baghdad, Iraq."],
        ["Information we collect", "Account details (name, email), profile and CV information you choose to provide, messages and requests you send us, and basic technical data needed to run and secure the service."],
        ["How we use it", "To provide your account, to operate the platform, to respond to your requests, to connect you with employers when you choose to apply, and to keep the service secure."],
        ["Sharing", "Your profile and CV are shared with an employer only when you apply to that employer's vacancy and confirm data sharing. We do not sell personal data."],
        ["AI processing", "When AI features are enabled, CV text you submit may be processed by an AI provider to produce suggestions. Uploaded documents are treated as untrusted content and are never used to change platform rules."],
        ["Your choices", "You can edit your profile, request account deletion from your account settings, and contact us about your data."],
        ["Retention and security", "Retention periods and the full list of processors will be confirmed in the final policy. Data is stored with access controls and private storage for documents."],
        ["Contact", "Use the contact page to reach NEXT about privacy questions."],
      ],
    },
    terms: {
      title: "Terms of Service",
      sections: [
        ["Using NEXT", "You must provide accurate information and keep your account secure. You are responsible for activity under your account."],
        ["Candidates", "You confirm that the information in your profile and applications is true. Do not submit content you do not have the right to share."],
        ["Employers", "Vacancies must be genuine and lawful. Companies may be verified by NEXT, and unverified or misleading postings may be removed."],
        ["Prohibited conduct", "Fraud, impersonation, discrimination, scraping, attempts to access other users' data and any unlawful use are prohibited."],
        ["AI-generated content", "AI output is a suggestion. You are responsible for reviewing and approving anything you submit. AI features do not make hiring decisions."],
        ["Availability", "Features are released in stages and may change. We may suspend accounts that violate these terms."],
        ["Contact", "Use the contact page for questions about these terms."],
      ],
    },
    errors: {
      notFoundTitle: "Page not found", notFoundBody: "The page you are looking for does not exist or has moved.",
      errorTitle: "Something went wrong", errorBody: "An unexpected error occurred. Please try again.", retry: "Try again", home: "Back to home",
      notAuthorizedTitle: "You don't have access to this page", notAuthorizedBody: "Your account does not have permission to open this area. If you believe this is a mistake, contact NEXT.",
      loading: "Loading…", offline: "Network problem. Check your connection and try again.", ref: "Error reference",
    },
  },
  ar: {
    about: {
      title: "عن NEXT | HR & Recruitment",
      intro: "شركة موارد بشرية وتوظيف مقرها الكرادة، بغداد، العراق.",
      whatTitle: "ماذا نقدّم",
      services: [
        { title: "حلول توظيف مخصصة", body: "خدمات توظيف مصممة وفق احتياجات كل مؤسسة.", points: [] },
        { title: "استقطاب الكفاءات", body: "مساعدة المؤسسات على التعرف على المرشحين المناسبين والتواصل معهم.", points: [] },
        { title: "تخطيط القوى العاملة", body: "دعم المؤسسات في تقييم احتياجاتها من الكوادر وتخطيط متطلبات القوى العاملة.", points: [] },
        { title: "الاستشارات المهنية", body: "دعم المهنيين في التطور الوظيفي والتحضير للبحث عن عمل وتحسين حضورهم المهني.", points: [] },
      ],
      candidatesTitle: "للباحثين عن عمل",
      candidatesBody: "نساعد الباحثين عن عمل على اتخاذ خطوتهم القادمة نحو مسار مهني ذي معنى ومستدام: العثور على الفرص، وتحضير سيرة ذاتية أقوى، والحصول على إرشاد مهني.",
      employersTitle: "للشركات",
      employersBody: "ندعم الشركات بحلول توظيف مخصصة وتخطيط للقوى العاملة وعملية توظيف احترافية.",
      findTitle: "موقعنا",
      findBody: "الكرادة، بغداد، العراق.",
      contactCta: "تواصل مع NEXT",
    },
    services: {
      title: "خدمات الموارد البشرية والتوظيف",
      intro: "ندعم الشركات بحلول توظيف مخصصة وتخطيط للقوى العاملة واستشارات مهنية، ونساعد الباحثين عن عمل على اتخاذ خطوتهم القادمة.",
      companiesTitle: "للشركات: اطلب خدمات التوظيف",
      companiesIntro: "أخبرنا بما تحتاجه. يُحفظ طلبك برقم مرجعي ويراجعه فريق NEXT.",
      consultingTitle: "للباحثين عن عمل: الاستشارات المهنية",
      consultingIntro: "اطلب استشارة مهنية أو مراجعة للسيرة الذاتية أو تحضيرًا للمقابلة أو مراجعة للملف المهني.",
      recruitmentMsg: "متطلبات التوظيف",
      consultingMsg: "أخبرنا عن وضعك وأهدافك",
    },
    contact: {
      title: "تواصل معنا", intro: "أرسل لنا رسالة وسيرد عليك فريق NEXT.",
      formTitle: "أرسل رسالة", detailsTitle: "بيانات الشركة",
      location: "الكرادة، بغداد، العراق", linkedin: "LinkedIn",
      moreChannels: "ستظهر هنا قنوات التواصل الرسمية الأخرى بعد التحقق منها.",
    },
    employers: {
      title: "وظّف الكفاءة المناسبة",
      intro: "انشر الوظائف الشاغرة وأدِر التوظيف عبر نظام احترافي، أو دع NEXT تتولى البحث نيابةً عنك.",
      canTitle: "ما ستتمكن الشركات من فعله على NEXT",
      items: [
        ["سجّل شركتك", "أنشئ حساب شركة وقدّم شركتك للتحقق."],
        ["انشر الوظائف", "أنشئ إعلانات وظيفية مع المتطلبات ونطاق الراتب وأسئلة الفرز."],
        ["أدِر المتقدمين", "راجع الطلبات وأضف ملاحظات داخلية وانقل المرشحين بين مراحل التوظيف."],
        ["اعمل مع فريق NEXT", "اطلب دعمًا في التوظيف المخصص أو استقطاب الكفاءات أو تخطيط القوى العاملة."],
      ],
      statusNote: "الحالة: تسجيل الشركات ونموذج طلب خدمات NEXT متاحان الآن. أدوات نشر الوظائف وتتبّع المتقدمين ما زالت قيد البناء وغير قابلة للاستخدام بعد.",
      ctaRegister: "أنشئ حساب شركة", ctaService: "اطلب خدمات التوظيف",
    },
    cv: {
      title: "استوديو السيرة الذاتية الذكي",
      intro: "أنشئ سيرتك الذاتية وحسّنها وكيّفها بمساعدة الذكاء الاصطناعي، دون أن يختلق أي معلومة عنك.",
      principlesTitle: "قواعدنا لاستخدام الذكاء الاصطناعي في سيرتك",
      principles: [
        ["لا يختلق معلومات", "لا يخترع الذكاء الاصطناعي جهات عمل أو مسميات وظيفية أو شهادات أو تواريخ أو إنجازات أو أرقامًا. تُعلَّم التفاصيل الناقصة لتكملها أنت."],
        ["أنت توافق على كل تعديل", "تُعرض التعديلات المقترحة بجانب نصك الأصلي، ولا يُحفظ شيء قبل أن تقبله."],
        ["إرشاد وليس حكمًا", "أي درجة هي درجة إرشادية داخلية وليست درجة ATS رسمية، وليست قرار توظيف."],
      ],
      planTitle: "الوظائف المخطط لها",
      plan: ["إنشاء سيرة ذاتية من الصفر", "رفع سيرة ذاتية موجودة بصيغة PDF أو DOCX", "تحليل السيرة الذاتية وتحسينها", "تكييف السيرة الذاتية لوظيفة محددة", "حفظ النسخ ومقارنتها", "التصدير إلى PDF وDOCX بالعربية والإنجليزية"],
      statusNote: "الحالة: قيد التطوير. يمكنك إنشاء حساب الآن؛ أدوات السيرة الذاتية غير متاحة بعد، ولا تُحلَّل أو تُخزَّن أي سيرة ذاتية حاليًا.",
      ctaRegister: "أنشئ حسابًا",
    },
    jobs: {
      title: "اعثر على وظيفتك القادمة", intro: "ابحث في فرص العمل المتاحة في العراق.",
      keyword: "المسمى الوظيفي أو كلمة مفتاحية", city: "المدينة أو الموقع", search: "ابحث عن وظيفة", resultsFor: "البحث",
      emptyTitle: "لا توجد وظائف منشورة بعد",
      emptyBody: "ستظهر الوظائف هنا عندما تنشرها الشركات. لا نعرض أبدًا وظائف مختلقة.",
      ctaRegister: "أنشئ حسابًا", ctaService: "تحتاج لملء وظيفة؟ تحدث مع NEXT",
    },
    faq: {
      title: "الأسئلة الشائعة", intro: "إجابات قصيرة عن NEXT وكيفية عمل المنصة.",
      items: [
        ["ما هي NEXT | HR & Recruitment؟", "NEXT شركة موارد بشرية وتوظيف في الكرادة، بغداد، العراق. تربط هذه المنصة بين الباحثين عن عمل والشركات وخدمات NEXT للموارد البشرية."],
        ["ما المتاح على المنصة اليوم؟", "يمكنك تصفح الصفحات العامة وإنشاء حساب وإرسال طلبات التواصل وخدمات التوظيف والاستشارات المهنية والبلاغات. نشر الوظائف والتقديم عليها واستوديو السيرة الذاتية الذكي قيد البناء على مراحل، ويُشار إلى ذلك أينما ظهرت."],
        ["كيف أطلب خدمات التوظيف لشركتي؟", "استخدم النموذج في صفحة خدمات الموارد البشرية. يحصل طلبك على رقم مرجعي ويراجعه فريق NEXT."],
        ["هل يختلق الذكاء الاصطناعي تفاصيل في سيرتي الذاتية؟", "لا. صُمّم استوديو السيرة الذاتية الذكي ألا يختلق جهات العمل أو المسميات أو الشهادات أو التواريخ أو النتائج. تُعلَّم التفاصيل الناقصة لتؤكدها، وأنت توافق على كل تعديل."],
        ["من يستطيع الاطلاع على سيرتي وملفي؟", "ملفك وسيرك الذاتية خاصة. تُشارك مع جهة التوظيف فقط عندما تتقدم لوظيفتها وتؤكد مشاركة البيانات."],
        ["كيف أبلّغ عن مشكلة أو وظيفة مشبوهة؟", "استخدم صفحة الإبلاغ عن إساءة. أرفق عنوان الصفحة أو المرجع إن توفر."],
        ["ما اللغات المدعومة؟", "العربية والإنجليزية، مع تخطيط من اليمين إلى اليسار ومن اليسار إلى اليمين."],
      ],
    },
    report: { title: "الإبلاغ عن إساءة", intro: "أخبرنا عن وظيفة مشبوهة أو حساب احتيالي أو أي إساءة استخدام للمنصة.", message: "ماذا حدث؟" },
    legal: { draftNotice: "مسودة بانتظار المراجعة القانونية المهنية. لا تعتمد على هذا النص كشروط قانونية نهائية.", updated: "نسخة مسودة" },
    privacy: {
      title: "سياسة الخصوصية",
      sections: [
        ["من نحن", "NEXT | HR & Recruitment شركة موارد بشرية وتوظيف في الكرادة، بغداد، العراق."],
        ["المعلومات التي نجمعها", "بيانات الحساب (الاسم والبريد الإلكتروني)، ومعلومات الملف الشخصي والسيرة الذاتية التي تختار تقديمها، والرسائل والطلبات التي ترسلها لنا، وبيانات تقنية أساسية لازمة لتشغيل الخدمة وتأمينها."],
        ["كيف نستخدمها", "لتوفير حسابك وتشغيل المنصة والرد على طلباتك وربطك بجهات التوظيف عندما تختار التقديم وللحفاظ على أمان الخدمة."],
        ["المشاركة", "يُشارك ملفك وسيرتك الذاتية مع جهة التوظيف فقط عندما تتقدم لوظيفتها وتؤكد مشاركة البيانات. لا نبيع البيانات الشخصية."],
        ["المعالجة بالذكاء الاصطناعي", "عند تفعيل ميزات الذكاء الاصطناعي، قد يعالج مزوّد ذكاء اصطناعي نص سيرتك الذاتية لإنتاج اقتراحات. تُعامل المستندات المرفوعة كمحتوى غير موثوق ولا تُستخدم أبدًا لتغيير قواعد المنصة."],
        ["خياراتك", "يمكنك تعديل ملفك وطلب حذف حسابك من إعدادات الحساب والتواصل معنا بشأن بياناتك."],
        ["الاحتفاظ والأمان", "ستُحدَّد مدد الاحتفاظ والقائمة الكاملة للمعالجين في السياسة النهائية. تُخزَّن البيانات بضوابط وصول وتخزين خاص للمستندات."],
        ["التواصل", "استخدم صفحة التواصل للوصول إلى NEXT بشأن أسئلة الخصوصية."],
      ],
    },
    terms: {
      title: "شروط الخدمة",
      sections: [
        ["استخدام NEXT", "يجب تقديم معلومات صحيحة والحفاظ على أمان حسابك. أنت مسؤول عن النشاط الذي يتم عبر حسابك."],
        ["الباحثون عن عمل", "تؤكد أن المعلومات في ملفك وطلباتك صحيحة. لا تقدّم محتوى لا تملك حق مشاركته."],
        ["الشركات", "يجب أن تكون الوظائف حقيقية ومشروعة. قد تتحقق NEXT من الشركات، وقد تُزال الإعلانات غير الموثقة أو المضللة."],
        ["السلوك المحظور", "يُحظر الاحتيال وانتحال الهوية والتمييز وجمع البيانات آليًا ومحاولة الوصول إلى بيانات مستخدمين آخرين وأي استخدام غير قانوني."],
        ["المحتوى المولَّد بالذكاء الاصطناعي", "مخرجات الذكاء الاصطناعي مجرد اقتراحات. أنت مسؤول عن مراجعة وقبول ما تقدّمه. ميزات الذكاء الاصطناعي لا تتخذ قرارات توظيف."],
        ["التوفر", "تُطلق الميزات على مراحل وقد تتغير. قد نعلّق الحسابات المخالفة لهذه الشروط."],
        ["التواصل", "استخدم صفحة التواصل للأسئلة حول هذه الشروط."],
      ],
    },
    errors: {
      notFoundTitle: "الصفحة غير موجودة", notFoundBody: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
      errorTitle: "حدث خطأ ما", errorBody: "وقع خطأ غير متوقع. يرجى المحاولة مرة أخرى.", retry: "حاول مرة أخرى", home: "العودة إلى الرئيسية",
      notAuthorizedTitle: "ليس لديك صلاحية لهذه الصفحة", notAuthorizedBody: "حسابك لا يملك إذن فتح هذا القسم. إذا كنت تعتقد أن هذا خطأ فتواصل مع NEXT.",
      loading: "جارٍ التحميل…", offline: "مشكلة في الشبكة. تحقق من اتصالك وحاول مجددًا.", ref: "مرجع الخطأ",
    },
  },
};

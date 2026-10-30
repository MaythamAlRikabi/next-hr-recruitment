import type { Locale } from "@/lib/i18n";

/**
 * Copy for the expansion pages. Rules: no statistics, no client names, no testimonials, no accreditations,
 * no claims about services NEXT has not approved. Future modules (contract staffing, payroll, EOR,
 * relocation, training) appear only in the `roadmap` block, labelled "Not offered yet"; they are never service pages.
 */
export type ServiceDetail = {
  slug: string;
  title: string;
  intro: string;
  forWhom: string;
  points: [string, string][];
  steps: string[];
  cta: string;
};

type Expansion = {
  executive: {
    eyebrow: string; title: string; intro: string;
    whoTitle: string; who: [string, string][];
    processTitle: string; process: string[];
    privacyTitle: string; privacy: string[];
    formTitle: string; formIntro: string; formMsg: string; note: string;
  };
  insights: {
    eyebrow: string; title: string; intro: string; categoriesTitle: string; categories: string[];
    emptyTitle: string; emptyBody: string; policyTitle: string; policy: string; ctaContact: string; ctaJobs: string;
  };
  submitCv: {
    eyebrow: string; title: string; intro: string;
    stepsTitle: string; steps: [string, string][];
    controlsTitle: string; controls: string[];
    status: string; ctaRegister: string; ctaStudio: string; ctaLogin: string;
  };
  services: ServiceDetail[];
  serviceCommon: { back: string; forWhom: string; includes: string; how: string; request: string; note: string };
  roadmap: { title: string; intro: string; badge: string; items: [string, string][]; contact: string };
  home: {
    audience: { upload: string };
    locations: { heading: string; intro: string; items: { slug: string; label: string }[] };
    exec: { badge: string; heading: string; body: string; points: string[]; cta: string; contact: string };
    insights: { heading: string; intro: string; emptyTitle: string; emptyBody: string; cta: string };
    services: { heading: string; intro: string; all: string };
  };
};

const cities = {
  en: [
    ["baghdad", "Baghdad"], ["erbil", "Erbil"], ["basra", "Basra"], ["sulaymaniyah", "Sulaymaniyah"],
    ["mosul", "Mosul"], ["najaf", "Najaf"], ["karbala", "Karbala"], ["kirkuk", "Kirkuk"], ["duhok", "Duhok"],
  ],
  ar: [
    ["baghdad", "بغداد"], ["erbil", "أربيل"], ["basra", "البصرة"], ["sulaymaniyah", "السليمانية"],
    ["mosul", "الموصل"], ["najaf", "النجف"], ["karbala", "كربلاء"], ["kirkuk", "كركوك"], ["duhok", "دهوك"],
  ],
} as const;

export const expansion: Record<Locale, Expansion> = {
  en: {
    executive: {
      eyebrow: "Executive Search",
      title: "Leadership hiring, handled with discretion",
      intro:
        "A recruiter-managed service for senior management and leadership roles, where who is hiring — and who is being considered — stays private until the right moment.",
      whoTitle: "Who it is for",
      who: [
        ["Boards and owners", "Appointing a general manager, country manager or other senior leader."],
        ["Growing organisations", "Building a leadership layer for a new market, function or business unit."],
        ["Confidential replacements", "Replacing a senior employee without announcing the vacancy."],
      ],
      processTitle: "How an assignment runs",
      process: [
        "You send a confidential brief: the role, seniority and what must stay private.",
        "A NEXT recruiter reviews it and agrees scope, timing and the confidentiality terms with you.",
        "Candidates are approached directly and their consent is requested before any profile is shared.",
        "You receive a recruiter-managed shortlist — never a raw database export.",
        "NEXT coordinates interviews, records feedback and tracks the placement to completion.",
      ],
      privacyTitle: "Confidentiality principles",
      privacy: [
        "Confidential assignments are not published on the public job board.",
        "The employer's identity is shown to candidates only after you approve it.",
        "A candidate's profile is shared with you only with that candidate's consent.",
        "Access is limited to the NEXT recruiters assigned to your assignment.",
      ],
      formTitle: "Send a confidential hiring inquiry",
      formIntro:
        "Tell us about the role. Please do not include names of people being replaced. A recruiter will reply to the email you provide.",
      formMsg: "Role, seniority, location and what must remain confidential",
      note: "Executive Search is delivered by NEXT recruiters on request. This page does not list or advertise any live assignment.",
    },
    insights: {
      eyebrow: "Insights",
      title: "Career advice and hiring guidance",
      intro: "Guides, interview advice and labour-market notes for people and employers in Iraq.",
      categoriesTitle: "What we will publish",
      categories: [
        "Career articles", "Recruitment guides", "Interview advice", "Industry insights",
        "Iraq labour-market updates", "Salary reports", "Workforce planning", "Company announcements",
      ],
      emptyTitle: "No articles have been published yet",
      emptyBody:
        "Articles appear here once the NEXT editorial team publishes them. Each will show its author, date and category.",
      policyTitle: "Our content standard",
      policy:
        "We publish labour-market figures only when we can cite a real source. Until then, you will not see invented statistics.",
      ctaContact: "Suggest a topic",
      ctaJobs: "Explore jobs",
    },
    submitCv: {
      eyebrow: "Talent pool",
      title: "Submit your CV to NEXT",
      intro:
        "Not ready to apply for a specific vacancy? Share your CV and preferences so NEXT recruiters can consider you when a suitable role appears — only if you choose to.",
      stepsTitle: "How it will work",
      steps: [
        ["Create an account", "Your CV and preferences stay private by default."],
        ["Upload a PDF or DOCX", "Add your preferred functions, locations and job preferences."],
        ["Choose your visibility", "Private, anonymised preview for NEXT recruiters, or searchable by NEXT recruiters."],
        ["Give or withdraw consent", "Joining the talent pool is a separate, explicit choice you can undo at any time."],
      ],
      controlsTitle: "Your controls",
      controls: [
        "Companies cannot browse your private profile automatically.",
        "Anonymised previews hide your name and contact details.",
        "You can withdraw consent and request deletion of your data.",
        "Nothing is shared with an employer without your approval.",
      ],
      status:
        "Status: CV upload and the talent pool are being built and are not open yet. You can create an account now; we will not collect CV files through this page.",
      ctaRegister: "Create an account",
      ctaStudio: "Improve my CV first",
      ctaLogin: "Sign in",
    },
    serviceCommon: {
      back: "All services", forWhom: "Who it is for", includes: "What it covers",
      how: "How it works", request: "Request this service",
      note: "Delivered by NEXT recruiters. Scope and timelines are agreed with you in writing.",
    },
    roadmap: {
      title: "Planned services — not available yet",
      intro: "These are areas NEXT may add in the future. They are not offered today, and nothing here can be ordered.",
      badge: "Not offered yet",
      items: [
        ["Outsourcing and contract staffing", "Under consideration. Not available."],
        ["Employer of Record", "Under consideration. Not available."],
        ["Payroll services", "Under consideration. Not available."],
        ["Training", "Under consideration. Not available."],
      ],
      contact: "Ask us what is available today",
    },
    services: [
      {
        slug: "permanent-recruitment",
        title: "Permanent Recruitment",
        intro: "Recruitment designed around each organisation's hiring requirements, from role definition to a confirmed hire.",
        forWhom: "Organisations in Iraq hiring permanent staff at professional and managerial level.",
        points: [
          ["Role definition", "Clarify responsibilities, must-have skills and selection criteria."],
          ["Sourcing and screening", "Identify suitable candidates and screen them against the brief."],
          ["Shortlist and interviews", "Present a recruiter-reviewed shortlist and coordinate interviews."],
        ],
        steps: ["Share your requirements", "Agree scope and timeline", "Review the shortlist", "Interview and decide"],
        cta: "Request recruitment support",
      },
      {
        slug: "talent-acquisition",
        title: "Talent Acquisition",
        intro: "Helping organisations identify and connect with suitable candidates, including hard-to-reach profiles.",
        forWhom: "HR teams that need extra sourcing capacity or help reaching specific talent.",
        points: [
          ["Targeted outreach", "Approach relevant professionals with a clear, honest role description."],
          ["Employer presentation", "Help present the role and the organisation accurately."],
          ["Pipeline support", "Keep qualified candidates engaged while decisions are made."],
        ],
        steps: ["Define the profile", "Source and approach", "Assess fit", "Hand over candidates"],
        cta: "Discuss your hiring needs",
      },
      {
        slug: "workforce-planning",
        title: "Workforce Planning",
        intro: "Evaluating staffing needs and planning the workforce requirements of the organisation.",
        forWhom: "Management teams planning growth, restructuring or new operations.",
        points: [
          ["Staffing needs review", "Compare current capacity with the work to be delivered."],
          ["Role and skills mapping", "Describe the roles and skills the plan requires."],
          ["Hiring roadmap", "Sequence hiring priorities against timing and budget you provide."],
        ],
        steps: ["Share objectives", "Review current structure", "Draft the plan", "Agree next actions"],
        cta: "Talk to NEXT about planning",
      },
      {
        slug: "career-consulting",
        title: "Career Consulting",
        intro: "Supporting professionals in career development, job-search preparation and professional positioning.",
        forWhom: "Professionals who want guidance on their next move, their CV or their interviews.",
        points: [
          ["Career direction", "Think through options and next steps."],
          ["Job-search preparation", "Prepare applications and interviews."],
          ["Professional positioning", "Present real experience clearly and credibly."],
        ],
        steps: ["Tell us your goal", "Book a consultation", "Receive guidance", "Act on the plan"],
        cta: "Request career consulting",
      },
      {
        slug: "talent-mapping",
        title: "Talent Mapping",
        intro: "A structured view of where relevant talent sits in a sector, function or location.",
        forWhom: "Organisations assessing the availability of specific skills before committing to hiring.",
        points: [
          ["Scope definition", "Agree the roles, sectors and locations to be mapped."],
          ["Market view", "Describe where relevant talent is found, based on research we can source."],
          ["Findings review", "Walk through what was found and what it means for your plan."],
        ],
        steps: ["Define the scope", "Research", "Review findings", "Decide how to proceed"],
        cta: "Ask about talent mapping",
      },
      {
        slug: "recruitment-advisory",
        title: "Recruitment Advisory",
        intro: "Practical advice on how to structure, run and improve your hiring process.",
        forWhom: "Organisations that hire in-house and want a clearer, fairer and faster process.",
        points: [
          ["Process review", "Look at how you attract, screen and select today."],
          ["Role and interview design", "Write clearer role descriptions and structured interview questions."],
          ["Fair selection", "Keep decisions based on job-related criteria, with humans accountable."],
        ],
        steps: ["Describe your process", "Review together", "Agree improvements", "Follow up"],
        cta: "Ask for advisory support",
      },
      {
        slug: "contingency-search",
        title: "Contingency Search",
        intro: "A search model where NEXT recruiters work on a defined role and you review candidates before committing to a hire.",
        forWhom: "Organisations that want recruiter support on a specific role without a retained assignment.",
        points: [
          ["Defined brief", "A written role brief and selection criteria agreed with you."],
          ["Recruiter-reviewed candidates", "Candidates are screened and reviewed by a NEXT recruiter before you see them."],
          ["Consent-based sharing", "Candidate details are shared only with the candidate's consent."],
        ],
        steps: ["Send the role brief", "Agree terms in writing", "Review candidates", "Interview and decide"],
        cta: "Ask about contingency search",
      },
    ],
    home: {
      audience: { upload: "Upload CV" },
      locations: {
        heading: "Browse by location",
        intro: "Look for roles in the city where you want to work.",
        items: cities.en.map(([slug, label]) => ({ slug, label })),
      },
      exec: {
        badge: "Executive Search",
        heading: "Senior hiring that stays confidential",
        body:
          "For leadership roles, NEXT recruiters manage the assignment end to end: a confidential brief, discreet outreach, candidate consent and a recruiter-managed shortlist.",
        points: [
          "Confidential assignments are never listed publicly",
          "Employer identity is revealed only with your approval",
          "Candidate profiles are shared only with consent",
        ],
        cta: "Explore Executive Search",
        contact: "Send a confidential inquiry",
      },
      insights: {
        heading: "Insights",
        intro: "Career advice, hiring guides and labour-market notes.",
        emptyTitle: "Articles are coming soon",
        emptyBody: "We publish when we have something useful and verifiable to say — no invented statistics.",
        cta: "Go to Insights",
      },
      services: {
        heading: "Recruitment services",
        intro: "Choose the support that fits how you hire.",
        all: "All services",
      },
    },
  },
  ar: {
    executive: {
      eyebrow: "البحث التنفيذي",
      title: "توظيف القيادات بسرّية واحترافية",
      intro:
        "خدمة يديرها مختصو NEXT للمناصب الإدارية العليا والقيادية، حيث تبقى هوية الجهة المُوظِّفة والمرشحين المحتملين سرّية حتى اللحظة المناسبة.",
      whoTitle: "لمن هذه الخدمة",
      who: [
        ["مجالس الإدارة والملاك", "عند تعيين مدير عام أو مدير دولة أو قيادي أول."],
        ["المؤسسات النامية", "عند بناء طبقة قيادية لسوق أو وظيفة أو وحدة أعمال جديدة."],
        ["الاستبدال السرّي", "عند استبدال موظف كبير دون الإعلان عن الشاغر."],
      ],
      processTitle: "كيف تسير المهمة",
      process: [
        "ترسل ملخصًا سريًا: المنصب، والمستوى الوظيفي، وما يجب أن يبقى خاصًا.",
        "يراجعه مختص من NEXT ويتفق معك على النطاق والتوقيت وشروط السرّية.",
        "يُتواصل مع المرشحين مباشرة ويُطلب موافقتهم قبل مشاركة أي ملف.",
        "تستلم قائمة مختصرة يديرها المختص، وليس تصديرًا خامًا لقاعدة بيانات.",
        "تنسّق NEXT المقابلات وتسجّل الملاحظات وتتابع التعيين حتى اكتماله.",
      ],
      privacyTitle: "مبادئ السرّية",
      privacy: [
        "لا تُنشر المهام السرية في لوحة الوظائف العامة.",
        "لا تُعرض هوية الجهة المُوظِّفة للمرشحين إلا بعد موافقتك.",
        "لا يُشارك ملف المرشح معك إلا بموافقته.",
        "الوصول مقتصر على مختصي NEXT المكلّفين بمهمتك.",
      ],
      formTitle: "أرسل استفسار توظيف سريًا",
      formIntro:
        "عرّفنا بالمنصب. يرجى عدم ذكر أسماء الأشخاص المراد استبدالهم. سيردّ عليك مختص عبر البريد الذي تدخله.",
      formMsg: "المنصب والمستوى والموقع وما يجب أن يبقى سريًا",
      note: "يقدّم مختصو NEXT خدمة البحث التنفيذي عند الطلب. لا تعرض هذه الصفحة أو تعلن أي مهمة قائمة.",
    },
    insights: {
      eyebrow: "رؤى ومقالات",
      title: "نصائح مهنية وإرشادات توظيف",
      intro: "أدلة ونصائح مقابلات وملاحظات عن سوق العمل للأفراد والشركات في العراق.",
      categoriesTitle: "ما سننشره",
      categories: [
        "مقالات مهنية", "أدلة التوظيف", "نصائح المقابلات", "رؤى القطاعات",
        "مستجدات سوق العمل العراقي", "تقارير الرواتب", "تخطيط القوى العاملة", "إعلانات الشركة",
      ],
      emptyTitle: "لم تُنشر أي مقالات بعد",
      emptyBody: "تظهر المقالات هنا عندما يقوم فريق NEXT التحريري بنشرها، وتتضمن اسم الكاتب والتاريخ والتصنيف.",
      policyTitle: "معيارنا في المحتوى",
      policy: "لا ننشر أرقام سوق العمل إلا إذا استطعنا الاستشهاد بمصدر حقيقي. لذلك لن تجد هنا إحصاءات مختلقة.",
      ctaContact: "اقترح موضوعًا",
      ctaJobs: "استكشف الوظائف",
    },
    submitCv: {
      eyebrow: "قاعدة المواهب",
      title: "قدّم سيرتك الذاتية إلى NEXT",
      intro:
        "لست جاهزًا للتقديم على وظيفة محددة؟ شارك سيرتك وتفضيلاتك ليأخذك مختصو NEXT بالاعتبار عند ظهور دور مناسب، وذلك فقط إن اخترت ذلك.",
      stepsTitle: "كيف ستعمل",
      steps: [
        ["أنشئ حسابًا", "تبقى سيرتك وتفضيلاتك خاصة بشكل افتراضي."],
        ["ارفع ملف PDF أو DOCX", "أضف مجالاتك ومواقعك وتفضيلاتك الوظيفية."],
        ["اختر مستوى الظهور", "خاص، أو معاينة مجهولة لمختصي NEXT، أو قابل للبحث من مختصي NEXT."],
        ["امنح الموافقة أو اسحبها", "الانضمام إلى قاعدة المواهب خيار منفصل وصريح يمكنك التراجع عنه في أي وقت."],
      ],
      controlsTitle: "تحكّمك الكامل",
      controls: [
        "لا تستطيع الشركات تصفح ملفك الخاص تلقائيًا.",
        "المعاينة المجهولة تُخفي اسمك وبيانات التواصل.",
        "يمكنك سحب الموافقة وطلب حذف بياناتك.",
        "لا يُشارك أي شيء مع جهة توظيف دون موافقتك.",
      ],
      status:
        "الحالة: رفع السيرة وقاعدة المواهب قيد البناء وغير مفتوحين بعد. يمكنك إنشاء حساب الآن، ولا نجمع ملفات السير من هذه الصفحة.",
      ctaRegister: "أنشئ حسابًا",
      ctaStudio: "حسّن سيرتي أولًا",
      ctaLogin: "تسجيل الدخول",
    },
    serviceCommon: {
      back: "كل الخدمات", forWhom: "لمن هذه الخدمة", includes: "ماذا تشمل",
      how: "كيف تعمل", request: "اطلب هذه الخدمة",
      note: "يقدّمها مختصو NEXT. يُتفق معك كتابةً على النطاق والمواعيد.",
    },
    roadmap: {
      title: "خدمات مخطّط لها — غير متاحة بعد",
      intro: "هذه مجالات قد تضيفها NEXT مستقبلًا. هي غير مقدَّمة اليوم، ولا يمكن طلب أي منها من هنا.",
      badge: "غير متاحة بعد",
      items: [
        ["الاستعانة بمصادر خارجية وعقود التوظيف المؤقت", "قيد الدراسة. غير متاحة."],
        ["صاحب العمل الاسمي (EOR)", "قيد الدراسة. غير متاحة."],
        ["خدمات الرواتب", "قيد الدراسة. غير متاحة."],
        ["التدريب", "قيد الدراسة. غير متاحة."],
      ],
      contact: "اسألنا عمّا هو متاح اليوم",
    },
    services: [
      {
        slug: "permanent-recruitment",
        title: "التوظيف الدائم",
        intro: "توظيف مصمم وفق احتياجات كل مؤسسة، من تحديد الدور حتى تأكيد التعيين.",
        forWhom: "مؤسسات في العراق تستقطب موظفين دائمين على المستويين المهني والإداري.",
        points: [
          ["تحديد الدور", "توضيح المسؤوليات والمهارات الأساسية ومعايير الاختيار."],
          ["الاستقطاب والفرز", "التعرف على المرشحين المناسبين وفرزهم وفق المتطلبات."],
          ["القائمة المختصرة والمقابلات", "عرض قائمة مراجَعة من المختص وتنسيق المقابلات."],
        ],
        steps: ["شاركنا متطلباتك", "نتفق على النطاق والجدول", "راجع القائمة المختصرة", "قابل وقرّر"],
        cta: "اطلب دعم التوظيف",
      },
      {
        slug: "talent-acquisition",
        title: "استقطاب الكفاءات",
        intro: "مساعدة المؤسسات على التعرف على المرشحين المناسبين والتواصل معهم، بما في ذلك الملفات صعبة الوصول.",
        forWhom: "فرق الموارد البشرية التي تحتاج طاقة استقطاب إضافية أو الوصول إلى كفاءات محددة.",
        points: [
          ["تواصل موجّه", "التواصل مع المهنيين المناسبين بوصف واضح وصادق للدور."],
          ["تقديم جهة العمل", "المساعدة في عرض الدور والمؤسسة بدقة."],
          ["دعم قناة المرشحين", "إبقاء المرشحين المؤهلين على اطلاع أثناء اتخاذ القرار."],
        ],
        steps: ["حدّد الملف المطلوب", "استقطاب وتواصل", "تقييم الملاءمة", "تسليم المرشحين"],
        cta: "ناقش احتياجات التوظيف",
      },
      {
        slug: "workforce-planning",
        title: "تخطيط القوى العاملة",
        intro: "تقييم الاحتياجات من الكوادر وتخطيط متطلبات القوى العاملة في المؤسسة.",
        forWhom: "فرق الإدارة التي تخطط للنمو أو إعادة الهيكلة أو عمليات جديدة.",
        points: [
          ["مراجعة الاحتياج", "مقارنة الطاقة الحالية بحجم العمل المطلوب."],
          ["رسم الأدوار والمهارات", "وصف الأدوار والمهارات التي تتطلبها الخطة."],
          ["خارطة التوظيف", "ترتيب أولويات التوظيف وفق التوقيت والميزانية التي تزوّدنا بها."],
        ],
        steps: ["شارك أهدافك", "نراجع الهيكل الحالي", "نصيغ الخطة", "نتفق على الخطوات التالية"],
        cta: "تحدّث مع NEXT عن التخطيط",
      },
      {
        slug: "career-consulting",
        title: "الاستشارات المهنية",
        intro: "دعم المهنيين في التطور الوظيفي والتحضير للبحث عن عمل وتحسين حضورهم المهني.",
        forWhom: "مهنيون يريدون توجيهًا بشأن خطوتهم القادمة أو سيرتهم أو مقابلاتهم.",
        points: [
          ["الاتجاه المهني", "التفكير في الخيارات والخطوات القادمة."],
          ["التحضير للبحث عن عمل", "تجهيز طلبات التقديم والمقابلات."],
          ["الحضور المهني", "عرض الخبرة الحقيقية بوضوح ومصداقية."],
        ],
        steps: ["أخبرنا بهدفك", "احجز استشارة", "استلم التوجيه", "نفّذ الخطة"],
        cta: "اطلب استشارة مهنية",
      },
      {
        slug: "talent-mapping",
        title: "رسم خارطة المواهب",
        intro: "رؤية منظمة لأماكن وجود المواهب المناسبة في قطاع أو وظيفة أو موقع.",
        forWhom: "مؤسسات تقيّم توفّر مهارات محددة قبل الالتزام بالتوظيف.",
        points: [
          ["تحديد النطاق", "الاتفاق على الأدوار والقطاعات والمواقع المراد رسمها."],
          ["نظرة على السوق", "وصف أماكن وجود المواهب المناسبة بالاعتماد على بحث يمكننا توثيق مصدره."],
          ["مراجعة النتائج", "شرح ما توصلنا إليه وأثره على خطتك."],
        ],
        steps: ["حدّد النطاق", "بحث", "راجع النتائج", "قرّر كيف تتابع"],
        cta: "اسأل عن رسم خارطة المواهب",
      },
      {
        slug: "recruitment-advisory",
        title: "الاستشارات التوظيفية",
        intro: "نصائح عملية لتنظيم عملية التوظيف وتشغيلها وتحسينها.",
        forWhom: "مؤسسات توظّف داخليًا وتريد عملية أوضح وأكثر عدلًا وأسرع.",
        points: [
          ["مراجعة العملية", "النظر في طريقة الاستقطاب والفرز والاختيار لديك اليوم."],
          ["تصميم الأدوار والمقابلات", "صياغة أوصاف أوضح وأسئلة مقابلة منظّمة."],
          ["اختيار عادل", "بناء القرارات على معايير متعلقة بالوظيفة، مع بقاء المسؤولية بيد البشر."],
        ],
        steps: ["صِف عمليتك", "نراجعها معًا", "نتفق على التحسينات", "متابعة"],
        cta: "اطلب دعمًا استشاريًا",
      },
      {
        slug: "contingency-search",
        title: "البحث الاحتمالي (Contingency)",
        intro: "نموذج بحث يعمل فيه مختصو NEXT على وظيفة محددة وتراجع أنت المرشحين قبل الالتزام بالتعيين.",
        forWhom: "مؤسسات تريد دعم مختص على وظيفة بعينها دون مهمة بحث حصرية.",
        points: [
          ["ملخص واضح", "ملخص مكتوب للوظيفة ومعايير الاختيار يُتفق عليه معك."],
          ["مرشحون يراجعهم مختص", "يفرز مختص من NEXT المرشحين ويراجعهم قبل أن تراهم."],
          ["مشاركة بالموافقة", "لا تُشارك بيانات المرشح إلا بموافقته."],
        ],
        steps: ["أرسل ملخص الوظيفة", "نتفق على الشروط كتابةً", "راجع المرشحين", "قابل وقرّر"],
        cta: "اسأل عن البحث الاحتمالي",
      },
    ],
    home: {
      audience: { upload: "ارفع سيرتك" },
      locations: {
        heading: "تصفّح حسب الموقع",
        intro: "ابحث عن الأدوار في المدينة التي تريد العمل فيها.",
        items: cities.ar.map(([slug, label]) => ({ slug, label })),
      },
      exec: {
        badge: "البحث التنفيذي",
        heading: "توظيف القيادات بسرّية تامة",
        body:
          "للمناصب القيادية، يدير مختصو NEXT المهمة من البداية للنهاية: ملخص سري، وتواصل متحفّظ، وموافقة المرشح، وقائمة مختصرة يديرها المختص.",
        points: [
          "المهام السرية لا تُعرض علنًا أبدًا",
          "هوية جهة التوظيف لا تُكشف إلا بموافقتك",
          "ملفات المرشحين لا تُشارك إلا بموافقتهم",
        ],
        cta: "استكشف البحث التنفيذي",
        contact: "أرسل استفسارًا سريًا",
      },
      insights: {
        heading: "رؤى ومقالات",
        intro: "نصائح مهنية وأدلة توظيف وملاحظات عن سوق العمل.",
        emptyTitle: "المقالات قادمة قريبًا",
        emptyBody: "ننشر عندما يكون لدينا ما هو مفيد ويمكن التحقق منه، بلا إحصاءات مختلقة.",
        cta: "اذهب إلى الرؤى",
      },
      services: {
        heading: "خدمات التوظيف",
        intro: "اختر الدعم الذي يناسب طريقة توظيفك.",
        all: "كل الخدمات",
      },
    },
  },
};

export const serviceSlugs = expansion.en.services.map((s) => s.slug);

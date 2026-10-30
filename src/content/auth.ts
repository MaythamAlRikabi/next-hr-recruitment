import type { Locale } from "@/lib/i18n";

export type AuthLabels = {
  loginTitle: string; loginIntro: string; registerTitle: string; registerIntro: string;
  forgotTitle: string; forgotIntro: string; resetTitle: string; resetIntro: string;
  email: string; password: string; confirm: string; newPassword: string; fullName: string; phone: string; phoneHint: string;
  purpose: string; purposeCandidate: string; purposeEmployer: string;
  terms: string; termsLink: string; privacyLink: string;
  signIn: string; signingIn: string; register: string; registering: string; send: string; sending: string; save: string; saving: string;
  forgotLink: string; noAccount: string; haveAccount: string; backToLogin: string;
  checkEmailTitle: string; checkEmailBody: string; resetSentTitle: string; resetSentBody: string;
  resetDoneTitle: string; resetDoneBody: string; savedOk: string;
  accountTitle: string; accountIntro: string; profileTitle: string; signOut: string; language: string; role: string;
  deleteTitle: string; deleteIntro: string; deleteReason: string; deleteConfirm: string; deleteSubmit: string; deleteRequested: string; deleteDone: string;
  passwordHint: string; sessionMissing: string;
  errors: Record<string, string>;
};

export const authLabels: Record<Locale, AuthLabels> = {
  en: {
    loginTitle: "Sign in", loginIntro: "Welcome back. Sign in to continue.",
    registerTitle: "Create your account", registerIntro: "Choose what you need NEXT for. You can change your mind later.",
    forgotTitle: "Forgot your password?", forgotIntro: "Enter your email and we will send you a link to set a new password.",
    resetTitle: "Set a new password", resetIntro: "Choose a new password for your account.",
    email: "Email", password: "Password", confirm: "Confirm password", newPassword: "New password", fullName: "Full name",
    phone: "Phone (optional)", phoneHint: "Iraqi number in international format, e.g. +9647XXXXXXXXX",
    purpose: "I want to", purposeCandidate: "I'm looking for a job", purposeEmployer: "I'm hiring for a company",
    terms: "I agree to the", termsLink: "Terms of Service", privacyLink: "Privacy Policy",
    signIn: "Sign in", signingIn: "Signing in…", register: "Create account", registering: "Creating account…",
    send: "Send reset link", sending: "Sending…", save: "Save", saving: "Saving…",
    forgotLink: "Forgot your password?", noAccount: "No account yet?", haveAccount: "Already have an account?", backToLogin: "Back to sign in",
    checkEmailTitle: "Check your email", checkEmailBody: "If this address can be registered, we sent a confirmation link. Open it to activate your account, then sign in.",
    resetSentTitle: "Check your email", resetSentBody: "If an account exists for this address, a password reset link is on its way.",
    resetDoneTitle: "Password updated", resetDoneBody: "Your password was changed. You can continue.",
    savedOk: "Saved.",
    accountTitle: "Account settings", accountIntro: "Manage your details and account.", profileTitle: "Your details", signOut: "Sign out", language: "Language", role: "Account type",
    deleteTitle: "Delete my account", deleteIntro: "Submit a request to delete your account and personal data. A NEXT administrator will process it.",
    deleteReason: "Reason (optional)", deleteConfirm: "I understand this request is for permanent deletion of my account.",
    deleteSubmit: "Request deletion", deleteRequested: "A deletion request is pending. NEXT will process it.", deleteDone: "Deletion request submitted.",
    passwordHint: "At least 8 characters, with letters and numbers.", sessionMissing: "Your session has expired. Request a new link.",
    errors: {
      short: "This field is too short.", long: "This field is too long.", email: "Enter a valid email address.",
      required: "This field is required.", invalid_type: "This field is required.", consent: "You must agree to continue.",
      pw_short: "Use at least 8 characters.", pw_long: "Use at most 72 characters.", pw_weak: "Use both letters and numbers.",
      mismatch: "Passwords do not match.", phone_iq: "Use an Iraqi number like +9647XXXXXXXXX.",
      invalid_credentials: "Incorrect email or password.", email_not_confirmed: "Please confirm your email first. Check your inbox.",
      rate: "Too many attempts. Please wait a moment and try again.", server: "Something went wrong. Please try again.",
      email_registered: "This email is already registered. Sign in, or use “Forgot password” to reset it.",
      unavailable: "The service is temporarily unavailable. Please try again later.", weak_password: "This password is too weak or has been exposed in a data breach. Choose another.",
      duplicate: "A deletion request is already pending.", callback: "This link could not be completed (it may have expired, or it was opened in a different browser). If you already confirmed your email, just sign in below; otherwise request a new link.",
    },
  },
  ar: {
    loginTitle: "تسجيل الدخول", loginIntro: "مرحبًا بعودتك. سجّل الدخول للمتابعة.",
    registerTitle: "أنشئ حسابك", registerIntro: "اختر ما تحتاجه من NEXT. يمكنك تغيير رأيك لاحقًا.",
    forgotTitle: "نسيت كلمة المرور؟", forgotIntro: "أدخل بريدك الإلكتروني وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.",
    resetTitle: "تعيين كلمة مرور جديدة", resetIntro: "اختر كلمة مرور جديدة لحسابك.",
    email: "البريد الإلكتروني", password: "كلمة المرور", confirm: "تأكيد كلمة المرور", newPassword: "كلمة المرور الجديدة", fullName: "الاسم الكامل",
    phone: "رقم الهاتف (اختياري)", phoneHint: "رقم عراقي بالصيغة الدولية، مثال: ‎+9647XXXXXXXXX",
    purpose: "أريد أن", purposeCandidate: "أبحث عن وظيفة", purposeEmployer: "أوظّف لصالح شركة",
    terms: "أوافق على", termsLink: "شروط الخدمة", privacyLink: "سياسة الخصوصية",
    signIn: "تسجيل الدخول", signingIn: "جارٍ تسجيل الدخول…", register: "إنشاء حساب", registering: "جارٍ إنشاء الحساب…",
    send: "إرسال رابط الاستعادة", sending: "جارٍ الإرسال…", save: "حفظ", saving: "جارٍ الحفظ…",
    forgotLink: "نسيت كلمة المرور؟", noAccount: "ليس لديك حساب؟", haveAccount: "لديك حساب بالفعل؟", backToLogin: "العودة لتسجيل الدخول",
    checkEmailTitle: "تحقق من بريدك الإلكتروني", checkEmailBody: "إذا كان بالإمكان تسجيل هذا العنوان فقد أرسلنا رابط تأكيد. افتحه لتفعيل حسابك ثم سجّل الدخول.",
    resetSentTitle: "تحقق من بريدك الإلكتروني", resetSentBody: "إذا كان هناك حساب لهذا العنوان فإن رابط استعادة كلمة المرور في طريقه إليك.",
    resetDoneTitle: "تم تحديث كلمة المرور", resetDoneBody: "تم تغيير كلمة المرور. يمكنك المتابعة.",
    savedOk: "تم الحفظ.",
    accountTitle: "إعدادات الحساب", accountIntro: "أدِر بياناتك وحسابك.", profileTitle: "بياناتك", signOut: "تسجيل الخروج", language: "اللغة", role: "نوع الحساب",
    deleteTitle: "حذف حسابي", deleteIntro: "قدّم طلبًا لحذف حسابك وبياناتك الشخصية. سيعالجه مسؤول من NEXT.",
    deleteReason: "السبب (اختياري)", deleteConfirm: "أفهم أن هذا الطلب لحذف حسابي بشكل نهائي.",
    deleteSubmit: "طلب الحذف", deleteRequested: "يوجد طلب حذف قيد الانتظار. ستعالجه NEXT.", deleteDone: "تم تقديم طلب الحذف.",
    passwordHint: "8 أحرف على الأقل، مع أحرف وأرقام.", sessionMissing: "انتهت الجلسة. اطلب رابطًا جديدًا.",
    errors: {
      short: "هذا الحقل قصير جدًا.", long: "هذا الحقل طويل جدًا.", email: "أدخل بريدًا إلكترونيًا صحيحًا.",
      required: "هذا الحقل مطلوب.", invalid_type: "هذا الحقل مطلوب.", consent: "يجب الموافقة للمتابعة.",
      pw_short: "استخدم 8 أحرف على الأقل.", pw_long: "استخدم 72 حرفًا كحد أقصى.", pw_weak: "استخدم أحرفًا وأرقامًا معًا.",
      mismatch: "كلمتا المرور غير متطابقتين.", phone_iq: "استخدم رقمًا عراقيًا مثل ‎+9647XXXXXXXXX.",
      invalid_credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.", email_not_confirmed: "يرجى تأكيد بريدك الإلكتروني أولًا. تحقق من صندوق الوارد.",
      rate: "محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.", server: "حدث خطأ ما. حاول مرة أخرى.",
      email_registered: "هذا البريد مسجَّل مسبقًا. سجّل الدخول، أو استخدم «نسيت كلمة المرور» لاستعادتها.",
      unavailable: "الخدمة غير متاحة مؤقتًا. حاول لاحقًا.", weak_password: "كلمة المرور ضعيفة أو ظهرت في تسريب بيانات. اختر كلمة أخرى.",
      duplicate: "يوجد طلب حذف قيد الانتظار بالفعل.", callback: "تعذّر إكمال هذا الرابط (قد يكون منتهيًا أو فُتح في متصفح آخر). إذا كنت قد أكّدت بريدك فسجّل الدخول من هنا، وإلا فاطلب رابطًا جديدًا.",
    },
  },
};

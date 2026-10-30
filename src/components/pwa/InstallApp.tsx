"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const T = {
  ar: { install: "ثبّت التطبيق", iosHint: "لتثبيت التطبيق على الآيفون: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».", installed: "التطبيق مثبّت" },
  en: { install: "Install the app", iosHint: "To install on iPhone: tap Share, then “Add to Home Screen”.", installed: "App installed" },
} as const;

/** "Install the app" button. Android/desktop Chrome use the browser prompt; iPhone shows the manual steps. Hidden once installed. */
export function InstallApp({ locale }: { locale: "ar" | "en" }) {
  const L = T[locale];
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); };
    const onInstalled = () => { setEvt(null); setStandalone(true); };
    const t = window.setTimeout(() => {
      setStandalone(isStandalone);
      setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone);
    }, 0);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.clearTimeout(t); window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (standalone) return null;
  if (evt) {
    return (
      <button type="button" onClick={async () => { await evt.prompt(); await evt.userChoice.catch(() => null); setEvt(null); }}
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-hover">
        <Download className="size-4" aria-hidden />{L.install}
      </button>
    );
  }
  if (ios) {
    return <p className="flex max-w-xs items-start gap-2 text-xs text-muted"><Share className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />{L.iosHint}</p>;
  }
  return null;
}

"use client";

import { useState } from "react";
import { Globe, Headphones, RotateCcw, ShieldCheck, ArrowDownRight } from "lucide-react";

const features = [
  {
    title: "WORLDWIDE SHIPPING",
    subtitle: "We deliver all over all collect",
    icon: Globe,
  },
  {
    title: "24/7 ONLINE SUPPORT",
    subtitle: "Always ready to assist you",
    icon: Headphones,
  },
  {
    title: "FREE 30 DAYS RETURN",
    subtitle: "30 Days return policy",
    icon: RotateCcw,
  },
  {
    title: "SAFE CHECKOUT",
    subtitle: "Ensuring your safety",
    icon: ShieldCheck,
  },
];

const faqQuestions = [
  "Is a soft-shell helmet enough for tackle?",
  "Is a soft-shell helmet enough for tackle?",
  "Is a soft-shell helmet enough for tackle?",
  "Is a soft-shell helmet enough for tackle?",
];

const faqShortAnswer =
  "No. Soft-shells are for non-tackle use in most programs. Use hard-shell helmets for tackle practices and games.";

const faqLongAnswers = [
  "Choosing the right helmet matters for safety, comfort, and confidence. If you're comparing soft shell vs hard shell football helmet options for your program, this guide explains the real-world differences, when to use each type, and how to pick the best setup for practices, games, and VR.",
  "Choosing the right helmet matters for safety, comfort, and confidence. If you're comparing soft shell vs hard shell football helmet options for your program, this guide explains the real-world differences, when to use each type, and how to pick the best setup for practices, games, and VR.",
  "Choosing the right helmet matters for safety, comfort, and confidence. If you're comparing soft shell vs hard shell football helmet options for your program, this guide explains the real-world differences, when to use each type, and how to pick the best setup for practices, games, and VR.",
];

export function ShopFeaturesFaqSection() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <section className="mt-16 md:mt-20 px-1 md:px-2 mb-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 mb-8 md:mb-10">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3.5">
              <Icon className="w-6 h-6 mt-0.5 text-black" strokeWidth={1.8} />
              <div>
                <p className="text-[15px] md:text-[16px] font-bold text-black leading-none">
                  {item.title}
                </p>
                <p className="text-[13px] md:text-[14px] text-black/70 mt-1.5 leading-none">
                  {item.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {faqQuestions.map((question, idx) => (
          <div key={`${question}-${idx}`}>
            <button
              type="button"
              onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
              className="w-full min-h-[52px] border border-black/35 rounded-[3px] px-4 py-3 flex items-center justify-between bg-transparent"
            >
              <p className="text-[16px] md:text-[17px] text-black leading-none">{question}</p>
              <span className="w-7 h-7 bg-black rounded-[4px] flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-white" strokeWidth={2.5} />
              </span>
            </button>
            {openFaqIndex === idx && (
              <p className="text-[16px] md:text-[17px] text-black mt-1.5 leading-[1.4]">
                {faqShortAnswer}
              </p>
            )}
          </div>
        ))}

        {openFaqIndex !== null && (
          <div className="pt-4 space-y-4">
            {faqLongAnswers.map((answer, idx) => (
              <p key={`long-${idx}`} className="text-[16px] md:text-[17px] text-black leading-[1.4]">
                {answer}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

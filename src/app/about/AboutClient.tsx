"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Target,
  Zap,
  ShieldCheck,
  Users,
  Trophy,
  Rocket,
  ArrowRight,
  CheckCircle2,
  Cpu,
  History
} from "lucide-react";
import { LockerRoomSection } from "../home/components/LockerRoomSection";

const STATS = [
  { label: "Elite Squads", value: "500+", icon: <Users className="w-5 h-5" /> },
  { label: "Global Brands", value: "500+", icon: <ShieldCheck className="w-5 h-5" /> },
  { label: "Win Rate", value: "98%", icon: <Zap className="w-5 h-5" /> },
  { label: "Ops Support", value: "24/7", icon: <CheckCircle2 className="w-5 h-5" /> },
];

const VALUES = [
  {
    title: "Precision",
    desc: "Every stitch, every pixel, every strategy is executed with surgical accuracy to ensure peak performance.",
    icon: <Target className="w-8 h-8 text-[#FF5A2A]" />,
  },
  {
    title: "Quality",
    desc: "We use military-grade fabrics and advanced manufacturing to build gear that survives the toughest arenas.",
    icon: <ShieldCheck className="w-8 h-8 text-[#FF5A2A]" />,
  },
  {
    title: "Innovation",
    desc: "The game changes, and so do we. We leverage cutting-edge tech to keep our teams ahead of the curve.",
    icon: <Cpu className="w-8 h-8 text-[#FF5A2A]" />,
  },
];

const TIMELINE = [
  { year: "2018", title: "The Inception", desc: "Athletic Force 1 is born from a garage with a single mission: to revolutionize custom athletic gear." },
  { year: "2020", title: "The Expansion", desc: "We scaled our manufacturing capabilities and partnered with our first 100 professional squads." },
  { year: "2022", title: "The Evolution", desc: "Launched our tactical digital platform, bringing elite design tools to every coach and athlete." },
  { year: "2024", title: "The Dominance", desc: "Now the industry standard for premium, high-speed custom uniforms across all major sports." },
];

export default function AboutClient() {
  return (
    <main className="bg-white overflow-x-hidden">
      {/* --- Tactical Hero Section --- */}
      <section className="relative min-h-[85vh] flex items-center pt-24 pb-24 md:pb-32 overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/about/hero.png"
            alt="About AF1"
            className="w-full h-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        </div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-[#FF5A2A] font-black uppercase tracking-[0.5em] italic mb-6">Established 2018</p>
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white leading-[0.9] mb-8">
                About <br />
                <span className="text-transparent border-t border-b border-white/20 px-2 bg-clip-text bg-gradient-to-r from-white to-white/40">Athletic Force 1</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed mb-10 max-w-2xl italic">
                We don't just make uniforms. We forge identity. Athletic Force 1 was founded on the belief that every team deserves gear as elite as their ambition.
              </p>
              <div className="flex flex-wrap gap-5">
                <Link href="/shop" className="bg-[#FF5A2A] text-white px-10 py-5 rounded-2xl font-black uppercase italic tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#FF5A2A]/20 flex items-center gap-3">
                  Prepare Mission
                  <Rocket className="w-5 h-5" />
                </Link>
                <Link href="/blog" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-2xl font-black uppercase italic tracking-widest hover:bg-white/20 transition-all flex items-center gap-3">
                  Read Story
                  <History className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Mission Control Stats --- */}
      <section className="bg-white pt-32 pb-16 md:pt-40 md:pb-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-center group"
              >
                <div className="text-4xl md:text-6xl font-black text-slate-900 italic mb-2 tracking-tighter group-hover:text-[#FF5A2A] transition-colors">
                  {stat.value}
                </div>
                <div className="flex items-center justify-center gap-2 text-[#FF5A2A] text-[10px] font-black uppercase tracking-[0.2em] italic">
                  {stat.icon}
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Our Mission Section --- */}
      <section className="py-24 bg-[var(--color-page-background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-slate-900 mb-6">
              Our <span className="text-[#FF5A2A]">Mission</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium italic">
              Empowering athletes and teams with premium, custom-performance gear that combines state-of-the-art technology with bold, elite identity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUES.map((value, idx) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-12 rounded-[40px] border border-slate-100 shadow-xl shadow-black/[0.02] group hover:-translate-y-2 transition-all duration-500"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:bg-[#FF5A2A]/10 transition-colors">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-4">{value.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed italic">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Our Journey Timeline --- */}
      <section className="py-32 bg-black text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF5A2A]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">Our <span className="text-[#FF5A2A]">Journey</span></h2>
            <p className="text-slate-400 font-medium italic">From tactical beginnings to national dominance.</p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 hidden md:block" />

            <div className="space-y-24">
              {TIMELINE.map((item, idx) => (
                <div key={item.year} className={`flex flex-col md:flex-row items-center gap-12 ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                  <div className={`flex-1 text-center md:px-12 ${idx % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <motion.div
                      initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                    >
                      <div className="text-6xl font-black italic text-white/20 mb-4">{item.year}</div>
                      <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-[#FF5A2A] mb-4">{item.title}</h3>
                      <p className="text-slate-300 leading-relaxed font-medium italic">{item.desc}</p>
                    </motion.div>
                  </div>

                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 bg-black border-4 border-[#FF5A2A] rounded-full z-10 flex items-center justify-center shadow-[0_0_20px_rgba(255,90,42,0.4)]">
                      <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                    </div>
                  </div>

                  <div className="flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- Awards & Recognition --- */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-slate-900 mb-16">Awards & <span className="text-[#FF5A2A]">Recognition</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { title: "BEST DESIGN 2024", org: "Sports Apparel Excellence Awards" },
              { title: "TOP MANUFACTURER", org: "Athletic Industry Association" },
              { title: "CUSTOMER CHOICE", org: "Team Sports Review Magazine" },
              { title: "INNOVATION LEADER", org: "National Sports Business Awards" }
            ].map((award, i) => (
              <div key={i} className="group p-8 transition-all">
                <Trophy className="w-12 h-12 text-[#FF5A2A] mx-auto mb-6 transition-transform group-hover:scale-110" />
                <div className="text-[12px] font-black uppercase tracking-tighter text-slate-900 mb-2 italic">{award.title}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{award.org}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Latest Intelligence --- */}
      <section className="py-24 bg-[var(--color-page-background)] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LockerRoomSection />
        </div>
      </section>

      {/* --- Final CTA Section --- */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="bg-black rounded-[60px] p-8 md:p-20 text-center shadow-2xl shadow-black/20 overflow-hidden relative group">
            {/* Tactical Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF5A2A]/10 blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] translate-y-1/2 -translate-x-1/2" />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="relative z-10"
            >
              <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white mb-8 leading-[0.9]">
                Ready to Forge Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A2A] to-orange-400">Team's Identity?</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-400 font-bold italic mb-12 max-w-2xl mx-auto">
                Join the 500+ squads already dominating their arenas with Athletic Force 1 tactical gear.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <Link href="/request-order-form" className="bg-[#FF5A2A] text-white px-12 py-6 rounded-[24px] font-black uppercase italic tracking-widest text-lg hover:scale-105 transition-all shadow-xl shadow-[#FF5A2A]/20 flex items-center gap-4 group/btn">
                  Request Operational Brief
                  <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}

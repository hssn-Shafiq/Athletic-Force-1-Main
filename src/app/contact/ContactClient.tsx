"use client";

import { FormEvent, useState } from "react";
import { Mail, PhoneCall, MapPin, Clock3, Send, ShieldCheck, Headphones, Globe } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "react-toastify";

const contactCards = [
  {
    icon: Mail,
    title: "Email Support",
    value: "info@athleticforce1.com",
    note: "Typical reply in 2-6 hours",
  },
  {
    icon: PhoneCall,
    title: "Phone",
    value: "(+1) 707-741-5737",
    note: "Mon-Fri, 9:00 AM - 6:00 PM",
  },
  {
    icon: MapPin,
    title: "Head Office",
    value: "501 Champions Ave, Austin, TX",
    note: "Visits by appointment only",
  },
  {
    icon: Clock3,
    title: "Order Desk",
    value: "24/7 Inquiry Intake",
    note: "Team orders prioritized",
  },
];

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Secure Communication",
    text: "Your team and billing data are handled with strict privacy controls.",
  },
  {
    icon: Headphones,
    title: "Dedicated Specialists",
    text: "Work with real uniform specialists, not generic call center scripts.",
  },
  {
    icon: Globe,
    title: "Worldwide Fulfillment",
    text: "We coordinate custom team shipments across local and global destinations.",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    teamOrganization: "",
    projectDetails: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiClient.post("/api/contact-submissions", form);
      if (response.data.ok) {
        setIsSubmitted(true);
        toast.success(response.data.message || "Thank you for contacting us.");
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          teamOrganization: "",
          projectDetails: "",
        });
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "We could not send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-[var(--color-page-background)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <section className="relative rounded-[34px] overflow-hidden border border-black/10 bg-heading text-white p-8 md:p-12">
          <div className="absolute inset-0 opacity-25" style={{
            backgroundImage:
              "radial-gradient(circle at 20% 25%, rgba(239,68,68,0.5), transparent 35%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.22), transparent 35%)",
          }} />

          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
            <div className="lg:col-span-2">
              <p className="inline-flex rounded-full border border-white/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
                Contact Athletic Force 1
              </p>
              <h1 className="mt-4 text-4xl md:text-6xl font-black tracking-tight leading-[0.95]">
                Let&apos;s Build Your Next Championship Kit
              </h1>
              <p className="mt-4 text-sm md:text-lg text-white/80 max-w-2xl leading-relaxed">
                From custom team uniforms to high-performance accessories, our specialists help you choose, design, and deliver gear that performs under pressure.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/20 p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-white/75">Priority Team Desk</p>
              <p className="text-2xl font-black mt-1">(+1) 707-741-5737</p>
              <p className="text-xs text-white/75 mt-2">Fast track support for coaches and bulk orders.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {contactCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="w-11 h-11 rounded-xl bg-heading text-white flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="mt-4 text-xs uppercase tracking-wider text-black/50">{card.title}</p>
                <p className="mt-1 text-lg font-bold text-heading leading-tight">{card.value}</p>
                <p className="mt-2 text-sm text-black/60">{card.note}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-8 grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 rounded-[28px] border border-black/10 bg-white p-6 md:p-8">
            <h2 className="text-2xl md:text-4xl font-black text-heading tracking-tight">Send Us A Message</h2>
            <p className="text-sm text-black/65 mt-2">
              Share your team details, timeline, and what you want to build. We will follow up with a tailored plan.
            </p>

            {isSubmitted ? (
              <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/5 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-2xl font-black text-heading">Thank you for reaching out!</h3>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-black/65">
                  Your message has been received. Our team will review your request and get back to you soon.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="mt-6 inline-flex h-11 items-center rounded-xl bg-heading px-5 text-sm font-bold text-white transition-colors hover:bg-accent"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-black/55">First Name</span>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  required
                  placeholder="Jordan"
                  className="mt-1 h-12 w-full rounded-xl border border-black/15 px-4 text-sm text-heading outline-none focus:border-accent"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wider text-black/55">Last Name</span>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  required
                  placeholder="Miles"
                  className="mt-1 h-12 w-full rounded-xl border border-black/15 px-4 text-sm text-heading outline-none focus:border-accent"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wider text-black/55">Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  required
                  placeholder="coach@team.com"
                  className="mt-1 h-12 w-full rounded-xl border border-black/15 px-4 text-sm text-heading outline-none focus:border-accent"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wider text-black/55">Phone</span>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  required
                  placeholder="+1 (000) 000-0000"
                  className="mt-1 h-12 w-full rounded-xl border border-black/15 px-4 text-sm text-heading outline-none focus:border-accent"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-wider text-black/55">Team / Organization</span>
                <input
                  type="text"
                  name="teamOrganization"
                  value={form.teamOrganization}
                  onChange={(event) => updateField("teamOrganization", event.target.value)}
                  placeholder="Austin Warriors Football"
                  className="mt-1 h-12 w-full rounded-xl border border-black/15 px-4 text-sm text-heading outline-none focus:border-accent"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-wider text-black/55">Project Details</span>
                <textarea
                  name="projectDetails"
                  value={form.projectDetails}
                  onChange={(event) => updateField("projectDetails", event.target.value)}
                  required
                  placeholder="Tell us about roster size, style goals, sport, and timeline."
                  rows={6}
                  className="mt-1 w-full rounded-xl border border-black/15 px-4 py-3 text-sm text-heading outline-none focus:border-accent resize-y"
                />
              </label>

              <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <p className="text-xs text-black/55 max-w-md">
                  By sending this form, you agree to our communication policy regarding follow-up quotes and project updates.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-heading text-white text-sm font-bold hover:bg-accent transition-colors"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
            )}
          </div>

          <aside className="xl:col-span-5 space-y-6">
            <div className="rounded-[28px] border border-black/10 bg-white p-6 md:p-8">
              <h3 className="text-2xl md:text-3xl font-black text-heading tracking-tight">Why Teams Choose Us</h3>
              <div className="mt-5 space-y-4">
                {trustPoints.map((point) => {
                  const Icon = point.icon;
                  return (
                    <div key={point.title} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-heading">{point.title}</p>
                        <p className="text-sm text-black/65 mt-1 leading-relaxed">{point.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-white p-2">
              <div className="rounded-[22px] bg-gradient-to-br from-zinc-100 to-zinc-200 min-h-[260px] flex items-center justify-center text-center px-6">
                <div>
                  <p className="text-sm text-black/60 uppercase tracking-wider">Visit Us</p>
                  <p className="mt-2 text-2xl font-black text-heading tracking-tight">Athletic Force 1 HQ</p>
                  <p className="mt-2 text-sm text-black/65">501 Champions Ave, Austin, TX</p>
                  <p className="mt-1 text-sm text-black/65">Mon - Fri | 9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

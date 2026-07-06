import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Shield, ShieldCheck, Zap, Users, MapPin, Bell, Star, CheckCircle2, Menu, X } from "lucide-react";

export default function Landing() {
  const [nav, setNav] = useState(false);
  const links = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#testimonials", label: "Reviews" },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand-50/40 to-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="font-extrabold text-lg sm:text-xl text-brand-700 inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white">
              <ShieldCheck size={20} />
            </div>
            HireHelper
          </Link>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            {links.map((l) => <a key={l.href} href={l.href} className="hover:text-brand-700">{l.label}</a>)}
            <Link to="/admin/login" className="hover:text-brand-700">Admin</Link>
          </nav>
          <div className="hidden sm:flex items-center gap-2">
            <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link to="/signup" className="btn-primary text-sm">Get started</Link>
          </div>
          <button
            onClick={() => setNav((v) => !v)}
            className="sm:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Toggle menu"
          >{nav ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {nav && (
          <div className="sm:hidden border-t border-slate-100 bg-white/95 backdrop-blur">
            <div className="px-4 py-3 flex flex-col gap-1 text-sm font-medium">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setNav(false)}
                  className="py-2 px-2 rounded-lg text-slate-700 hover:bg-slate-100">{l.label}</a>
              ))}
              <Link to="/admin/login" onClick={() => setNav(false)}
                className="py-2 px-2 rounded-lg text-slate-700 hover:bg-slate-100">Admin</Link>
              <div className="flex gap-2 mt-2">
                <Link to="/login" onClick={() => setNav(false)} className="btn-ghost text-sm flex-1 justify-center">Sign in</Link>
                <Link to="/signup" onClick={() => setNav(false)} className="btn-primary text-sm flex-1 justify-center">Get started</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand-700/10 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 pt-16 lg:pt-24 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
              <Sparkles size={14} /> On-demand help, in minutes
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
              Post a task. <span className="text-brand-600">Hire</span> a helper.<br /> Get it done today.
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl">
              HireHelper connects you with trusted people nearby for any errand, gig, or chore — moving boxes, picking up groceries, fixing a leak, you name it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="btn-primary">Post your first task <ArrowRight size={18} /></Link>
              <a href="#how" className="btn-ghost">See how it works</a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
              <div className="flex -space-x-2">
                {["A","B","C","D"].map((c,i)=>(
                  <div key={i} className="h-9 w-9 rounded-full bg-brand-100 border-2 border-white grid place-items-center text-brand-700 font-bold text-xs">{c}</div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-500">{[...Array(5)].map((_,i)=><Star key={i} size={14} fill="currentColor" />)}</div>
                <div>Trusted by <b>10,000+</b> users</div>
              </div>
            </div>
          </div>

          {/* Hero card */}
          <div className="relative">
            <div className="card p-6 lg:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold">JS</div>
                  <div>
                    <div className="font-semibold">Jess S.</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> 0.6 mi away</div>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full font-semibold">Open</span>
              </div>
              <h3 className="mt-4 font-bold text-lg">Help me assemble an IKEA wardrobe</h3>
              <p className="text-sm text-slate-600 mt-1">Need someone handy for ~2 hours this Saturday afternoon. Tools provided.</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-slate-500">Today · 2:00 PM</span>
                <button className="btn-primary text-sm py-2">Request task</button>
              </div>
            </div>
            <div className="card p-4 absolute -bottom-6 -left-6 w-56 hidden md:block">
              <div className="flex items-center gap-2 text-brand-700"><Bell size={16}/><span className="text-sm font-semibold">New request</span></div>
              <p className="text-xs text-slate-600 mt-1">Mike wants to help with “Grocery pickup”.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold">Everything you need to get help, fast</h2>
          <p className="mt-3 text-slate-600">From posting to payment — HireHelper makes the whole loop effortless.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { i: Zap,   t: "Lightning fast",     d: "Post in 30 seconds. Get matched with helpers nearby in minutes." },
            { i: Shield,t: "Verified & secure",  d: "Email OTP verification and JWT-secured sessions keep accounts safe." },
            { i: Users, t: "Trusted community",  d: "Real reviews and ratings — pick the right helper with confidence." },
            { i: MapPin,t: "Location-aware",     d: "See tasks near you on a clean, minimal feed." },
            { i: Bell,  t: "Real-time alerts",   d: "Instant in-app notifications when someone requests your task." },
            { i: Sparkles,t:"Beautiful UX",      d: "Responsive design that just works on mobile, tablet, and desktop." },
          ].map((f,i)=>(
            <div key={i} className="card p-6 hover:-translate-y-1 transition">
              <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-700 grid place-items-center"><f.i size={20}/></div>
              <h3 className="mt-4 font-bold text-lg">{f.t}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="bg-brand-900 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-20">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center">How HireHelper works</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              { n:"01", t:"Sign up & verify", d:"Create your account and confirm with email OTP." },
              { n:"02", t:"Post or browse",   d:"Post a task or browse the feed for jobs near you." },
              { n:"03", t:"Get it done",      d:"Accept requests, chat, complete the task, repeat." },
            ].map((s)=>(
              <div key={s.n} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
                <div className="text-brand-500 font-extrabold text-3xl">{s.n}</div>
                <h3 className="mt-3 font-bold text-lg">{s.t}</h3>
                <p className="mt-1 text-white/70 text-sm">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="max-w-7xl mx-auto px-4 lg:px-8 py-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">Loved by the community</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { n:"Priya R.", q:"Found someone to help me move within an hour. Insane." },
            { n:"Daniel K.",q:"Finally a platform that doesn’t feel sketchy. UI is gorgeous." },
            { n:"Amelia T.",q:"I help neighbors on weekends — it’s become my favorite side hustle." },
          ].map((t,i)=>(
            <div key={i} className="card p-6">
              <div className="flex items-center gap-1 text-amber-500">{[...Array(5)].map((_,i)=><Star key={i} size={14} fill="currentColor"/>)}</div>
              <p className="mt-3 text-slate-700">“{t.q}”</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold">{t.n[0]}</div>
                <div className="text-sm font-semibold">{t.n}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 lg:px-8 pb-24">
        <div className="rounded-3xl bg-gradient-to-tr from-brand-600 to-brand-500 p-10 lg:p-14 text-white shadow-soft text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold">Ready to get things done?</h2>
          <p className="mt-3 text-white/90">Join thousands using HireHelper today. It’s free to sign up.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/signup" className="btn bg-white text-brand-700 hover:bg-slate-100">Create account</Link>
            <Link to="/login" className="btn border border-white/40 text-white hover:bg-white/10">Sign in</Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-white/90">
            <span className="flex items-center gap-1"><CheckCircle2 size={16}/> Free forever plan</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={16}/> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={16}/> Cancel anytime</span>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} HireHelper. Built with ❤️ for the community.
      </footer>
    </div>
  );
}

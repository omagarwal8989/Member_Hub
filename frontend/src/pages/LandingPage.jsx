// import { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import axios from "axios";
// import {
//   Dumbbell,
//   Star,
//   ArrowRight,
//   Users,
//   Award,
//   Clock,
//   ShieldCheck,
// } from "lucide-react";
// import { API_BASE_URL } from "../config.js";

// // Picks an icon based on keywords in a plan's name — same logic used on
// // the certificate template server-side, so a "Gym + Yoga" plan looks
// // visually consistent whether you're looking at the landing page or a
// // generated certificate.
// function getPlanIcon(name = "") {
//   const lower = name.toLowerCase();
//   if (lower.includes("personal") || lower.includes("trainer")) return Star;
//   if (lower.includes("yoga")) {
//     return (props) => (
//       <svg
//         {...props}
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//       >
//         <path d="M12 4a2 2 0 100 4 2 2 0 000-4z" />
//         <path d="M5 20c1-4 4-6 7-6s6 2 7 6" />
//         <path d="M8 13l-3 3M16 13l3 3" />
//       </svg>
//     );
//   }
//   if (lower.includes("gym")) return Dumbbell;
//   return Clock;
// }

// // Fallback shown only if the live /api/public/tiers fetch fails or hasn't
// // loaded yet — keeps the section from appearing empty. Replaced by real
// // plan data (including admin-written descriptions) as soon as it arrives.
// const FALLBACK_PROGRAMS = [
//   {
//     id: "fallback-p1",
//     name: "Gym Access",
//     description:
//       "Full run of the weight floor, cardio machines, and open training area — any time we're open.",
//   },
//   {
//     id: "fallback-p2",
//     name: "Gym + Yoga",
//     description:
//       "Everything in Gym Access, plus unlimited spots in our yoga and mobility classes throughout the week.",
//   },
//   {
//     id: "fallback-p3",
//     name: "Gym + Personal Training",
//     description:
//       "One-on-one coaching with a certified trainer, built around your goals — strength, fat loss, or sport-specific.",
//   },
//   {
//     id: "fallback-p4",
//     name: "At-Home Yoga",
//     description:
//       "Live and recorded yoga sessions you can follow from home, for members who want flexibility over a commute.",
//   },
// ];

// // Fallback shown only if the live /api/public/tiers fetch fails or hasn't
// // loaded yet — keeps the page from showing an empty section. These are
// // replaced by real tier data from the database as soon as it arrives.
// const FALLBACK_PLANS = [
//   { id: "fallback-1", name: "Gym Only", price: 1500, durationDays: 30 },
//   { id: "fallback-2", name: "Gym + Yoga", price: 2200, durationDays: 30 },
//   {
//     id: "fallback-3",
//     name: "Gym + Personal Training",
//     price: 4500,
//     durationDays: 30,
//   },
//   { id: "fallback-4", name: "At-Home Yoga", price: 1000, durationDays: 30 },
// ];

// const TESTIMONIALS = [
//   {
//     name: "Priya Sharma",
//     program: "Gym + Personal Training",
//     quote:
//       "Six months in and I've hit strength numbers I didn't think were possible. My trainer actually adjusts the plan every week based on how I'm recovering.",
//   },
//   {
//     name: "Arjun Mehta",
//     program: "Gym + Yoga",
//     quote:
//       "The yoga classes fixed a shoulder problem I'd been ignoring for years. Front desk always remembers my name, which sounds small but it matters.",
//   },
//   {
//     name: "Kavita Rao",
//     program: "At-Home Yoga",
//     quote:
//       "I travel a lot for work, so the at-home sessions are the only reason I've stayed consistent. Renewal reminders mean I never lose my streak by accident.",
//   },
// ];

// export default function LandingPage() {
//   const [plans, setPlans] = useState(FALLBACK_PLANS);
//   const [programs, setPrograms] = useState(FALLBACK_PROGRAMS);

//   useEffect(() => {
//     const fetchTiers = async () => {
//       try {
//         const res = await axios.get(`${API_BASE_URL}/api/public/tiers`);
//         if (res.data.length > 0) {
//           setPlans(res.data);
//           setPrograms(res.data);
//         }
//       } catch {
//         // Falls back to FALLBACK_PLANS / FALLBACK_PROGRAMS, already set as
//         // initial state — the page still looks complete even if the
//         // backend is briefly unreachable.
//       }
//     };
//     fetchTiers();
//   }, []);

//   // Admin-controlled via Settings → falls back to the old position-based
//   // guess only if no plan has been marked popular yet (e.g. fresh install).
//   const foundIndex = plans.findIndex((p) => p.isPopular);
//   const popularIndex =
//     foundIndex !== -1 ? foundIndex : plans.length > 2 ? 1 : 0;

//   return (
//     <div className="min-h-screen bg-black text-white">
//       {/* Utility bar */}
//       <div className="bg-neutral-950 border-b border-neutral-800">
//         <div className="max-w-6xl mx-auto px-6 h-10 flex items-center justify-between text-xs text-neutral-400">
//           <span className="flex items-center gap-2">
//             <Clock size={13} /> Open Mon–Sat, 6:00 AM – 10:00 PM
//           </span>
//           <div className="flex items-center gap-4">
//             <Link
//               to="/login/member"
//               className="hover:text-white transition-colors"
//             >
//               Member Login
//             </Link>
//             <span className="text-neutral-700">|</span>
//             <Link
//               to="/login/admin"
//               className="hover:text-white transition-colors"
//             >
//               Staff Login
//             </Link>
//             <span className="text-neutral-700">|</span>
//             <Link to="/verify" className="hover:text-white transition-colors">
//               Verify Certificate
//             </Link>
//           </div>
//         </div>
//       </div>

//       {/* Main nav */}
//       <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-sm border-b border-neutral-800">
//         <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center">
//               <Dumbbell className="text-white" size={20} />
//             </div>
//             <span
//               className="text-2xl tracking-wide"
//               style={{ fontFamily: "'Anton', sans-serif" }}
//             >
//               MEMBERHUB FITNESS
//             </span>
//           </div>

//           <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-neutral-300">
//             <a href="#programs" className="hover:text-white transition-colors">
//               Programs
//             </a>
//             <a href="#plans" className="hover:text-white transition-colors">
//               Membership
//             </a>
//             <a
//               href="#testimonials"
//               className="hover:text-white transition-colors"
//             >
//               Testimonials
//             </a>
//             <a href="#contact" className="hover:text-white transition-colors">
//               Contact
//             </a>
//           </nav>

//           <Link
//             to="/login/member"
//             className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-6 py-3 rounded transition-colors tracking-wide"
//           >
//             JOIN NOW
//           </Link>
//         </div>
//       </header>

//       {/* Hero */}
//       <section className="relative overflow-hidden border-b border-neutral-800">
//         {/* Decorative geometric background — no external photo dependency */}
//         <div className="absolute inset-0">
//           <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-red-600/20 rounded-full blur-3xl" />
//           <div className="absolute -left-20 bottom-0 w-[400px] h-[400px] bg-red-600/10 rounded-full blur-3xl" />
//           <div
//             className="absolute inset-0 opacity-[0.04]"
//             style={{
//               backgroundImage:
//                 "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 40px)",
//             }}
//           />
//         </div>

//         <div className="relative max-w-6xl mx-auto px-6 py-28 md:py-36 text-center">
//           <p className="text-red-500 font-semibold tracking-[0.3em] text-sm mb-4">
//             GYM · YOGA · PERSONAL TRAINING
//           </p>
//           <h1
//             className="text-5xl md:text-7xl leading-[1.02] tracking-wide max-w-4xl mx-auto"
//             style={{ fontFamily: "'Anton', sans-serif" }}
//           >
//             TRANSFORM YOUR BODY.
//             <br />
//             <span className="text-red-500">TRANSFORM YOUR LIFE.</span>
//           </h1>
//           <p className="mt-6 text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed">
//             Real coaching, real accountability, and a membership system that
//             never lets a renewal slip through the cracks.
//           </p>
//           <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
//             <Link
//               to="/login/member"
//               className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded font-semibold tracking-wide transition-colors"
//             >
//               START YOUR MEMBERSHIP <ArrowRight size={18} />
//             </Link>
//             <a
//               href="#plans"
//               className="inline-flex items-center gap-2 border border-neutral-700 hover:border-white text-white px-8 py-4 rounded font-semibold tracking-wide transition-colors"
//             >
//               VIEW MEMBERSHIP PLANS
//             </a>
//           </div>
//         </div>
//       </section>

//       {/* Stats */}
//       <section className="border-b border-neutral-800 bg-neutral-950">
//         <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
//           {[
//             { label: "Active Members", value: "500+" },
//             { label: "Programs", value: String(programs.length) },
//             { label: "Certified Trainers", value: "100%" },
//             { label: "Years Coaching", value: "15+" },
//           ].map((stat) => (
//             <div key={stat.label}>
//               <p
//                 className="text-3xl md:text-4xl text-red-500"
//                 style={{ fontFamily: "'Anton', sans-serif" }}
//               >
//                 {stat.value}
//               </p>
//               <p className="text-xs text-neutral-400 mt-1 tracking-wide uppercase">
//                 {stat.label}
//               </p>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* Programs */}
//       <section id="programs" className="max-w-6xl mx-auto px-6 py-24">
//         <p className="text-red-500 font-semibold tracking-[0.3em] text-sm text-center mb-3">
//           WHAT WE OFFER
//         </p>
//         <h2
//           className="text-4xl md:text-5xl text-center tracking-wide"
//           style={{ fontFamily: "'Anton', sans-serif" }}
//         >
//           PROGRAMS BUILT AROUND YOU
//         </h2>

//         <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
//           {programs.map((program) => {
//             const Icon = getPlanIcon(program.name);
//             return (
//               <div
//                 key={program.id}
//                 className="bg-neutral-950 border border-neutral-800 hover:border-red-600/50 rounded-xl p-6 transition-colors"
//               >
//                 <div className="w-12 h-12 rounded-lg bg-red-600/10 flex items-center justify-center mb-5">
//                   <Icon className="text-red-500" size={22} />
//                 </div>
//                 <h3 className="font-semibold text-white mb-2">
//                   {program.name}
//                 </h3>
//                 <p className="text-sm text-neutral-400 leading-relaxed">
//                   {program.description ||
//                     "Ask us about this plan at the front desk."}
//                 </p>
//               </div>
//             );
//           })}
//         </div>
//       </section>

//       {/* Membership Plans */}
//       <section
//         id="plans"
//         className="bg-neutral-950 border-y border-neutral-800"
//       >
//         <div className="max-w-6xl mx-auto px-6 py-24">
//           <p className="text-red-500 font-semibold tracking-[0.3em] text-sm text-center mb-3">
//             MEMBERSHIP
//           </p>
//           <h2
//             className="text-4xl md:text-5xl text-center tracking-wide"
//             style={{ fontFamily: "'Anton', sans-serif" }}
//           >
//             CHOOSE YOUR PLAN
//           </h2>

//           <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
//             {plans.map((plan, i) => {
//               const isPopular = i === popularIndex;
//               return (
//                 <div
//                   key={plan.id || plan.name}
//                   className={`relative rounded-xl p-6 border flex flex-col ${
//                     isPopular
//                       ? "bg-red-600 border-red-600"
//                       : "bg-black border-neutral-800"
//                   }`}
//                 >
//                   {isPopular && (
//                     <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-red-600 text-xs font-bold px-3 py-1 rounded-full">
//                       MOST POPULAR
//                     </span>
//                   )}
//                   <h3 className="font-semibold mb-3 text-white">{plan.name}</h3>
//                   <p className="mb-6">
//                     <span
//                       className="text-3xl"
//                       style={{ fontFamily: "'Anton', sans-serif" }}
//                     >
//                       ₹{plan.price.toLocaleString("en-IN")}
//                     </span>
//                     <span
//                       className={
//                         isPopular ? "text-red-100" : "text-neutral-400"
//                       }
//                     >
//                       {" "}
//                       / {plan.durationDays} days
//                     </span>
//                   </p>
//                   <Link
//                     to="/login/member"
//                     className={`mt-auto text-center py-2.5 rounded font-medium text-sm transition-colors ${
//                       isPopular
//                         ? "bg-white text-red-600 hover:bg-red-50"
//                         : "bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-700"
//                     }`}
//                   >
//                     Get Started
//                   </Link>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </section>

//       {/* Testimonials */}
//       <section id="testimonials" className="max-w-6xl mx-auto px-6 py-24">
//         <p className="text-red-500 font-semibold tracking-[0.3em] text-sm text-center mb-3">
//           MEMBER STORIES
//         </p>
//         <h2
//           className="text-4xl md:text-5xl text-center tracking-wide"
//           style={{ fontFamily: "'Anton', sans-serif" }}
//         >
//           RESULTS, NOT EXCUSES
//         </h2>

//         <div className="mt-14 grid md:grid-cols-3 gap-6">
//           {TESTIMONIALS.map((t) => (
//             <div
//               key={t.name}
//               className="bg-neutral-950 border border-neutral-800 rounded-xl p-6"
//             >
//               <div className="flex gap-1 text-red-500 mb-4">
//                 {Array.from({ length: 5 }).map((_, i) => (
//                   <Star key={i} size={14} fill="currentColor" />
//                 ))}
//               </div>
//               <p className="text-sm text-neutral-300 leading-relaxed mb-5">
//                 "{t.quote}"
//               </p>
//               <p className="text-sm font-semibold text-white">{t.name}</p>
//               <p className="text-xs text-neutral-500">{t.program}</p>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* CTA band */}
//       <section className="bg-red-600">
//         <div className="max-w-4xl mx-auto px-6 py-16 text-center">
//           <h2
//             className="text-3xl md:text-4xl tracking-wide mb-4"
//             style={{ fontFamily: "'Anton', sans-serif" }}
//           >
//             READY TO START?
//           </h2>
//           <p className="text-red-100 mb-8 max-w-md mx-auto">
//             Your first session is the hardest one to show up for. We'll take it
//             from there.
//           </p>
//           <Link
//             to="/login/member"
//             className="inline-flex items-center gap-2 bg-black hover:bg-neutral-900 text-white px-8 py-4 rounded font-semibold tracking-wide transition-colors"
//           >
//             JOIN NOW <ArrowRight size={18} />
//           </Link>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer id="contact" className="bg-black border-t border-neutral-800">
//         <div className="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
//           <div>
//             <div className="flex items-center gap-2.5 mb-4">
//               <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
//                 <Dumbbell className="text-white" size={16} />
//               </div>
//               <span
//                 className="text-lg tracking-wide"
//                 style={{ fontFamily: "'Anton', sans-serif" }}
//               >
//                 MEMBERHUB FITNESS
//               </span>
//             </div>
//             <p className="text-sm text-neutral-500 leading-relaxed">
//               123 MG Road, Bareilly, Uttar Pradesh
//               <br />
//               Open Mon–Sat, 6:00 AM – 10:00 PM
//             </p>
//           </div>

//           <div>
//             <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">
//               QUICK LINKS
//             </h4>
//             <ul className="space-y-2 text-sm text-neutral-400">
//               <li>
//                 <a
//                   href="#programs"
//                   className="hover:text-white transition-colors"
//                 >
//                   Programs
//                 </a>
//               </li>
//               <li>
//                 <a href="#plans" className="hover:text-white transition-colors">
//                   Membership Plans
//                 </a>
//               </li>
//               <li>
//                 <a
//                   href="#testimonials"
//                   className="hover:text-white transition-colors"
//                 >
//                   Testimonials
//                 </a>
//               </li>
//             </ul>
//           </div>

//           <div>
//             <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">
//               MEMBER ACCESS
//             </h4>
//             <ul className="space-y-2 text-sm text-neutral-400">
//               <li>
//                 <Link
//                   to="/login/member"
//                   className="hover:text-white transition-colors"
//                 >
//                   Member Login / Join Now
//                 </Link>
//               </li>
//               <li>
//                 <Link
//                   to="/login/admin"
//                   className="hover:text-white transition-colors"
//                 >
//                   Staff Login
//                 </Link>
//               </li>
//               <li>
//                 <Link
//                   to="/verify"
//                   className="hover:text-white transition-colors"
//                 >
//                   Verify Certificate
//                 </Link>
//               </li>
//             </ul>
//           </div>
//         </div>

//         <div className="border-t border-neutral-900">
//           <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
//             <span>
//               © {new Date().getFullYear()} MemberHub Fitness. All rights
//               reserved.
//             </span>
//             <span className="flex items-center gap-1.5">
//               <ShieldCheck size={13} /> Secure member data, powered by MemberHub
//             </span>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }
















import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Dumbbell,
  Star,
  ArrowRight,
  Users,
  Award,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { API_BASE_URL } from "../config.js";

function getPlanIcon(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("personal") || lower.includes("trainer")) return Star;
  if (lower.includes("yoga")) {
    return (props) => (
      <svg
        {...props}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 4a2 2 0 100 4 2 2 0 000-4z" />
        <path d="M5 20c1-4 4-6 7-6s6 2 7 6" />
        <path d="M8 13l-3 3M16 13l3 3" />
      </svg>
    );
  }
  if (lower.includes("gym")) return Dumbbell;
  return Clock;
}

const FALLBACK_PROGRAMS = [
  {
    id: "fallback-p1",
    name: "Gym Access",
    description:
      "Full run of the weight floor, cardio machines, and open training area — any time we're open.",
  },
  {
    id: "fallback-p2",
    name: "Gym + Yoga",
    description:
      "Everything in Gym Access, plus unlimited spots in our yoga and mobility classes throughout the week.",
  },
  {
    id: "fallback-p3",
    name: "Gym + Personal Training",
    description:
      "One-on-one coaching with a certified trainer, built around your goals — strength, fat loss, or sport-specific.",
  },
  {
    id: "fallback-p4",
    name: "At-Home Yoga",
    description:
      "Live and recorded yoga sessions you can follow from home, for members who want flexibility over a commute.",
  },
];

const FALLBACK_PLANS = [
  { id: "fallback-1", name: "Gym Only", price: 1500, durationDays: 30 },
  { id: "fallback-2", name: "Gym + Yoga", price: 2200, durationDays: 30 },
  {
    id: "fallback-3",
    name: "Gym + Personal Training",
    price: 4500,
    durationDays: 30,
  },
  { id: "fallback-4", name: "At-Home Yoga", price: 1000, durationDays: 30 },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    program: "Gym + Personal Training",
    quote:
      "Six months in and I've hit strength numbers I didn't think were possible. My trainer actually adjusts the plan every week based on how I'm recovering.",
  },
  {
    name: "Arjun Mehta",
    program: "Gym + Yoga",
    quote:
      "The yoga classes fixed a shoulder problem I'd been ignoring for years. Front desk always remembers my name, which sounds small but it matters.",
  },
  {
    name: "Kavita Rao",
    program: "At-Home Yoga",
    quote:
      "I travel a lot for work, so the at-home sessions are the only reason I've stayed consistent. Renewal reminders mean I never lose my streak by accident.",
  },
];

const GALLERY_IMAGES = [
  { src: "/images/photo_1.avif", alt: "Dumbbell rack and open training floor" },
  { src: "/images/istockphoto_6.jpg", alt: "Member training with dumbbells" },
  { src: "/images/photo_2.avif", alt: "Close-up of a barbell deadlift" },
];

export default function LandingPage() {
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [programs, setPrograms] = useState(FALLBACK_PROGRAMS);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/public/tiers`);
        if (res.data.length > 0) {
          setPlans(res.data);
          setPrograms(res.data);
        }
      } catch {
        // Falls back to FALLBACK_PLANS / FALLBACK_PROGRAMS
      }
    };
    fetchTiers();
  }, []);

  const foundIndex = plans.findIndex((p) => p.isPopular);
  const popularIndex =
    foundIndex !== -1 ? foundIndex : plans.length > 2 ? 1 : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Utility bar */}
      <div className="bg-neutral-950 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 h-10 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-2">
            <Clock size={13} /> Open Mon–Sat, 6:00 AM – 10:00 PM
          </span>
          <div className="flex items-center gap-4">
            <Link
              to="/login/member"
              className="hover:text-white transition-colors"
            >
              Member Login
            </Link>
            <span className="text-neutral-700">|</span>
            <Link
              to="/login/admin"
              className="hover:text-white transition-colors"
            >
              Staff Login
            </Link>
            <span className="text-neutral-700">|</span>
            <Link to="/verify" className="hover:text-white transition-colors">
              Verify Certificate
            </Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center">
              <Dumbbell className="text-white" size={20} />
            </div>
            <span
              className="text-2xl tracking-wide"
              style={{ fontFamily: "'Anton', sans-serif" }}
            >
              MEMBERHUB FITNESS
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-neutral-300">
            <a href="#programs" className="hover:text-white transition-colors">
              Programs
            </a>
            <a href="#plans" className="hover:text-white transition-colors">
              Membership
            </a>
            <a href="#gallery" className="hover:text-white transition-colors">
              Our Gym
            </a>
            <a
              href="#testimonials"
              className="hover:text-white transition-colors"
            >
              Testimonials
            </a>
            <a href="#contact" className="hover:text-white transition-colors">
              Contact
            </a>
          </nav>

          <Link
            to="/login/member"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-6 py-3 rounded transition-colors tracking-wide"
          >
            JOIN NOW
          </Link>
        </div>
      </header>

      {/* Hero — now with a real photo background */}
      {/* <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0">
          <img
            src="/images/photo_3.avif"
            alt="Athlete preparing for a deadlift in a dark gym"
            className="w-full h-full object-cover grayscale-[15%]"
          /> */}
      {/* Dark gradient overlay — keeps hero text readable over any photo,
              and unifies this photo's tone with the rest of the red/black palette */}
      {/* <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70" />
        </div> */}

      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0">
          <img
            src="/images/photo_3.avif"
            alt="Athlete preparing for a deadlift in a dark gym"
            className="w-full h-full object-cover brightness-140 contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-28 md:py-36 text-center">
          <p className="text-red-500 font-semibold tracking-[0.3em] text-sm mb-4">
            GYM · YOGA · PERSONAL TRAINING
          </p>
          <h1
            className="text-5xl md:text-7xl leading-[1.02] tracking-wide max-w-4xl mx-auto"
            style={{ fontFamily: "'Anton', sans-serif" }}
          >
            TRANSFORM YOUR BODY.
            <br />
            <span className="text-red-500">TRANSFORM YOUR LIFE.</span>
          </h1>
          <p className="mt-6 text-lg text-neutral-300 max-w-xl mx-auto leading-relaxed">
            Real coaching, real accountability, and a membership system that
            never lets a renewal slip through the cracks.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login/member"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded font-semibold tracking-wide transition-colors"
            >
              START YOUR MEMBERSHIP <ArrowRight size={18} />
            </Link>
            <a
              href="#plans"
              className="inline-flex items-center gap-2 border border-neutral-700 hover:border-white text-white px-8 py-4 rounded font-semibold tracking-wide transition-colors"
            >
              VIEW MEMBERSHIP PLANS
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-neutral-800 bg-neutral-950">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Active Members", value: "500+" },
            { label: "Programs", value: String(programs.length) },
            { label: "Certified Trainers", value: "100%" },
            { label: "Years Coaching", value: "15+" },
          ].map((stat) => (
            <div key={stat.label}>
              <p
                className="text-3xl md:text-4xl text-red-500"
                style={{ fontFamily: "'Anton', sans-serif" }}
              >
                {stat.value}
              </p>
              <p className="text-xs text-neutral-400 mt-1 tracking-wide uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* NEW: Our Facility gallery */}
      <section id="gallery" className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-red-500 font-semibold tracking-[0.3em] text-sm text-center mb-3">
          TAKE A LOOK INSIDE
        </p>
        <h2
          className="text-4xl md:text-5xl text-center tracking-wide mb-14"
          style={{ fontFamily: "'Anton', sans-serif" }}
        >
          OUR FACILITY
        </h2>

        <div className="grid sm:grid-cols-3 gap-5">
          {GALLERY_IMAGES.map((img) => (
            <div
              key={img.src}
              className="relative aspect-[4/5] rounded-xl overflow-hidden border border-neutral-800 group"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            </div>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-red-500 font-semibold tracking-[0.3em] text-sm text-center mb-3">
          WHAT WE OFFER
        </p>
        <h2
          className="text-4xl md:text-5xl text-center tracking-wide"
          style={{ fontFamily: "'Anton', sans-serif" }}
        >
          PROGRAMS BUILT AROUND YOU
        </h2>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {programs.map((program) => {
            const Icon = getPlanIcon(program.name);
            return (
              <div
                key={program.id}
                className="bg-neutral-950 border border-neutral-800 hover:border-red-600/50 rounded-xl p-6 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-red-600/10 flex items-center justify-center mb-5">
                  <Icon className="text-red-500" size={22} />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  {program.name}
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {program.description ||
                    "Ask us about this plan at the front desk."}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Membership Plans */}
      <section
        id="plans"
        className="bg-neutral-950 border-y border-neutral-800"
      >
        <div className="max-w-6xl mx-auto px-6 py-24">
          <p className="text-red-500 font-semibold tracking-[0.3em] text-sm text-center mb-3">
            MEMBERSHIP
          </p>
          <h2
            className="text-4xl md:text-5xl text-center tracking-wide"
            style={{ fontFamily: "'Anton', sans-serif" }}
          >
            CHOOSE YOUR PLAN
          </h2>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan, i) => {
              const isPopular = i === popularIndex;
              return (
                <div
                  key={plan.id || plan.name}
                  className={`relative rounded-xl p-6 border flex flex-col ${
                    isPopular
                      ? "bg-red-600 border-red-600"
                      : "bg-black border-neutral-800"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  )}
                  <h3 className="font-semibold mb-3 text-white">{plan.name}</h3>
                  <p className="mb-6">
                    <span
                      className="text-3xl"
                      style={{ fontFamily: "'Anton', sans-serif" }}
                    >
                      ₹{plan.price.toLocaleString("en-IN")}
                    </span>
                    <span
                      className={
                        isPopular ? "text-red-100" : "text-neutral-400"
                      }
                    >
                      {" "}
                      / {plan.durationDays} days
                    </span>
                  </p>
                  <Link
                    to="/login/member"
                    className={`mt-auto text-center py-2.5 rounded font-medium text-sm transition-colors ${
                      isPopular
                        ? "bg-white text-red-600 hover:bg-red-50"
                        : "bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-700"
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-red-500 font-semibold tracking-[0.3em] text-sm text-center mb-3">
          MEMBER STORIES
        </p>
        <h2
          className="text-4xl md:text-5xl text-center tracking-wide"
          style={{ fontFamily: "'Anton', sans-serif" }}
        >
          RESULTS, NOT EXCUSES
        </h2>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-neutral-950 border border-neutral-800 rounded-xl p-6"
            >
              <div className="flex gap-1 text-red-500 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed mb-5">
                "{t.quote}"
              </p>
              <p className="text-sm font-semibold text-white">{t.name}</p>
              <p className="text-xs text-neutral-500">{t.program}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band — now with a photo background */}
      <section className="relative overflow-hidden">
        {/* <div className="absolute inset-0">
          <img
            src="/images/photo_4.avif"
            alt="Athlete chalking up before a lift"
            className="w-full h-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-red-700/85" />
        </div> */}

        <div className="absolute inset-0">
          <img
            src="/images/photo_4.avif"
            alt="Athlete chalking up before a lift"
            className="w-full h-full object-cover grayscale brightness-100"
          />
          <div className="absolute inset-0 bg-red-700/55" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <h2
            className="text-3xl md:text-4xl tracking-wide mb-4"
            style={{ fontFamily: "'Anton', sans-serif" }}
          >
            READY TO START?
          </h2>
          <p className="text-red-100 mb-8 max-w-md mx-auto">
            Your first session is the hardest one to show up for. We'll take it
            from there.
          </p>
          <Link
            to="/login/member"
            className="inline-flex items-center gap-2 bg-black hover:bg-neutral-900 text-white px-8 py-4 rounded font-semibold tracking-wide transition-colors"
          >
            JOIN NOW <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-black border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <Dumbbell className="text-white" size={16} />
              </div>
              <span
                className="text-lg tracking-wide"
                style={{ fontFamily: "'Anton', sans-serif" }}
              >
                MEMBERHUB FITNESS
              </span>
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed">
              123 MG Road, Bareilly, Uttar Pradesh
              <br />
              Open Mon–Sat, 6:00 AM – 10:00 PM
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">
              QUICK LINKS
            </h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <a
                  href="#programs"
                  className="hover:text-white transition-colors"
                >
                  Programs
                </a>
              </li>
              <li>
                <a href="#plans" className="hover:text-white transition-colors">
                  Membership Plans
                </a>
              </li>
              <li>
                <a
                  href="#gallery"
                  className="hover:text-white transition-colors"
                >
                  Our Gym
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="hover:text-white transition-colors"
                >
                  Testimonials
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">
              MEMBER ACCESS
            </h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link
                  to="/login/member"
                  className="hover:text-white transition-colors"
                >
                  Member Login / Join Now
                </Link>
              </li>
              <li>
                <Link
                  to="/login/admin"
                  className="hover:text-white transition-colors"
                >
                  Staff Login
                </Link>
              </li>
              <li>
                <Link
                  to="/verify"
                  className="hover:text-white transition-colors"
                >
                  Verify Certificate
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-900">
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
            <span>
              © {new Date().getFullYear()} MemberHub Fitness. All rights
              reserved.
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} /> Secure member data, powered by MemberHub
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
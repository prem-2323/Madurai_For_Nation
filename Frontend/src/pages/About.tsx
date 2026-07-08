import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, HelpCircle, ChevronDown, Sparkles, Cpu, ShieldCheck, HeartPulse, Globe, RefreshCw } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'How does CleanAir AI identify different types of pollution?',
    answer: 'Our platform utilizes computer vision neural networks trained on millions of environmental images. When a user uploads a photo, the model analyzes pixel distributions, smoke plume colors, structural outlines, and oil sheen patterns to identify the chemical classification and estimate particulate volume.'
  },
  {
    question: 'How accurate is the AI detection engine?',
    answer: 'In clinical benchmarks, our Gemini-assisted and customized vision architectures demonstrate a 96.4% accuracy rate in isolating industrial smokestack particulate, illegal landfill dump items, and storm drain contamination sheens.'
  },
  {
    question: 'Can I report pollution anonymously?',
    answer: 'Yes! Public citizens can log environmental incidents completely anonymously without creating accounts. We process the photo EXIF spatial metadata to plot the coordinates on our live municipal database map.'
  },
  {
    question: 'What happens after I submit a pollution report?',
    answer: 'Once submitted, the report is instantly plotted on the Live Spatial Map and queued on the Municipal Dashboard. City inspectors and hazardous clean-up crews are immediately alerted, coordinating remediation based on the AI-assigned severity level.'
  },
  {
    question: 'How do municipalities integrate this platform into their systems?',
    answer: 'CleanAir AI provides a secure REST API with OpenAPI specifications and standard GIS map layers, allowing smooth integrations into existing municipal CRM suites, 311 systems, or emergency dispatch platforms.'
  }
];

export const About: React.FC = () => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  
  // Contact Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      setTimeout(() => setIsSubmitted(false), 3000);
    }, 1500);
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  const techStack = [
    { title: 'React (Vite)', desc: 'High-performance reactive frontend UI compilation' },
    { title: 'Tailwind CSS v4', desc: 'Modern, utility-first design architecture' },
    { title: 'Framer Motion', desc: 'Seamless, physics-based page and modal transition engines' },
    { title: 'Lucide Icons', desc: 'Clean vector graphics representation' },
    { title: 'Gemini Vision', desc: 'Image profile matching and clinical severity grading' },
    { title: 'REST API Ready', desc: 'Axios requests configured for full-stack deployment' }
  ];

  const team = [
    { name: 'Dr. Clara Vance', role: 'Principal Climate Scientist', bio: 'Former NOAA researcher specializing in particulate atmospheric dispersion models.' },
    { name: 'Xavier Cole', role: 'Lead Computer Vision Architect', bio: 'Expert in neural image networks, previously developing geospatial drone vision systems.' },
    { name: 'Amara Lopez', role: 'Municipal Operations Director', bio: 'Former Deputy CIO for City Planning, optimizing 311 incident logistics.' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 text-left">
      
      {/* 1. MISSION & VISION HEADER */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <span className="text-xs font-bold text-primary uppercase tracking-widest block">Corporate Profile</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Democratizing Climate Action Through Intelligence
          </h1>
          <p className="text-sm text-muted-text leading-relaxed">
            CleanAir AI was founded on a simple, vital premise: citizens shouldn’t have to struggle to breathe clean air, and municipalities shouldn’t have to guess where environmental violations are occurring. By pairing community-driven smartphones with industry-leading neural image parsing, we provide an immediate, secure interface to identify, assess, and resolve pollution hotspots.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="p-4 glass-panel border border-slate-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-secondary flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-secondary" /> Our Mission
              </span>
              <p className="text-xs text-muted-text leading-relaxed">
                To establish a high-resolution, hyperlocal mesh of environmental awareness that empowers community reporting and automates municipal remediation workflows.
              </p>
            </div>
            <div className="p-4 glass-panel border border-slate-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" /> Our Vision
              </span>
              <p className="text-xs text-muted-text leading-relaxed">
                A world where environmental hazards are caught instantly and resolved within minutes, optimizing metropolitan resources to foster safer, cleaner neighborhoods.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          {/* Stylized Brand Badge Panel */}
          <div className="w-full max-w-[360px] p-6 rounded-3xl glass-panel border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between h-80">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none" />
            
            <span className="text-[10px] font-mono text-muted-text">NODE_CREDITS //</span>
            
            <div className="space-y-4">
              <span className="text-4xl font-extrabold text-white tracking-tight">CleanAir AI</span>
              <p className="text-xs text-muted-text leading-relaxed">
                Deploying state-of-the-art vision nodes across industrial waterways and metropolitan corridors since 2026.
              </p>
            </div>

            <div className="flex gap-4 border-t border-white/5 pt-4 text-[10px] font-mono text-secondary">
              <span>EST. 2026</span>
              <span>•</span>
              <span>SEATTLEHQ</span>
              <span>•</span>
              <span>V_2.4</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY CLEANAIR AI & TECH STACK */}
      <section className="space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">System Architecture</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Engineering & Tech Stack</h2>
          <p className="text-sm text-muted-text">Designed with premium client-side rendering and scalable full-stack hooks to fit into any modern GIS or 311 software landscape.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {techStack.map((tech) => (
            <div key={tech.title} className="p-6 rounded-2xl glass-panel border border-slate-800 hover:border-secondary/30 transition-all shadow-lg text-left">
              <span className="text-sm font-bold text-white block">{tech.title}</span>
              <p className="text-xs text-muted-text mt-2 leading-relaxed">{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. TEAM PLATFORM */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold text-primary uppercase tracking-widest block">Human Capital</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Our Core Team</h2>
          <p className="text-sm text-muted-text">Meet the climate experts, computer vision architects, and civic coordinators pioneering air intelligence systems.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((member) => (
            <div key={member.name} className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-white font-extrabold text-lg">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">{member.name}</span>
                  <span className="text-[10px] text-secondary font-semibold block">{member.role}</span>
                </div>
              </div>
              <p className="text-xs text-muted-text leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">System Diagnostics</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
          <p className="text-xs text-muted-text leading-relaxed">
            Detailed support document outlining browser image uploads, neural model confidence parameters, geolocation, and civic API options.
          </p>
        </div>

        <div className="lg:col-span-7 space-y-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-card-dark/60 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-white pr-4">{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-text shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-xs text-muted-text leading-relaxed border-t border-white/5 pt-4">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. CONTACT & TICKETING SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 glass-panel rounded-3xl border border-slate-800 p-8 relative overflow-hidden shadow-xl">
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-secondary/5 rounded-tl-full pointer-events-none" />
        
        {/* Contact Info column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-primary uppercase tracking-widest block">Support Desk</span>
            <h3 className="text-xl font-bold text-white tracking-tight">Connect With Our Specialists</h3>
            <p className="text-xs text-muted-text leading-relaxed">
              Are you a municipal representative seeking custom integration protocols or data service-level guarantees? Drop us a secure transmission and we will sync up.
            </p>
          </div>

          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-xs text-muted-text">
              <Mail className="w-4 h-4 text-secondary shrink-0" />
              <a href="mailto:response@cleanair.ai" className="hover:text-white transition-all">response@cleanair.ai</a>
            </li>
            <li className="flex items-center gap-3 text-xs text-muted-text">
              <Phone className="w-4 h-4 text-secondary shrink-0" />
              <span>+1 (206) 555-0143</span>
            </li>
            <li className="flex items-start gap-3 text-xs text-muted-text">
              <MapPin className="w-4.5 h-4.5 text-secondary shrink-0 mt-0.5" />
              <span>Madurai, Tamil Nadu, India</span>
            </li>
          </ul>
        </div>

        {/* Contact Form column */}
        <div className="lg:col-span-7">
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-secondary/50 rounded-xl text-xs text-white placeholder-muted-text outline-none transition-all"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Corporate Email Address"
                className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-secondary/50 rounded-xl text-xs text-white placeholder-muted-text outline-none transition-all"
              />
            </div>

            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="State your municipal/corporate coordination inquiry in detail..."
              className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-secondary/50 rounded-xl text-xs text-white placeholder-muted-text outline-none transition-all resize-none"
            />

            <button
              type="submit"
              disabled={isSubmitting || isSubmitted}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-primary/10 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Transmitting...</span>
                </>
              ) : isSubmitted ? (
                <>
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  <span>Transmission Successful!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>Send Secure Message</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>

    </div>
  );
};
export default About;

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

// PostPilot testimonials — social proof with specificity (psychology: availability heuristic + social proof)
const testimonials: Testimonial[] = [
  {
    text: "PostPilot cut my content planning from 8 hours a week to under 40 minutes. I used to dread Mondays — now my entire week's posts are ready before breakfast.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Maya Chen",
    role: "Lifestyle Creator · 180K followers",
  },
  {
    text: "I was skeptical about AI writing 'sounding like me' but PostPilot nailed my tone after the first strategy session. My engagement went up 3.4x in 30 days.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Jordan Ellis",
    role: "Marketing Consultant",
  },
  {
    text: "We run social for 14 clients. PostPilot replaced a part-time hire. ROI was positive in week two and we haven't looked back since.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Priya Desai",
    role: "Founder, Spark Social Agency",
  },
  {
    text: "The strategy feature is what sold me. It doesn't just write posts — it understands my audience, my niche, my voice. It feels like a real content strategist.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Alex Rivera",
    role: "E-commerce Entrepreneur",
  },
  {
    text: "I went from posting twice a week to every single day. My follower count doubled in 6 weeks. PostPilot is simply the highest-leverage tool in my stack.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Sofia Laurent",
    role: "Personal Finance Creator",
  },
  {
    text: "Our SaaS grew to 2,000 users through organic LinkedIn content. PostPilot handled every single post. It's the unfair advantage nobody talks about.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Tomás Vargas",
    role: "SaaS Founder",
  },
  {
    text: "The templates alone are worth the price. I run a fitness brand and PostPilot knows the difference between motivation Monday and transformation Tuesday.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Dani Brooks",
    role: "Fitness Coach · 95K Instagram",
  },
  {
    text: "I used to spend my weekends batch-writing content. Now I use that time to actually serve my clients. PostPilot gave me my weekends back.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Keiko Tanaka",
    role: "Brand Strategist",
  },
  {
    text: "I tried four AI writing tools. PostPilot is the only one that understood context — my industry, my past content, my audience's pain points. Night and day difference.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Marcus Webb",
    role: "Real Estate Investor & Educator",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.ul
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent transition-colors duration-300 list-none m-0 p-0"
      >
        {[...new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <motion.li
                key={`${index}-${i}`}
                aria-hidden={index === 1 ? "true" : "false"}
                tabIndex={index === 1 ? -1 : 0}
                whileHover={{
                  scale: 1.03,
                  y: -8,
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                  transition: { type: "spring", stiffness: 400, damping: 17 },
                }}
                className="p-8 rounded-3xl border border-white/10 shadow-lg shadow-black/20 max-w-xs w-full bg-white/5 backdrop-blur-sm transition-all duration-300 cursor-default select-none group focus:outline-none"
              >
                <blockquote className="m-0 p-0">
                  <p className="text-white/70 leading-relaxed font-normal m-0">
                    {text}
                  </p>
                  <footer className="flex items-center gap-3 mt-6">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={`Avatar of ${name}`}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-white/30 transition-all duration-300"
                    />
                    <div className="flex flex-col">
                      <cite className="font-semibold not-italic tracking-tight leading-5 text-white">
                        {name}
                      </cite>
                      <span className="text-sm leading-5 tracking-tight text-white/40 mt-0.5">
                        {role}
                      </span>
                    </div>
                  </footer>
                </blockquote>
              </motion.li>
            ))}
          </React.Fragment>
        ))]}
      </motion.ul>
    </div>
  );
};

export function TestimonialsSection() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="py-24 relative overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        className="container px-4 z-10 mx-auto"
      >
        <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-16">
          <div className="flex justify-center">
            <div className="border border-white/20 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-white/60 bg-white/5">
              Creator Stories
            </div>
          </div>
          {/* Loss aversion + social proof headline */}
          <h2
            id="testimonials-heading"
            className="text-4xl md:text-5xl font-extrabold tracking-tight mt-6 text-center text-white"
          >
            They stopped losing hours to content.
          </h2>
          <p className="text-center mt-5 text-white/50 text-lg leading-relaxed max-w-sm">
            Join thousands of creators and teams who reclaimed their time — and grew faster than ever.
          </p>
        </div>
        <div
          className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[740px] overflow-hidden"
          role="region"
          aria-label="Scrolling Testimonials"
        >
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </motion.div>
    </section>
  );
}

export default TestimonialsSection;

import { motion } from 'framer-motion';

import StatCard from './StatCard';

const stats = [
  { number: 567, label: 'Photos clicked this year', icon: '📸' },
  { number: 5, label: 'Longest shoot (hours)', icon: '⏱️' },
  { number: 123, label: 'Coffees consumed while editing', icon: '☕' },
  { number: 42, label: 'Sunrise shoots', icon: '🌅' },
];

export default function AboutNumbers() {
  return (
    <section className="relative px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">About Me in Numbers</h2>
          <p className="text-lg opacity-80">A quick glimpse into my photography journey</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} number={stat.number} label={stat.label} icon={stat.icon} delay={index * 0.2} />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center text-lg opacity-60"
        >
          Scroll down to see my favorite shots!
        </motion.p>
      </div>
    </section>
  );
}

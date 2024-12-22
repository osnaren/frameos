import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

interface StatCardProps {
  number: number;
  label: string;
  icon?: string;
  delay?: number;
}

export default function StatCard({ number, label, icon, delay = 0 }: StatCardProps) {
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="group p-6 rounded-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 
         text-[var(--color-shadow)] hover:shadow-current hover:shadow-md"
    >
      <div className="flex flex-col items-center text-center space-y-2">
        {icon && <span className="text-4xl mb-2">{icon}</span>}
        <div className="text-5xl md:text-6xl font-bold text-[var(--color-primary)]">
          <CountUp end={number} duration={2} start={0} enableScrollSpy scrollSpyOnce />
        </div>
        <span className="text-lg text-[var(--color-text)] opacity-80">{label}</span>
      </div>
    </motion.div>
  );
}

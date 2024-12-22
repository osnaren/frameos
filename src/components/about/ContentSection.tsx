import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface ContentSectionProps {
  title: string;
  content: any; // Updated to accept any structured content
  align?: 'left' | 'right';
}

const renderContent = (data: any) => {
  // console.log(data);
  if (!Array.isArray(data.content)) {
    return null;
  }
  return data?.content.map((node: any, index: number) => {
    if (node.nodeType === 'paragraph') {
      return (
        <p key={index} className="text-lg leading-relaxed">
          {node.content.map((textNode: any, textIndex: number) => {
            if (textNode.nodeType === 'text') {
              return (
                <span
                  key={textIndex}
                  className={textNode.marks.some((mark: any) => mark.type === 'bold') ? 'font-bold' : ''}
                >
                  {textNode.value}
                </span>
              );
            }
            return null;
          })}
        </p>
      );
    }
    return null;
  });
};

export default function ContentSection({ title, content, align = 'left' }: ContentSectionProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      className={`max-w-2xl mx-auto my-12 ${align === 'right' ? 'ml-auto' : 'mr-auto'}`}
      initial={{ opacity: 0, x: align === 'right' ? 50 : -50 }}
      animate={inView ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      {renderContent(content)}
    </motion.div>
  );
}

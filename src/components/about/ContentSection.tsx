import type { Document, Paragraph, Text } from '@contentful/rich-text-types';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface ContentSectionProps {
  title: string;
  content: Document;
  align?: 'left' | 'right';
}

const isParagraph = (node: Document['content'][number]): node is Paragraph => node.nodeType === 'paragraph';
const isText = (node: Paragraph['content'][number]): node is Text => node.nodeType === 'text';

const renderContent = (doc: Document) => {
  if (!Array.isArray(doc.content)) {
    return null;
  }

  return doc.content.filter(isParagraph).map((paragraph, index) => (
    <p key={index} className="text-lg leading-relaxed">
      {paragraph.content.filter(isText).map((textNode, textIndex) => (
        <span key={textIndex} className={textNode.marks?.some((mark) => mark.type === 'bold') ? 'font-bold' : ''}>
          {textNode.value}
        </span>
      ))}
    </p>
  ));
};

export default function ContentSection({ title, content, align = 'left' }: ContentSectionProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      className={`mx-auto my-12 max-w-2xl ${align === 'right' ? 'ml-auto' : 'mr-auto'}`}
      initial={{ opacity: 0, x: align === 'right' ? 50 : -50 }}
      animate={inView ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: 0.6 }}
    >
      <h2 className="mb-4 text-3xl font-bold">{title}</h2>
      {renderContent(content)}
    </motion.div>
  );
}

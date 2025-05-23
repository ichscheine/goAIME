import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/**
 * MathRenderer component for consistent LaTeX rendering across the application
 * Uses ReactMarkdown with remark-math and rehype-katex plugins
 */
const MathRenderer = ({ children, className = '' }) => {
  if (!children) return null;
  
  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {children}
    </ReactMarkdown>
  );
};

export default MathRenderer;
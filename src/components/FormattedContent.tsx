import React from 'react';
import { isHtmlString, sanitizeHtml, convertPlainTextToHtml } from '../lib/richTextUtils';

interface FormattedContentProps {
  content?: string;
  className?: string;
  fallback?: string;
}

export const FormattedContent: React.FC<FormattedContentProps> = ({
  content,
  className = '',
  fallback = ''
}) => {
  if (!content) {
    if (!fallback) return null;
    return <span className={className}>{fallback}</span>;
  }

  const html = isHtmlString(content) ? sanitizeHtml(content) : convertPlainTextToHtml(content);

  return (
    <div
      className={`rich-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

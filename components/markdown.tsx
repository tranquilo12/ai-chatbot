import Link from 'next/link';
import React, { memo } from 'react';
import { Streamdown, type StreamdownProps } from 'streamdown';

type Components = StreamdownProps['components'];

const components: Partial<Components> = {
  // Links with better styling
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-blue-600/30 hover:decoration-blue-600/60 underline-offset-2 transition-colors font-medium"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },

  // Typography hierarchy
  h1: ({ children, ...props }) => (
    <h1 className="text-xl font-bold text-foreground mb-2 mt-4 first:mt-0 leading-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-lg font-semibold text-foreground mb-2 mt-4 first:mt-0 leading-tight" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-base font-semibold text-foreground mb-1 mt-3 first:mt-0 leading-tight" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-sm font-semibold text-foreground mb-1 mt-3 first:mt-0 leading-tight" {...props}>
      {children}
    </h4>
  ),

  // Paragraphs with proper spacing
  p: ({ children, ...props }) => (
    <p className="text-foreground leading-relaxed mb-4 last:mb-0" {...props}>
      {children}
    </p>
  ),

  // Enhanced lists
  ul: ({ children, ...props }) => (
    <ul className="space-y-2 mb-4 pl-6" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="space-y-2 mb-4 pl-6 list-decimal" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-foreground leading-relaxed relative" {...props}>
      <span className="block">{children}</span>
    </li>
  ),

  // Enhanced blockquotes
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-muted-foreground/30 pl-4 py-2 my-4 italic text-muted-foreground bg-muted/30 rounded-r-md"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Better code blocks
  pre: ({ children, ...props }) => (
    <pre
      className="overflow-x-auto max-w-full bg-muted/80 border border-border p-4 rounded-lg text-sm whitespace-pre-wrap break-words scrollbar-thin my-4 font-mono leading-relaxed code-block"
      {...props}
    >
      {children}
    </pre>
  ),

  // Inline code with better styling
  code: ({ children, ...props }) => (
    <code
      className="bg-muted/80 border border-border px-1.5 py-0.5 rounded text-sm break-words overflow-wrap-anywhere font-mono text-foreground"
      {...props}
    >
      {children}
    </code>
  ),

  // Enhanced strong/bold text
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),

  // Enhanced emphasis
  em: ({ children, ...props }) => (
    <em className="italic text-foreground" {...props}>
      {children}
    </em>
  ),

  // Horizontal rules
  hr: ({ ...props }) => (
    <hr className="border-0 h-px bg-border my-8" {...props} />
  ),
};

const NonMemoizedMarkdown = ({ children }: { children: string }) => (
  <div className="markdown-wrapper overflow-hidden prose prose-sm prose-neutral dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted/80 prose-pre:border prose-pre:border-border max-w-none">
    <Streamdown components={components}>{children}</Streamdown>
  </div>
);

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

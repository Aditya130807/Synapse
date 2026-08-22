import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
}

function extractTextContent(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextContent).join('');
  if (
    React.isValidElement(node) &&
    node.props &&
    (node.props as { children?: React.ReactNode }).children
  ) {
    return extractTextContent((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

function getLanguage(node: React.ReactNode, fallbackClass?: string): string {
  if (fallbackClass) {
    const match = /language-(\w+)/.exec(fallbackClass) || /hljs-(\w+)/.exec(fallbackClass);
    if (match && match[1]) return match[1];
  }
  if (React.isValidElement(node) && node.props) {
    const className = ((node.props as { className?: string }).className || '') as string;
    const match = /language-(\w+)/.exec(className) || /hljs-(\w+)/.exec(className);
    if (match && match[1]) return match[1];
  }
  return 'code';
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);

  const rawCode = extractTextContent(children).trimEnd();
  const language = getLanguage(children, className);

  const handleCopy = async () => {
    if (!rawCode) return;
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  return (
    <div
      className="my-3 overflow-hidden rounded-xl border shadow-2xs transition-colors duration-200"
      style={{
        backgroundColor: 'var(--code-bg)',
        borderColor: 'var(--code-border)',
      }}
    >
      {/* Code Header Bar */}
      <div
        className="flex items-center justify-between border-b px-4 py-2 select-none transition-colors duration-200"
        style={{
          backgroundColor: 'var(--code-header-bg)',
          borderColor: 'var(--code-border)',
        }}
      >
        <span
          className="font-mono text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--code-muted)' }}
        >
          {language}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer hover:border-[var(--primary)]"
          style={{
            backgroundColor: 'var(--code-btn-bg)',
            borderColor: 'var(--code-btn-border)',
            color: 'var(--code-btn-text)',
          }}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
              <span className="font-semibold" style={{ color: 'var(--primary)' }}>Copied ✓</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" style={{ color: 'var(--code-muted)' }} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Container */}
      <pre
        className="overflow-x-auto p-4 font-mono text-xs sm:text-sm leading-relaxed transition-colors duration-200"
        style={{
          backgroundColor: 'var(--code-bg)',
          color: 'var(--code-text)',
        }}
      >
        {children}
      </pre>
    </div>
  );
};

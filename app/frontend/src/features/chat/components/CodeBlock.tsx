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
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-[#020617] shadow-xl">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0F172A]/90 px-4 py-2 select-none">
        <span className="font-mono text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied ✓</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Container */}
      <pre className="overflow-x-auto p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-100 bg-[#020617]">
        {children}
      </pre>
    </div>
  );
};

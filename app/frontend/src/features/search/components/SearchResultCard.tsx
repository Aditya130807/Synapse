import React from 'react';
import { FileText, Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { SemanticSearchResultItem } from '../services/search.api';

interface SearchResultCardProps {
  result: SemanticSearchResultItem;
  onClick: (result: SemanticSearchResultItem) => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, onClick }) => {
  const getScoreColor = (percent: number) => {
    if (percent >= 80) return 'bg-[var(--primary-muted)] border-[var(--primary-border)] text-[var(--primary)]';
    if (percent >= 60) return 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400';
    return 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400';
  };

  return (
    <Card
      onClick={() => onClick(result)}
      className="group relative flex flex-col p-4 rounded-xl border transition-all duration-200 shadow-xs cursor-pointer space-y-3"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 truncate">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg border shrink-0"
            style={{
              backgroundColor: 'var(--primary-muted)',
              borderColor: 'var(--primary-border)',
              color: 'var(--primary)',
            }}
          >
            <FileText className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="truncate">
            <h4 className="text-xs font-semibold tracking-tight transition-colors truncate" style={{ color: 'var(--text-primary)' }}>
              {result.filename}
            </h4>
            <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
              {result.page && <span>Page {result.page}</span>}
              {result.page && <span>•</span>}
              <span>Chunk #{result.chunkIndex + 1}</span>
            </div>
          </div>
        </div>

        {/* Semantic Score Badge */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold font-mono px-2.5 py-0.5 rounded-full border ${getScoreColor(
              result.scorePercent
            )}`}
          >
            <Sparkles className="h-3 w-3" />
            <span>{result.scorePercent}% Match</span>
          </span>
        </div>
      </div>

      {/* Matching Excerpt Content */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-subtle)' }}>
        <p className="text-xs font-sans leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
          "{result.content}"
        </p>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end text-[11px] font-medium group-hover:translate-x-0.5 transition-transform gap-1" style={{ color: 'var(--primary)' }}>
        <span>View matching section</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Card>
  );
};

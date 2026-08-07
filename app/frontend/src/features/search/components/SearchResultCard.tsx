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
    if (percent >= 80) return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
    if (percent >= 60) return 'bg-blue-500/15 border-blue-500/30 text-blue-400';
    return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
  };

  return (
    <Card
      onClick={() => onClick(result)}
      className="group relative flex flex-col p-4 rounded-xl border border-white/[0.08] bg-[#0F172A]/80 hover:bg-[#0F172A] hover:border-blue-500/40 transition-all shadow-sm cursor-pointer space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 truncate">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="truncate">
            <h4 className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors truncate">
              {result.filename}
            </h4>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
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
      <div className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.04]">
        <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-3">
          "{result.content}"
        </p>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end text-[11px] font-medium text-blue-400 group-hover:translate-x-0.5 transition-transform gap-1">
        <span>View matching section</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Card>
  );
};

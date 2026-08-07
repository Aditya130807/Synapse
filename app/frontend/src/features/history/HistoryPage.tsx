import { History } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">History</h1>
        <p className="text-sm text-muted-foreground">
          Review past sessions, prompt logs, and generated artifacts.
        </p>
      </div>

      <Card className="border-border/80 bg-[#111827] p-12 text-center min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4 max-w-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/80 text-muted-foreground border border-border">
            <History className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-foreground">No conversations yet.</h3>
            <p className="text-xs text-muted-foreground">
              Your conversation history and saved sessions will be automatically stored here.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure workspace parameters, API keys, and account preferences.
        </p>
      </div>

      <Card className="border-border/80 bg-[#111827] p-12 text-center min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4 max-w-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Settings className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-foreground">Workspace settings will appear here.</h3>
            <p className="text-xs text-muted-foreground">
              Customize model parameters, system prompts, integration credentials, and security controls.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

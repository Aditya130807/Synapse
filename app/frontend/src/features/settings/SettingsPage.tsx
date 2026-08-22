import { useState, useEffect } from 'react';
import {
  User,
  Sparkles,
  Sun,
  Moon,
  Brain,
  ShieldCheck,
  LogOut,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Bot,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { authService } from '@/features/auth/auth.service';

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'appearance' | 'memory' | 'security'>('profile');

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // AI Preference State (stored locally in localStorage)
  const [selectedModel, setSelectedModel] = useState<string>(
    () => localStorage.getItem('synapse_preferred_model') || 'gemini-2.5-flash'
  );
  const [defaultAgentMode, setDefaultAgentMode] = useState<string>(
    () => localStorage.getItem('synapse_agent_mode') || 'general'
  );
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSavingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);

      const res = await authService.updateProfile({ name: name.trim(), email: email.trim() });
      if (updateUser) {
        updateUser(res.user);
      }
      setProfileSuccess('Profile updated successfully.');
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setProfileError(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Update
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      const res = await authService.updatePassword({ currentPassword, newPassword });
      setPasswordSuccess(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to update password:', err);
      setPasswordError(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle AI Preferences Save
  const handleSaveAI = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('synapse_preferred_model', selectedModel);
    localStorage.setItem('synapse_agent_mode', defaultAgentMode);
    setAiSuccess('AI preferences saved.');
    setTimeout(() => setAiSuccess(null), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'ai', label: 'AI Engine', icon: Sparkles },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Workspace Settings
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Manage your account profile, AI parameters, theme preferences, and security credentials.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b pb-3 overflow-x-auto no-scrollbar" style={{ borderColor: 'var(--border)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--primary-muted)',
                      border: '1px solid var(--primary-border)',
                      color: 'var(--primary)',
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: 'var(--muted)',
                    }
              }
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="max-w-3xl">
        {/* 1. PROFILE TAB */}
        {activeTab === 'profile' && (
          <Card className="p-6 sm:p-8 rounded-2xl border space-y-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold border shrink-0"
                style={{
                  backgroundColor: 'var(--primary-muted)',
                  borderColor: 'var(--primary-border)',
                  color: 'var(--primary)',
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{user?.email}</p>
                {user?.createdAt && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  style={{
                    backgroundColor: 'var(--input)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  style={{
                    backgroundColor: 'var(--input)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* 2. AI ENGINE TAB */}
        {activeTab === 'ai' && (
          <Card className="p-6 sm:p-8 rounded-2xl border space-y-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>AI Engine & Agent Routing</h3>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Configure primary AI providers, models, and default agent orchestration behavior.
              </p>
            </div>

            <form onSubmit={handleSaveAI} className="space-y-5">
              {aiSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{aiSuccess}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                  Preferred Primary AI Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--input)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Google AI — Fast & Lightweight)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Google AI — High Reasoning & Architecture)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic — Code & Document Analysis)</option>
                  <option value="gpt-4o">GPT-4o (OpenAI — General Synthesis)</option>
                  <option value="deepseek-r1">DeepSeek R1 (DeepSeek — Reasoning Model)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Bot className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                  Default Agent Orchestration Mode
                </label>
                <select
                  value={defaultAgentMode}
                  onChange={(e) => setDefaultAgentMode(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--input)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="general">General Assistant (Auto Router & Synthesis)</option>
                  <option value="coding">Coding Architect (Technical Code & Refactoring)</option>
                  <option value="document">Document RAG Analyzer (Knowledge Base Search)</option>
                  <option value="research">Research Specialist (Web & Deep Inspection)</option>
                </select>
              </div>

              <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                  <ShieldCheck className="h-4 w-4" />
                  <span>OmniRoute Fallback System Active</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Synapse automatically routes prompts through alternative providers if primary rate limits or network issues occur.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  <Check className="h-4 w-4" />
                  <span>Save AI Preferences</span>
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* 3. APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <Card className="p-6 sm:p-8 rounded-2xl border space-y-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Appearance & Workspace Theme</h3>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Select your workspace theme aesthetic and visual preferences.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Dark Theme Option */}
              <div
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  theme === 'dark' ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: '#0D110E',
                  borderColor: theme === 'dark' ? 'var(--primary)' : 'var(--border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-xs text-white">
                    <Moon className="h-4 w-4 text-[var(--primary)]" />
                    <span>Dark Workspace</span>
                  </div>
                  {theme === 'dark' && <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Restrained Graphite background with Synapse Green accents. High contrast for developer workflows.
                </p>
              </div>

              {/* Light Theme Option */}
              <div
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  theme === 'light' ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: '#FAFBF9',
                  borderColor: theme === 'light' ? 'var(--primary)' : 'var(--border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span>Light Workspace</span>
                  </div>
                  {theme === 'light' && <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />}
                </div>
                <p className="text-[11px] text-neutral-500">
                  Clean crisp daylight background with polished Synapse identity. Ideal for bright environments.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* 4. MEMORY TAB */}
        {activeTab === 'memory' && (
          <Card className="p-6 sm:p-8 rounded-2xl border space-y-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Persistent Context & Instruction Memory</h3>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Synapse automatically remembers project rules, user preferences, and context across conversations.
              </p>
            </div>

            <div className="p-5 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: 'var(--primary-muted)',
                    borderColor: 'var(--primary-border)',
                    color: 'var(--primary)',
                  }}
                >
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Active Workspace Rules</h4>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Persistent instructions are injected with mandatory priority into future prompts.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                  <span>Conflict Resolution: Automatically archives old rules when new stack choices are specified.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                  <span>Security Sanitizer: Never stores passwords, tokens, or sensitive API secrets.</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 5. SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card className="p-6 sm:p-8 rounded-2xl border space-y-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Security & Password</h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Update your account password to maintain workspace security.
                </p>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-4">
                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    style={{
                      backgroundColor: 'var(--input)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    style={{
                      backgroundColor: 'var(--input)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    style={{
                      backgroundColor: 'var(--input)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                    }}
                  >
                    {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </Card>

            {/* Logout Card */}
            <Card className="p-6 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Session Actions</h4>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Sign out of your active Synapse workspace session on this device.
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

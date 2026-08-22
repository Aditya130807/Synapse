import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../auth.context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedBackground } from '@/components/background';
import {
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Cpu,
  Brain,
  ShieldCheck,
  FileText,
  Loader2,
  Zap,
} from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiMessage || message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = () => {
    // Placeholder for Google OAuth handler
    console.log('Google Auth initiated');
  };

  return (
    <AnimatedBackground>
      <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="grid w-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-12 items-center">
          
          {/* LEFT COLUMN / BRANDING & PRODUCT POSITIONING */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col space-y-7 lg:col-span-6 px-2 sm:px-4 text-left"
          >
            {/* Brand Header & Badge */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--primary-border)',
                  color: 'var(--primary)',
                }}
              >
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Synapse
                </span>
                <span
                  className="text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 rounded-md border uppercase"
                  style={{
                    backgroundColor: 'var(--primary-muted)',
                    borderColor: 'var(--primary-border)',
                    color: 'var(--primary)',
                  }}
                >
                  AI WORKSPACE
                </span>
              </div>
            </div>

            {/* Main Headline & Subtitle */}
            <div className="space-y-3">
              <h1
                className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-[1.15]"
                style={{ color: 'var(--text-primary)' }}
              >
                Your AI workspace for{' '}
                <span style={{ color: 'var(--primary)' }}>thinking, building,</span> and{' '}
                <span style={{ color: 'var(--primary)' }}>researching.</span>
              </h1>
              <p className="text-sm sm:text-base leading-relaxed max-w-lg" style={{ color: 'var(--text-secondary)' }}>
                Chat, knowledge, documents, memory, and AI agents — all in one intelligent workspace.
              </p>
            </div>

            {/* 4 Feature Cards (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Feature 1 */}
              <div
                className="flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl border shrink-0 mt-0.5"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--primary)',
                  }}
                >
                  <Cpu className="h-4 w-4" />
                </div>
                <div className="flex flex-col space-y-0.5 min-w-0">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Multi-Agent AI
                  </span>
                  <span className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
                    General, coding, research & docs
                  </span>
                </div>
              </div>

              {/* Feature 2 */}
              <div
                className="flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl border shrink-0 mt-0.5"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--primary)',
                  }}
                >
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex flex-col space-y-0.5 min-w-0">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Hybrid Document RAG
                  </span>
                  <span className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
                    PDF, MD, DOCX & citations
                  </span>
                </div>
              </div>

              {/* Feature 3 */}
              <div
                className="flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl border shrink-0 mt-0.5"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--primary)',
                  }}
                >
                  <Brain className="h-4 w-4" />
                </div>
                <div className="flex flex-col space-y-0.5 min-w-0">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Persistent Memory
                  </span>
                  <span className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
                    Workspace & context that remembers
                  </span>
                </div>
              </div>

              {/* Feature 4 */}
              <div
                className="flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl border shrink-0 mt-0.5"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--primary)',
                  }}
                >
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="flex flex-col space-y-0.5 min-w-0">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Encrypted Workspace
                  </span>
                  <span className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
                    Secure sessions, private by design
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Trust Indicators */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px]" style={{ color: 'var(--muted)' }}>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                <span>Secure by design</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                <span>Your data stays private</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                <span>Built for focus</span>
              </span>
            </div>
          </motion.div>

          {/* RIGHT COLUMN / AUTHENTICATION CARD */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="lg:col-span-6 w-full max-w-md mx-auto"
          >
            <div
              className="relative rounded-[22px] border p-7 sm:p-9 shadow-2xl space-y-6"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Header */}
              <div className="space-y-1 text-left">
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm font-normal" style={{ color: 'var(--muted)' }}>
                  Sign in to continue to Synapse.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div
                    role="alert"
                    className="flex items-center gap-2.5 rounded-xl border p-3 text-xs font-medium animate-in fade-in duration-150"
                    style={{
                      backgroundColor: 'rgba(225, 29, 72, 0.1)',
                      borderColor: 'rgba(225, 29, 72, 0.3)',
                      color: '#FDA4AF',
                    }}
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="email" className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    Email address
                  </Label>
                  <div className="relative group">
                    <Mail
                      className="absolute left-3.5 top-3.5 h-4 w-4 transition-colors duration-200 pointer-events-none"
                      style={{ color: 'var(--muted)' }}
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="test@example.com"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="pl-10 h-11 rounded-xl text-xs sm:text-sm transition-all duration-200"
                      style={{
                        backgroundColor: 'var(--input)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      Password
                    </Label>
                  </div>
                  <div className="relative group">
                    <Lock
                      className="absolute left-3.5 top-3.5 h-4 w-4 transition-colors duration-200 pointer-events-none"
                      style={{ color: 'var(--muted)' }}
                    />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="pl-10 pr-10 h-11 rounded-xl text-xs sm:text-sm transition-all duration-200"
                      style={{
                        backgroundColor: 'var(--input)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 p-1 rounded transition-colors cursor-pointer"
                      style={{ color: 'var(--muted)' }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Options Row: Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#A6D63A] cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <a
                    href="#forgot-password"
                    onClick={(e) => {
                      e.preventDefault();
                      setError('Password reset link sent to your email address.');
                    }}
                    className="font-medium transition-colors hover:underline"
                    style={{ color: 'var(--primary)' }}
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Primary CTA Button */}
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50 mt-1"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </motion.button>

                {/* Divider */}
                <div className="relative py-2 flex items-center justify-center">
                  <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
                  <span
                    className="absolute px-3 text-[11px] font-mono"
                    style={{ backgroundColor: 'var(--surface)', color: 'var(--muted)' }}
                  >
                    or
                  </span>
                </div>

                {/* Secondary Auth — Continue with Google */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-white/[0.04] cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {/* Google SVG Logo */}
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Footer Link */}
                <div className="pt-3 text-center">
                  <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                    Don't have an account?{' '}
                    <Link
                      to="/signup"
                      className="font-semibold transition-colors hover:underline"
                      style={{ color: 'var(--primary)' }}
                    >
                      Create account
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </motion.div>

        </div>
      </div>
    </AnimatedBackground>
  );
}

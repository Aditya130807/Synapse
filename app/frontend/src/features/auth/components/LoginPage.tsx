import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../auth.context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedBackground } from '@/components/background';
import { Sparkles, ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email, password });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed';
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiMessage || message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedBackground>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          {/* Glassmorphism Login Card with Linear-grade Light Physics & Asymmetric Hairline Border */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-[20px] bg-[rgba(15,23,42,0.75)] p-8 sm:p-9 backdrop-blur-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.06),0_0_32px_-8px_rgba(59,130,246,0.12)] border-t border-t-white/[0.14] border-x border-x-white/[0.07] border-b border-b-white/[0.04]"
          >
            {/* Header & Typography */}
            <div className="flex flex-col items-center text-center space-y-3 mb-7">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500/20 to-blue-600/10 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-1">
                <h1 className="text-[24px] font-semibold tracking-tight text-[#F8FAFC]">
                  Welcome back
                </h1>
                <p className="text-[13px] font-normal text-slate-400">
                  Sign in to your Synapse account
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 p-3 text-[12px] text-rose-300 font-medium"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[12px] font-medium text-slate-300">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 transition-colors duration-200 group-focus-within:text-blue-400 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="pl-10 h-11 rounded-xl bg-[#030712]/80 border border-white/[0.08] text-[#F8FAFC] text-[13px] placeholder:text-slate-500/70 hover:border-white/[0.15] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-0 focus-visible:border-blue-500/70 focus:shadow-[0_0_16px_rgba(59,130,246,0.2)] transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[12px] font-medium text-slate-300">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 transition-colors duration-200 group-focus-within:text-blue-400 pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pl-10 h-11 rounded-xl bg-[#030712]/80 border border-white/[0.08] text-[#F8FAFC] text-[13px] placeholder:text-slate-500/70 hover:border-white/[0.15] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-0 focus-visible:border-blue-500/70 focus:shadow-[0_0_16px_rgba(59,130,246,0.2)] transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Linear-styled Tactile Button with Hairline Top Highlight */}
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={shouldReduceMotion ? {} : { scale: 1.015, y: -1 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.985 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 font-medium text-[13px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.5),0_0_12px_rgba(59,130,246,0.25)] border-t border-t-white/25 border-x border-x-blue-500/20 border-b border-b-blue-700/40 hover:from-blue-400 hover:to-blue-500 hover:shadow-[0_1px_3px_rgba(0,0,0,0.6),0_0_16px_rgba(59,130,246,0.35)] active:opacity-90 disabled:opacity-50 transition-all duration-150 cursor-pointer"
              >
                {submitting ? (
                  'Signing in...'
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </motion.button>

              {/* Footer Signup Link */}
              <div className="pt-1 text-center">
                <p className="text-[13px] text-slate-400">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-blue-400 hover:text-blue-300 transition-colors duration-150 underline-offset-4 hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatedBackground>
  );
}

import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  Coins,
  Clapperboard,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { User } from '../types/auth';
import { loginWithEmail, signupWithEmail, loginWithGoogle } from '../utils/auth';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle visual mock reCAPTCHA click
  const handleCaptchaClick = () => {
    if (captchaChecked) {
      setCaptchaChecked(false);
      return;
    }
    setCaptchaLoading(true);
    setError(null);
    setTimeout(() => {
      setCaptchaLoading(false);
      setCaptchaChecked(true);
    }, 600);
  };

  // Handle Google Auth
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const googleUser = await loginWithGoogle(email.trim() ? email.trim() : undefined);
      onAuthSuccess(googleUser);
    } catch (err) {
      setError('Google sign in failed. Please try again.');
      setLoading(false);
    }
  };

  // Handle Email Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    if (!captchaChecked) {
      setError('Please complete the "I\'m not a robot" reCAPTCHA verification.');
      return;
    }

    setLoading(true);
    try {
      let user: User;
      if (mode === 'signup') {
        user = await signupWithEmail(trimmedEmail, password);
      } else {
        user = await loginWithEmail(trimmedEmail, password);
      }
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('creator.demo@creatorkit.io');
    setPassword('studio2026!');
    setCaptchaChecked(true);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Neon Purple Glows */}
      <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-150px] right-[-100px] w-[500px] h-[350px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 left-[-150px] w-[400px] h-[300px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Simple Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              CreatorKit
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                Studio
              </span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuickDemoFill}
          className="text-xs text-zinc-400 hover:text-purple-300 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 px-3 py-1.5 rounded-lg transition-all"
        >
          Quick Demo Credentials
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-purple-950/40 ring-1 ring-purple-500/20">
          {/* Card Title & Description */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-3">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>3 Free Daily Video Credits</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {mode === 'signup' ? 'Create your Account' : 'Welcome Back'}
            </h1>
            <p className="text-sm text-zinc-400 mt-1.5">
              {mode === 'signup'
                ? 'Join CreatorKit Studio to turn scripts into editable video plans'
                : 'Sign in to access your saved projects and daily video credits'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Social Auth: Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-zinc-800/90 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl border border-zinc-700/80 hover:border-purple-500/50 flex items-center justify-center gap-3 shadow-md hover:shadow-purple-500/10 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60"
          >
            {/* Google Multi-Color Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-zinc-800 flex-1" />
            <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
              Or with email
            </span>
            <div className="h-px bg-zinc-800 flex-1" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPassword('demo2026!');
                      setEmail((prev) => prev || 'creator@creatorkit.io');
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Visual Mock reCAPTCHA Checkbox */}
            <div className="pt-1">
              <div
                onClick={handleCaptchaClick}
                className={`flex items-center justify-between p-3 rounded-xl border bg-zinc-950/70 cursor-pointer select-none transition-all ${
                  captchaChecked
                    ? 'border-emerald-600/50 shadow-sm shadow-emerald-950/40'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                      captchaChecked
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    {captchaLoading ? (
                      <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    ) : captchaChecked ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : null}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-zinc-200">
                    I'm not a robot
                  </span>
                </div>

                {/* reCAPTCHA Brand Badge Mock */}
                <div className="flex flex-col items-center pl-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg viewBox="0 0 48 48" className="w-5 h-5">
                      <path
                        fill="#4285F4"
                        d="M24 4C12.95 4 4 12.95 4 24c0 4.14 1.27 8.01 3.44 11.21L12.5 32.5C11.56 30 11 27.1 11 24c0-7.18 5.82-13 13-13 3.82 0 7.26 1.66 9.64 4.31l-4.64 4.64H44V5l-5.69 5.69C34.58 6.84 29.58 4 24 4z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 44c11.05 0 20-8.95 20-20 0-4.14-1.27-8.01-3.44-11.21L35.5 15.5C36.44 18 37 20.9 37 24c0 7.18-5.82 13-13 13-3.82 0-7.26-1.66-9.64-4.31l4.64-4.64H4v15l5.69-5.69C13.42 41.16 18.42 44 24 44z"
                      />
                    </svg>
                  </div>
                  <span className="text-[8px] font-semibold tracking-wider text-zinc-500 uppercase mt-0.5">
                    reCAPTCHA
                  </span>
                  <span className="text-[7px] text-zinc-600">Privacy - Terms</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'signup' ? 'Sign up with Email' : 'Log in with Email'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Signup and Login */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
            {mode === 'signup' ? (
              <p className="text-xs text-zinc-400">
                Already have account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-semibold text-purple-400 hover:text-purple-300 hover:underline transition-colors ml-1 cursor-pointer"
                >
                  Login
                </button>
              </p>
            ) : (
              <p className="text-xs text-zinc-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="font-semibold text-purple-400 hover:text-purple-300 hover:underline transition-colors ml-1 cursor-pointer"
                >
                  Sign up
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer Feature Highlights */}
      <footer className="relative z-10 max-w-4xl mx-auto w-full px-6 py-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>3 Free Videos Every Day</span>
          </div>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Clapperboard className="w-4 h-4 text-purple-400" />
            <span>Precise Scene Control</span>
          </div>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Local Browser Session Storage</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

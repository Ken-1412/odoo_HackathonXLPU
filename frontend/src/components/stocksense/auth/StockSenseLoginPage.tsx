import React, { useState } from 'react';
import {
  Box,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { login } from '../../../lib/auth';

interface StockSenseLoginPageProps {
  onLoginSuccess: (user: any) => void;
  onNavigateToSignup?: () => void;
  onNavigateToForgotPassword?: () => void;
  onNavigate?: (route: string) => void;
}

export const StockSenseLoginPage: React.FC<StockSenseLoginPageProps> = ({
  onLoginSuccess,
  onNavigateToSignup,
  onNavigateToForgotPassword,
  onNavigate,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your Login ID or Email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const response = await login(trimmedEmail, password);
      onLoginSuccess(response);
      onNavigate?.('/dashboard');
    } catch (err: any) {
      console.error('[StockSense Login Error]:', err);
      setError(err?.message || 'Invalid Login ID or Password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* ─── Ethereal Azure Warehouse Background Banner ─── */}
      <div 
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] select-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="relative w-full h-full">
          <img
            src="/stocksense-dashboard-theme.jpg"
            alt="StockSense Azure Warehouse Theme"
            className="w-full h-full object-cover object-[center_28%] opacity-65 filter saturate-[1.10] contrast-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-[#F8FAFC]" />
        </div>
      </div>

      {/* ─── Center Authentication Card matching Reference Sketch ─── */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl p-8 sm:p-10 relative z-10 space-y-7">
        {/* Brand Logo & Name */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Box className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-['Space_Grotesk'] text-2xl font-extrabold text-slate-900 tracking-tight">
              StockSense
            </span>
          </div>

          <div>
            <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Sign in to manage your inventory and warehouse operations
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-700 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Login ID / Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Login ID / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email or login ID"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
                required
              />
            </div>
          </div>

          {/* Password with Show/Hide toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In / Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation Links matching Sketch */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => onNavigateToForgotPassword ? onNavigateToForgotPassword() : onNavigate?.('/forgot-password')}
            className="text-slate-500 hover:text-blue-600 font-medium transition cursor-pointer"
          >
            Forgot Password?
          </button>
          <button
            type="button"
            onClick={() => onNavigateToSignup ? onNavigateToSignup() : onNavigate?.('/signup')}
            className="text-blue-600 hover:text-blue-700 font-semibold transition cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Back to Home / Landing link */}
      <div className="mt-6 text-center z-10">
        <button
          type="button"
          onClick={() => onNavigate ? onNavigate('/') : window.location.assign('/')}
          className="text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          ← Back to StockSense Home
        </button>
      </div>
    </div>
  );
};

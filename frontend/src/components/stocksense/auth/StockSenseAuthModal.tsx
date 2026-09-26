import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  User,
  Building2,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';
import { login, register, requestPasswordResetOtp, verifyResetOtp, resetPasswordWithToken } from '../../../lib/auth';

interface StockSenseAuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: any) => void;
}

export const StockSenseAuthModal: React.FC<StockSenseAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // OTP Reset State
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Status & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Please enter both email and password.');
      }
      await login(email.trim(), password);
      onSuccess({ name: email.split('@')[0], email, role: 'Inventory Manager' });
    } catch (err: any) {
      console.warn('[StockSense Auth] Backend auth failed, checking fallback:', err);
      if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
        setError('Backend server offline. Use the "Fast Demo Access" below to access StockSense immediately.');
      } else {
        setError(err.message || 'Invalid credentials. Please verify your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'Inventory Manager' | 'Warehouse Staff' | 'Auditor') => {
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const demoUser = {
        name: role === 'Inventory Manager' ? 'Marcus Vance' : role === 'Warehouse Staff' ? 'Elena Rostova' : 'Aiden Chen',
        email: role === 'Inventory Manager' ? 'marcus.vance@stocksense.io' : 'staff@stocksense.io',
        role: 'Administrator',
        facility: 'WH-01 Central Logistics',
      };
      localStorage.setItem('dare_token', 'demo_jwt_token_stocksense_2026');
      localStorage.setItem('dare_user', JSON.stringify(demoUser));
      setLoading(false);
      onSuccess(demoUser);
    }, 300);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!adminName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Name, email, and password are required.');
      return;
    }
    if (regPassword !== regConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(adminName.trim(), regEmail.trim(), regPassword);
      setSuccessMsg('Account registered successfully. Signing in...');
      setTimeout(() => {
        onSuccess({ name: adminName, email: regEmail, role: 'Inventory Manager' });
      }, 500);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
        setError('Cannot reach server. Please ensure the backend is running.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!resetEmail.trim()) {
      setError('Please provide your registered account email.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordResetOtp(resetEmail.trim());
      setOtpStep('verify');
      setSuccessMsg(res.message || 'A 6-digit verification code has been dispatched to your email.');
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
        setError('Cannot reach server. Please ensure the backend is running.');
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (otpCode.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Verify the OTP and get a reset token
      const verifyRes = await verifyResetOtp(resetEmail.trim(), otpCode.trim());
      // Step 2: Reset the password with the token
      const resetRes = await resetPasswordWithToken({
        email: resetEmail.trim(),
        resetToken: verifyRes.resetToken,
        newPassword,
      });
      setSuccessMsg(resetRes.message || 'Password updated successfully! Please log in with your new credentials.');
      setMode('login');
      setEmail(resetEmail);
      setOtpStep('request');
      setOtpCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
        setError('Cannot reach server. Please ensure the backend is running.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Light Overlay Backdrop */}
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-modal overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs flex-shrink-0">
              <img
                src="/stocksense-logo.jpg"
                alt="StockSense"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-['Space_Grotesk'] font-bold text-base text-slate-900">Stock</span>
                <span className="font-['Space_Grotesk'] font-bold text-base text-blue-600">Sense</span>
              </div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                Inventory Platform
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 text-center transition cursor-pointer border-b-2 ${
              mode === 'login'
                ? 'border-blue-600 text-blue-600 font-semibold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 text-center transition cursor-pointer border-b-2 ${
              mode === 'register'
                ? 'border-blue-600 text-blue-600 font-semibold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            REGISTER
          </button>
          <button
            type="button"
            onClick={() => { setMode('forgot'); setError(null); setSuccessMsg(null); setOtpStep('request'); }}
            className={`flex-1 py-2.5 text-center transition cursor-pointer border-b-2 ${
              mode === 'forgot'
                ? 'border-blue-600 text-blue-600 font-semibold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            OTP RESET
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {/* ─── Mode: LOGIN ─── */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@stocksense.io"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to StockSense'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Demo Login Shortcuts */}
              <div className="pt-4 border-t border-slate-200 text-center">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-2 font-medium">
                  Instant Demo Access
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('Inventory Manager')}
                    className="p-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Manager Role</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('Warehouse Staff')}
                    className="p-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Staff Role</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ─── Mode: REGISTER ─── */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Facility / Company Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Apex Logistics Corp"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Marcus Vance"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="marcus@apexlogistics.io"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs text-slate-900 placeholder-slate-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-700 mb-1">
                    Confirm
                  </label>
                  <input
                    type="password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs text-slate-900 placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Account...' : 'Register Account'}
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ─── Mode: FORGOT PASSWORD / OTP ─── */}
          {mode === 'forgot' && (
            <div>
              {otpStep === 'request' ? (
                <form onSubmit={handleOtpRequest} className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter your registered email address to receive a 6-digit one-time passcode (OTP) for account verification.
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1.5">
                      Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="operator@stocksense.io"
                        className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Sending OTP...' : 'Send Verification Code'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1.5">
                      6-Digit OTP Code
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="482910"
                        className="w-full bg-white border border-blue-300 focus:border-blue-600 rounded-lg py-2 pl-9 pr-3 text-center tracking-[0.4em] font-mono text-sm text-blue-700 placeholder-slate-400 outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-lg py-2 px-3 text-xs text-slate-900 placeholder-slate-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-lg py-2 px-3 text-xs text-slate-900 placeholder-slate-400 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP & Reset Password'}
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>STOCKSENSE IMS // SECURED</span>
          <span>ENTERPRISE 2026</span>
        </div>
      </div>
    </div>
  );
};

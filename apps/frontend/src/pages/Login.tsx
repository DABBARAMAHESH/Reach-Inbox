import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

type Mode = 'login' | 'register';
type Step = 'form' | 'verify';

export const Login: React.FC = () => {
  const { login, register: registerUser, verifyOtp, resendOtp, devLogin, isLoading } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>('form');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [etherealLink, setEtherealLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'register') {
        const res = await registerUser({ name, email, password });
        if (res.success && res.data?.needsVerification) {
          setEtherealLink(res.data.etherealLink || '');
          setStep('verify');
        }
      } else {
        const res = await login(email, password);
        if (res && res.error === 'EMAIL_NOT_VERIFIED') {
          setEtherealLink(res.data?.etherealLink || '');
          setStep('verify');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong';
      setError(msg);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await verifyOtp(email, otp);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Invalid verification OTP code';
      setError(msg);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    try {
      const res = await resendOtp(email);
      if (res && res.data?.etherealLink) {
        setEtherealLink(res.data.etherealLink);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to resend code';
      setError(msg);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5001/api/auth/google';
  };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Elegant ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-400/8 dark:bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-violet-400/8 dark:bg-violet-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/25">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">ReachInbox</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Distributed Email Campaign Scheduler</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-2xl dark:shadow-black/40 transition-colors duration-200">

          {step === 'form' ? (
            <>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
              </h2>

              {mode === 'register' && (
                <div className="mb-5 p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs rounded-xl leading-relaxed">
                  ℹ️ A verification code will be sent to your email. After verifying, add your SMTP sender in the Senders tab.
                </div>
              )}

              {error && (
                <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === 'login' ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="text-center mt-5">
                <button
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold transition-colors"
                >
                  {mode === 'login' ? 'New here? Create an account →' : 'Already have an account? Sign In'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2 text-center">Verify your Email</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs text-center mb-6">
                We sent a 6-digit code to <strong className="text-slate-800 dark:text-white">{email}</strong>.
              </p>

              {etherealLink && (
                <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl text-center">
                  ✉️ Test mail generated!<br/>
                  <a
                    href={etherealLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-indigo-600 dark:text-indigo-400 font-bold inline-block mt-1 hover:text-indigo-500"
                  >
                    Open Ethereal Mailbox → grab OTP
                  </a>
                </div>
              )}

              {error && (
                <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={`${inputClass} text-center tracking-widest font-bold`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Code'}
                </button>
              </form>

              <div className="flex items-center justify-between mt-5 text-xs">
                <button
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold transition-colors"
                >
                  Resend Code
                </button>
                <button
                  onClick={() => { setStep('form'); setError(''); }}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs text-slate-400 dark:text-slate-600">or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Social login buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handleGoogleLogin}
              className="w-full py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow border border-slate-200 dark:border-slate-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.14 3.01-1.3 4l3.01 2.33c1.74-1.61 2.75-3.98 2.75-6.83z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.01-2.33c-.83.56-1.9.89-3.11.89-2.38 0-4.41-1.61-5.13-3.77L2.65 18.2C4.63 22.13 8.78 24 12 24z" />
                <path fill="#FBBC05" d="M6.87 15.88c-.18-.56-.29-1.16-.29-1.78s.11-1.22.29-1.78L3.7 9.87C2.93 11.4 2.5 13.1 2.5 14.88c0 1.78.43 3.48 1.2 5l3.17-2.43z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 8.78 0 4.63 1.87 2.65 5.8l3.17 2.43c.72-2.16 2.75-3.77 5.13-3.77z" />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => devLogin()}
              disabled={isLoading}
              className="w-full py-2.5 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-sm font-semibold rounded-xl transition-all"
            >
              ⚡ Quick Dev Login (Local Test)
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
          ReachInbox · Distributed Email Scheduling Platform
        </p>
      </div>
    </div>
  );
};

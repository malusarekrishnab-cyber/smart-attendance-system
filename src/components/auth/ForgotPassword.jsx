import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hash, KeyRound, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ForgotPassword({ onBack }) {
  const [step, setStep] = useState(1); // 1=enter enrollment, 2=enter OTP, 3=new password
  const [enrollment, setEnrollment] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');

  const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!enrollment.trim()) {
      toast.error('Please enter your enrollment number');
      return;
    }
    const accounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
    const account = accounts.find(a => a.enrollment === enrollment.trim() && a.role === 'student');
    if (!account) {
      toast.error('No student account found with this enrollment number');
      return;
    }
    setIsLoading(true);
    const code = generateOtp();
    setGeneratedOtp(code);
    setAccountEmail(account.email || '');
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      toast.success('OTP generated! (Demo mode — shown below. Connect Gmail for real email delivery.)');
    }, 800);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.trim() !== generatedOtp) {
      toast.error('Incorrect OTP. Please try again.');
      return;
    }
    setStep(3);
    toast.success('OTP verified! Set your new password.');
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const accounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
      const updated = accounts.map(a =>
        a.enrollment === enrollment.trim() && a.role === 'student'
          ? { ...a, password: newPassword.trim() }
          : a
      );
      localStorage.setItem('registeredAccounts', JSON.stringify(updated));
      setIsLoading(false);
      toast.success('Password reset successfully! Please sign in.');
      onBack();
    }, 600);
  };

  return (
    <motion.form
      key="forgot"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onSubmit={step === 1 ? handleSendOtp : step === 2 ? handleVerifyOtp : handleResetPassword}
      className="space-y-4"
    >
      <button type="button" onClick={onBack} className="text-blue-300/70 hover:text-blue-200 text-sm inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" />Back to Sign In
      </button>

      {step === 1 && (
        <>
          <div className="text-center mb-2">
            <KeyRound className="w-10 h-10 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-blue-200/60">Enter your enrollment number to receive a password reset OTP.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="forgot-enrollment" className="text-blue-100">Enrollment Number</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
              <Input id="forgot-enrollment" type="text" placeholder="e.g., 2024001" value={enrollment} onChange={(e) => setEnrollment(e.target.value)} className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200/40 focus:border-blue-400 focus:ring-blue-400/20 font-mono" />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/30">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5 mr-2" />}
            Send OTP
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="text-center mb-2">
            <ShieldCheck className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-blue-200/60">Enter the 6-digit OTP sent to your email.</p>
          </div>
          {accountEmail && (
            <p className="text-xs text-center text-blue-200/40">Sent to: {accountEmail}</p>
          )}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
            <p className="text-xs text-amber-200/60 mb-1">Demo Mode — OTP (connect Gmail for real email):</p>
            <p className="text-2xl font-bold tracking-widest text-amber-300">{generatedOtp}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="otp-input" className="text-blue-100">Enter OTP</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
              <Input id="otp-input" type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200/40 focus:border-blue-400 focus:ring-blue-400/20 text-center text-lg tracking-widest font-mono" />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/30">
            Verify OTP
          </Button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="text-center mb-2">
            <Lock className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-blue-200/60">Set your new password.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-blue-100">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
              <Input id="new-password" type={showPassword ? 'text' : 'password'} placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-11 pr-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200/40 focus:border-blue-400 focus:ring-blue-400/20" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-blue-200 transition-colors">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-500/30">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
          </Button>
        </>
      )}
    </motion.form>
  );
}
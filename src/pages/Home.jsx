import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, User, Lock, Eye, EyeOff, Loader2, UserPlus, LogIn, Hash, Mail, Shield, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Student, Attendance, Leave, Warning, WorkingDay } from "@/api/entityClient";import ForgotPassword from '@/components/auth/ForgotPassword';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [mode, setMode] = useState('signup');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [enrollment, setEnrollment] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const getAccounts = () => JSON.parse(localStorage.getItem('registeredAccounts') || '[]');

  const isInstituteEmail = (email) => {
    return email.endsWith('.ac.in') || email.endsWith('.edu') || email.endsWith('.edu.in');
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    if (role === 'student') {
      if (!enrollment.trim()) { toast.error('Please enter enrollment number'); return; }
      // Protection: enrollment must exist in Student entity (teacher must have added the student)
      try {
        const existingStudents = await Student.filter({ enrollment_number: enrollment.trim() });
        if (existingStudents.length === 0) {
          toast.error('This enrollment number is not registered by your teacher. Please contact your teacher to be added first.');
          return;
        }
      } catch (err) {
        toast.error('Unable to verify enrollment. Please try again.');
        return;
      }
    }
    if (role === 'teacher') {
      if (!username.trim()) { toast.error('Please enter username'); return; }
      const currentTeacherCode = localStorage.getItem('teacherAccessCode') || 'TEACHER2026';
      if (teacherCode.trim() !== currentTeacherCode) {
        toast.error('Invalid teacher access code');
        return;
      }
    }
    if (role === 'admin') {
      if (!email.trim()) { toast.error('Please enter institute email'); return; }
      if (!isInstituteEmail(email.trim())) {
        toast.error('Please use a valid institute email (.ac.in / .edu)');
        return;
      }
      const currentAdminCode = localStorage.getItem('adminAccessCode') || 'ADMIN2026';
      if (adminCode.trim() !== currentAdminCode) {
        toast.error('Invalid admin access code');
        return;
      }
    }

    const accounts = getAccounts();
    const identifier = role === 'admin' ? email.trim() : role === 'student' ? enrollment.trim() : username.trim();
    if (accounts.find(a => a.identifier === identifier)) {
      toast.error('Account already exists. Please sign in.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const account = {
        id: `acc_${Date.now()}`,
        name: name.trim(),
        identifier,
        username: role === 'admin' ? email.trim() : role === 'student' ? enrollment.trim() : username.trim(),
        email: role === 'admin' ? email.trim() : null,
        password: password.trim(),
        role,
        enrollment: role === 'student' ? enrollment.trim() : null,
        created_date: new Date().toISOString()
      };
      accounts.push(account);
      localStorage.setItem('registeredAccounts', JSON.stringify(accounts));
      localStorage.setItem('userRole', role);
      localStorage.setItem('userName', name.trim());
      localStorage.setItem('isLoggedIn', 'true');
      if (role === 'student') {
        localStorage.setItem('studentEnrollment', enrollment.trim());
      }
      if (role === 'admin') {
        localStorage.setItem('adminEmail', email.trim());
      }
      toast.success(`Account created! Welcome, ${name.trim()}!`);
      navigate(createPageUrl(role === 'student' ? 'StudentDashboard' : role === 'teacher' ? 'TeacherDashboard' : 'AdminDashboard'));
      setIsLoading(false);
    }, 800);
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter credentials');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const accounts = getAccounts();
      // Find account by username, email, or enrollment number
      const account = accounts.find(a =>
        a.username === username.trim() ||
        a.email === username.trim() ||
        (a.enrollment && a.enrollment.toLowerCase() === username.trim().toLowerCase())
      );
      if (!account) {
        setIsLoading(false);
        toast.error('Account not found! No account exists with this username, email, or enrollment number.');
        return;
      }
      if (account.password !== password.trim()) {
        setIsLoading(false);
        toast.error(`Incorrect password! Please check your password and try again.`);
        return;
      }
      // Save data with id and old id for tracking
      const oldAccountId = account.id || null;
      const newAccountId = account.id || `acc_${Date.now()}`;
      account.id = newAccountId;
      account.old_id = oldAccountId;
      account.last_login = new Date().toISOString();
      const updatedAccounts = accounts.map(a => a.identifier === account.identifier ? account : a);
      localStorage.setItem('registeredAccounts', JSON.stringify(updatedAccounts));
      localStorage.setItem('userRole', account.role);
      localStorage.setItem('userName', account.name);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('accountId', newAccountId);
      if (account.role === 'student' && account.enrollment) {
        localStorage.setItem('studentEnrollment', account.enrollment);
      }
      if (account.role === 'admin' && account.email) {
        localStorage.setItem('adminEmail', account.email);
      }
      toast.success(`Welcome back, ${account.name}!`);
      navigate(createPageUrl(account.role === 'student' ? 'StudentDashboard' : account.role === 'teacher' ? 'TeacherDashboard' : 'AdminDashboard'));
      setIsLoading(false);
    }, 800);
  };

  if (showSplash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center">
          <motion.div initial={{ y: -20 }} animate={{ y: 0 }} transition={{ delay: 0.3, type: "spring", stiffness: 200 }} className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl shadow-blue-500/30 mb-6">
            <GraduationCap className="w-12 h-12 text-white" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-4xl font-bold text-white mb-3">Smart Attendance</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-blue-200/70">Diploma Engineering Project</motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const roleButtonClass = (r) => `flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${role === r ? 'border-blue-400 bg-blue-500/20 text-white' : 'border-white/10 bg-white/5 text-blue-200/60 hover:border-white/20'}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl shadow-blue-500/30 mb-4">
              <GraduationCap className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Smart Attendance</h1>
            <p className="text-blue-200/70 mt-2">Diploma Engineering Project</p>
          </div>

          <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-2">
                <button onClick={() => setMode('signup')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' : 'text-blue-200/70 hover:text-white'}`}>
                  <UserPlus className="w-4 h-4" />Create Account
                </button>
                <button onClick={() => setMode('signin')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'signin' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' : 'text-blue-200/70 hover:text-white'}`}>
                  <LogIn className="w-4 h-4" />Sign In
                </button>
              </div>
              <CardTitle className="text-2xl text-white text-center">{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</CardTitle>
              <CardDescription className="text-blue-200/60 text-center">{mode === 'signup' ? 'Choose your role and get started' : 'Enter your credentials to continue'}</CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {mode === 'signup' ? (
                  <motion.form key="signup" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-blue-100">Select Role</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => setRole('student')} className={roleButtonClass('student')}>
                          <GraduationCap className="w-5 h-5" /><span className="text-xs font-semibold">Student</span>
                        </button>
                        <button type="button" onClick={() => setRole('teacher')} className={roleButtonClass('teacher')}>
                          <User className="w-5 h-5" /><span className="text-xs font-semibold">Teacher</span>
                        </button>
                        <button type="button" onClick={() => setRole('admin')} className={roleButtonClass('admin')}>
                          <Shield className="w-5 h-5" /><span className="text-xs font-semibold">Admin</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-blue-100">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
                        <Input id="name" type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200/40 focus:border-blue-400 focus:ring-blue-400/20" />
                      </div>
                    </div>

                    {role === 'teacher' && (
                      <div className="space-y-2">
                        <Label htmlFor="su-username" className="text-blue-100">Username</Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
                          <Input id="su-username" type="text" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200/40 focus:border-blue-400 focus:ring-blue-400/20" />
                        </div>
                      </div>
                    )}

                    {role === 'admin' && (
                      <div className="space-y-2">
                        <Label htmlFor="su-email" className="text-blue-100">Institute Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
                          <Input id="su-email" type="email" placeholder="admin@institute.ac.in" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200/40 focus:border-blue-400 focus:ring-blue-400/20" />
                        </div>
                        <p className="text-xs text-blue-200/40">Must end with .ac.in, .edu, or .edu.in</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="su-password" className="text-blue-100">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
                        <Input id="su-password" type={showPassword ? 'text' : 'password'} placeholder="Choose a password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200/40 focus:border-blue-400 focus:ring-blue-400/20" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-blue-200 transition-colors">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {role === 'student' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                        <Label htmlFor="enrollment" className="text-blue-100">Enrollment Number</Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
                          <Input id="enrollment" type="text" placeholder="e.g., 2024001" value={enrollment} onChange={(e) => setEnrollment(e.target.value)} className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200/40 focus:border-blue-400 focus:ring-blue-400/20 font-mono" />
                        </div>
                        <p className="text-xs text-blue-200/40 text-center">Your enrollment must be added by your teacher first</p>
                      </motion.div>
                    )}

                    {role === 'teacher' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                        <Label htmlFor="teacherCode" className="text-blue-100">Teacher Access Code</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
                          <Input id="teacherCode" type="password" placeholder="Enter access code" value={teacherCode} onChange={(e) => setTeacherCode(e.target.value)} className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200/40 focus:border-blue-400 focus:ring-blue-400/20" />
                        </div>
                        <p className="text-xs text-blue-200/40 text-center">Only authorized teachers can create accounts</p>
                      </motion.div>
                    )}

                    {role === 'admin' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                        <Label htmlFor="adminCode" className="text-blue-100">Admin Access Code</Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
                          <Input id="adminCode" type="password" placeholder="Enter admin code" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200/40 focus:border-blue-400 focus:ring-blue-400/20" />
                        </div>
                        <p className="text-xs text-blue-200/40 text-center">Requires institute email + admin code</p>
                      </motion.div>
                    )}

                    <Button type="submit" disabled={isLoading} className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                    </Button>
                  </motion.form>
                ) : mode === 'signin' ? (
                  <motion.form key="signin" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="si-username" className="text-blue-100">Enrollment No., Email, or Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
                        <Input id="si-username" type="text" placeholder="Enter username, email, or enrollment" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200/40 focus:border-blue-400 focus:ring-blue-400/20" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="si-password" className="text-blue-100">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
                        <Input id="si-password" type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200/40 focus:border-blue-400 focus:ring-blue-400/20" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-blue-200 transition-colors">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                    </Button>
                    <p className="text-center text-sm text-blue-200/50">
                      Don't have an account?{' '}
                      <button type="button" onClick={() => setMode('signup')} className="text-blue-300 hover:text-blue-200 font-semibold underline">Create one</button>
                    </p>
                    <p className="text-center">
                      <button type="button" onClick={() => setMode('forgot')} className="text-sm text-blue-300/70 hover:text-blue-200 underline inline-flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5" />Forgot Password?
                      </button>
                    </p>
                  </motion.form>
                ) : (
                  <ForgotPassword onBack={() => setMode('signin')} />
                )}
              </AnimatePresence>

              {mode === 'signup' && (
                <p className="text-center text-sm text-blue-200/50 mt-4">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setMode('signin')} className="text-blue-300 hover:text-blue-200 font-semibold underline">Sign In</button>
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <footer className="relative z-10 py-4 text-center">
        <p className="text-blue-200/40 text-sm">Smart Attendance System – Diploma Engineering Project</p>
      </footer>
    </div>
  );
}
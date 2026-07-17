import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap, LogOut, ArrowLeft, Loader2, CreditCard,
  CheckCircle2, User, Hash, ScanLine, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { format } from 'date-fns';

export default function ScanAttendance() {
  const [uid, setUid] = useState('');
  const [students, setStudents] = useState([]);
  const [lastScanned, setLastScanned] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    if (!isLoggedIn || userRole !== 'teacher') {
      toast.error('Please login first');
      navigate(createPageUrl('Home'));
      return;
    }
    fetchStudents();
  }, [navigate]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [students]);

  const fetchStudents = async () => {
    const all = await Student.list();
    setStudents(all);
  };

  const handleScan = async (e) => {
    e?.preventDefault();
    const trimmedUid = uid.trim();
    if (!trimmedUid || isProcessing) return;

    setIsProcessing(true);
    try {
      const student = students.find(s => s.rfid_uid && s.rfid_uid.trim() === trimmedUid);
      if (!student) {
        toast.error(`No student found for RFID: ${trimmedUid}`);
        setLastScanned({ status: 'error', uid: trimmedUid, name: 'Unknown', enrollment: 'N/A' });
        setScanHistory(prev => [{ status: 'error', uid: trimmedUid, name: 'Unknown', enrollment: 'N/A', time: new Date() }, ...prev].slice(0, 10));
        setUid('');
        inputRef.current?.focus();
        return;
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Check if already marked today
      const existing = await Attendance.filter({
        date: today,
        enrollment_number: student.enrollment_number
      });

      if (existing.length > 0) {
        if (existing[0].status === 'present') {
          toast.warning(`${student.name} already marked present today`);
          setLastScanned({ status: 'duplicate', uid: trimmedUid, name: student.name, enrollment: student.enrollment_number });
          setScanHistory(prev => [{ status: 'duplicate', uid: trimmedUid, name: student.name, enrollment: student.enrollment_number, time: now }, ...prev].slice(0, 10));
        } else {
          // Update to present
          await Attendance.update(existing[0].id, { status: 'present' });
          toast.success(`${student.name} marked present!`);
          setLastScanned({ status: 'present', uid: trimmedUid, name: student.name, enrollment: student.enrollment_number });
          setScanHistory(prev => [{ status: 'present', uid: trimmedUid, name: student.name, enrollment: student.enrollment_number, time: now }, ...prev].slice(0, 10));
        }
      } else {
        // Create new present record
        await Attendance.create({
          enrollment_number: student.enrollment_number,
          date: today,
          status: 'present',
          month,
          year
        });
        toast.success(`${student.name} marked present!`);
        setLastScanned({ status: 'present', uid: trimmedUid, name: student.name, enrollment: student.enrollment_number });
        setScanHistory(prev => [{ status: 'present', uid: trimmedUid, name: student.name, enrollment: student.enrollment_number, time: now }, ...prev].slice(0, 10));
      }
    } catch (err) {
      toast.error('Failed to process scan');
    }
    setUid('');
    inputRef.current?.focus();
    setIsProcessing(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully');
    navigate(createPageUrl('Home'));
  };

  const statusConfig = {
    present: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Present' },
    duplicate: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Already Present' },
    error: { icon: User, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Not Found' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800">RFID Attendance</h1>
                <p className="text-xs text-slate-500">Scan Card / Enter UID</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-slate-600 hover:text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" /><span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <Button variant="outline" onClick={() => navigate(createPageUrl('TeacherDashboard'))} className="mb-4 border-slate-200">
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
        </Button>

        {/* Scan Box */}
        <Card className="border-0 shadow-xl bg-white mb-6">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30"
              >
                <ScanLine className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold text-slate-800">Scan RFID Card</h2>
              <p className="text-sm text-slate-500 mt-1">Tap card on reader or type UID below</p>
            </div>

            <form onSubmit={handleScan} className="space-y-4">
              <div className="relative">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter RFID UID..."
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  autoFocus
                  className="h-14 text-center text-lg font-mono border-2 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400/20 uppercase"
                />
              </div>
              <Button type="submit" disabled={isProcessing || !uid.trim()} className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/30">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-5 h-5 mr-2" />Mark Present</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Last Scanned Result */}
        <AnimatePresence mode="wait">
          {lastScanned && (
            <motion.div
              key={lastScanned.uid + lastScanned.time?.getTime()}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <Card className={`border-2 ${statusConfig[lastScanned.status].border} ${statusConfig[lastScanned.status].bg} shadow-md`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${statusConfig[lastScanned.status].bg} rounded-2xl flex items-center justify-center`}>
                      {(() => {
                        const Icon = statusConfig[lastScanned.status].icon;
                        return <Icon className={`w-7 h-7 ${statusConfig[lastScanned.status].color}`} />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <p className={`text-lg font-bold ${statusConfig[lastScanned.status].color}`}>{statusConfig[lastScanned.status].label}</p>
                      <p className="font-semibold text-slate-800">{lastScanned.name}</p>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Hash className="w-3 h-3" />{lastScanned.enrollment}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">UID</p>
                      <p className="font-mono text-sm text-slate-600">{lastScanned.uid}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />Recent Scans
              </h3>
              <div className="space-y-2">
                {scanHistory.map((scan, idx) => {
                  const Icon = statusConfig[scan.status].icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                      <Icon className={`w-4 h-4 ${statusConfig[scan.status].color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{scan.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{scan.uid}</p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {format(scan.time, 'HH:mm:ss')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="py-4 text-center border-t border-slate-200 bg-white/50">
        <p className="text-slate-500 text-sm">Smart Attendance System – RFID Card Mode</p>
      </footer>
    </div>
  );
}
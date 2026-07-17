import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  GraduationCap, LogOut, Users, BookOpen, Percent, CheckCircle2,
  XCircle, Loader2, ClipboardList, Shield, Mail, ArrowLeft, Key, Save, Eye, EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Student, Attendance, Leave, Warning, WorkingDay } from "@/api/entityClient";
import AccountManager from '@/components/admin/AccountManager';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teacherCode, setTeacherCode] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showTeacherCode, setShowTeacherCode] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [savingCode, setSavingCode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    if (!isLoggedIn || userRole !== 'admin') {
      toast.error('Admin access required');
      navigate(createPageUrl('Home'));
      return;
    }
    setTeacherCode(localStorage.getItem('teacherAccessCode') || 'TEACHER2026');
    setAdminCode(localStorage.getItem('adminAccessCode') || 'ADMIN2026');
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    const allStudents = await Student.list();
    const allLeaves = await Leave.list();
    const allAttendance = await Attendance.list();
    setStudents(allStudents);
    setLeaves(allLeaves);
    setAttendance(allAttendance);
    setIsLoading(false);
  };

  const handleLeaveAction = async (leaveId, status) => {
    await Leave.update(leaveId, { status });
    toast.success(`Leave ${status}`);
    fetchData();
  };

  const handleSaveCodes = () => {
    if (!teacherCode.trim() || !adminCode.trim()) {
      toast.error('Access codes cannot be empty');
      return;
    }
    setSavingCode(true);
    localStorage.setItem('teacherAccessCode', teacherCode.trim());
    localStorage.setItem('adminAccessCode', adminCode.trim());
    setTimeout(() => {
      setSavingCode(false);
      toast.success('Access codes updated successfully');
    }, 500);
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully');
    navigate(createPageUrl('Home'));
  };

  const totalPresent = attendance.filter(a => a.status === 'present').length;
  const totalAbsent = attendance.filter(a => a.status === 'absent').length;
  const avgPercentage = attendance.length > 0 ? (totalPresent / (totalPresent + totalAbsent)) * 100 : 0;
  const pendingLeaves = leaves.filter(l => l.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">{localStorage.getItem('adminEmail') || 'Administrator'}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-slate-600 hover:text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {isLoading ? (
          <Card className="border-0 shadow-md"><CardContent className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></CardContent></Card>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-slate-700" />
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Institute Overview</h2>
                <p className="text-slate-500">Complete attendance management</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-800">{students.length}</p>
                  <p className="text-xs text-slate-500">Total Students</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-800">{attendance.length}</p>
                  <p className="text-xs text-slate-500">Total Records</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 text-center">
                  <Percent className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className={`text-2xl font-bold ${avgPercentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>{avgPercentage.toFixed(1)}%</p>
                  <p className="text-xs text-slate-500">Avg Attendance</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 text-center">
                  <ClipboardList className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-600">{pendingLeaves.length}</p>
                  <p className="text-xs text-slate-500">Pending Leaves</p>
                </CardContent>
              </Card>
            </div>

            {/* Access Code Settings */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Key className="w-5 h-5 text-indigo-600" />
                  Access Code Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Teacher Access Code</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input type={showTeacherCode ? 'text' : 'password'} value={teacherCode} onChange={(e) => setTeacherCode(e.target.value)} className="pl-9 pr-9 border-slate-200" />
                      <button type="button" onClick={() => setShowTeacherCode(!showTeacherCode)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showTeacherCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Required for new teacher account creation</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Admin Access Code</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input type={showAdminCode ? 'text' : 'password'} value={adminCode} onChange={(e) => setAdminCode(e.target.value)} className="pl-9 pr-9 border-slate-200" />
                      <button type="button" onClick={() => setShowAdminCode(!showAdminCode)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showAdminCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Required for new admin account creation</p>
                  </div>
                </div>
                <Button onClick={handleSaveCodes} disabled={savingCode} className="bg-indigo-600 hover:bg-indigo-700">
                  {savingCode ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save Access Codes
                </Button>
              </CardContent>
            </Card>

            {/* Leave Applications */}
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                  Leave Applications
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold min-w-[120px]">Student</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">Enrollment</TableHead>
                    <TableHead className="font-semibold min-w-[160px]">Dates</TableHead>
                    <TableHead className="font-semibold min-w-[150px]">Reason</TableHead>
                    <TableHead className="font-semibold text-center min-w-[90px]">Status</TableHead>
                    <TableHead className="font-semibold text-center min-w-[160px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">No leave applications</TableCell></TableRow>
                  ) : (
                    leaves.map((leave) => (
                      <TableRow key={leave.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{leave.student_name}</TableCell>
                        <TableCell className="font-mono text-sm">{leave.enrollment_number}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{leave.from_date} → {leave.to_date}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{leave.reason}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-0' : leave.status === 'rejected' ? 'bg-red-100 text-red-700 border-0' : 'bg-amber-100 text-amber-700 border-0'}>
                            {leave.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {leave.status === 'pending' && (
                            <div className="flex gap-1 justify-center">
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={() => handleLeaveAction(leave.id, 'approved')}>Approve</Button>
                              <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-8" onClick={() => handleLeaveAction(leave.id, 'rejected')}>Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </Card>

            {/* Account Management */}
            <AccountManager />

            {/* All Students */}
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                  All Students
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold min-w-[120px]">Enrollment</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">Name</TableHead>
                    <TableHead className="font-semibold min-w-[100px]">Branch</TableHead>
                    <TableHead className="font-semibold text-center min-w-[80px]">Semester</TableHead>
                    <TableHead className="font-semibold text-center min-w-[80px]">Present</TableHead>
                    <TableHead className="font-semibold text-center min-w-[80px]">Absent</TableHead>
                    <TableHead className="font-semibold text-center min-w-[80px]">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const studentAttendance = attendance.filter(a => a.enrollment_number === student.enrollment_number);
                    const present = studentAttendance.filter(a => a.status === 'present').length;
                    const absent = studentAttendance.filter(a => a.status === 'absent').length;
                    const total = present + absent;
                    const pct = total > 0 ? (present / total) * 100 : 0;
                    return (
                      <TableRow key={student.id} className="hover:bg-slate-50">
                        <TableCell className="font-mono font-medium">{student.enrollment_number}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-sm">{student.branch}</TableCell>
                        <TableCell className="text-center">{student.semester}</TableCell>
                        <TableCell className="text-center"><span className="inline-block px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-sm">{present}</span></TableCell>
                        <TableCell className="text-center"><span className="inline-block px-3 py-1 rounded-lg bg-red-50 text-red-700 font-semibold text-sm">{absent}</span></TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${pct >= 75 ? 'bg-emerald-100 text-emerald-700' : pct >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'} border-0 font-semibold`}>
                            {pct.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </Card>
          </motion.div>
        )}
      </main>

      <footer className="py-4 text-center border-t border-slate-200 bg-white/50">
        <p className="text-slate-500 text-sm">Smart Attendance System – Diploma Engineering Project</p>
      </footer>
    </div>
  );
}
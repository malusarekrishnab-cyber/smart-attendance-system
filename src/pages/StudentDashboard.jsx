import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GraduationCap, LogOut, Calendar, CalendarDays,
  CheckCircle2, XCircle, Loader2, Download, User,
  BookOpen, Percent, ClipboardList, ArrowLeft, FileText, AlertTriangle, Send,
  KeyRound, Eye, EyeOff, BellRing, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Student, Attendance, Leave, Warning, WorkingDay } from "@/api/entityClient";

import { format, getDaysInMonth, startOfMonth, addDays } from 'date-fns';
import { generatePDF } from '@/lib/pdfUtils';
import AttendanceCalendar from '@/components/AttendanceCalendar';
import { AttendanceTrendChart } from '@/components/AttendanceChart';

const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
  { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
  { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function StudentDashboard() {
  const [enrollment, setEnrollment] = useState('');
  const [studentName, setStudentName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1 + '');
  const [selectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [semesterData, setSemesterData] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState({ totalLectures: 0, present: 0, absent: 0, percentage: 0 });
  const [semesterSummary, setSemesterSummary] = useState({ totalLectures: 0, present: 0, absent: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('monthly');
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [myLeaves, setMyLeaves] = useState([]);
  const [showChangePass, setShowChangePass] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    const savedEnrollment = localStorage.getItem('studentEnrollment');
    if (!isLoggedIn || userRole !== 'student') {
      toast.error('Please login first');
      navigate(createPageUrl('Home'));
      return;
    }
    if (savedEnrollment) setEnrollment(savedEnrollment);
  }, [navigate]);

  useEffect(() => {
    if (enrollment) fetchData();
  }, [enrollment, selectedMonth, activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    const students = await Student.filter({ enrollment_number: enrollment });
    if (students.length > 0) setStudentName(students[0].name);
    else setStudentName('Student');
    const attendance = await Attendance.filter({ enrollment_number: enrollment });
    setAllAttendance(attendance);
    const leaves = await Leave.filter({ enrollment_number: enrollment });
    setMyLeaves(leaves);
    const studentWarnings = await Warning.filter({ enrollment_number: enrollment });
    setWarnings(studentWarnings);
    if (activeTab === 'monthly') await fetchMonthlyData(attendance);
    else await fetchSemesterData(attendance);
    setIsLoading(false);
  };

  const fetchMonthlyData = async (attendance) => {
    const monthNum = parseInt(selectedMonth);
    const daysInMonth = getDaysInMonth(new Date(selectedYear, monthNum - 1));
    const monthStart = startOfMonth(new Date(selectedYear, monthNum - 1));
    const fullMonthData = [];
    let totalLectures = 0, present = 0, absent = 0;
    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = addDays(monthStart, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const existingRecord = attendance.find(a => a.date === dateStr);
      const isSunday = currentDate.getDay() === 0;
      let status = 'absent';
      if (existingRecord) status = existingRecord.status;
      else if (isSunday) status = 'holiday';
      if (status !== 'holiday') { totalLectures++; if (status === 'present') present++; else absent++; }
      fullMonthData.push({ date: dateStr, day: format(currentDate, 'EEEE'), status });
    }
    setMonthlyData(fullMonthData);
    setMonthlySummary({ totalLectures, present, absent, percentage: totalLectures > 0 ? (present / totalLectures) * 100 : 0 });
  };

  const fetchSemesterData = async (attendance) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const semesterMonths = [];
    for (let i = 5; i >= 0; i--) {
      let month = currentMonth - i, year = currentYear;
      if (month <= 0) { month += 12; year -= 1; }
      semesterMonths.push({ month, year });
    }
    const monthlyAgg = [];
    let totalLectures = 0, totalPresent = 0, totalAbsent = 0;
    for (const { month, year } of semesterMonths) {
      const daysInMonth = getDaysInMonth(new Date(year, month - 1));
      const monthStart = startOfMonth(new Date(year, month - 1));
      let lectures = 0, present = 0, absent = 0;
      for (let i = 0; i < daysInMonth; i++) {
        const currentDay = addDays(monthStart, i);
        const dateStr = format(currentDay, 'yyyy-MM-dd');
        const isSunday = currentDay.getDay() === 0;
        const existingRecord = attendance.find(a => a.date === dateStr);
        let status = 'absent';
        if (existingRecord) status = existingRecord.status;
        else if (isSunday) status = 'holiday';
        if (status !== 'holiday') { lectures++; if (status === 'present') present++; else absent++; }
      }
      monthlyAgg.push({ month, year, monthName: `${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`, totalLectures: lectures, present, absent, percentage: lectures > 0 ? (present / lectures) * 100 : 0 });
      totalLectures += lectures; totalPresent += present; totalAbsent += absent;
    }
    setSemesterData(monthlyAgg);
    setSemesterSummary({ totalLectures, present: totalPresent, absent: totalAbsent, percentage: totalLectures > 0 ? (totalPresent / totalLectures) * 100 : 0 });
  };

  const handleChangePassword = () => {
    if (!currentPass || !newPass || !confirmPass) {
      toast.error('Please fill all fields');
      return;
    }
    if (newPass !== confirmPass) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPass.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    const accounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
    const account = accounts.find(a => a.identifier === enrollment && a.role === 'student');
    if (!account) {
      toast.error('Account not found');
      return;
    }
    if (account.password !== currentPass) {
      toast.error('Current password is incorrect');
      return;
    }
    setChangingPass(true);
    setTimeout(() => {
      account.password = newPass;
      localStorage.setItem('registeredAccounts', JSON.stringify(accounts));
      toast.success('Password changed successfully');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
      setShowChangePass(false);
      setChangingPass(false);
    }, 500);
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully');
    navigate(createPageUrl('Home'));
  };

  const downloadCSV = () => {
    const summary = activeTab === 'monthly' ? monthlySummary : semesterSummary;
    const data = activeTab === 'monthly' ? monthlyData : semesterData;
    const title = activeTab === 'monthly' ? `Monthly Attendance - ${MONTHS[parseInt(selectedMonth) - 1]?.label} ${selectedYear}` : 'Semester Attendance Report';
    let csvContent = 'Smart Attendance System\nDiploma Engineering Project\n' + title + '\n\n';
    csvContent += `Enrollment No,${enrollment}\nName,${studentName}\n\n`;
    if (activeTab === 'monthly') {
      csvContent += 'Date,Day,Status\n';
      data.forEach(row => { csvContent += `${format(new Date(row.date), 'dd MMM yyyy')},${row.day},${row.status}\n`; });
    } else {
      csvContent += 'Month,Total Lectures,Present,Absent,Percentage\n';
      data.forEach(row => { csvContent += `${row.monthName},${row.totalLectures},${row.present},${row.absent},${row.percentage.toFixed(1)}%\n`; });
    }
    csvContent += '\nSummary\n' + `Total Lectures,${summary.totalLectures}\nPresent,${summary.present}\nAbsent,${summary.absent}\nAttendance %,${summary.percentage.toFixed(1)}%\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Attendance_${enrollment}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Excel report downloaded');
  };

  const downloadPDF = () => {
    const summary = activeTab === 'monthly' ? monthlySummary : semesterSummary;
    const subtitle = `<p><strong>Enrollment:</strong> ${enrollment}</p><p><strong>Name:</strong> ${studentName}</p>`;
    let content = '';
    if (activeTab === 'monthly') {
      content = '<table><thead><tr><th>Date</th><th>Day</th><th>Status</th></tr></thead><tbody>';
      monthlyData.forEach(row => {
        content += `<tr><td>${format(new Date(row.date), 'dd MMM yyyy')}</td><td>${row.day}</td><td class="${row.status}">${row.status}</td></tr>`;
      });
      content += '</tbody></table>';
    } else {
      content = '<table><thead><tr><th>Month</th><th>Total</th><th>Present</th><th>Absent</th><th>%</th></tr></thead><tbody>';
      semesterData.forEach(row => {
        content += `<tr><td>${row.monthName}</td><td>${row.totalLectures}</td><td>${row.present}</td><td>${row.absent}</td><td>${row.percentage.toFixed(1)}%</td></tr>`;
      });
      content += '</tbody></table>';
    }
    content += `<div class="summary-grid"><div class="summary-card"><div class="label">Total Lectures</div><div class="value">${summary.totalLectures}</div></div><div class="summary-card"><div class="label">Present</div><div class="value" style="color:#059669">${summary.present}</div></div><div class="summary-card"><div class="label">Absent</div><div class="value" style="color:#dc2626">${summary.absent}</div></div><div class="summary-card"><div class="label">Attendance %</div><div class="value" style="color:${summary.percentage >= 75 ? '#059669' : '#f59e0b'}">${summary.percentage.toFixed(1)}%</div></div></div>`;
    const title = activeTab === 'monthly' ? `Monthly Attendance – ${MONTHS[parseInt(selectedMonth) - 1]?.label} ${selectedYear}` : 'Semester Attendance Report';
    generatePDF(title, subtitle, content);
    toast.success('PDF report opened — use "Save as PDF"');
  };

  const handleLeaveSubmit = async () => {
    if (!leaveFrom || !leaveTo || !leaveReason.trim()) {
      toast.error('Please fill all leave details');
      return;
    }
    await Leave.create({
      enrollment_number: enrollment,
      student_name: studentName,
      from_date: leaveFrom,
      to_date: leaveTo,
      reason: leaveReason.trim(),
      status: 'pending'
    });
    toast.success('Leave application submitted');
    setShowLeaveForm(false);
    setLeaveFrom(''); setLeaveTo(''); setLeaveReason('');
    fetchData();
  };

  const getStatusBadge = (status) => {
    if (status === 'present') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border"><CheckCircle2 className="w-3 h-3 mr-1" />Present</Badge>;
    if (status === 'absent') return <Badge className="bg-red-100 text-red-700 border-red-200 border"><XCircle className="w-3 h-3 mr-1" />Absent</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 border"><Calendar className="w-3 h-3 mr-1" />Holiday</Badge>;
  };

  const currentSummary = activeTab === 'monthly' ? monthlySummary : semesterSummary;
  const lowAttendance = currentSummary.percentage > 0 && currentSummary.percentage < 75;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800">Smart Attendance</h1>
                <p className="text-xs text-slate-500">Student Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowChangePass(!showChangePass)} className={`shrink-0 ${showChangePass ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}>
                <KeyRound className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Change Password</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowLeaveForm(!showLeaveForm)} className="border-amber-200 text-amber-700 hover:bg-amber-50 shrink-0">
                <Send className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Apply Leave</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 hover:text-red-600 hover:bg-red-50 shrink-0">
                <LogOut className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Student Info */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="text-white">
                  <h2 className="text-xl font-bold">{studentName}</h2>
                  <p className="text-blue-100">Enrollment: {enrollment}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Form */}
          {showChangePass && (
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><KeyRound className="w-5 h-5 text-indigo-600" />Change Password</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Current Password</Label>
                  <div className="relative">
                    <Input type={showCurrentPass ? 'text' : 'password'} placeholder="Enter current password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} className="pr-9 border-slate-200" />
                    <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">New Password</Label>
                    <div className="relative">
                      <Input type={showNewPass ? 'text' : 'password'} placeholder="Enter new password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="pr-9 border-slate-200" />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Confirm New Password</Label>
                    <Input type={showNewPass ? 'text' : 'password'} placeholder="Confirm new password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className="border-slate-200" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleChangePassword} disabled={changingPass} className="bg-indigo-600 hover:bg-indigo-700">
                    {changingPass ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}Update Password
                  </Button>
                  <Button variant="outline" onClick={() => { setShowChangePass(false); setCurrentPass(''); setNewPass(''); setConfirmPass(''); }} className="border-slate-200">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Teacher Warnings */}
          {warnings.filter(w => w.status === 'unread').length > 0 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}>
                      <BellRing className="w-5 h-5 text-red-600" />
                    </motion.div>
                    <h3 className="font-bold text-red-700">Attendance Warnings from Teacher</h3>
                  </div>
                  <div className="space-y-2">
                    {warnings.filter(w => w.status === 'unread').map((warning, idx) => (
                      <motion.div key={warning.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-2 p-3 bg-white rounded-lg border border-red-100">
                        <Mail className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-slate-700">{warning.message}</p>
                          <p className="text-xs text-slate-400 mt-1">Attendance: {warning.attendance_percentage?.toFixed(1)}%</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={async () => { await Warning.update(warning.id, { status: 'read' }); fetchData(); }}
                          className="text-slate-400 hover:text-slate-600 h-7 px-2 text-xs">Mark Read</Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Low Attendance Alert */}
          {lowAttendance && (
            <Card className="border-0 shadow-md bg-gradient-to-r from-red-50 to-amber-50 border-l-4 border-l-red-500">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-700">Low Attendance Warning!</p>
                  <p className="text-sm text-red-600">Your attendance is {currentSummary.percentage.toFixed(1)}%. Minimum required is 75%.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leave Form */}
          {showLeaveForm && (
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-lg">Apply for Leave</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">From Date</Label>
                    <Input type="date" value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} className="border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">To Date</Label>
                    <Input type="date" value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} className="border-slate-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Reason</Label>
                  <Textarea placeholder="Enter reason for leave" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} className="border-slate-200" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleLeaveSubmit} className="bg-blue-600 hover:bg-blue-700"><Send className="w-4 h-4 mr-2" />Submit</Button>
                  <Button variant="outline" onClick={() => setShowLeaveForm(false)} className="border-slate-200">Cancel</Button>
                </div>
                {myLeaves.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Your Leave Applications:</p>
                    {myLeaves.map(leave => (
                      <div key={leave.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{leave.from_date} → {leave.to_date}</p>
                          <p className="text-xs text-slate-500">{leave.reason}</p>
                        </div>
                        <Badge className={leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-0' : leave.status === 'rejected' ? 'bg-red-100 text-red-700 border-0' : 'bg-amber-100 text-amber-700 border-0'}>{leave.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
              <TabsTrigger value="monthly" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"><Calendar className="w-4 h-4 mr-2" />Monthly</TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"><CalendarDays className="w-4 h-4 mr-2" />Calendar</TabsTrigger>
              <TabsTrigger value="semester" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"><ClipboardList className="w-4 h-4 mr-2" />6 Months</TabsTrigger>
            </TabsList>

            {/* Monthly Tab */}
            <TabsContent value="monthly" className="space-y-4 mt-4">
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-full sm:w-48 border-slate-200"><SelectValue placeholder="Select Month" /></SelectTrigger>
                      <SelectContent>{MONTHS.map(month => <SelectItem key={month.value} value={month.value}>{month.label} {selectedYear}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button onClick={downloadCSV} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0"><Download className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Excel</span></Button>
                      <Button onClick={downloadPDF} className="bg-red-600 hover:bg-red-700 shrink-0"><FileText className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">PDF</span></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" /><p className="text-2xl font-bold text-slate-800">{monthlySummary.totalLectures}</p><p className="text-xs text-slate-500">Total Lectures</p></CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" /><p className="text-2xl font-bold text-emerald-600">{monthlySummary.present}</p><p className="text-xs text-slate-500">Present</p></CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" /><p className="text-2xl font-bold text-red-600">{monthlySummary.absent}</p><p className="text-xs text-slate-500">Absent</p></CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><Percent className="w-8 h-8 text-indigo-600 mx-auto mb-2" /><p className={`text-2xl font-bold ${monthlySummary.percentage >= 75 ? 'text-emerald-600' : monthlySummary.percentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{monthlySummary.percentage.toFixed(1)}%</p><p className="text-xs text-slate-500">Attendance</p></CardContent></Card>
              </div>

              {isLoading ? (
                <Card className="border-0 shadow-md"><CardContent className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></CardContent></Card>
              ) : (
                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-slate-50"><TableRow><TableHead className="font-semibold min-w-[120px]">Date</TableHead><TableHead className="font-semibold min-w-[100px]">Day</TableHead><TableHead className="font-semibold text-center min-w-[100px]">Status</TableHead></TableRow></TableHeader>
                      <TableBody>{monthlyData.map((row, idx) => (<TableRow key={idx} className="hover:bg-slate-50"><TableCell className="font-medium">{format(new Date(row.date), 'dd MMM yyyy')}</TableCell><TableCell>{row.day}</TableCell><TableCell className="text-center">{getStatusBadge(row.status)}</TableCell></TableRow>))}</TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-4 mt-4">
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-4">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-48 border-slate-200"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTHS.map(month => <SelectItem key={month.value} value={month.value}>{month.label} {selectedYear}</SelectItem>)}</SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <AttendanceCalendar attendance={allAttendance} selectedMonth={selectedMonth} selectedYear={selectedYear} />
            </TabsContent>

            {/* Semester Tab */}
            <TabsContent value="semester" className="space-y-4 mt-4">
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-700"><ClipboardList className="w-5 h-5 text-indigo-600" /><span className="font-medium">Last 6 Months Overview</span></div>
                    <div className="flex gap-2">
                      <Button onClick={downloadCSV} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0"><Download className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Excel</span></Button>
                      <Button onClick={downloadPDF} className="bg-red-600 hover:bg-red-700 shrink-0"><FileText className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">PDF</span></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" /><p className="text-2xl font-bold text-slate-800">{semesterSummary.totalLectures}</p><p className="text-xs text-slate-500">Total Lectures</p></CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" /><p className="text-2xl font-bold text-emerald-600">{semesterSummary.present}</p><p className="text-xs text-slate-500">Present</p></CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" /><p className="text-2xl font-bold text-red-600">{semesterSummary.absent}</p><p className="text-xs text-slate-500">Absent</p></CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><Percent className="w-8 h-8 text-indigo-600 mx-auto mb-2" /><p className={`text-2xl font-bold ${semesterSummary.percentage >= 75 ? 'text-emerald-600' : semesterSummary.percentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{semesterSummary.percentage.toFixed(1)}%</p><p className="text-xs text-slate-500">Attendance</p></CardContent></Card>
              </div>

              <AttendanceTrendChart data={semesterData} />

              {isLoading ? (
                <Card className="border-0 shadow-md"><CardContent className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></CardContent></Card>
              ) : (
                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow><TableHead className="font-semibold">Month</TableHead><TableHead className="font-semibold text-center">Total</TableHead><TableHead className="font-semibold text-center">Present</TableHead><TableHead className="font-semibold text-center">Absent</TableHead><TableHead className="font-semibold text-center">%</TableHead></TableRow></TableHeader>
                    <TableBody>{semesterData.map((row, idx) => (<TableRow key={idx} className="hover:bg-slate-50"><TableCell className="font-medium">{row.monthName}</TableCell><TableCell className="text-center font-semibold">{row.totalLectures}</TableCell><TableCell className="text-center"><span className="inline-block px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">{row.present}</span></TableCell><TableCell className="text-center"><span className="inline-block px-3 py-1 rounded-lg bg-red-50 text-red-700 font-semibold">{row.absent}</span></TableCell><TableCell className="text-center"><Badge className={`${row.percentage >= 75 ? 'bg-emerald-50 text-emerald-600' : row.percentage >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'} border-0 font-semibold`}>{row.percentage.toFixed(1)}%</Badge></TableCell></TableRow>))}</TableBody>
                  </Table>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <footer className="py-4 text-center border-t border-slate-200 bg-white/50">
        <p className="text-slate-500 text-sm">Smart Attendance System – Diploma Engineering Project</p>
      </footer>
    </div>
  );
}
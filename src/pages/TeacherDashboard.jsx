import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, LogOut, Calendar, Search, Loader2, Download,
  Users, BookOpen, ArrowLeft, User, Hash, FileText, ClipboardCheck,
  Plus, Minus, UserCog, CalendarOff, CreditCard, AlertTriangle, Send, BellRing, TrendingDown, CheckCircle2, Percent
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { entities } from '@/api/entityClient';

import { format, getDaysInMonth, startOfMonth, addDays } from 'date-fns';
import { generatePDF } from '@/lib/pdfUtils';
import { StudentComparisonChart } from '@/components/AttendanceChart';
import StudentManager from '@/components/teacher/StudentManager';
import PasswordResetRequests from '@/components/teacher/PasswordResetRequests';
import HolidayManager from '@/components/teacher/HolidayManager';
import RfidManager from '@/components/teacher/RfidManager';
import WarningModal from '@/components/teacher/WarningModal';

const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
  { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
  { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function TeacherDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1 + '');
  const [selectedYear] = useState(new Date().getFullYear());
  const [students, setStudents] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSemesterData, setStudentSemesterData] = useState([]);
  const [studentSummary, setStudentSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [showManageStudents, setShowManageStudents] = useState(false);
  const [showHolidays, setShowHolidays] = useState(false);
  const [showRfidManager, setShowRfidManager] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [warningTarget, setWarningTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    if (!isLoggedIn || userRole !== 'teacher') {
      toast.error('Please login first');
      navigate(createPageUrl('Home'));
      return;
    }
    fetchMonthlyData();
  }, [navigate, selectedMonth]);

  const fetchMonthlyData = async () => {
    setIsLoading(true);
    const allStudents = await entities.Student.list();
    setStudents(allStudents);
    const monthNum = parseInt(selectedMonth);
    const allAttendance = await entities.Attendance.filter({ month: monthNum, year: selectedYear });
    const daysInMonth = getDaysInMonth(new Date(selectedYear, monthNum - 1));
    const monthStart = startOfMonth(new Date(selectedYear, monthNum - 1));
    const studentSummaries = [];
    for (const student of allStudents) {
      let totalLectures = 0, present = 0, absent = 0;
      for (let i = 0; i < daysInMonth; i++) {
        const currentDate = addDays(monthStart, i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const isSunday = currentDate.getDay() === 0;
        const existingRecord = allAttendance.find(a => a.date === dateStr && a.enrollment_number === student.enrollment_number);
        let status = 'absent';
        if (existingRecord) status = existingRecord.status;
        else if (isSunday) status = 'holiday';
        if (status !== 'holiday') { totalLectures++; if (status === 'present') present++; else absent++; }
      }
      studentSummaries.push({ enrollment_number: student.enrollment_number, name: student.name, totalLectures, present, absent, percentage: totalLectures > 0 ? (present / totalLectures) * 100 : 0 });
    }
    setMonthlyData(studentSummaries);
    setIsLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { toast.error('Please enter enrollment number or name'); return; }
    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    const found = students.find(s => s.enrollment_number.toLowerCase().includes(query) || s.name.toLowerCase().includes(query));
    if (!found) { toast.error('Student not found'); setIsSearching(false); return; }
    setSelectedStudent(found);
    await fetchStudentSemesterData(found.enrollment_number);
    setShowStudentDetail(true);
    setIsSearching(false);
  };

  const fetchStudentSemesterData = async (enrollment) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const semesterMonths = [];
    for (let i = 5; i >= 0; i--) {
      let month = currentMonth - i, year = currentYear;
      if (month <= 0) { month += 12; year -= 1; }
      semesterMonths.push({ month, year });
    }
    const allAttendance = await entities.Attendance.filter({ enrollment_number: enrollment });
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
        const existingRecord = allAttendance.find(a => a.date === dateStr);
        let status = 'absent';
        if (existingRecord) status = existingRecord.status;
        else if (isSunday) status = 'holiday';
        if (status !== 'holiday') { lectures++; if (status === 'present') present++; else absent++; }
      }
      monthlyAgg.push({ month, year, monthName: `${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`, totalLectures: lectures, present, absent, percentage: lectures > 0 ? (present / lectures) * 100 : 0 });
      totalLectures += lectures; totalPresent += present; totalAbsent += absent;
    }
    setStudentSemesterData(monthlyAgg);
    setStudentSummary({ totalLectures, present: totalPresent, absent: totalAbsent, percentage: totalLectures > 0 ? (totalPresent / totalLectures) * 100 : 0 });
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully');
    navigate(createPageUrl('Home'));
  };

  const downloadCSV = () => {
    let csvContent = 'Smart Attendance System\nDiploma Engineering Project\n';
    if (showStudentDetail && selectedStudent) {
      csvContent += `Student Attendance Report\n\nEnrollment No,${selectedStudent.enrollment_number}\nName,${selectedStudent.name}\n\nMonth,Total Lectures,Present,Absent,Percentage\n`;
      studentSemesterData.forEach(row => { csvContent += `${row.monthName},${row.totalLectures},${row.present},${row.absent},${row.percentage.toFixed(1)}%\n`; });
      csvContent += `\nSummary\nTotal Lectures,${studentSummary.totalLectures}\nPresent,${studentSummary.present}\nAbsent,${studentSummary.absent}\nAttendance %,${studentSummary.percentage.toFixed(1)}%\n`;
    } else {
      csvContent += `Monthly Attendance - ${MONTHS[parseInt(selectedMonth) - 1]?.label} ${selectedYear}\n\nEnrollment,Name,Total Lectures,Present,Absent,Percentage\n`;
      monthlyData.forEach(row => { csvContent += `${row.enrollment_number},${row.name},${row.totalLectures},${row.present},${row.absent},${row.percentage.toFixed(1)}%\n`; });
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Excel report downloaded');
  };

  const downloadPDF = () => {
    let subtitle = '', content = '', title = '';
    if (showStudentDetail && selectedStudent) {
      title = 'Student Attendance Report';
      subtitle = `<p><strong>Enrollment:</strong> ${selectedStudent.enrollment_number}</p><p><strong>Name:</strong> ${selectedStudent.name}</p>`;
      content = '<table><thead><tr><th>Month</th><th>Total</th><th>Present</th><th>Absent</th><th>%</th></tr></thead><tbody>';
      studentSemesterData.forEach(row => { content += `<tr><td>${row.monthName}</td><td>${row.totalLectures}</td><td>${row.present}</td><td>${row.absent}</td><td>${row.percentage.toFixed(1)}%</td></tr>`; });
      content += '</tbody></table>';
      content += `<div class="summary-grid"><div class="summary-card"><div class="label">Total</div><div class="value">${studentSummary.totalLectures}</div></div><div class="summary-card"><div class="label">Present</div><div class="value" style="color:#059669">${studentSummary.present}</div></div><div class="summary-card"><div class="label">Absent</div><div class="value" style="color:#dc2626">${studentSummary.absent}</div></div><div class="summary-card"><div class="label">%</div><div class="value" style="color:${studentSummary.percentage >= 75 ? '#059669' : '#f59e0b'}">${studentSummary.percentage.toFixed(1)}%</div></div></div>`;
    } else {
      title = `Monthly Attendance – ${MONTHS[parseInt(selectedMonth) - 1]?.label} ${selectedYear}`;
      content = '<table><thead><tr><th>Enrollment</th><th>Name</th><th>Total</th><th>Present</th><th>Absent</th><th>%</th></tr></thead><tbody>';
      monthlyData.forEach(row => { content += `<tr><td>${row.enrollment_number}</td><td>${row.name}</td><td>${row.totalLectures}</td><td>${row.present}</td><td>${row.absent}</td><td>${row.percentage.toFixed(1)}%</td></tr>`; });
      content += '</tbody></table>';
    }
    generatePDF(title, subtitle, content);
    toast.success('PDF report opened — use "Save as PDF"');
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 75) return 'bg-emerald-100 text-emerald-700';
    if (percentage >= 60) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const backToMainView = () => { setShowStudentDetail(false); setSelectedStudent(null); setSearchQuery(''); };

  const atRiskStudents = monthlyData.filter(s => s.percentage > 0 && s.percentage < 75);
  const goodStandingStudents = monthlyData.filter(s => s.percentage >= 75).length;

  const sendWarningToAll = async () => {
    if (atRiskStudents.length === 0) return;
    toast.info(`Sending warnings to ${atRiskStudents.length} students...`);
    for (const student of atRiskStudents) {
      await entities.Warning.create({
        enrollment_number: student.enrollment_number,
        student_name: student.name,
        attendance_percentage: student.percentage,
        message: `Dear ${student.name}, your attendance is ${student.percentage.toFixed(1)}%, which is below the required 75%. Please improve your attendance immediately to avoid academic penalties.`,
        status: 'unread'
      });
    }
    toast.success(`Warnings sent to ${atRiskStudents.length} students!`);
  };

  const handleAdjustAttendance = async (enrollmentNumber, status, delta) => {
    setEditingEnrollment(enrollmentNumber);
    try {
      const monthNum = parseInt(selectedMonth);
      const daysInMonth = getDaysInMonth(new Date(selectedYear, monthNum - 1));
      const monthStart = startOfMonth(new Date(selectedYear, monthNum - 1));
      const allAttendance = await entities.Attendance.filter({ month: monthNum, year: selectedYear, enrollment_number: enrollmentNumber });

      if (delta > 0) {
        // Find first working day without a record
        for (let i = 0; i < daysInMonth; i++) {
          const currentDate = addDays(monthStart, i);
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          const isSunday = currentDate.getDay() === 0;
          if (isSunday) continue;
          const exists = allAttendance.find(a => a.date === dateStr);
          if (!exists) {
            await entities.Attendance.create({ enrollment_number: enrollmentNumber, date: dateStr, status, month: monthNum, year: selectedYear });
            break;
          }
        }
        toast.success(`Added 1 ${status} for ${enrollmentNumber}`);
      } else {
        // Find and delete one record with matching status
        const toDelete = allAttendance.find(a => a.status === status);
        if (toDelete) {
          await entities.Attendance.delete(toDelete.id);
          toast.success(`Removed 1 ${status} for ${enrollmentNumber}`);
        } else {
          toast.error(`No ${status} records to remove`);
        }
      }
      await fetchMonthlyData();
    } catch (err) {
      toast.error('Failed to update attendance');
    }
    setEditingEnrollment(null);
  };

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
                <p className="text-xs text-slate-500">Teacher Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowRfidManager(!showRfidManager); setShowHolidays(false); setShowManageStudents(false); setShowStudentDetail(false); }} className={`shrink-0 ${showRfidManager ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-purple-200 text-purple-700 hover:bg-purple-50'}`}>
                <CreditCard className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">RFID Cards</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowHolidays(!showHolidays); setShowManageStudents(false); setShowRfidManager(false); }} className={`shrink-0 ${showHolidays ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-orange-200 text-orange-700 hover:bg-orange-50'}`}>
                <CalendarOff className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Holidays</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowManageStudents(!showManageStudents); setShowHolidays(false); setShowRfidManager(false); }} className={`shrink-0 ${showManageStudents ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}>
                <UserCog className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Manage Students</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl('MarkAttendance'))} className="border-blue-200 text-blue-700 hover:bg-blue-50 shrink-0">
                <ClipboardCheck className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Mark Attendance</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 hover:text-red-600 hover:bg-red-50 shrink-0">
                <LogOut className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          {showRfidManager ? (
            <motion.div key="rfid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <RfidManager />
            </motion.div>
          ) : showHolidays ? (
            <motion.div key="holidays" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <div className="flex items-center gap-3">
                <CalendarOff className="w-8 h-8 text-orange-600" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Manage Holidays</h2>
                  <p className="text-slate-500">Mark days as holidays for all students</p>
                </div>
              </div>
              <HolidayManager selectedMonth={selectedMonth} selectedYear={selectedYear} />
            </motion.div>
          ) : showManageStudents ? (
            <motion.div key="manage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <PasswordResetRequests />
              <StudentManager onBack={() => setShowManageStudents(false)} />
            </motion.div>
          ) : !showStudentDetail ? (
            <motion.div key="main" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-indigo-600" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">All Students Attendance</h2>
                  <p className="text-slate-500">Month-wise attendance overview</p>
                </div>
              </div>

              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-full sm:w-48 border-slate-200"><Calendar className="w-4 h-4 mr-2 text-slate-500" /><SelectValue placeholder="Select Month" /></SelectTrigger>
                      <SelectContent>{MONTHS.map(month => <SelectItem key={month.value} value={month.value}>{month.label} {selectedYear}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search enrollment or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="pl-9 w-full sm:w-56 md:w-64 border-slate-200" />
                      </div>
                      <Button onClick={handleSearch} disabled={isSearching} size="icon" className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                      <Button onClick={downloadCSV} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0"><Download className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Excel</span></Button>
                      <Button onClick={downloadPDF} className="bg-red-600 hover:bg-red-700 shrink-0"><FileText className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">PDF</span></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* At-Risk Alert Banner */}
              {!isLoading && atRiskStudents.length > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-red-500 to-orange-500 overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}
                            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <BellRing className="w-6 h-6 text-white" />
                          </motion.div>
                          <div className="text-white">
                            <h3 className="font-bold text-lg">{atRiskStudents.length} Student{atRiskStudents.length > 1 ? 's' : ''} Below 75% Attendance!</h3>
                            <p className="text-sm text-red-100">Send warnings to improve attendance</p>
                          </div>
                        </div>
                        <Button onClick={sendWarningToAll} className="bg-white text-red-600 hover:bg-red-50 font-semibold shrink-0">
                          <Send className="w-4 h-4 mr-2" />Warn All ({atRiskStudents.length})
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Quick Stats Row */}
              {!isLoading && monthlyData.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Card className="border-0 shadow-sm bg-white"><CardContent className="p-4 text-center">
                      <Users className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-slate-800">{monthlyData.length}</p>
                      <p className="text-xs text-slate-500">Total Students</p>
                    </CardContent></Card>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="border-0 shadow-sm bg-white"><CardContent className="p-4 text-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-emerald-600">{goodStandingStudents}</p>
                      <p className="text-xs text-slate-500">Above 75%</p>
                    </CardContent></Card>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card className={`border-0 shadow-sm ${atRiskStudents.length > 0 ? 'bg-red-50 ring-2 ring-red-200' : 'bg-white'}`}><CardContent className="p-4 text-center">
                      <TrendingDown className="w-6 h-6 text-red-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-red-600">{atRiskStudents.length}</p>
                      <p className="text-xs text-slate-500">Below 75%</p>
                    </CardContent></Card>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="border-0 shadow-sm bg-white"><CardContent className="p-4 text-center">
                      <Percent className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-blue-600">{monthlyData.length > 0 ? (monthlyData.reduce((sum, s) => sum + s.percentage, 0) / monthlyData.length).toFixed(1) : 0}%</p>
                      <p className="text-xs text-slate-500">Class Average</p>
                    </CardContent></Card>
                  </motion.div>
                </div>
              )}

              {/* Chart */}
              {!isLoading && monthlyData.length > 0 && <StudentComparisonChart data={monthlyData} />}

              {isLoading ? (
                <Card className="border-0 shadow-md"><CardContent className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></CardContent></Card>
              ) : (
                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow><TableHead className="font-semibold">Enrollment</TableHead><TableHead className="font-semibold">Student Name</TableHead><TableHead className="font-semibold text-center">Total</TableHead><TableHead className="font-semibold text-center">Present</TableHead><TableHead className="font-semibold text-center">Absent</TableHead><TableHead className="font-semibold text-center">%</TableHead><TableHead className="font-semibold text-center">Edit</TableHead><TableHead className="font-semibold text-center">Warn</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {monthlyData.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400">No students found</TableCell></TableRow>
                      ) : (
                        monthlyData.map((row, idx) => (
                          <TableRow key={idx} className={`hover:bg-slate-50 ${row.percentage > 0 && row.percentage < 75 ? 'bg-red-50/50 border-l-4 border-l-red-500' : ''}`}>
                            <TableCell className="font-mono font-medium cursor-pointer" onClick={() => { setSearchQuery(row.enrollment_number); handleSearch(); }}>{row.enrollment_number}</TableCell>
                            <TableCell className="font-medium cursor-pointer" onClick={() => { setSearchQuery(row.enrollment_number); handleSearch(); }}>
                              <div className="flex items-center gap-1">
                                {row.percentage > 0 && row.percentage < 75 && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                                {row.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-semibold">{row.totalLectures}</TableCell>
                            <TableCell className="text-center">
                              <div className="inline-flex items-center gap-1">
                                <button onClick={() => handleAdjustAttendance(row.enrollment_number, 'present', -1)} disabled={editingEnrollment === row.enrollment_number || row.present === 0} className="w-6 h-6 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0"><Minus className="w-3 h-3" /></button>
                                <span className="inline-block px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold min-w-[28px] text-center">{row.present}</span>
                                <button onClick={() => handleAdjustAttendance(row.enrollment_number, 'present', 1)} disabled={editingEnrollment === row.enrollment_number} className="w-6 h-6 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0"><Plus className="w-3 h-3" /></button>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="inline-flex items-center gap-1">
                                <button onClick={() => handleAdjustAttendance(row.enrollment_number, 'absent', -1)} disabled={editingEnrollment === row.enrollment_number || row.absent === 0} className="w-6 h-6 rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0"><Minus className="w-3 h-3" /></button>
                                <span className="inline-block px-2 py-1 rounded-lg bg-red-50 text-red-700 font-semibold min-w-[28px] text-center">{row.absent}</span>
                                <button onClick={() => handleAdjustAttendance(row.enrollment_number, 'absent', 1)} disabled={editingEnrollment === row.enrollment_number} className="w-6 h-6 rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0"><Plus className="w-3 h-3" /></button>
                              </div>
                            </TableCell>
                            <TableCell className="text-center"><Badge className={`${getPercentageColor(row.percentage)} border-0 font-semibold`}>{row.percentage.toFixed(1)}%</Badge></TableCell>
                            <TableCell className="text-center">{editingEnrollment === row.enrollment_number ? <Loader2 className="w-4 h-4 animate-spin text-slate-400 mx-auto" /> : <span className="text-slate-300 text-xs">±</span>}</TableCell>
                            <TableCell className="text-center">
                              {row.percentage > 0 && row.percentage < 75 ? (
                                <Button size="sm" variant="outline" onClick={() => setWarningTarget({ student: { name: row.name, enrollment_number: row.enrollment_number }, percentage: row.percentage })}
                                  className="border-red-300 text-red-600 hover:bg-red-50 h-8 px-2">
                                  <AlertTriangle className="w-3 h-3 mr-1" />Warn
                                </Button>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </div>
                </Card>
              )}
            </motion.div>
          ) : (
            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <Button variant="outline" onClick={backToMainView} className="border-slate-200"><ArrowLeft className="w-4 h-4 mr-2" />Back to All Students</Button>

              <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center"><User className="w-8 h-8 text-white" /></div>
                      <div className="text-white">
                        <h3 className="text-xl font-bold">{selectedStudent?.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-emerald-100"><Hash className="w-4 h-4" /><span>{selectedStudent?.enrollment_number}</span></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={downloadCSV} variant="outline" className="border-white/30 text-white hover:bg-white/20"><Download className="w-4 h-4 mr-2" />Excel</Button>
                      <Button onClick={downloadPDF} className="bg-white/20 hover:bg-white/30 text-white border-0"><FileText className="w-4 h-4 mr-2" />PDF</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {studentSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" /><p className="text-2xl font-bold text-slate-800">{studentSummary.totalLectures}</p><p className="text-xs text-slate-500">Total Lectures</p></CardContent></Card>
                  <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-emerald-600 font-bold">✓</span></div><p className="text-2xl font-bold text-emerald-600">{studentSummary.present}</p><p className="text-xs text-slate-500">Present</p></CardContent></Card>
                  <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-red-600 font-bold">✗</span></div><p className="text-2xl font-bold text-red-600">{studentSummary.absent}</p><p className="text-xs text-slate-500">Absent</p></CardContent></Card>
                  <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-indigo-600 font-bold">%</span></div><p className={`text-2xl font-bold ${studentSummary.percentage >= 75 ? 'text-emerald-600' : studentSummary.percentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{studentSummary.percentage.toFixed(1)}%</p><p className="text-xs text-slate-500">Attendance</p></CardContent></Card>
                </div>
              )}

              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-lg">6 Months Attendance</CardTitle></CardHeader>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50"><TableRow><TableHead className="font-semibold">Month</TableHead><TableHead className="font-semibold text-center">Total</TableHead><TableHead className="font-semibold text-center">Present</TableHead><TableHead className="font-semibold text-center">Absent</TableHead><TableHead className="font-semibold text-center">%</TableHead></TableRow></TableHeader>
                  <TableBody>{studentSemesterData.map((row, idx) => (<TableRow key={idx} className="hover:bg-slate-50"><TableCell className="font-medium">{row.monthName}</TableCell><TableCell className="text-center font-semibold">{row.totalLectures}</TableCell><TableCell className="text-center"><span className="inline-block px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">{row.present}</span></TableCell><TableCell className="text-center"><span className="inline-block px-3 py-1 rounded-lg bg-red-50 text-red-700 font-semibold">{row.absent}</span></TableCell><TableCell className="text-center"><Badge className={`${getPercentageColor(row.percentage)} border-0 font-semibold`}>{row.percentage.toFixed(1)}%</Badge></TableCell></TableRow>))}</TableBody>
                </Table>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {warningTarget && (
          <WarningModal
            student={warningTarget.student}
            percentage={warningTarget.percentage}
            onClose={() => setWarningTarget(null)}
            onSent={() => setWarningTarget(null)}
          />
        )}
      </main>

      <footer className="py-4 text-center border-t border-slate-200 bg-white/50">
        <p className="text-slate-500 text-sm">Smart Attendance System – Diploma Engineering Project</p>
      </footer>
    </div>
  );
}
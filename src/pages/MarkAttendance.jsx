import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, LogOut, Calendar, CheckCircle2, XCircle, Loader2,
  User, Hash, Save, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Student, Attendance, Leave, Warning, WorkingDay } from "@/api/entityClient";
import { format } from 'date-fns';

export default function MarkAttendance() {
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceMap, setAttendanceMap] = useState({});
  const [existingRecords, setExistingRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
    if (students.length > 0) {
      fetchExistingAttendance();
    }
  }, [selectedDate, students]);

  const fetchStudents = async () => {
    setIsLoading(true);
    const allStudents = await Student.list();
    setStudents(allStudents);
    setIsLoading(false);
  };

  const fetchExistingAttendance = async () => {
    const date = new Date(selectedDate);
    const records = await Attendance.filter({
      date: selectedDate
    });
    setExistingRecords(records);
    const map = {};
    for (const student of students) {
      const existing = records.find(r => r.enrollment_number === student.enrollment_number);
      if (existing) {
        map[student.enrollment_number] = existing.status;
      } else {
        const isSunday = date.getDay() === 0;
        map[student.enrollment_number] = isSunday ? 'holiday' : 'present';
      }
    }
    setAttendanceMap(map);
  };

  const toggleStatus = (enrollment) => {
    setAttendanceMap(prev => ({
      ...prev,
      [enrollment]: prev[enrollment] === 'present' ? 'absent' : 'present'
    }));
  };

  const markAll = (status) => {
    const map = {};
    for (const student of students) {
      map[student.enrollment_number] = status;
    }
    setAttendanceMap(map);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const date = new Date(selectedDate);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const toCreate = [];
    const toUpdate = [];

    for (const student of students) {
      const status = attendanceMap[student.enrollment_number];
      if (status === 'holiday') continue;
      const existing = existingRecords.find(r => r.enrollment_number === student.enrollment_number);
      if (existing) {
        if (existing.status !== status) {
          toUpdate.push({ id: existing.id, status });
        }
      } else {
        toCreate.push({
          enrollment_number: student.enrollment_number,
          date: selectedDate,
          status,
          month,
          year
        });
      }
    }

    if (toCreate.length > 0) {
      await Attendance.bulkCreate(toCreate);
    }
    for (const update of toUpdate) {
      await Attendance.update(update.id, { status: update.status });
    }

    toast.success(`Attendance saved for ${format(date, 'dd MMM yyyy')}!`);
    setIsSaving(false);
    await fetchExistingAttendance();
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully');
    navigate(createPageUrl('Home'));
  };

  const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'absent').length;

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
                <h1 className="font-bold text-slate-800">Mark Attendance</h1>
                <p className="text-xs text-slate-500">Teacher Dashboard</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-slate-600 hover:text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Button variant="outline" onClick={() => navigate(createPageUrl('TeacherDashboard'))} className="mb-4 border-slate-200">
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <Label className="text-slate-700 text-sm">Select Date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full sm:w-48 border-slate-200 mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => markAll('present')} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">All Present</span><span className="sm:hidden">Present</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => markAll('absent')} className="border-red-200 text-red-700 hover:bg-red-50 shrink-0">
                    <XCircle className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">All Absent</span><span className="sm:hidden">Absent</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-emerald-600">{presentCount}</p>
                <p className="text-xs text-slate-500">Present</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-red-600">{absentCount}</p>
                <p className="text-xs text-slate-500">Absent</p>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <Card className="border-0 shadow-md"><CardContent className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></CardContent></Card>
          ) : (
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg">Student List – {format(new Date(selectedDate), 'dd MMMM yyyy')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {students.map((student, idx) => {
                  const status = attendanceMap[student.enrollment_number];
                  return (
                    <div key={student.id} className={`flex items-center justify-between p-4 border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{student.name}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Hash className="w-3 h-3" />{student.enrollment_number}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {status === 'holiday' ? (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">Holiday</Badge>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant={status === 'present' ? 'default' : 'outline'}
                              onClick={() => toggleStatus(student.enrollment_number)}
                              className={status === 'present' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}
                            >
                              <CheckCircle2 className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Present</span>
                            </Button>
                            <Button
                              size="sm"
                              variant={status === 'absent' ? 'default' : 'outline'}
                              onClick={() => toggleStatus(student.enrollment_number)}
                              className={status === 'absent' ? 'bg-red-600 hover:bg-red-700' : 'border-red-200 text-red-600 hover:bg-red-50'}
                            >
                              <XCircle className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Absent</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" />Save Attendance</>}
          </Button>
        </motion.div>
      </main>

      <footer className="py-4 text-center border-t border-slate-200 bg-white/50">
        <p className="text-slate-500 text-sm">Smart Attendance System – Diploma Engineering Project</p>
      </footer>
    </div>
  );
}
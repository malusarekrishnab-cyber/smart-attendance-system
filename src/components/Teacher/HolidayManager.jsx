import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2, Trash2, Plus, CalendarOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format, getDaysInMonth, startOfMonth, addDays } from 'date-fns';

export default function HolidayManager({ selectedMonth, selectedYear }) {
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const monthNum = parseInt(selectedMonth);

  useEffect(() => {
    fetchHolidays();
  }, [selectedMonth, selectedYear]);

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      // Get all attendance records with holiday status for this month
      const allAttendance = await base44.entities.Attendance.filter({ month: monthNum, year: selectedYear, status: 'holiday' });
      // Deduplicate by date
      const seen = new Set();
      const unique = [];
      for (const rec of allAttendance) {
        if (!seen.has(rec.date)) {
          seen.add(rec.date);
          unique.push({ date: rec.date, count: 1 });
        } else {
          const u = unique.find(u => u.date === rec.date);
          if (u) u.count++;
        }
      }
      unique.sort((a, b) => a.date.localeCompare(b.date));
      setHolidays(unique);
    } catch (err) {
      toast.error('Failed to load holidays');
    }
    setIsLoading(false);
  };

  const handleMarkHoliday = async () => {
    if (!holidayDate) {
      toast.error('Please select a date');
      return;
    }
    const parsedDate = new Date(holidayDate);
    if (parsedDate.getMonth() + 1 !== monthNum || parsedDate.getFullYear() !== selectedYear) {
      toast.error('Selected date must be within the current month');
      return;
    }
    setIsSaving(true);
    try {
      const dateStr = format(parsedDate, 'yyyy-MM-dd');
      const allStudents = await base44.entities.Student.list();
      if (allStudents.length === 0) {
        toast.error('No students found');
        setIsSaving(false);
        return;
      }
      // Check existing records for this date
      const existing = await base44.entities.Attendance.filter({ month: monthNum, year: selectedYear, date: dateStr });
      const studentsWithRecords = new Set(existing.map(e => e.enrollment_number));
      // Create holiday records for students who don't have one
      const toCreate = allStudents
        .filter(s => !studentsWithRecords.has(s.enrollment_number))
        .map(s => ({ enrollment_number: s.enrollment_number, date: dateStr, status: 'holiday', month: monthNum, year: selectedYear }));
      // Update existing non-holiday records to holiday
      const toUpdate = existing.filter(e => e.status !== 'holiday');
      if (toCreate.length > 0) {
        await base44.entities.Attendance.bulkCreate(toCreate);
      }
      for (const rec of toUpdate) {
        await base44.entities.Attendance.update(rec.id, { status: 'holiday' });
      }
      toast.success(`${dateStr} marked as holiday${holidayName ? ` (${holidayName})` : ''}`);
      setHolidayDate('');
      setHolidayName('');
      await fetchHolidays();
    } catch (err) {
      toast.error('Failed to mark holiday');
    }
    setIsSaving(false);
  };

  const handleRemoveHoliday = async (dateStr) => {
    setIsSaving(true);
    try {
      const records = await base44.entities.Attendance.filter({ month: monthNum, year: selectedYear, date: dateStr, status: 'holiday' });
      for (const rec of records) {
        await base44.entities.Attendance.delete(rec.id);
      }
      toast.success(`Holiday removed for ${dateStr}`);
      await fetchHolidays();
    } catch (err) {
      toast.error('Failed to remove holiday');
    }
    setIsSaving(false);
  };

  return (
    <Card className="border-0 shadow-md bg-white">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
        <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
          <CalendarOff className="w-5 h-5" /> Manage Holidays
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700">Holiday Date</Label>
            <Input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} className="border-slate-200" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">Holiday Name (optional)</Label>
            <Input type="text" placeholder="e.g., Diwali" value={holidayName} onChange={(e) => setHolidayName(e.target.value)} className="border-slate-200" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleMarkHoliday} disabled={isSaving} className="w-full bg-orange-600 hover:bg-orange-700">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Mark Holiday
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
        ) : holidays.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            No holidays marked this month
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">Holidays in {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][monthNum - 1]} {selectedYear}:</p>
            <div className="flex flex-wrap gap-2">
              {holidays.map((h, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">{h.date}</span>
                  <button onClick={() => handleRemoveHoliday(h.date)} disabled={isSaving} className="text-orange-400 hover:text-red-600 disabled:opacity-30">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
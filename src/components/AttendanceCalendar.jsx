import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, getDaysInMonth, startOfMonth, addDays } from 'date-fns';
import { CheckCircle2, XCircle, Calendar } from 'lucide-react';

export default function AttendanceCalendar({ attendance, selectedMonth, selectedYear }) {
  const monthNum = parseInt(selectedMonth);
  const daysInMonth = getDaysInMonth(new Date(selectedYear, monthNum - 1));
  const monthStart = startOfMonth(new Date(selectedYear, monthNum - 1));
  const startDayOfWeek = monthStart.getDay();

  const days = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 0; i < daysInMonth; i++) {
    const currentDate = addDays(monthStart, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const record = attendance.find(a => a.date === dateStr);
    const isSunday = currentDate.getDay() === 0;
    let status = 'none';
    if (record) status = record.status;
    else if (isSunday) status = 'holiday';
    else if (currentDate > new Date()) status = 'future';
    else status = 'absent';
    days.push({ date: currentDate, dateStr, status });
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-500 text-white border-emerald-600';
      case 'absent': return 'bg-red-500 text-white border-red-600';
      case 'holiday': return 'bg-amber-200 text-amber-800 border-amber-300';
      case 'future': return 'bg-slate-50 text-slate-300 border-slate-200';
      default: return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-blue-600" />
          Calendar View – {format(monthStart, 'MMMM yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-slate-500 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {days.map((day, idx) => (
            <div key={idx} className="aspect-square">
              {day ? (
                <div className={`w-full h-full rounded-lg border flex flex-col items-center justify-center text-xs font-medium ${getStatusStyle(day.status)}`}>
                  <span className="text-xs sm:text-sm font-bold">{format(day.date, 'd')}</span>
                  {day.status === 'present' && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mt-0.5" />}
                  {day.status === 'absent' && <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mt-0.5" />}
                </div>
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mt-4 justify-center text-xs">
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-emerald-500" /><span>Present</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-red-500" /><span>Absent</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-amber-200" /><span>Holiday</span></div>
        </div>
      </CardContent>
    </Card>
  );
}
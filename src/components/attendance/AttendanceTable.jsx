import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  present: { label: 'Present', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  absent: { label: 'Absent', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  holiday: { label: 'Holiday', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Calendar }
};

export default function AttendanceTable({ data, showStudent = false }) {
  const getDayName = (dateStr) => {
    return format(new Date(dateStr), 'EEEE');
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead className="font-semibold text-slate-700">Date</TableHead>
            <TableHead className="font-semibold text-slate-700">Day</TableHead>
            {showStudent && (
              <>
                <TableHead className="font-semibold text-slate-700">Enrollment</TableHead>
                <TableHead className="font-semibold text-slate-700">Name</TableHead>
              </>
            )}
            <TableHead className="font-semibold text-slate-700 text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showStudent ? 5 : 3} className="text-center py-12 text-slate-400">
                No attendance records found
              </TableCell>
            </TableRow>
          ) : (
            data.map((record, index) => {
              const status = statusConfig[record.status] || statusConfig.absent;
              const StatusIcon = status.icon;
              
              return (
                <TableRow 
                  key={record.id || index} 
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="font-medium text-slate-800">
                    {format(new Date(record.date), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {getDayName(record.date)}
                  </TableCell>
                  {showStudent && (
                    <>
                      <TableCell className="font-mono text-slate-700">{record.enrollment_number}</TableCell>
                      <TableCell className="text-slate-700">{record.student_name}</TableCell>
                    </>
                  )}
                  <TableCell className="text-center">
                    <Badge className={`${status.color} border px-3 py-1 inline-flex items-center gap-1.5`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
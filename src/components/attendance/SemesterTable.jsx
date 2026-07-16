import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SemesterTable({ data, showStudent = false }) {
  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (percentage >= 75) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (percentage >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            {showStudent && (
              <>
                <TableHead className="font-semibold text-slate-700">Enrollment</TableHead>
                <TableHead className="font-semibold text-slate-700">Name</TableHead>
              </>
            )}
            {!showStudent && <TableHead className="font-semibold text-slate-700">Month</TableHead>}
            <TableHead className="font-semibold text-slate-700 text-center">Working Days</TableHead>
            <TableHead className="font-semibold text-slate-700 text-center">Present</TableHead>
            <TableHead className="font-semibold text-slate-700 text-center">Absent</TableHead>
            <TableHead className="font-semibold text-slate-700 text-center">Percentage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showStudent ? 6 : 5} className="text-center py-12 text-slate-400">
                No records found
              </TableCell>
            </TableRow>
          ) : (
            data.map((record, index) => (
              <TableRow key={index} className="hover:bg-slate-50/50 transition-colors">
                {showStudent && (
                  <>
                    <TableCell className="font-mono text-slate-700">{record.enrollment_number}</TableCell>
                    <TableCell className="text-slate-700 font-medium">{record.name}</TableCell>
                  </>
                )}
                {!showStudent && (
                  <TableCell className="font-medium text-slate-800">
                    {MONTH_NAMES[record.month - 1]} {record.year}
                  </TableCell>
                )}
                <TableCell className="text-center font-semibold text-slate-700">{record.workingDays}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">
                    {record.presentDays}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 text-red-700 font-semibold">
                    {record.absentDays}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={`${getPercentageColor(record.percentage)} border px-3 py-1.5 font-semibold`}>
                    {record.percentage.toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, CheckCircle2, XCircle, Percent } from 'lucide-react';

export default function SummaryCard({ summary, title = "Attendance Summary" }) {
  const { workingDays, presentDays, absentDays, percentage } = summary;

  const stats = [
    { label: 'Working Days', value: workingDays, icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
    { label: 'Present Days', value: presentDays, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Absent Days', value: absentDays, icon: XCircle, color: 'text-red-600 bg-red-50' },
    { label: 'Attendance %', value: `${percentage.toFixed(1)}%`, icon: Percent, color: percentage >= 75 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50' }
  ];

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                {stats.map((stat) => (
                  <TableHead key={stat.label} className="text-center font-semibold text-slate-700">
                    {stat.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <TableCell key={stat.label} className="text-center py-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`p-2 rounded-lg ${stat.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold text-slate-800">{stat.value}</span>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function PasswordResetRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    refreshRequests();
  }, []);

  const refreshRequests = () => {
    setRequests(JSON.parse(localStorage.getItem('passwordResetRequests') || '[]'));
  };

  const handleApprove = (enrollment) => {
    const accounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
    const account = accounts.find(a => a.identifier === enrollment);
    if (account) {
      account.password = enrollment;
      localStorage.setItem('registeredAccounts', JSON.stringify(accounts));
      toast.success(`Password reset for ${enrollment}. New password: ${enrollment}`);
    } else {
      toast.error('Student account not found');
    }
    const reqs = JSON.parse(localStorage.getItem('passwordResetRequests') || '[]');
    const updated = reqs.filter(r => r.enrollment !== enrollment);
    localStorage.setItem('passwordResetRequests', JSON.stringify(updated));
    refreshRequests();
  };

  const handleReject = (enrollment) => {
    const reqs = JSON.parse(localStorage.getItem('passwordResetRequests') || '[]');
    const updated = reqs.filter(r => r.enrollment !== enrollment);
    localStorage.setItem('passwordResetRequests', JSON.stringify(updated));
    toast.success('Request rejected');
    refreshRequests();
  };

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="bg-slate-50 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="w-5 h-5 text-amber-600" />
          Password Reset Requests
          {requests.length > 0 && <Badge className="bg-amber-100 text-amber-700 border-0 ml-1">{requests.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold min-w-[120px]">Enrollment</TableHead>
              <TableHead className="font-semibold min-w-[120px]">Student Name</TableHead>
              <TableHead className="font-semibold min-w-[150px]">Requested On</TableHead>
              <TableHead className="font-semibold text-center min-w-[160px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400">No password reset requests</TableCell></TableRow>
            ) : (
              requests.map((req, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50">
                  <TableCell className="font-mono font-medium">{req.enrollment}</TableCell>
                  <TableCell className="font-medium">{req.studentName || '—'}</TableCell>
                  <TableCell className="text-sm text-slate-500">{req.requestedOn || '—'}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={() => handleApprove(req.enrollment)}>
                        <Check className="w-3.5 h-3.5 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-8" onClick={() => handleReject(req.enrollment)}>
                        <X className="w-3.5 h-3.5 mr-1" />Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
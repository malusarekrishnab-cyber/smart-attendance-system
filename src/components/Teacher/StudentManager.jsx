import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Upload, Loader2, Users, FileSpreadsheet, ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function StudentManager({ onBack }) {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [enrollment, setEnrollment] = useState('');
  const [semester, setSemester] = useState('1');
  const [branch, setBranch] = useState('');
  const [rfidUid, setRfidUid] = useState('');
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingEnrollment, setDeletingEnrollment] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    const all = await base44.entities.Student.list();
    setStudents(all);
    setIsLoading(false);
  };

  const createStudentAccount = (enrollmentNumber, studentName) => {
    const accounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
    if (!accounts.find(a => a.identifier === enrollmentNumber)) {
      accounts.push({
        name: studentName,
        identifier: enrollmentNumber,
        username: enrollmentNumber,
        email: null,
        password: enrollmentNumber,
        role: 'student',
        enrollment: enrollmentNumber
      });
      localStorage.setItem('registeredAccounts', JSON.stringify(accounts));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!enrollment.trim() || !name.trim()) {
      toast.error('Please enter enrollment number and name');
      return;
    }
    const existing = await base44.entities.Student.filter({ enrollment_number: enrollment.trim() });
    if (existing.length > 0) {
      toast.error('Student with this enrollment already exists');
      return;
    }
    setIsAdding(true);
    await base44.entities.Student.create({
      enrollment_number: enrollment.trim(),
      name: name.trim(),
      semester: parseInt(semester) || 1,
      branch: branch.trim() || 'Not specified',
      rfid_uid: rfidUid.trim() || null,
      email: email.trim() || null
    });
    createStudentAccount(enrollment.trim(), name.trim());
    toast.success(`Student added! Login: ${enrollment.trim()} / ${enrollment.trim()}`);
    setName(''); setEnrollment(''); setBranch(''); setSemester('1'); setRfidUid(''); setEmail('');
    await fetchStudents();
    setIsAdding(false);
  };

  const handleDelete = async (student) => {
    setDeletingEnrollment(student.enrollment_number);
    await base44.entities.Student.delete(student.id);
    const accounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
    const updated = accounts.filter(a => a.identifier !== student.enrollment_number);
    localStorage.setItem('registeredAccounts', JSON.stringify(updated));
    toast.success('Student deleted');
    await fetchStudents();
    setDeletingEnrollment(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
        type: "object",
        properties: {
        students: {
          type: "array",
          items: {
            type: "object",
            properties: {
              enrollment_number: { type: "string" },
              name: { type: "string" },
              semester: { type: "number" },
              branch: { type: "string" },
              rfid_uid: { type: "string" }
            }
          }
        }
        }
        }
      });

      const studentList = Array.isArray(result.output) ? result.output : (result.output?.students || []);
      if (!studentList || studentList.length === 0) {
        toast.error('No students found in file. Use columns: enrollment_number, name, semester, branch');
        setIsUploading(false);
        e.target.value = '';
        return;
      }

      const toCreate = [];
      for (const s of studentList) {
        const enr = s.enrollment_number ? String(s.enrollment_number).trim() : null;
        const nm = s.name ? String(s.name).trim() : null;
        if (enr && nm) {
          toCreate.push({
            enrollment_number: enr,
            name: nm,
            semester: s.semester || 1,
            branch: s.branch || 'Not specified',
            rfid_uid: s.rfid_uid || null
          });
        }
      }

      if (toCreate.length > 0) {
        await base44.entities.Student.bulkCreate(toCreate);
        const accounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
        for (const s of toCreate) {
          if (!accounts.find(a => a.identifier === s.enrollment_number)) {
            accounts.push({
              name: s.name,
              identifier: s.enrollment_number,
              username: s.enrollment_number,
              email: null,
              password: s.enrollment_number,
              role: 'student',
              enrollment: s.enrollment_number
            });
          }
        }
        localStorage.setItem('registeredAccounts', JSON.stringify(accounts));
        toast.success(`${toCreate.length} students imported! Login: enrollment/enrollment`);
        await fetchStudents();
      } else {
        toast.error('No valid student data found in file');
      }
    } catch (err) {
      toast.error('Failed to import file');
    }
    setIsUploading(false);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack} className="border-slate-200">
        <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
      </Button>

      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-indigo-600" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Student Management</h2>
          <p className="text-slate-500">Add, delete, or bulk import students</p>
        </div>
      </div>

      {/* Add Student + Import */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-indigo-600" />Add New Student
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs">Enrollment Number</Label>
                  <Input type="text" placeholder="e.g. 2024007" value={enrollment} onChange={(e) => setEnrollment(e.target.value)} className="border-slate-200" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs">Full Name</Label>
                  <Input type="text" placeholder="Student name" value={name} onChange={(e) => setName(e.target.value)} className="border-slate-200" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs">Semester</Label>
                  <Input type="number" min="1" max="6" value={semester} onChange={(e) => setSemester(e.target.value)} className="border-slate-200" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-700 text-xs">Branch</Label>
                  <Input type="text" placeholder="e.g. Computer" value={branch} onChange={(e) => setBranch(e.target.value)} className="border-slate-200" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-slate-700 text-xs">Email (for attendance warnings)</Label>
                  <Input type="email" placeholder="student@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="border-slate-200" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-slate-700 text-xs">RFID Card UID (optional)</Label>
                  <Input type="text" placeholder="e.g. A1:B2:C3:D4" value={rfidUid} onChange={(e) => setRfidUid(e.target.value)} className="border-slate-200 font-mono" />
                </div>
              </div>
              <Button type="submit" disabled={isAdding} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}Add Student
              </Button>
              <p className="text-xs text-slate-400 text-center">Default login: enrollment number as username &amp; password</p>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />Bulk Import from Excel/CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Upload an Excel or CSV file with columns: <span className="font-mono text-xs bg-slate-100 px-1 rounded">enrollment_number, name, semester, branch</span></p>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all">
                {isUploading ? (
                  <div className="text-center"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" /><p className="text-sm text-slate-500">Importing students...</p></div>
                ) : (
                  <div className="text-center"><Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-sm font-medium text-slate-600">Click to upload Excel/CSV</p><p className="text-xs text-slate-400 mt-1">All students will be added automatically</p></div>
                )}
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-blue-600" />All Students ({students.length})
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold min-w-[120px]">Enrollment</TableHead>
                <TableHead className="font-semibold min-w-[120px]">Name</TableHead>
                <TableHead className="font-semibold min-w-[100px]">Branch</TableHead>
                <TableHead className="font-semibold min-w-[120px]">RFID UID</TableHead>
                <TableHead className="font-semibold text-center min-w-[80px]">Sem</TableHead>
                <TableHead className="font-semibold text-center min-w-[80px]">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" /></TableCell></TableRow>
              ) : students.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">No students found. Add one above.</TableCell></TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-slate-50">
                    <TableCell className="font-mono font-medium">{student.enrollment_number}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-sm">{student.branch}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {student.rfid_uid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 text-indigo-700"><CreditCard className="w-3 h-3" />{student.rfid_uid}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{student.semester}</TableCell>
                    <TableCell className="text-center">
                      <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50 h-8 w-8" disabled={deletingEnrollment === student.enrollment_number} onClick={() => handleDelete(student)}>
                        {deletingEnrollment === student.enrollment_number ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
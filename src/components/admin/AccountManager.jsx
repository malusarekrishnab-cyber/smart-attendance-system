import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  UserPlus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Users,
  Shield,
  Mail,
  Hash,
} from "lucide-react";

import { toast } from "sonner";
export default function AccountManager() {
  const [accounts, setAccounts] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [role, setRole] = useState('teacher');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    refreshAccounts();
  }, []);

  const refreshAccounts = () => {
    setAccounts(JSON.parse(localStorage.getItem('registeredAccounts') || '[]'));
  };

  const isInstituteEmail = (email) => {
    return email.endsWith('.ac.in') || email.endsWith('.edu') || email.endsWith('.edu.in');
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    if (role === 'admin') {
      if (!email.trim()) { toast.error('Please enter institute email'); return; }
      if (!isInstituteEmail(email.trim())) {
        toast.error('Admin email must end with .ac.in, .edu, or .edu.in');
        return;
      }
      const currentAdminCode = localStorage.getItem('adminAccessCode') || 'ADMIN2026';
      if (accessCode.trim() !== currentAdminCode) {
        toast.error('Invalid admin access code');
        return;
      }
    } else {
      if (!username.trim()) { toast.error('Please enter username'); return; }
      const currentTeacherCode = localStorage.getItem('teacherAccessCode') || 'TEACHER2026';
      if (accessCode.trim() !== currentTeacherCode) {
        toast.error('Invalid teacher access code');
        return;
      }
    }

    const existing = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
    const identifier = role === 'admin' ? email.trim() : username.trim();
    if (existing.find(a => a.identifier === identifier)) {
      toast.error('Account already exists');
      return;
    }

    setIsCreating(true);
    setTimeout(() => {
      const account = {
        name: name.trim(),
        identifier,
        username: role === 'admin' ? email.trim() : username.trim(),
        email: role === 'admin' ? email.trim() : null,
        password: password.trim(),
        role,
        enrollment: null
      };
     existing.push(account);

toast.success(`Account created for ${name.trim()}`);

setName('');
setEmail('');
setUsername('');
setPassword('');
setAccessCode('');

refreshAccounts();
setIsCreating(false);
    }, 500);
  };

  const handleDelete = (identifier) => {
    const existing = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
    const updated = existing.filter(a => a.identifier !== identifier);
    localStorage.setItem('registeredAccounts', JSON.stringify(updated));
    toast.success('Account deleted');
    refreshAccounts();
  };

  const roleButtonClass = (r) => `flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all ${role === r ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`;

  return (
    <div className="space-y-6">
      {/* Create Account Form */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            Create New Account
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Select Role</Label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRole('teacher')} className={roleButtonClass('teacher')}>
                  <Users className="w-4 h-4" /><span className="text-xs font-semibold">Teacher</span>
                </button>
                <button type="button" onClick={() => setRole('admin')} className={roleButtonClass('admin')}>
                  <Shield className="w-4 h-4" /><span className="text-xs font-semibold">Admin</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Full Name</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input type="text" placeholder="Enter name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9 border-slate-200" />
                </div>
              </div>

              {role === 'admin' ? (
                <div className="space-y-2">
                  <Label className="text-slate-700">Institute Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="email" placeholder="admin@institute.ac.in" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 border-slate-200" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-slate-700">Username</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="text" placeholder="Choose username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-9 border-slate-200" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-700">Password</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-9 border-slate-200" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Access Code</Label>
                <Input type="password" placeholder={role === 'admin' ? 'Admin access code' : 'Teacher access code'} value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="border-slate-200" />
              </div>
            </div>

            <Button type="submit" disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-700">
              {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}Create Account
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* All Accounts */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-blue-600" />
            Registered Accounts ({accounts.length})
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold min-w-[120px]">Name</TableHead>
                <TableHead className="font-semibold min-w-[120px]">Username/Email</TableHead>
                <TableHead className="font-semibold min-w-[80px]">Role</TableHead>
                <TableHead className="font-semibold text-center min-w-[80px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400">No accounts registered</TableCell></TableRow>
              ) : (
                accounts.map((account, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell className="text-sm">{account.email || account.username}</TableCell>
                    <TableCell>
                      <Badge className={account.role === 'admin' ? 'bg-slate-100 text-slate-700 border-0' : account.role === 'teacher' ? 'bg-blue-100 text-blue-700 border-0' : 'bg-emerald-100 text-emerald-700 border-0'}>
                        {account.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50 h-8 w-8" onClick={() => handleDelete(account.identifier)}>
                        <Trash2 className="w-4 h-4" />
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
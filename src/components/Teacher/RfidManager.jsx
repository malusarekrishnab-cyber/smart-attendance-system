import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, Users, Save, X, Search, ScanLine, CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function RfidManager() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scanMode, setScanMode] = useState(false);
  const [scanTarget, setScanTarget] = useState(null);
  const [scanUid, setScanUid] = useState('');
  const scanInputRef = useRef(null);
  const [autoUid, setAutoUid] = useState('');
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [lastAutoAssigned, setLastAutoAssigned] = useState(null);
  const autoInputRef = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (scanMode && scanInputRef.current) {
      scanInputRef.current.focus();
    }
    if (autoInputRef.current) {
      autoInputRef.current.focus();
    }
  }, [scanMode, lastAutoAssigned]);

  const fetchStudents = async () => {
    setIsLoading(true);
    const all = await base44.entities.Student.list();
    setStudents(all);
    setIsLoading(false);
  };

  const startEdit = (student) => {
    setEditingId(student.id);
    setEditValue(student.rfid_uid || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveUid = async (student) => {
    const trimmed = editValue.trim();
    // Check duplicate
    const duplicate = students.find(s => s.id !== student.id && s.rfid_uid && s.rfid_uid.trim() === trimmed);
    if (trimmed && duplicate) {
      toast.error(`UID already assigned to ${duplicate.name}`);
      return;
    }
    setSavingId(student.id);
    try {
      await base44.entities.Student.update(student.id, { rfid_uid: trimmed || null });
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, rfid_uid: trimmed || null } : s));
      toast.success(`RFID UID updated for ${student.name}`);
      setEditingId(null);
      setEditValue('');
    } catch (err) {
      toast.error('Failed to update RFID UID');
    }
    setSavingId(null);
  };

  const startScanAssign = (student) => {
    setScanTarget(student);
    setScanMode(true);
    setScanUid('');
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    const trimmed = scanUid.trim();
    if (!trimmed) return;

    const duplicate = students.find(s => s.id !== scanTarget.id && s.rfid_uid && s.rfid_uid.trim() === trimmed);
    if (duplicate) {
      toast.error(`UID already assigned to ${duplicate.name}`);
      return;
    }

    setSavingId(scanTarget.id);
    try {
      await base44.entities.Student.update(scanTarget.id, { rfid_uid: trimmed });
      setStudents(prev => prev.map(s => s.id === scanTarget.id ? { ...s, rfid_uid: trimmed } : s));
      toast.success(`Card assigned to ${scanTarget.name}!`);
      setScanMode(false);
      setScanTarget(null);
      setScanUid('');
    } catch (err) {
      toast.error('Failed to assign RFID UID');
    }
    setSavingId(null);
  };

  const handleAutoAssign = async (e) => {
    e?.preventDefault();
    const trimmed = autoUid.trim();
    if (!trimmed || autoAssigning) return;

    // Check if UID already assigned to someone
    const existing = students.find(s => s.rfid_uid && s.rfid_uid.trim() === trimmed);
    if (existing) {
      toast.error(`UID already assigned to ${existing.name}`);
      setAutoUid('');
      autoInputRef.current?.focus();
      return;
    }

    // Find first unassigned student
    const target = students.find(s => !s.rfid_uid);
    if (!target) {
      toast.success('🎉 All students have RFID cards assigned!');
      setAutoUid('');
      return;
    }

    setAutoAssigning(true);
    try {
      await base44.entities.Student.update(target.id, { rfid_uid: trimmed });
      setStudents(prev => prev.map(s => s.id === target.id ? { ...s, rfid_uid: trimmed } : s));
      setLastAutoAssigned({ name: target.name, enrollment: target.enrollment_number, uid: trimmed, time: Date.now() });
      toast.success(`✓ ${target.name} → ${trimmed}`);
      setAutoUid('');
      autoInputRef.current?.focus();
    } catch (err) {
      toast.error('Failed to assign');
    }
    setAutoAssigning(false);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.enrollment_number.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const unassignedStudents = students.filter(s => !s.rfid_uid);

  const assignedCount = students.filter(s => s.rfid_uid).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <CreditCard className="w-7 h-7 text-purple-600" />
        <div>
          <h3 className="text-xl font-bold text-slate-800">RFID Card Management</h3>
          <p className="text-sm text-slate-500">Assign RFID card UIDs to students for card-based attendance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-slate-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-800">{students.length}</p>
            <p className="text-xs text-slate-500">Total Students</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-emerald-600">{assignedCount}</p>
            <p className="text-xs text-slate-500">Cards Assigned</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <CreditCard className="w-6 h-6 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">{students.length - assignedCount}</p>
            <p className="text-xs text-slate-500">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search student by name or enrollment..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 border-slate-200" />
      </div>

      {/* Scan Assign Modal */}
      <AnimatePresence>
        {scanMode && scanTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setScanMode(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center mb-4">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/30">
                  <ScanLine className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-lg font-bold text-slate-800">Assign RFID Card</h3>
                <p className="text-sm text-slate-500 mt-1">Scan card or type UID for</p>
                <p className="font-semibold text-purple-700">{scanTarget.name} ({scanTarget.enrollment_number})</p>
              </div>
              <form onSubmit={handleScanSubmit} className="space-y-3">
                <Input ref={scanInputRef} type="text" placeholder="Scan / Enter RFID UID..." value={scanUid} onChange={(e) => setScanUid(e.target.value)} className="h-12 text-center text-lg font-mono border-2 border-purple-200 focus:border-purple-400 uppercase" />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => { setScanMode(false); setScanTarget(null); setScanUid(''); }} className="flex-1"><X className="w-4 h-4 mr-2" />Cancel</Button>
                  <Button type="submit" disabled={!scanUid.trim() || savingId === scanTarget.id} className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                    {savingId === scanTarget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Assign</>}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-Assign: Fastest mode */}
      <Card className="border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <h4 className="font-bold text-slate-800">⚡ Auto-Assign Mode</h4>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0 ml-auto">{unassignedStudents.length} pending</Badge>
          </div>
          <p className="text-xs text-slate-600 mb-3">Just scan cards one by one — each card auto-assigns to the next student. No clicking, no selecting!</p>

          {/* Next student preview */}
          {unassignedStudents.length > 0 && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-white/70 border border-purple-200 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                {unassignedStudents[0].name.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-slate-500">Next card will assign to:</p>
                <p className="font-semibold text-slate-800 text-sm">{unassignedStudents[0].name} <span className="text-slate-400 font-normal">({unassignedStudents[0].enrollment_number})</span></p>
              </div>
            </div>
          )}

          <form onSubmit={handleAutoAssign}>
            <div className="relative">
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <Input ref={autoInputRef} type="text" placeholder="Scan card here — auto-assigns instantly..." value={autoUid} onChange={(e) => setAutoUid(e.target.value)} disabled={unassignedStudents.length === 0} className="pl-10 h-14 text-lg font-mono border-2 border-purple-300 focus:border-purple-500 bg-white uppercase disabled:opacity-50" />
            </div>
          </form>

          {/* Last assigned feedback */}
          <AnimatePresence>
            {lastAutoAssigned && (
              <motion.div key={lastAutoAssigned.time} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-sm text-emerald-700"><span className="font-semibold">{lastAutoAssigned.name}</span> assigned to <span className="font-mono">{lastAutoAssigned.uid}</span></p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Student Table */}
      <Card className="border-0 shadow-md overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold">Enrollment</TableHead>
                <TableHead className="font-semibold">Student Name</TableHead>
                <TableHead className="font-semibold min-w-[180px]">RFID UID</TableHead>
                <TableHead className="font-semibold text-center min-w-[140px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" /></TableCell></TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400">No students found</TableCell></TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-slate-50">
                    <TableCell className="font-mono text-sm font-medium">{student.enrollment_number}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      {editingId === student.id ? (
                        <Input type="text" placeholder="Enter UID..." value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 font-mono text-sm border-slate-200 uppercase" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveUid(student); if (e.key === 'Escape') cancelEdit(); }} />
                      ) : student.rfid_uid ? (
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 font-mono"><CreditCard className="w-3 h-3 mr-1" />{student.rfid_uid}</Badge>
                      ) : (
                        <span className="text-slate-300 text-sm">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId === student.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => saveUid(student)} disabled={savingId === student.id} className="text-emerald-700 hover:bg-emerald-50 h-8 px-2">
                            {savingId === student.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-slate-500 hover:bg-slate-100 h-8 px-2"><X className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="outline" onClick={() => startScanAssign(student)} className="border-purple-200 text-purple-700 hover:bg-purple-50 h-8">
                            <ScanLine className="w-3 h-3 mr-1" />Scan
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => startEdit(student)} className="text-slate-600 hover:bg-slate-100 h-8 px-2 text-xs">Edit</Button>
                        </div>
                      )}
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
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from 'framer-motion';
import { AlertTriangle, Send, Loader2, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function WarningModal({ student, percentage, onClose, onSent }) {
  const [message, setMessage] = useState(
    `Dear ${student?.name}, your attendance is currently ${percentage?.toFixed(1)}%, which is below the required 75%. Please improve your attendance to avoid academic penalties.`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a warning message');
      return;
    }
    setSending(true);
    try {
      await base44.entities.Warning.create({
        enrollment_number: student.enrollment_number,
        student_name: student.name,
        attendance_percentage: percentage,
        message: message.trim(),
        status: 'unread'
      });
      toast.success(`Warning sent to ${student.name}`);
      onSent();
    } catch (err) {
      toast.error('Failed to send warning');
    }
    setSending(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-5 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="text-white flex-1">
            <h3 className="font-bold text-lg">Send Attendance Warning</h3>
            <p className="text-sm text-red-100">Attendance: {percentage?.toFixed(1)}% (Below 75%)</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
              {student?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{student?.name}</p>
              <p className="text-sm text-slate-500 font-mono">{student?.enrollment_number}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Warning Message</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
              className="border-slate-200 resize-none" placeholder="Type your warning message..." />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 p-3 rounded-lg">
            <Mail className="w-4 h-4 text-blue-500 shrink-0" />
            <p>The student will see this warning on their dashboard when they log in.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200">Cancel</Button>
          <Button onClick={handleSend} disabled={sending} className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send Warning
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
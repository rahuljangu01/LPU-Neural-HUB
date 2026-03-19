import React, { useEffect, useState, useCallback } from 'react';
import { X, Trash2, Clock, Calendar, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import { successToast } from '../services/alertService';

const NotificationPanel = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const userRole = localStorage.getItem('role');

  const fetchMsgs = useCallback(async () => {
    try {
      const res = await API.get('/messages');
      setMessages(res.data);
    } catch (err) { console.error("Sync Error"); }
  }, []);

  useEffect(() => {
    if (isOpen) fetchMsgs();
  }, [isOpen, fetchMsgs]);

  const deleteMsg = async (id) => {
    await API.delete(`/messages/${id}`);
    successToast("Message Deleted");
    fetchMsgs();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-screen w-full max-w-sm bg-white z-[101] shadow-2xl p-6 overflow-y-auto font-['Inter']">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">LPU Announcements</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20}/></button>
            </div>

            <div className="space-y-4">
              {messages.length === 0 ? <p className="text-center text-slate-300 py-20 text-xs font-black uppercase tracking-widest">No new notifications</p> : 
                messages.map((m) => (
                <div key={m._id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group transition-all hover:border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone size={12} className="text-orange-600"/>
                    <span className="text-[9px] font-black uppercase text-orange-600 tracking-widest">{m.senderRole} • {m.senderName}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed mb-3">{m.content}</p>
                  
                  <div className="flex items-center justify-between mt-2 border-t border-slate-200/50 pt-2">
                    <div className="flex gap-3 text-[8px] font-black text-slate-400 uppercase italic">
                       <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(m.createdAt).toLocaleDateString()}</span>
                       <span className="flex items-center gap-1"><Clock size={10}/> {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {(userRole === 'admin' || userRole === 'hod') && (
                      <button onClick={() => deleteMsg(m._id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;
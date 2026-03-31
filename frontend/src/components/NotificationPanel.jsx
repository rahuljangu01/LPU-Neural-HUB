import React, { useEffect, useState, useCallback } from 'react';
import { X, Trash2, Clock, Calendar, Bell, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import { successToast } from '../services/alertService';

const NotificationPanel = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [msgContent, setMsgContent] = useState('');
  const [sending, setSending] = useState(false);
  const userRole = localStorage.getItem('role');
  const userName = localStorage.getItem('userName') || 'User';
  const isAdminOrHod = userRole === 'admin' || userRole === 'hod';

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

  const sendMsg = async (e) => {
    e?.preventDefault();
    if (!msgContent.trim()) return;
    setSending(true);
    try {
      await API.post('/messages', {
        senderName: userName,
        senderRole: userRole?.toUpperCase(),
        content: msgContent
      });
      successToast("Message Sent!");
      setMsgContent('');
      fetchMsgs();
    } catch (err) {
      console.error("Send Error");
    } finally {
      setSending(false);
    }
  };

  const roleColors = {
    admin: 'from-red-500 to-rose-600',
    hod: 'from-orange-500 to-red-500',
    faculty: 'from-purple-500 to-pink-500',
    student: 'from-cyan-500 to-teal-500'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full sm:w-[450px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <Bell size={20} className="text-white"/>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Notifications</h2>
                    <p className="text-xs text-slate-400">{messages.length} messages</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/20 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X size={20}/>
                </button>
              </div>

              {/* Send Message Form (Admin & HOD only) */}
              {isAdminOrHod && (
                <form onSubmit={sendMsg} className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={msgContent}
                      onChange={(e) => setMsgContent(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-500 placeholder:text-slate-500"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={sending || !msgContent.trim()}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white disabled:opacity-50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    {sending ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"/>
                    ) : (
                      <Send size={18}/>
                    )}
                  </motion.button>
                </form>
              )}
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                    <MessageSquare size={32} className="text-slate-600"/>
                  </div>
                  <p className="text-slate-400 font-semibold text-sm">No notifications yet</p>
                  <p className="text-slate-500 text-xs mt-1">Messages will appear here</p>
                </div>
              ) : (
                messages.map((m) => (
                  <motion.div
                    key={m._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-white/10 relative group hover:border-orange-500/30 transition-all"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-red-500 rounded-l-xl"/>

                    <div className="flex items-start gap-3 pl-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${roleColors[m.senderRole?.toLowerCase()] || roleColors.student} rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                        {m.senderName?.charAt(0) || 'U'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-sm">{m.senderName}</span>
                          <span className={`text-[10px] px-2 py-0.5 bg-gradient-to-r ${roleColors[m.senderRole?.toLowerCase()] || roleColors.student} rounded-full text-white font-bold uppercase`}>
                            {m.senderRole}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed break-words">{m.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={10}/> {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10}/> {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {isAdminOrHod && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          whileHover={{ scale: 1.1 }}
                          onClick={() => deleteMsg(m._id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                          <Trash2 size={14}/>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;

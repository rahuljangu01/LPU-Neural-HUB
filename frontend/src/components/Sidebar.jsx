import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Home, Users, LayoutGrid,
  Activity, Menu, X,
  Layers, BookOpen, Calendar, Clock, ChevronRight, Send, MessageSquare, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import { successToast, errorAlert } from '../services/alertService';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false); 
  const [showMessenger, setShowMessenger] = useState(false);
  const [messages, setMessages] = useState([]);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await API.get('/messages');
      setMessages(res.data);
    } catch (err) { console.error("Sync Error"); }
    finally { setLoading(false); }
  };

  const handleOpenMessenger = () => {
    setShowMessenger(true);
    fetchMessages();
  };

  const handleSendBroadcast = async (e) => {
    e?.preventDefault();
    if (!broadcastMsg.trim()) return;
    setSending(true);
    try {
      await API.post('/messages', { 
        senderName: localStorage.getItem('userName'), 
        senderRole: localStorage.getItem('role')?.toUpperCase(), 
        content: broadcastMsg 
      });
      successToast("Message Sent!");
      setBroadcastMsg('');
      fetchMessages();
    } catch (err) { 
      errorAlert("Failed", "Transmission error."); 
    } finally { 
      setSending(false); 
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      await API.delete(`/messages/${id}`);
      successToast("Message Deleted");
      fetchMessages();
    } catch (err) { 
      errorAlert("Failed", "Could not delete."); 
    }
  };

  const menuItems = {
    admin: [
      { name: 'DashBoard', icon: <Home size={18}/>, path: '/admin' },
      { name: 'Users', icon: <Users size={18}/>, path: '/admin/users' },
      { name: 'Rooms', icon: <Layers size={18}/>, path: '/admin/rooms' },
      { name: 'Subjects', icon: <BookOpen size={18}/>, path: '/admin/subjects' },
      { name: 'Batches', icon: <LayoutGrid size={18}/>, path: '/admin/batches' },
    ],
    hod: [
      { name: 'DashBoard', icon: <Activity size={18}/>, path: '/hod' },
    ],
    student: [
      { name: 'DashBoard', icon: <Calendar size={18}/>, path: '/student' },
    ],
    faculty: [
      { name: 'DashBoard', icon: <Clock size={18}/>, path: '/faculty' },
    ]
  };

  const role = localStorage.getItem('role') || 'student';
  const isAdminOrHod = role === 'admin' || role === 'hod';
  const userName = localStorage.getItem('userName') || 'User';
  const navLinks = menuItems[role] || [];
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const roleColors = {
    admin: 'from-red-500 to-rose-600',
    hod: 'from-orange-500 to-red-500',
    faculty: 'from-purple-500 to-pink-500',
    student: 'from-cyan-500 to-teal-500'
  };
  const roleColor = roleColors[role] || roleColors.student;

  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring", stiffness: 250, damping: 30 } },
    closed: { x: -320, transition: { type: "spring", stiffness: 250, damping: 30 } }
  };

  return (
    <>
      {/* MOBILE HAMBURGER */}
      <div className="lg:hidden fixed top-4 left-4 z-[2000]">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-xl border border-white/10 p-3 rounded-2xl text-white shadow-xl"
        >
          {isOpen ? <X size={22}/> : <Menu size={22}/>}
        </motion.button>
      </div>

      {/* OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)} 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <motion.div 
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen || window.innerWidth >= 1024 ? "open" : "closed"}
        className="h-screen fixed left-0 top-0 z-[1001] flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 backdrop-blur-xl border-r border-white/10 font-['Outfit'] w-72 overflow-hidden shadow-2xl"
      >
        {/* Animated Glow Effects */}
        <motion.div 
          animate={{ 
            opacity: [0.15, 0.25, 0.15],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl pointer-events-none"
        />
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 right-0 w-32 h-32 bg-gradient-to-tl from-rose-500/10 to-transparent rounded-full blur-2xl pointer-events-none"
        />

        {/* LOGO SECTION */}
        <div className="p-6 border-b border-white/10 shrink-0 relative">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3"
          >
            <div>
              <motion.h2 
                animate={{ 
                  textShadow: [
                    "0 0 10px rgba(249, 115, 22, 0)",
                    "0 0 20px rgba(249, 115, 22, 0.5)",
                    "0 0 10px rgba(249, 115, 22, 0)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                whileHover={{ x: 3 }}
                className="text-xl font-black text-white tracking-tight"
              >
                <motion.span
                  animate={{ color: ["#ffffff", "#f97316", "#ffffff"] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  LPU
                </motion.span>
                <motion.span
                  animate={{ color: ["#f97316", "#ffffff", "#f97316"] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                >
                  {' '}Neural HUB
                </motion.span>
              </motion.h2>
              <motion.div 
                className="flex items-center gap-2"
              >
                <motion.p 
                  animate={{ opacity: [0.6, 1, 0.6], y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[10px] text-orange-400 font-medium uppercase tracking-widest"
                >
                  Smart Scheduler
                </motion.p>
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-orange-500 rounded-full"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* USER PROFILE */}
        <div className="p-4 shrink-0 relative">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-orange-500/30 transition-all cursor-pointer"
          >
            <motion.div 
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(249, 115, 22, 0)",
                  "0 0 20px 5px rgba(249, 115, 22, 0.3)",
                  "0 0 0 0 rgba(249, 115, 22, 0)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-12 h-12 bg-gradient-to-br ${roleColor} rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg`}
            >
              {getInitials(userName)}
            </motion.div>
            <div className="flex-1 overflow-hidden">
              <motion.p 
                whileHover={{ x: 2 }}
                className="font-bold text-white text-sm truncate"
              >
                {userName}
              </motion.p>
              <motion.p 
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs text-orange-400 font-medium uppercase"
              >
                {role}
              </motion.p>
            </div>
          </motion.div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scroll">
          <div className="space-y-1">
            {navLinks.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link 
                    to={item.path}
                    className={`relative group flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {isActive && (
                      <>
                        <motion.div 
                          layoutId="navBg" 
                          className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-l-4 border-orange-500 rounded-xl" 
                        />
                        <motion.div 
                          animate={{ height: [24, 32, 24] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"
                        />
                      </>
                    )}
                    <motion.span 
                      whileHover={{ scale: 1.1 }}
                      className={`relative z-10 ${isActive ? 'text-orange-400' : 'group-hover:text-orange-400'}`}
                    >
                      {item.icon}
                    </motion.span>
                    <span className="relative z-10 font-semibold text-sm">{item.name}</span>
                    {isActive && (
                      <motion.div 
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="relative z-10 ml-auto"
                      >
                        <ChevronRight className="text-orange-400" size={16}/>
                      </motion.div>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* MESSENGER BUTTON (Admin & HOD only) */}
        {isAdminOrHod && (
          <div className="px-3 py-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenMessenger}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 hover:border-orange-500 rounded-xl text-orange-400 hover:text-white transition-all"
            >
              <MessageSquare size={18}/>
              <span className="font-semibold text-sm">Messenger</span>
            </motion.button>
          </div>
        )}

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-slate-900/50 relative">
          <motion.div 
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-center"
          >
            <p className="text-[10px] text-slate-500 font-medium">LPU Neural HUB v4.5</p>
          </motion.div>
        </div>
      </motion.div>

      {/* MESSENGER MODAL - Mobile Responsive */}
      <AnimatePresence>
        {showMessenger && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowMessenger(false)} 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:left-0 lg:left-72 h-[85vh] sm:h-screen w-full sm:w-[400px] lg:w-[450px] z-[2001] flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 sm:border-l sm:border-white/10 shadow-2xl rounded-t-3xl sm:rounded-none"
            >
              {/* Drag Handle - Mobile Only */}
              <div className="sm:hidden flex justify-center pt-3 pb-2 shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full"/>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center"
                  >
                    <MessageSquare size={20} className="text-white"/>
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Messenger</h3>
                    <p className="text-slate-400 text-xs">{messages.length} messages</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMessenger(false)} 
                  className="p-2 bg-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/20 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <X size={18}/>
                </button>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"/>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <MessageSquare size={32} className="text-slate-600 mb-3"/>
                    <p className="text-slate-400 font-semibold text-sm">No messages</p>
                    <p className="text-slate-500 text-xs mt-1">Send a message below</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <motion.div
                      key={m._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800/80 p-3 rounded-xl border border-white/5 relative group hover:border-orange-500/30 transition-all"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-red-500 rounded-l-xl"/>

                      <div className="flex items-start gap-3 pl-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${roleColors[m.senderRole?.toLowerCase()] || roleColors.student} rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                          {m.senderName?.charAt(0) || 'U'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-xs">{m.senderName}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 bg-gradient-to-r ${roleColors[m.senderRole?.toLowerCase()] || roleColors.student} rounded text-white font-bold uppercase`}>
                              {m.senderRole}
                            </span>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed break-words">{m.content}</p>
                          <p className="text-slate-500 text-[10px] mt-1">{new Date(m.createdAt).toLocaleString()}</p>
                        </div>

                        <motion.button
                          initial={{ opacity: 0 }}
                          whileHover={{ scale: 1.1 }}
                          onClick={() => handleDeleteMessage(m._id)}
                          className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all shrink-0"
                        >
                          <Trash2 size={12}/>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Send Message Form */}
              <div className="p-4 border-t border-white/10 shrink-0">
                <form onSubmit={handleSendBroadcast} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    className="flex-1 p-3 bg-white/10 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-orange-500 placeholder:text-slate-500"
                  />
                  <motion.button
                    type="submit"
                    disabled={sending || !broadcastMsg.trim()}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white disabled:opacity-50 transition-all flex items-center justify-center shadow-lg shadow-orange-500/20"
                  >
                    {sending ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/>
                    ) : (
                      <Send size={16}/>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Clock, Calendar, Mail, ChevronDown, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationPanel from './NotificationPanel';
import API from '../services/api';

const Navbar = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [unreadCount, setUnreadCount] = useState(0);

  const userEmail = localStorage.getItem('userEmail') || 'guest';
  const userName = (localStorage.getItem('userName') || 'User').split(' ')[0];
  const userRole = (localStorage.getItem('role') || 'GUEST').toUpperCase();
  const seenKey = `lastReadCount_${userEmail}`;

  // 1. INDIVIDUAL NOTIFICATION LOGIC (Student 1/2 Sync)
  const checkNewMessages = useCallback(async () => {
    try {
      const res = await API.get('/messages');
      const totalMsgs = res.data.length;
      const lastRead = localStorage.getItem(seenKey);
      setUnreadCount(lastRead === null ? totalMsgs : Math.max(0, totalMsgs - parseInt(lastRead)));
    } catch (err) { console.error("Sync Error"); }
  }, [seenKey]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    checkNewMessages();
    const m = setInterval(checkNewMessages, 5000); 
    return () => { clearInterval(t); clearInterval(m); };
  }, [checkNewMessages]);

  const handleOpenNotifications = async () => {
    setIsPanelOpen(true);
    try {
      const res = await API.get('/messages');
      localStorage.setItem(seenKey, res.data.length.toString());
      setUnreadCount(0); 
    } catch (err) { }
  };

  const getGreeting = () => {
    const h = time.getHours();
    if (h < 12) return "GOOD MORNING";
    if (h < 17) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  };

  // Time & Date Formats
  const dayName = time.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dateFormatted = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  const timeFormatted = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const mobileTime = `${dayName}, ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;

  return (
    <>
      {/* Laptop par h-24 sizing taaki 'Bada' dikhe */}
      <nav className="h-20 lg:h-24 sticky top-0 z-[60] px-4 md:px-10 flex items-center justify-between bg-[#020617]/95 backdrop-blur-3xl border-b border-white/5 shadow-[0_10px_50px_rgba(0,0,0,0.5)] font-['Outfit'] transition-all">
        
        {/* LEFT: PREMIUM IDENTITY SECTION */}
        <div className="flex items-center gap-4 pl-14 md:pl-0">
          {/* Cyber Red Line Accent */}
          <div className="w-[2px] h-8 lg:h-12 bg-gradient-to-b from-red-600 to-transparent hidden md:block opacity-60" />
          
          <div className="flex flex-col text-left leading-none">
            <motion.p 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 0.8, x: 0 }}
              className="text-[8px] md:text-[10px] lg:text-xs font-black text-red-500 tracking-[0.5em] uppercase italic mb-1.5 md:mb-2"
            >
              {getGreeting()}
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="text-xl md:text-3xl lg:text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
            >
              {userName}
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-red-600 ml-1"></motion.span>
            </motion.h1>
          </div>
        </div>

        {/* CENTER: HIGH-TECH CLOCK NODE (Bada Sizing for Laptop) */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="hidden md:flex items-center gap-4 lg:gap-10 bg-white/[0.03] px-8 lg:px-12 py-3 lg:py-4 rounded-full border border-white/5 shadow-inner"
        >
           <div className="flex items-center gap-3 border-r border-white/10 pr-8 lg:pr-12">
              <Calendar size={18} className="text-red-600 opacity-60" />
              <div className="flex flex-col text-left leading-none">
                 <span className="text-[10px] lg:text-xs font-black text-white tracking-widest">{dayName}</span>
                 <span className="text-[8px] lg:text-[10px] font-bold text-slate-500 mt-1">{dateFormatted}</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <Clock size={20} className="text-red-600 animate-pulse" />
              <span className="text-sm lg:text-2xl font-black text-white tabular-nums tracking-[0.2em]">
                {timeFormatted}
              </span>
           </div>
        </motion.div>

        {/* RIGHT: NOTIFICATIONS & PROFILE */}
        <div className="flex items-center gap-4 lg:gap-10">
          
          {/* Mobile Only Compact Time */}
          <div className="flex md:hidden flex-col items-end mr-1 text-white">
             <span className="text-[11px] font-black tracking-tighter uppercase leading-none">{mobileTime}</span>
          </div>

          {/* NOTIFICATION BELL (Animated) */}
          <motion.div 
            whileHover={{ scale: 1.2, rotate: 15 }} whileTap={{ scale: 0.9 }}
            onClick={handleOpenNotifications}
            className="relative p-2 lg:p-3 cursor-pointer group"
          >
            <Bell size={24} className={`${unreadCount > 0 ? 'text-red-500 animate-bounce' : 'text-slate-500'} lg:w-8 lg:h-8 transition-colors group-hover:text-red-500`} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute top-1 right-1 bg-red-600 text-white text-[9px] lg:text-[11px] font-black w-4.5 h-4.5 lg:w-6 lg:h-6 flex items-center justify-center rounded-full shadow-[0_0_20px_red] ring-2 ring-[#020617]"
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 🌟 PROFILE AVATAR (Orbit Animation) 🌟 */}
          <div onClick={() => setIsProfileOpen(true)} className="relative cursor-pointer group">
            {/* Spinning Orbit Ring */}
            <motion.div 
              animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 lg:-inset-3 border-2 border-dashed border-red-600/20 rounded-full group-hover:border-red-600/50"
            />
            
            <div className="relative flex items-center gap-4 bg-white/5 border border-white/10 p-1 pr-4 lg:pr-8 rounded-full group-hover:bg-white/10 transition-all">
                <div className="w-10 h-10 lg:w-16 lg:h-16 bg-gradient-to-br from-red-600 to-red-900 rounded-full flex items-center justify-center text-white font-black text-sm lg:text-2xl italic border-2 border-[#020617] shadow-2xl overflow-hidden">
                    {userName.charAt(0)}
                </div>
                <div className="hidden sm:block text-left overflow-hidden">
                   <p className="text-[7px] lg:text-[9px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Welcome</p>
                   <div className="flex items-center gap-1 lg:gap-2">
                      <span className="text-[10px] lg:text-sm font-black text-white uppercase italic tracking-widest">SYSTEM</span>
                      <ChevronDown size={14} className="text-slate-500 group-hover:translate-y-0.5 transition-transform" />
                   </div>
                </div>
            </div>
            {/* Online Pulse Dot */}
            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 lg:w-5 lg:h-5 bg-emerald-500 border-2 border-[#020617] rounded-full z-20 shadow-lg" />
          </div>

        </div>
      </nav>

      {/* --- PROFILE MODAL (Full Functional) --- */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
               className="absolute inset-0 bg-black/80 backdrop-blur-md" 
               onClick={() => setIsProfileOpen(false)} 
             />
             <motion.div 
               initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 50 }}
               className="bg-[#050505] w-full max-w-[380px] rounded-[4rem] p-12 text-center shadow-[0_0_100px_rgba(220,38,38,0.2)] relative border border-white/5 text-white"
             >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent" />
                <div className="w-24 h-24 bg-red-600 rounded-[2.5rem] mx-auto mb-8 flex items-center justify-center text-white text-5xl font-black italic shadow-[0_0_40px_rgba(220,38,38,0.4)] border-4 border-white/5">
                  {userName.charAt(0)}
                </div>
                <h3 className="text-3xl font-black uppercase italic leading-none mb-2">{userName}</h3>
                                <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center gap-4 text-xs font-bold text-slate-400 truncate mb-10">
                    <Mail size={20} className="text-red-600 flex-shrink-0"/> {userEmail}
                </div>
                <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-3 text-emerald-500/60 font-black uppercase text-[10px] tracking-[0.3em]">
                   <ShieldCheck size={16}/> Identity_Verified.
                </div>
                <button onClick={() => setIsProfileOpen(false)} className="mt-10 text-slate-600 hover:text-white transition-all text-xs font-black uppercase tracking-[0.5em] underline underline-offset-8">Close Card</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <NotificationPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
};

export default Navbar;
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, LogOut, LayoutGrid,
  Activity, Megaphone, ShieldCheck, Menu, X,
  Layers, BookOpen, Calendar, Zap, Clock, Signal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false); 
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const role = (localStorage.getItem('role') || 'student').toLowerCase();
  const userName = localStorage.getItem('userName') || 'User';

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  // 🎯 Logout Logic: Memory preserve karne ke liye pura clear nahi karenge
  const handleLogout = () => {
    const sessionKeys = ['token', 'role', 'userName', 'userEmail', 'userDept', 'userBatch'];
    sessionKeys.forEach(key => localStorage.removeItem(key));
    navigate('/');
  };

  const menuItems = {
    admin: [
      { name: 'DashBoard', icon: <Home size={18}/>, path: '/admin' },
      { name: 'Users List', icon: <Users size={18}/>, path: '/admin/users' },
      { name: 'Class Room', icon: <Layers size={18}/>, path: '/admin/rooms' },
      { name: 'Subject', icon: <BookOpen size={18}/>, path: '/admin/subjects' },
      { name: 'Batch ', icon: <LayoutGrid size={18}/>, path: '/admin/batches' },
      { name: 'Messenger', icon: <Signal size={18}/>, path: '/admin/broadcast' },
    ],
    hod: [
      { name: 'DashBaord', icon: <Activity size={18}/>, path: '/hod' },
      { name: 'Messenger', icon: <Megaphone size={18}/>, path: '/hod/broadcast' },
    ],
    student: [
      { name: 'DashBoard', icon: <Calendar size={18}/>, path: '/student' },
    ],
    faculty: [
      { name: 'DashBoard', icon: <Clock size={18}/>, path: '/faculty' },
      // Load Analytics Removed as requested
    ]
  };

  const navLinks = menuItems[role] || [];
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // --- Futuristic Animation Variants ---
  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring", stiffness: 200, damping: 25 } },
    closed: { x: -300, transition: { type: "spring", stiffness: 200, damping: 25 } }
  };

  const containerVariants = {
    open: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
  };

  const itemVariants = {
    open: { x: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
    closed: { x: -20, opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <>
      {/* 🍔 MOBILE BURGER BUTTON */}
      <div className="lg:hidden fixed top-5 left-4 z-[2000]">

        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#020617] border border-red-500/30 p-2.5 rounded-xl text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X size={22}/>
              </motion.div>
            ) : (
              <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Menu size={22}/>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* 🌑 DIM OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)} 
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]"
          />
        )}
      </AnimatePresence>

      {/* 💻 SIDEBAR MAIN CONTAINER */}
      <motion.div 
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen || window.innerWidth >= 1024 ? "open" : "closed"}
        /* 🚀 FIX: z-[1001] ensures it stays above everything, and 'fixed top-0 left-0' is strictly enforced */
        className="h-full fixed left-0 top-0 z-[1001] flex flex-col bg-[#020617] border-r border-white/5 font-['Outfit'] shadow-[20px_0_50px_rgba(0,0,0,0.3)] w-72 lg:w-64 xl:w-72 overflow-hidden"
      >
        {/* LOGO SECTION */}
        <div className="p-8 text-center border-b border-white/5 relative overflow-hidden">
           <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative z-10">
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                 LPU Neural <span className="text-red-600 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">HUB</span>
              </h2>
              <p className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-600 mt-1 italic">AI time table scheduler</p>
           </motion.div>
           <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-600/5 blur-3xl rounded-full" />
        </div>

        {/* USER PROFILE BOX */}
        <div className="px-6 py-8">
            <motion.div 
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-[2rem] border border-white/10 transition-all shadow-inner"
            >
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-950 rounded-2xl flex items-center justify-center font-black italic shadow-lg text-white ring-2 ring-red-600/20">
                    {getInitials(userName)}
                </div>
                <div className="flex-1 overflow-hidden text-left">
                    <p className="text-[11px] font-black text-white uppercase italic tracking-tighter truncate">{userName}</p>
                    <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest">{role}</p>
                </div>
            </motion.div>
        </div>

        {/* 📋 NAVIGATION LINKS (STAGGERED ANIMATION) */}
              <motion.nav 
                  variants={containerVariants}
                  className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scroll pb-10 h-full"
              >
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.div key={item.name} variants={itemVariants}>
                <Link 
                  to={item.path}
                  className={`relative group flex items-center p-4 rounded-2xl transition-all duration-300 overflow-hidden
                    ${isActive ? 'text-white' : 'text-slate-500 hover:text-white'}`}
                >
                  {/* Background Active Glow Logic */}
                  {isActive && (
                    <motion.div 
                        layoutId="navBackground"
                        className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-red-600/5 to-transparent border-l-4 border-red-600 z-0" 
                    />
                  )}
                  
                  <span className={`relative z-10 transition-transform duration-300 ${isActive ? 'text-red-500' : 'group-hover:scale-125'}`}>
                    {item.icon}
                  </span>
                  <span className="relative z-10 ml-4 font-black text-[10px] uppercase tracking-widest italic leading-none">
                    {item.name}
                  </span>
                  
                  {isActive && (
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="ml-auto relative z-10"
                    >
                        <Zap size={12} className="text-red-500 fill-red-500 animate-pulse" />
                    </motion.div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>

        {/* 🚪 TERMINATE SESSION ACTION */}
        <div className="p-6 mt-auto border-t border-white/5 bg-[#010411]">
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: "#dc2626", color: "#fff" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-center gap-3 p-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-red-500 transition-all font-black uppercase text-[10px] italic tracking-widest shadow-lg"
            >
               <LogOut size={16} /> Logout
            </motion.button>
        </div>
      </motion.div>

      {/* 🚀 ANIMATED LOGOUT MODAL */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-6 text-white font-['Outfit']">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                className="bg-[#050505] max-w-sm w-full rounded-[4rem] p-12 text-center border border-red-900/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent shadow-[0_0_20px_red]" />
                <ShieldCheck size={48} className="text-red-600 mx-auto mb-6 animate-pulse" />
                <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4 leading-none">Logout?</h2>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-10 italic">This will finalize current session data.</p>
                <div className="flex gap-4">
                    <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-4 text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors tracking-widest">Cancle</button>
                    <button 
                        onClick={handleLogout} 
                        className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-red-900/40 tracking-widest font-black"
                    >
                        Confirm
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
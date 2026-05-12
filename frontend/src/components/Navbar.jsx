import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Clock, Calendar, Mail, ChevronDown, ShieldCheck, LogOut, KeyRound, Eye, EyeOff, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationPanel from './NotificationPanel';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { successToast, errorAlert } from '../services/alertService';

const Navbar = () => {
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [time, setTime] = useState(new Date());
  const [unreadCount, setUnreadCount] = useState(0);

  const userEmail = localStorage.getItem('userEmail') || 'guest';
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = (localStorage.getItem('role') || 'GUEST').toUpperCase();
  const userUid = localStorage.getItem('userUid') || '00000';
  const seenKey = `lastReadCount_${userEmail}`;

  const checkNewMessages = useCallback(async () => {
    try {
      const res = await API.get('/messages');
      const totalMsgs = res.data.length;
      const lastRead = localStorage.getItem(seenKey);
      setUnreadCount(lastRead === null ? totalMsgs : Math.max(0, totalMsgs - parseInt(lastRead)));
    } catch (err) { console.error("Sync Error"); }
  }, [seenKey]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000); 
    checkNewMessages();
    const m = setInterval(checkNewMessages, 15000);
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

  const handleLogout = () => {
    setShowLogoutModal(false);
    setTimeout(() => {
      const readCountKeys = Object.keys(localStorage).filter(key => key.startsWith('lastReadCount_'));
      const savedReadCounts = {};
      readCountKeys.forEach(key => { savedReadCounts[key] = localStorage.getItem(key); });
      
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userBatch');
      localStorage.removeItem('userUid');
      
      Object.keys(savedReadCounts).forEach(key => { localStorage.setItem(key, savedReadCounts[key]); });
      navigate('/');
    }, 300);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errorAlert("Error", "New passwords do not match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      errorAlert("Error", "Password must be at least 6 characters!");
      return;
    }
    setChangingPassword(true);
    try {
      await API.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      successToast("Password changed successfully!");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
      setIsDropdownOpen(false);
    } catch (err) {
      const msg = err.response?.data?.msg || "Failed to change password";
      errorAlert("Error", msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const getGreeting = () => {
    const h = time.getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const dayName = time.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dateFormatted = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  const timeFormatted = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const mobileTime = `${dayName}, ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;

  const roleColors = {
    'ADMIN': 'from-red-500 to-rose-600',
    'HOD': 'from-purple-500 to-violet-600',
    'FACULTY': 'from-orange-500 to-amber-500',
    'STUDENT': 'from-cyan-500 to-teal-500',
    'GUEST': 'from-slate-500 to-gray-500'
  };

  const roleColor = roleColors[userRole] || roleColors['GUEST'];

  return (
    <>
      <nav className="h-14 sm:h-16 md:h-20 sticky top-0 z-[60] px-3 sm:px-4 md:px-8 flex items-center justify-between bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 backdrop-blur-xl border-b border-slate-700/50 shadow-lg font-['Outfit']">
        
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 pl-10 sm:pl-0">
          <div className="w-1 h-6 sm:h-8 md:h-10 bg-gradient-to-b from-orange-500 via-red-500 to-rose-500 rounded-full shadow-lg shadow-red-500/30"/>
          
          <div className="flex flex-col text-left leading-none min-w-0">
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[8px] sm:text-[9px] md:text-xs font-bold text-orange-400 tracking-widest uppercase"
            >
              {getGreeting()}
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-base sm:text-lg md:text-2xl lg:text-3xl font-black text-white tracking-tight"
            >
              {userName}
              <motion.span 
                animate={{ opacity: [0, 1, 0] }} 
                transition={{ duration: 1.5, repeat: Infinity }} 
                className="text-orange-500 ml-0.5"
              >
                _
              </motion.span>
            </motion.h1>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden xl:flex items-center gap-6 bg-slate-700/50 backdrop-blur-sm px-6 py-2.5 rounded-2xl border border-slate-600/50"
        >
          <div className="flex items-center gap-2 border-r border-slate-600 pr-5">
            <Calendar size={16} className="text-orange-500" />
            <div className="flex flex-col text-left leading-none">
              <span className="text-xs font-bold text-white tracking-widest">{dayName}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{dateFormatted}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-orange-500" />
            <span className="text-lg font-bold text-white tracking-widest tabular-nums">
              {timeFormatted}
            </span>
          </div>
        </motion.div>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          
          <div className="flex xl:hidden flex-col items-end text-slate-400 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase">{mobileTime}</span>
          </div>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Bell size={20} className={unreadCount > 0 ? 'text-orange-500' : 'text-slate-500'} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600 border border-slate-600/50 rounded-full pl-1 pr-3 py-1 transition-all min-h-[44px]"
            >
              <div className="relative">
                <div className={`w-9 h-9 md:w-11 md:h-11 bg-gradient-to-br ${roleColor} rounded-full flex items-center justify-center text-white font-black text-base md:text-xl shadow-lg`}>
                  {userName.charAt(0)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 bg-emerald-500 rounded-full border-2 border-white"/>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[8px] md:text-[9px] font-bold text-orange-400 uppercase tracking-wider">Access</p>
                <p className="text-[10px] md:text-sm font-black text-white -mt-0.5">{userRole}</p>
              </div>
              <ChevronDown size={12} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}/>
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}/>
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${roleColor} rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                          {userName.charAt(0)}
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-bold text-slate-800 truncate">{userName}</p>
                          <p className="text-xs text-orange-500 font-medium truncate">{userRole} • #{userUid}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <button 
                        onClick={() => { setIsProfileOpen(true); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-700 transition-all min-h-[44px]"
                      >
                        <span className="w-5 h-5 flex items-center justify-center text-orange-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></span>
                        <span className="font-medium text-sm">View Profile</span>
                      </button>
                      <button 
                        onClick={() => { setShowPasswordModal(true); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-700 transition-all min-h-[44px]"
                      >
                        <KeyRound size={18} className="text-orange-500"/>
                        <span className="font-medium text-sm">Change Password</span>
                      </button>
                    </div>

                    <div className="p-2 border-t border-slate-100">
                      <button 
                        onClick={() => { setShowLogoutModal(true); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 transition-all min-h-[44px]"
                      >
                        <LogOut size={18} />
                        <span className="font-medium text-sm">Logout</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
              onClick={() => setIsProfileOpen(false)} 
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="relative bg-gradient-to-br from-slate-800 to-slate-900 w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500"/>
              
              <button 
                onClick={() => setIsProfileOpen(false)} 
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/20 transition-all z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4 sm:mb-6">
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br ${roleColor} rounded-2xl sm:rounded-3xl flex items-center justify-center text-4xl sm:text-5xl font-black shadow-xl`}>
                    {userName.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-slate-800">
                    <ShieldCheck size={16} className="text-white"/>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{userName}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 bg-gradient-to-r ${roleColor} text-white text-xs font-bold rounded-full uppercase tracking-wider`}>
                    {userRole}
                  </span>
                  <span className="text-orange-400 font-bold text-sm">#{userUid}</span>
                </div>

                <div className="w-full space-y-3 mt-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <Mail className="text-orange-400 flex-shrink-0" size={20}/>
                    <span className="text-slate-300 text-sm font-medium truncate">{userEmail}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
                  <ShieldCheck size={16}/> Identity Verified
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                  <button 
                    onClick={() => { setShowPasswordModal(true); setIsProfileOpen(false); }}
                    className="w-full px-6 py-3.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl font-semibold text-sm hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <KeyRound size={18}/> Change Password
                  </button>
                  <button 
                    onClick={() => { setShowLogoutModal(true); setIsProfileOpen(false); }}
                    className="w-full px-6 py-3.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-semibold text-sm hover:bg-red-500 hover:text-white transition-all"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <NotificationPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />

      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[3000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LogOut className="text-red-500" size={32}/>
              </div>
              
              <h2 className="text-xl font-bold text-white text-center mb-2">Logout Confirmation</h2>
              <p className="text-slate-400 text-sm text-center mb-8">Are you sure you want to logout from Neural HUB?</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3.5 bg-white/5 text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${roleColor} rounded-xl flex items-center justify-center shadow-lg`}>
                    <KeyRound size={24} className="text-white"/>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Change Password</h3>
                    <p className="text-slate-400 text-sm">Update your account password</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(false)} 
                  className="p-2 bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                    <input 
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full p-4 pl-12 pr-12 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-orange-500 text-sm"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full p-4 pl-12 pr-12 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-orange-500 text-sm"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-orange-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button 
                    type="submit"
                    disabled={changingPassword}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {changingPassword ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"/>
                    ) : (
                      <>Update Password</>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

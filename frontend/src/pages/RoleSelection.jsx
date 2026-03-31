import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ChevronRight, ArrowLeft, Briefcase, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const RoleSelection = () => {
  const navigate = useNavigate();
  
  const roles = [
    { 
      id: 'student', 
      title: 'Student', 
      subtitle: 'View timetable & schedule',
      icon: <GraduationCap size={32} />, 
      color: 'from-cyan-500 to-teal-500',
      borderColor: 'hover:border-cyan-500/50',
      delay: 0.1 
    },
    { 
      id: 'faculty', 
      title: 'Faculty', 
      subtitle: 'Manage classes & schedule',
      icon: <Briefcase size={32} />, 
      color: 'from-blue-500 to-indigo-500',
      borderColor: 'hover:border-blue-500/50',
      delay: 0.2 
    },
    { 
      id: 'hod', 
      title: 'HOD', 
      subtitle: 'Full dashboard access',
      icon: <ShieldCheck size={32} />, 
      color: 'from-purple-500 to-pink-500',
      borderColor: 'hover:border-purple-500/50',
      delay: 0.3 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 sm:p-6 font-['Outfit'] overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            x: [-100, 100, -100],
            y: [-50, 50, -50],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [100, -100, 100],
            y: [50, -50, 50],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl w-full bg-white/5 backdrop-blur-2xl rounded-3xl sm:rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/10 relative z-10"
      >
        {/* Left Side - Branding */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
          {/* Animated Background Elements */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute opacity-5"
          >
            <Sparkles size={300} className="text-orange-500"/>
          </motion.div>
          
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-20 right-20 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"
          />
          
          {/* Mobile Logo */}
          <div className="md:hidden flex flex-col items-center z-10">
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-3 overflow-hidden bg-white/10"
            >
              <img src="/lpu-logo.png" alt="LPU Logo" className="w-full h-full object-contain" />
            </motion.div>
          </div>

          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="hidden md:block mb-8 z-10"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/40 overflow-hidden bg-white/10"
            >
              <img src="/lpu-logo.png" alt="LPU Logo" className="w-24 h-24 object-contain" />
            </motion.div>
          </motion.div>
          
          <motion.h2 
            animate={{ textShadow: ["0 0 10px rgba(249,115,22,0)", "0 0 20px rgba(249,115,22,0.5)", "0 0 10px rgba(249,115,22,0)"] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-white text-center mb-2 z-10"
          >
            LPU Neural HUB
          </motion.h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium text-center z-10">AI Powered Timetable Scheduler</p>
          
          <div className="hidden md:flex items-center gap-2 mt-6 z-10">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-emerald-500 rounded-full"
            />
            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">System Online</span>
          </div>
        </div>

        {/* Right Side - Role Selection */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center">
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -5 }}
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-slate-400 hover:text-orange-500 font-semibold text-xs sm:text-sm uppercase tracking-wider mb-6 md:mb-8 transition-colors self-start"
          >
            <ArrowLeft size={16} /> Back to Login
          </motion.button>

          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 tracking-tight leading-none"
          >
            Who are
          </motion.h2>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-orange-500 mb-6 md:mb-8 tracking-tight leading-none"
          >
            You?
          </motion.h2>
          
          <div className="space-y-3 sm:space-y-4">
            {roles.map((role, index) => (
              <motion.div 
                key={role.id} 
                initial={{ opacity: 0, x: 30, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: role.delay + 0.3 }}
                whileHover={{ x: 10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/register?role=${role.id}`)} 
                className={`flex items-center justify-between p-4 sm:p-5 md:p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl cursor-pointer group transition-all ${role.borderColor}`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${role.color} rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg`}
                  >
                    {role.icon}
                  </motion.div>
                  <div className="text-left">
                    <h3 className="font-bold text-white text-base sm:text-lg">{role.title}</h3>
                    <p className="text-slate-400 text-xs sm:text-sm font-medium">{role.subtitle}</p>
                  </div>
                </div>
                <motion.div 
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-slate-500 group-hover:text-orange-500 transition-colors"
                >
                  <ChevronRight size={22} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default RoleSelection;

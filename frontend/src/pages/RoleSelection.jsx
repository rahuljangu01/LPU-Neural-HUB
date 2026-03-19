import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ChevronRight, ArrowLeft, Briefcase, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const RoleSelection = () => {
  const navigate = useNavigate();
  const roles = [
    { id: 'student', title: 'LPU STUDENT', icon: <GraduationCap size={28} />, color: 'bg-orange-600', delay: 0.1 },
    { id: 'faculty', title: 'FACULTY MEMBER', icon: <Briefcase size={28} />, color: 'bg-blue-600', delay: 0.2 },
    { id: 'hod', title: 'HOD ', icon: <ShieldCheck size={28} />, color: 'bg-red-600', delay: 0.3 }
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 font-['Outfit'] overflow-hidden">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl w-full bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/10"
      >
        {/* MOBILE LOGO HEADER */}
        <div className="md:hidden w-full pt-8 flex flex-col items-center">
            <img src="/lpu-logo.png" className="w-16 drop-shadow-lg" alt="logo" />
        </div>

        <div className="w-full md:w-5/12 bg-[#0a0a0c] p-10 md:p-12 text-white flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-white/5">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="mb-6 md:mb-10 z-10 hidden md:block">
            <img src="/lpu-logo.png" alt="LPU" className="md:w-40 drop-shadow-[0_0_25px_rgba(234,88,12,0.4)]"/>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic text-center pr-4">LPU Neural <span className="text-orange-600">HUB</span></h2>
          <p className="text-slate-500 text-[9px] mt-4 uppercase tracking-[0.4em] font-black italic">AI time table scheduler</p>
        </div>

        <div className="w-full md:w-7/12 p-8 sm:p-12 md:p-16">
          <motion.button whileHover={{ x: -5 }} onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-orange-600 font-black text-[10px] uppercase tracking-widest mb-8 md:mb-10 transition-all">
            <ArrowLeft size={16} /> BACK TO LOGIN
          </motion.button>

          <h2 className="text-3xl md:text-4xl font-black text-white mb-1 tracking-tighter uppercase italic pr-4">WHO ARE</h2>
          <h2 className="text-3xl md:text-4xl font-black text-orange-600 mb-8 md:mb-10 tracking-tighter uppercase italic pr-4 underline decoration-white/10 underline-offset-8">YOU?</h2>
          
          <div className="space-y-4">
            {roles.map((role) => (
              <motion.div key={role.id} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: role.delay }}
                whileHover={{ x: 10, backgroundColor: "rgba(255,255,255,0.05)" }}
                onClick={() => navigate(`/register?role=${role.id}`)} 
                className="flex items-center justify-between p-5 md:p-6 border-2 border-white/5 rounded-3xl md:rounded-[2.5rem] cursor-pointer group transition-all"
              >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className={`${role.color} p-3 rounded-2xl text-white shadow-lg`}>{role.icon}</div>
                    <div className="text-left">
                      <h3 className="font-black text-white text-base uppercase italic tracking-tight pr-2">{role.title}</h3>                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-700 group-hover:text-orange-600 transition-all" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default RoleSelection;
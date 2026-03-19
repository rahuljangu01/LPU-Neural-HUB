import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Building, ArrowLeft, Zap } from 'lucide-react';
import API from '../services/api';
import { successToast, errorAlert } from '../services/alertService';

const Register = () => {
  const [searchParams] = useSearchParams();
  const role = (searchParams.get('role') || 'student').toLowerCase();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role, department: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/register', formData);
      successToast("Registration Successful ✅");
      navigate('/'); 
    } catch (err) { errorAlert("Identity already exists. Try logging in instead."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 font-['Outfit'] overflow-hidden">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-6xl w-full bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] md:rounded-[4rem] shadow-2xl flex flex-col md:flex-row-reverse overflow-hidden border border-white/10"
      >
        {/* MOBILE LOGO HEADER */}
        <div className="md:hidden w-full pt-8 flex flex-col items-center">
            <img src="/lpu-logo.png" className="w-16 drop-shadow-lg" alt="logo" />
        </div>

        <div className="w-full md:w-1/2 bg-[#0a0a0c] p-10 md:p-12 text-white flex flex-col items-center justify-center text-center relative border-l border-white/5">
          <motion.img animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 5, repeat: Infinity }} src="/lpu-logo.png" className="w-32 md:w-48 drop-shadow-[0_0_30px_rgba(234,88,12,0.3)] hidden md:block" alt="LPU" />
          <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter italic text-orange-600 pr-4 mt-6 md:mt-10">LPU Neural Hub</h2>
          <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.5em] italic">AI time table scheduler</p>
          
        </div>

        <div className="w-full md:w-1/2 p-8 sm:p-12 md:p-16">
          <motion.button whileHover={{ x: -5 }} onClick={() => navigate('/select-role')} className="flex items-center gap-2 text-slate-500 hover:text-orange-600 font-black text-[10px] uppercase tracking-widest mb-8 md:mb-10 transition-all">
            <ArrowLeft size={14} /> BACK TO ROLES
          </motion.button>

          <h2 className="text-3xl md:text-4xl font-black text-white mb-1 tracking-tighter uppercase italic pr-4">CREATE</h2>
          <h2 className="text-3xl md:text-4xl font-black text-orange-600 mb-8 md:mb-10 tracking-tighter uppercase italic pr-4 underline decoration-white/10 underline-offset-8">ACCOUNT</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: 'name', icon: <User size={18}/>, placeholder: 'FULL NAME' },
              { id: 'email', icon: <Mail size={18}/>, placeholder: 'OFFICIAL EMAIL' },
              { id: 'password', icon: <Lock size={18}/>, placeholder: 'SECURITY KEY' },
              { id: 'department', icon: <Building size={18}/>, placeholder: 'DEPARTMENT (MCA)' }
            ].map((field, idx) => (
              <motion.div key={field.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 * idx }} className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-600 transition-colors">{field.icon}</div>
                <input type={field.id === 'password' ? 'password' : 'text'} placeholder={field.placeholder} required className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-orange-600 text-white text-xs font-bold transition-all" 
                  onChange={e => setFormData({...formData, [field.id]: e.target.value})} />
              </motion.div>
            ))}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} 
              className="w-full bg-orange-600 text-white font-black py-4 md:py-5 rounded-2xl shadow-xl transition-all uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 mt-6 italic"
            >
              {loading ? "Establishing Link..." : <><Zap size={18} className="animate-pulse"/> Register</>}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
export default Register;
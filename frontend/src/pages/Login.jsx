import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, ShieldCheck, Cpu, Mail, Lock } from 'lucide-react';
import API from '../services/api';
import { successToast, errorAlert } from '../services/alertService';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role.toLowerCase());
      localStorage.setItem('userName', res.data.name);
      localStorage.setItem('userEmail', res.data.email);
      localStorage.setItem('userBatch', res.data.batch || ''); 
      successToast(`Login Successful. Welcome ${res.data.name}`);
      navigate(`/${res.data.role.toLowerCase()}`);
    } catch (err) {
      errorAlert("Access Denied", "Invalid Credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 font-['Outfit'] overflow-hidden">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] md:rounded-[4rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/10"
      >
        {/* MOBILE LOGO HEADER (Visible only on Mobile) */}
        <div className="md:hidden w-full pt-8 flex flex-col items-center gap-2">
            <img src="/lpu-logo.png" className="w-16 drop-shadow-lg" alt="logo" />
            <h2 className="text-sm font-black text-orange-600 tracking-widest italic uppercase">LPU Neural Hub</h2>
        </div>

        <div className="w-full md:w-1/2 p-8 sm:p-12 md:p-16">
          <div className="hidden md:flex items-center gap-3 mb-10">
             <div className="bg-orange-600 p-2 rounded-xl text-white shadow-lg shadow-orange-900/40"><ShieldCheck size={20}/></div>
             <h2 className="text-xl font-black text-white tracking-tighter uppercase italic pr-2">LPU NEURAL <span className="text-orange-600">HUB</span></h2>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-1 tracking-tighter uppercase italic leading-none pr-4">ACCOUNT</h2>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-orange-600 mb-8 tracking-tighter uppercase italic leading-none pr-4 underline decoration-white/10 underline-offset-8">LOGIN</h2>
          
          <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
            <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-600 transition-colors" size={18} />
                <input type="email" placeholder="OFFICIAL EMAIL" className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-orange-600 text-white font-bold text-xs transition-all" onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-600 transition-colors" size={18} />
                <input type="password" placeholder="SECURITY KEY" className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-orange-600 text-white font-bold text-xs transition-all" onChange={e => setFormData({...formData, password: e.target.value})} required />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} 
              className="w-full bg-orange-600 text-white font-black py-4 md:py-5 rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 italic mt-4"
            > 
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn size={18}/> Login</>}
            </motion.button>
          </form>
          <p className="text-center mt-10 text-[10px] text-slate-600 font-black uppercase tracking-widest">New User? <Link to="/select-role" className="text-orange-600 hover:text-white ml-2 underline underline-offset-4">Click Here</Link></p>
        </div>

        {/* LAPTOP SIDEBAR VISUAL */}
        <div className="hidden md:flex md:w-1/2 bg-[#0a0a0c] p-12 items-center justify-center relative overflow-hidden border-l border-white/5">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute opacity-5"><Cpu size={400} className="text-orange-600"/></motion.div>
            <div className="relative z-10 text-center">
               <motion.img animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} src="/lpu-logo.png" className="w-32 md:w-40 mx-auto drop-shadow-[0_0_30px_rgba(234,88,12,0.4)]" />
               <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic mt-8 leading-none pr-4">LPU Neural <br/><span className="text-orange-600">HUB</span> </h3>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
export default Login;
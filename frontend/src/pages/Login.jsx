import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Cpu, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import API from '../services/api';
import { successToast, errorAlert, welcomeToast } from '../services/alertService';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      localStorage.setItem('userElectiveBatch', res.data.electiveBatch || '');
      localStorage.setItem('userUid', res.data.uid);
      localStorage.setItem('userDepartment', res.data.department || '');
      localStorage.setItem('userVerified', res.data.verified ? 'true' : 'false');
      
      // Check if HOD is not verified
      if (res.data.role?.toLowerCase() === 'hod' && !res.data.verified) {
        welcomeToast(res.data.name + ' - Verification Pending');
      } else {
        welcomeToast(res.data.name);
      }
      
      setTimeout(() => navigate(`/${res.data.role.toLowerCase()}`), 1500);
    } catch (err) {
      errorAlert("Access Denied", "Invalid Credentials.");
    } finally { setLoading(false); }
  };

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
          className="absolute -top-40 -left-40 w-80 h-80 bg-red-500/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [100, -100, 100],
            y: [50, -50, 50],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-5xl w-full bg-white/5 backdrop-blur-2xl rounded-3xl sm:rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/10 relative z-10"
      >
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          {/* Mobile Logo */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 mb-3 overflow-hidden bg-white/10"
            >
              <img src="/lpu-logo.png" alt="LPU Logo" className="w-full h-full object-contain" />
            </motion.div>
            <h2 className="text-lg font-black text-white tracking-tight">LPU Neural HUB</h2>
          </div>

          <div className="hidden md:flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 overflow-hidden">
              <img src="/lpu-logo.png" alt="LPU Logo" className="w-8 h-8 object-contain" />
            </div>
            <h2 className="text-lg font-black text-white tracking-tight">LPU Neural HUB</h2>
          </div>

          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 tracking-tight leading-none"
          >
            Account
          </motion.h2>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-red-500 mb-6 md:mb-8 tracking-tight leading-none"
          >
            Login
          </motion.h2>
          
          <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="relative group"
            >
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-red-500 focus:bg-white/10 text-white font-medium text-sm transition-all"
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="relative group"
            >
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                className="w-full p-4 pl-12 pr-12 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-red-500 focus:bg-white/10 text-white font-medium text-sm transition-all"
                onChange={e => setFormData({...formData, password: e.target.value})} 
                required 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </motion.div>
            
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-red-500 to-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" 
                />
              ) : (
                <>
                  <LogIn size={18}/> Login
                </>
              )}
            </motion.button>
          </form>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center mt-6 text-sm text-slate-400 font-medium"
          >
            New User? <Link to="/select-role" className="text-red-500 hover:text-red-400 font-bold transition-colors">Register Here</Link>
          </motion.p>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 p-12 items-center justify-center relative overflow-hidden border-l border-white/5">
          {/* Animated Background Elements */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute opacity-5"
          >
            <Cpu size={350} className="text-red-500"/>
          </motion.div>
          
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-10 right-10 w-40 h-40 bg-red-500/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute bottom-20 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"
          />
          
          <div className="relative z-10 text-center">
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-32 h-32 bg-white/10 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-red-500/40 mb-6 overflow-hidden"
            >
              <img src="/lpu-logo.png" alt="LPU Logo" className="w-28 h-28 object-contain" />
            </motion.div>
            
            <motion.h3 
              animate={{ textShadow: ["0 0 10px rgba(249,115,22,0)", "0 0 20px rgba(249,115,22,0.5)", "0 0 10px rgba(249,115,22,0)"] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-3xl font-black text-white mb-2"
            >
              LPU Neural HUB
            </motion.h3>
            <p className="text-slate-400 text-sm font-medium">AI Powered Timetable Scheduler</p>
            
            <div className="flex items-center justify-center gap-2 mt-6">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-emerald-500 rounded-full"
              />
              <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">System Online</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default Login;

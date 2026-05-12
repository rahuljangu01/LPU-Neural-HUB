import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Building, ArrowLeft, Zap, Hash, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import API from '../services/api';
import { successToast, errorAlert } from '../services/alertService';

const Register = () => {
  const [searchParams] = useSearchParams();
  const role = (searchParams.get('role') || 'student').toLowerCase();
  
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role, 
    department: '', 
    uid: '' 
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/register', formData);
      successToast("Registration Successful!");
      navigate('/'); 
    } catch (err) { 
      const errorMsg = err.response?.data?.msg || "Identity already exists. Try logging in instead.";
      errorAlert("Registration Failed", errorMsg); 
    }
    finally { setLoading(false); }
  };

  const formFields = [
    { id: 'name', icon: <User size={18}/>, placeholder: 'Full Name', type: 'text', required: true },
    { id: 'email', icon: <Mail size={18}/>, placeholder: 'Email Address', type: 'email', required: true },
    { id: 'password', icon: <Lock size={18}/>, placeholder: 'Password', type: 'password', required: true },
    { id: 'department', icon: <Building size={18}/>, placeholder: 'Department (e.g. MCA)', type: 'text', required: true },
    { 
      id: 'uid', 
      icon: <Hash size={18}/>, 
      placeholder: role === 'student' ? 'Registration Number' : 'Faculty UID', 
      type: 'text', 
      maxLength: role === 'student' ? 8 : 5, 
      required: true 
    }
  ];

  const roleConfig = {
    student: { color: 'from-cyan-500 to-teal-500', label: 'Student' },
    faculty: { color: 'from-blue-500 to-indigo-500', label: 'Faculty' },
    hod: { color: 'from-purple-500 to-pink-500', label: 'HOD' }
  };

  const currentRole = roleConfig[role] || roleConfig.student;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 sm:p-6 font-['Outfit'] overflow-hidden relative">
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
        className="max-w-5xl w-full bg-white/5 backdrop-blur-2xl rounded-3xl sm:rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/10 relative z-10"
      >
        <div className="w-full md:w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute opacity-5"
          >
            <Zap size={300} className="text-orange-500"/>
          </motion.div>
          
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-20 right-20 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"
          />
          
          <div className="md:hidden flex flex-col items-center z-10 mb-6">
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
          <p className="text-slate-400 text-xs sm:text-sm font-medium text-center z-10 mb-4">AI Powered Timetable Scheduler</p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={`px-4 py-2 bg-gradient-to-r ${currentRole.color} rounded-full shadow-lg z-10`}
          >
            <span className="text-white text-xs font-bold uppercase tracking-wider">Registering as: {currentRole.label}</span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-2 mt-6 z-10">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-emerald-500 rounded-full"
            />
            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">System Online</span>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center">
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -5 }}
            onClick={() => navigate('/select-role')} 
            className="flex items-center gap-2 text-slate-400 hover:text-orange-500 font-semibold text-xs sm:text-sm uppercase tracking-wider mb-6 md:mb-8 transition-colors self-start"
          >
            <ArrowLeft size={16} /> Back to Roles
          </motion.button>

          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 tracking-tight leading-none"
          >
            Create
          </motion.h2>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-orange-500 mb-6 md:mb-8 tracking-tight leading-none"
          >
            Account
          </motion.h2>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {formFields.map((field, idx) => (
              <motion.div 
                key={field.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx + 0.3 }}
                className="relative group"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors">
                  {field.icon}
                </div>
                <input 
                  type={field.id === 'password' ? (showPassword ? "text" : "password") : field.type} 
                  placeholder={field.placeholder} 
                  required={field.required}
                  maxLength={field.maxLength}
                  className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-orange-500 focus:bg-white/10 text-white font-medium text-sm transition-all"
                  onChange={e => setFormData({...formData, [field.id]: e.target.value})} 
                />
                {field.id === 'password' && (
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                )}
              </motion.div>
            ))}

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap gap-2"
            >
              {['8+ chars', '1 number', '1 special'].map((req, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <CheckCircle2 size={12} className="text-emerald-500"/>
                  {req}
                </div>
              ))}
            </motion.div>

            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" 
                />
              ) : (
                <>
                  <Zap size={18} className="animate-pulse"/> Create Account
                </>
              )}
            </motion.button>
          </form>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-6 text-sm text-slate-400 font-medium"
          >
            Already have account? <span onClick={() => navigate('/')} className="text-orange-500 hover:text-orange-400 font-bold cursor-pointer transition-colors">Login Here</span>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};
export default Register;
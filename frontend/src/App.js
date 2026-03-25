import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Animations ke liye
import { X, Download, ShieldCheck } from 'lucide-react'; // Icons
import Layout from './components/Layout';
import Login from './pages/Login';
import RoleSelection from './pages/RoleSelection';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import HODDashboard from './pages/HODDashboard';
import TimetableView from './pages/TimetableView';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';

// Helper: Protected Route logic
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" />;
  return children;
};

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    // 1. Browser ke default prompt ko pakadna
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check karo ki kahin user ne pehle se "Dismiss" toh nahi kiya
      if (!localStorage.getItem('pwaDismissed')) {
        setShowInstallBtn(true);
      }
    });

    // 2. Install hone ke baad button gayab kar dena
    window.addEventListener('appinstalled', () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
      console.log('LPU HUB: Installed successfully');
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); // Asli Browser Prompt dikhao
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const dismissInstall = () => {
    setShowInstallBtn(false);
    // User ko baar baar pareshan na karne ke liye 24 ghante ka break
    localStorage.setItem('pwaDismissed', 'true'); 
  };

  return (
    <>
      {/* 🚀 PREMIUM PWA INSTALL POPUP */}
      {/* 🚀 NEURAL SYSTEM INSTALL MODAL - CENTERED & HIGH-TECH */}
      <AnimatePresence>
        {showInstallBtn && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
            {/* 1. Backdrop Blur (Piche ka sab dhundla kar dega) */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={dismissInstall}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* 2. Central Alert Card */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-[320px] bg-[#050505] border border-orange-500/30 rounded-[3rem] p-8 text-center shadow-[0_0_80px_rgba(234,88,12,0.2)] overflow-hidden"
            >
              {/* Holographic Top Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-600 to-transparent shadow-[0_0_20px_orange]" />

              {/* Animated Icon Container */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-2 border-2 border-dashed border-orange-500/20 rounded-full"
                />
                <div className="w-full h-full bg-orange-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-orange-900/40">
                    <ShieldCheck size={40} className="text-white animate-pulse" />
                </div>
              </div>

              {/* Text Content */}
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">
                Initialize <br/> <span className="text-orange-600">Neural Link?</span>
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-10 leading-relaxed px-4">
                Download the core application for high-speed matrix synchronization.
              </p>

              {/* Buttons Row */}
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleInstallClick}
                  className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase italic text-[11px] tracking-widest shadow-xl hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-3"
                >
                  <Download size={18} /> Authorize Install
                </button>
                
                <button 
                  onClick={dismissInstall}
                  className="w-full py-3 text-slate-600 hover:text-white transition-colors font-black uppercase text-[9px] tracking-[0.3em]"
                >
                  Abort Protocol
                </button>
              </div>

              {/* Cyber Decorative Element */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-600/5 blur-3xl rounded-full" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/select-role" element={<RoleSelection />} />
          <Route path="/register" element={<Register />} />

          <Route path="/admin" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/rooms" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/subjects" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/batches" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/broadcast" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />

          <Route path="/hod" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
          <Route path="/hod/optimizer" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
          <Route path="/hod/monitor" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
          <Route path="/hod/availability" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
          <Route path="/hod/broadcast" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
          <Route path="/hod/personnel" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />

          <Route path="/faculty" element={<ProtectedRoute><Layout><TeacherDashboard /></Layout></ProtectedRoute>} />
          <Route path="/faculty/stats" element={<ProtectedRoute><Layout><TeacherDashboard /></Layout></ProtectedRoute>} />
          <Route path="/faculty/global" element={<ProtectedRoute><Layout><TimetableView /></Layout></ProtectedRoute>} />

          <Route path="/student" element={<ProtectedRoute><Layout><StudentDashboard /></Layout></ProtectedRoute>} />
          <Route path="/student/broadcast" element={<ProtectedRoute><Layout><StudentDashboard /></Layout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
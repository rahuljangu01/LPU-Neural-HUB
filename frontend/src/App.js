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
      <AnimatePresence>
        {showInstallBtn && (
          <motion.div 
            initial={{ y: 150, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            /* bottom-10 ensures it stays above the phone's home gesture bar */
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-[340px] bg-[#020617] border border-orange-500/40 rounded-[2rem] p-4 shadow-[0_15px_50px_rgba(0,0,0,0.8)] flex flex-col items-center gap-4 overflow-hidden backdrop-blur-xl"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }} 
          >
            {/* Subtle Background Glow */}
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-orange-600/10 blur-2xl rounded-full" />
            
            <div className="flex items-center justify-between w-full relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-orange-600 p-2 rounded-xl shadow-lg">
                  <ShieldCheck size={18} className="text-white animate-pulse" />
                </div>
                <div className="text-left">
                  <p className="text-white font-black text-[10px] uppercase italic tracking-widest leading-none">LPU NEURAL HUB</p>
                  <p className="text-slate-500 text-[8px] font-bold uppercase tracking-tighter mt-1">Ready for System Download</p>
                </div>
              </div>
              
              {/* Close Button */}
              <button onClick={dismissInstall} className="text-slate-600 hover:text-white transition-colors">
                <X size={20}/>
              </button>
            </div>

            {/* Action Button - Moved to bottom for better mobile touch */}
            <button 
              onClick={handleInstallClick}
              className="w-full bg-white text-black py-3 rounded-xl text-[10px] font-black uppercase italic shadow-xl hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-2 relative z-10"
            >
              <Download size={14} /> INSTALL APPLICATION
            </button>
          </motion.div>
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
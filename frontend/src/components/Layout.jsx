import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* 1. Sidebar apni jagah fixed hai (Left side lock) */}
      <Sidebar />

      {/* 2. Main Content Wrapper */}
      {/* lg:ml-64 isliye taaki laptop par sidebar ki jagah chhod kar content dikhe */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 xl:ml-72 transition-all duration-300">
        
        {/* 3. Navbar top par fixed hai */}
        <Navbar />
        
        {/* 
           🚀 CONTENT AREA: 
           - pt-20 (mobile) aur lg:pt-24 (laptop) Navbar ki height ke barabar jagah chhodta hai.
           - Isse content navbar ke niche se shuru hoga aur wahi scroll hoga.
        */}
        <motion.main 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="pt-20 lg:pt-24 p-4 md:p-8 w-full min-h-screen overflow-x-hidden"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default Layout;
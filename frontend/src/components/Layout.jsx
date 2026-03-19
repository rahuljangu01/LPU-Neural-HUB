import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar: Iska toggle logic Sidebar component ke andar hi hai */}
      <Sidebar />

      {/* Main Content Area */}
      {/* lg:ml-64 matlab desktop par sidebar ki jagah chhodna, mobile par ml-0 rahega */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 xl:ml-72 transition-all duration-300">
        <Navbar />
        
        <motion.main 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-4 md:p-8 w-full overflow-x-hidden"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default Layout;
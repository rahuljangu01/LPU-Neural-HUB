import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { motion } from 'framer-motion';

const Layout = ({ children, modal }) => {
  return (
    <div className="flex h-screen w-full bg-[#f8afc] overflow-hidden font-['Outfit']">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 xl:ml-72 relative h-full">
        <Navbar />
        <motion.main 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 overflow-y-auto p-4 md:p-8 custom-scroll-dark bg-[#f8afc]"
        >
          <div className="max-w-7xl mx-auto pb-20">
            {children}
          </div>
        </motion.main>
      </div>
      {modal}
    </div>
  );
};

export default Layout;
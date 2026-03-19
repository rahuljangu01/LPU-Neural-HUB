import React, { useEffect, useState, useCallback } from 'react';
import { Megaphone, BellRing } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../services/api';

const AnnouncementFeed = () => {
  const [messages, setMessages] = useState([]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await API.get('/messages');
      setMessages(res.data);
    } catch (err) { console.error("Message Fetch Error"); }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Har 10 sec mein refresh
    return () => clearInterval(interval);
  }, [fetchMessages]);

  if (messages.length === 0) return null;

  return (
    <div className="mb-8 space-y-3">
      {messages.map((m, i) => (
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          key={i} 
          className="bg-orange-500/10 border-l-4 border-orange-500 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden group shadow-sm"
        >
          <div className="bg-orange-500 text-white p-2 rounded-lg animate-bounce">
            <Megaphone size={16}/>
          </div>
          <div>
            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none">
                Broadcast from {m.senderRole} ({m.senderName})
            </p>
            <p className="text-sm font-bold text-slate-700 mt-1">{m.content}</p>
          </div>
          <BellRing className="absolute -right-2 -bottom-2 text-orange-500/10" size={60}/>
        </motion.div>
      ))}
    </div>
  );
};

export default AnnouncementFeed;
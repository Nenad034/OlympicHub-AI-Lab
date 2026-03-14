import React from 'react';
import { motion } from 'framer-motion';
import { Network, Share2 } from 'lucide-react';
import './AgTrigger.css';

interface AgTriggerProps {
  onClick: () => void;
  active?: boolean;
}

export const AgTrigger: React.FC<AgTriggerProps> = ({ onClick, active }) => {
  return (
    <motion.button
      className={`ag-core-trigger ${active ? 'active' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Open Antigravity AI Control"
    >
      <div className="ag-orbit-container">
        <motion.div 
          className="ag-core-glow"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <div className="ag-core-inner">
          <Network size={18} className="ag-icon main-net" />
          <motion.div 
            className="ag-net-node n1"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div 
            className="ag-net-node n2"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div 
            className="ag-net-node n3"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
          />
        </div>
      </div>
      <span className="ag-label">AG</span>
    </motion.button>
  );
};

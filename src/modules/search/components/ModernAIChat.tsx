import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { smartRouter } from '../services/AISmartRouter';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'room_selection';
  data?: any;
}

interface ModernAIChatProps {
  forceOpen?: boolean;
  initialOptions?: any[];
  hotelName?: string;
  paxConfig?: any[];
  activeRoomIdx?: number;
  onActiveRoomChange?: (idx: number) => void;
  selectedRooms?: any[];
}

export const ModernAIChat: React.FC<ModernAIChatProps> = ({ 
  forceOpen, 
  initialOptions, 
  hotelName,
  paxConfig,
  activeRoomIdx = 0,
  onActiveRoomChange,
  selectedRooms = []
}) => {
  const [isOpen, setIsOpen] = useState(forceOpen || false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  // Listen for external system messages (e.g. from Hotel Selection)
  useEffect(() => {
    const handleSystemMessage = (e: any) => {
      const { hotelName, roomOptions } = e.detail;
      setIsOpen(true);
      const newMsg: Message = {
        id: Date.now().toString(),
        text: '', // Removed text
        sender: 'ai',
        timestamp: new Date(),
        type: 'room_selection',
        data: roomOptions
      };
      setMessages(prev => [...prev, newMsg]);
    };

    window.addEventListener('ms-ai-system-msg', handleSystemMessage);
    return () => window.removeEventListener('ms-ai-system-msg', handleSystemMessage);
  }, []);

  // Handle direct props (Deep Dive)
  useEffect(() => {
    if (initialOptions && initialOptions.length > 0) {
      // Check if we already have an initial room selection message to prevent duplication
      const hasInitial = messages.some(m => m.id === 'init-rooms');
      if (!hasInitial) {
        setMessages([{
          id: 'init-rooms',
          text: '',
          sender: 'ai',
          timestamp: new Date(),
          type: 'room_selection',
          data: initialOptions
        }]);
      }
    }
  }, [initialOptions, messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    const responseText = await smartRouter.processQuery(input);
    const aiMsg: Message = { 
      id: (Date.now() + 1).toString(), 
      text: responseText, 
      sender: 'ai', 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, aiMsg]);
  };

  const selectRoom = (room: any) => {
    // Communicate back to parent
    window.dispatchEvent(new CustomEvent('ms-hotel-room-selected', { detail: { room } }));
  };

  const scrollMatrix = (dir: 'left' | 'right') => {
    if (matrixRef.current) {
      const amt = dir === 'left' ? -200 : 200;
      matrixRef.current.scrollBy({ left: amt, behavior: 'smooth' });
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="ms-ai-toggle"
            style={{
              position: 'fixed', bottom: '100px', right: '410px',
              width: '64px', height: '64px', borderRadius: '24px',
              background: 'linear-gradient(135deg, var(--ms-brand-purple) 0%, #1A2B3C 100%)',
              border: 'none', color: 'white', cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(142, 36, 172, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
            }}
          >
            <Bot size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isOpen || forceOpen) && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="ms-ai-chat-inside"
            style={{
              position: 'relative', 
              width: '100%', 
              background: 'transparent',
              display: 'flex', flexDirection: 'column',
              overflow: 'visible'
            }}          >
            <div className="ms-no-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Date Matrix Mockup with Arrows */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <button 
                    onClick={() => scrollMatrix('left')}
                    style={{ position: 'absolute', left: '-10px', zIndex: 5, background: 'var(--ms-panel)', border: '1px solid var(--ms-border)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ms-brand-purple)' }}
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <div ref={matrixRef} className="ms-date-matrix ms-no-scrollbar" style={{ padding: '0 20px' }}>
                    {[...Array(14)].map((_, i) => (
                      <div key={i} className={`ms-date-item ${i === 3 ? 'active' : ''}`}>
                        <div className="ms-date-item-day">{['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'][(i + 1) % 7]}</div>
                        <div className="ms-date-item-date">{14 + i}. Mar</div>
                        <div className="ms-date-item-price">€{185 - (i === 3 ? 0 : 20)}</div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => scrollMatrix('right')}
                    style={{ position: 'absolute', right: '-10px', zIndex: 5, background: 'var(--ms-panel)', border: '1px solid var(--ms-border)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ms-brand-purple)' }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                {/* Room & Board Matrix */}
                {initialOptions && initialOptions.length > 0 && initialOptions.map((room: any) => (
                  <div key={room.id} className="ms-room-matrix-card" style={{ background: 'var(--ms-glass)', border: '1px solid var(--ms-brand-purple)', borderRadius: '12px', padding: '8px', marginBottom: '6px' }}>
                    <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontWeight: 900, fontSize: '12px' }}>{room.name}</div>
                      <div style={{ fontSize: '8px', opacity: 0.5 }}>{room.description}</div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {room.boards.map((board: any) => (
                        <div 
                          key={board.type}
                          onClick={() => selectRoom({ ...room, selectedBoard: board, price: board.price, board: board.label })}
                          className="ms-board-option"
                          style={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                            padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', 
                            border: '1px solid var(--ms-border)', cursor: 'pointer', transition: '0.1s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontWeight: 700, fontSize: '10px' }}>{board.label}</span>
                            <span style={{ fontSize: '8px', opacity: 0.5 }}>{board.type}</span>
                          </div>
                          <div style={{ fontWeight: 900, color: 'var(--ms-brand-purple)', fontSize: '11px' }}>€{board.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

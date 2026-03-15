import React from 'react';
import { User, Baby, X } from 'lucide-react';
import type { RoomConfig } from '../types/search.types';

interface PassengerInputProps {
  rooms: RoomConfig[];
  onUpdate: (rooms: RoomConfig[]) => void;
  onClose: () => void;
}

export const PassengerInput: React.FC<PassengerInputProps> = ({ rooms, onUpdate, onClose }) => {
  const addRoom = () => {
    onUpdate([...rooms, { adults: 2, children: 0, childrenAges: [] }]);
  };

  const removeRoom = (index: number) => {
    onUpdate(rooms.filter((_, i) => i !== index));
  };

  const updateRoom = (index: number, key: 'adults' | 'children', val: number) => {
    const newRooms = [...rooms];
    if (key === 'children') {
      const diff = val - newRooms[index].children;
      const ages = [...newRooms[index].childrenAges];
      if (diff > 0) {
        ages.push(7);
      } else if (diff < 0) {
        ages.pop();
      }
      newRooms[index] = { ...newRooms[index], [key]: val, childrenAges: ages };
    } else {
      newRooms[index] = { ...newRooms[index], [key]: val };
    }
    onUpdate(newRooms);
  };

  return (
    <div className="ms-popover" style={{ 
      position: 'absolute', top: '100%', right: '60px', 
      background: 'var(--ms-panel)', padding: '24px', 
      borderRadius: '24px', boxShadow: 'var(--ms-shadow)', 
      zIndex: 1000, width: '320px', marginTop: '12px', 
      border: '1px solid var(--ms-border)' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>Putnici i Sobe</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ms-text-sec)', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '300px', overflowY: 'auto' }}>
        {rooms.map((room, idx) => (
          <div key={idx} style={{ paddingBottom: '16px', borderBottom: idx !== rooms.length - 1 ? '1px solid var(--ms-border)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--ms-brand-purple)' }}>Soba {idx + 1}</span>
              {rooms.length > 1 && (
                <button onClick={() => removeRoom(idx)} style={{ color: '#ff4d4d', background: 'none', border: 'none', fontSize: '11px', cursor: 'pointer' }}>
                  Ukloni
                </button>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={14} /> <span>Odrasli</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={() => updateRoom(idx, 'adults', Math.max(1, room.adults - 1))} 
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--ms-border)', background: 'none', color: 'var(--ms-text)', cursor: 'pointer' }}
                >-</button>
                <span style={{ fontWeight: 700 }}>{room.adults}</span>
                <button 
                  onClick={() => updateRoom(idx, 'adults', room.adults + 1)} 
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--ms-border)', background: 'none', color: 'var(--ms-text)', cursor: 'pointer' }}
                >+</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Baby size={14} /> <span>Deca</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={() => updateRoom(idx, 'children', Math.max(0, room.children - 1))} 
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--ms-border)', background: 'none', color: 'var(--ms-text)', cursor: 'pointer' }}
                >-</button>
                <span style={{ fontWeight: 700 }}>{room.children}</span>
                <button 
                  onClick={() => updateRoom(idx, 'children', room.children + 1)} 
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--ms-border)', background: 'none', color: 'var(--ms-text)', cursor: 'pointer' }}
                >+</button>
              </div>
            </div>

            {room.children > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '12px', padding: '12px', background: 'rgba(142, 36, 172, 0.05)', borderRadius: '12px' }}>
                {room.childrenAges.map((age, childIdx) => (
                  <div key={childIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '9px', opacity: 0.6 }}>Dete {childIdx + 1} (godine)</label>
                    <select 
                      value={age}
                      onChange={(e) => {
                        const newRooms = [...rooms];
                        const newAges = [...newRooms[idx].childrenAges];
                        newAges[childIdx] = parseInt(e.target.value);
                        newRooms[idx] = { ...newRooms[idx], childrenAges: newAges };
                        onUpdate(newRooms);
                      }}
                      style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--ms-border)', background: 'var(--ms-glass)', color: 'var(--ms-text)', fontSize: '11px', outline: 'none' }}
                    >
                      {[...Array(18)].map((_, i) => (
                        <option key={i} value={i}>{i} god.</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button 
        onClick={addRoom}
        style={{ width: '100%', padding: '10px', marginTop: '16px', background: 'none', border: '1px dashed var(--ms-brand-purple)', color: 'var(--ms-brand-purple)', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '11px' }}
      >
        + Dodaj sobu
      </button>

      <button 
        onClick={onClose}
        className="ms-btn-primary"
        style={{ width: '100%', marginTop: '12px', fontSize: '13px' }}
      >
        Primeni
      </button>
    </div>
  );
};

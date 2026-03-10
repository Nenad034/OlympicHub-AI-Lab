import React, { useState, useEffect, useRef } from 'react';
import { X, PinOff, FileText } from 'lucide-react';
import { useNotesStore } from '../../stores/notesStore';

interface AgentNote {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
}

const STICKY_SCROLLBAR_CSS = `
.sticky-note-content::-webkit-scrollbar {
    width: 3px;
    height: 3px;
}
.sticky-note-content::-webkit-scrollbar-track {
    background: transparent;
}
.sticky-note-content::-webkit-scrollbar-thumb {
    background: #0d2137;
    border-radius: 2px;
    opacity: 0.4;
}
.sticky-note-content {
    scrollbar-width: thin;
    scrollbar-color: #0d2137 transparent;
}
`;

const PinnedNoteItem: React.FC<{ pinned: { id: string; x: number; y: number } }> = ({ pinned }) => {
    const { unpinNote, updatePosition } = useNotesStore();
    const [note, setNote] = useState<AgentNote | null>(null);
    const [pos, setPos] = useState({ x: pinned.x, y: pinned.y });
    const isDragging = useRef(false);
    const startMouse = useRef({ x: 0, y: 0 });
    const startPos = useRef({ x: pinned.x, y: pinned.y });

    useEffect(() => {
        const syncNote = () => {
            const saved = localStorage.getItem('prime-agent-notes');
            if (saved) {
                try {
                    const allNotes = JSON.parse(saved) as AgentNote[];
                    const found = allNotes.find(n => n.id === pinned.id);
                    setNote(found || null);
                } catch { }
            }
        };
        syncNote();
        const interval = setInterval(syncNote, 1500);
        return () => clearInterval(interval);
    }, [pinned.id]);

    // Drag on the amber header only
    const handleHeaderMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        isDragging.current = true;
        startMouse.current = { x: e.clientX, y: e.clientY };
        startPos.current = { x: pos.x, y: pos.y };
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const dx = e.clientX - startMouse.current.x;
            const dy = e.clientY - startMouse.current.y;
            setPos({ x: startPos.current.x + dx, y: startPos.current.y + dy });
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!isDragging.current) return;
            isDragging.current = false;
            const newX = startPos.current.x + (e.clientX - startMouse.current.x);
            const newY = startPos.current.y + (e.clientY - startMouse.current.y);
            setPos({ x: newX, y: newY });
            updatePosition(pinned.id, newX, newY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [pinned.id, updatePosition]);

    const updateNoteInStorage = (updates: Partial<AgentNote>) => {
        const saved = localStorage.getItem('prime-agent-notes');
        if (saved) {
            try {
                const allNotes = JSON.parse(saved) as AgentNote[];
                const updatedNotes = allNotes.map(n =>
                    n.id === pinned.id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
                );
                localStorage.setItem('prime-agent-notes', JSON.stringify(updatedNotes));
                // Trigger an update for the local state if needed, though the interval/storage listener should catch it
            } catch { }
        }
    };

    if (!note) return null;

    return (
        <div style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            zIndex: 99999,
            minWidth: '220px',
            minHeight: '160px',
            maxWidth: '600px',
            maxHeight: '520px',
            width: '280px',
            height: '240px',
            overflow: 'auto',
            resize: 'both',
            background: '#FFF176',
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)',
            color: '#0d2137',
            userSelect: 'none',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Amber drag header */}
            <div
                onMouseDown={handleHeaderMouseDown}
                style={{
                    flexShrink: 0,
                    background: '#F9A825',
                    height: '34px',
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 10px',
                    cursor: 'grab'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
                    <FileText size={11} style={{ opacity: 0.6, color: '#1a0a00' }} />
                    <input
                        value={note.title}
                        onChange={(e) => updateNoteInStorage({ title: e.target.value })}
                        placeholder="Naslov..."
                        onMouseDown={e => e.stopPropagation()}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontSize: '11px',
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            color: '#1a0a00',
                            width: '100%',
                            padding: '2px 0'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '2px', marginLeft: '8px' }}>
                    <button onClick={() => unpinNote(pinned.id)} title="Unpin"
                        style={{ background: 'transparent', border: 'none', color: '#1a0a00', cursor: 'pointer', padding: '3px', opacity: 0.7 }}>
                        <PinOff size={13} />
                    </button>
                    <button onClick={() => unpinNote(pinned.id)} title="Close"
                        style={{ background: 'transparent', border: 'none', color: '#1a0a00', cursor: 'pointer', padding: '3px', opacity: 0.7 }}>
                        <X size={13} />
                    </button>
                </div>
            </div>

            {/* Editable Content area */}
            <style>{STICKY_SCROLLBAR_CSS}</style>
            <div
                className="sticky-note-content"
                style={{ padding: '0', flex: 1, overflow: 'auto', background: '#FFF176', position: 'relative' }}
                onMouseDown={e => e.stopPropagation()}
            >
                {/* 
                  To have clickable links AND editing, we show a textarea when focused, 
                  and a formatted div when not focused.
                */}
                <textarea
                    value={note.content}
                    onChange={(e) => updateNoteInStorage({ content: e.target.value })}
                    placeholder="Unesite belešku..."
                    onMouseDown={e => e.stopPropagation()}
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        padding: '12px',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: '#0d2137',
                        fontFamily: "'Segoe UI', sans-serif",
                        fontWeight: '500',
                        display: 'block'
                    }}
                />
            </div>
        </div>
    );
};

export const PinnedNotesRenderer: React.FC = () => {
    const { pinnedNoteIds } = useNotesStore();

    return (
        <>
            {pinnedNoteIds.map(pn => (
                <PinnedNoteItem key={pn.id} pinned={pn} />
            ))}
        </>
    );
};

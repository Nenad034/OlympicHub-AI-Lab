import React, { useState, useMemo, useRef, useEffect } from 'react';
import ExcelJS from 'exceljs';
import {
    Upload,
    Plus,
    Minus,
    FileSpreadsheet,
    ArrowLeft,
    Brain,
    CloudCheck,
    RefreshCw,
    Table as TableIcon,
    Lock,
    Eye,
    EyeOff,
    Settings,
    GripVertical,
    FileCode,
    Combine,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import { translations, type Language } from '../../translations';

interface Props {
    onBack: () => void;
    lang: Language;
    userLevel: number;
    onOpenChat?: () => void;
    onDataUpdate?: (data: any[]) => void; // Šalje podatke aplikaciji
}

export default function MarsAnalysis({ onBack, lang, userLevel, onOpenChat, onDataUpdate }: Props) {
    const [allTables, setAllTables] = useState<Record<string, { name: string, rows: any[], columnOrder: string[] }>>({});
    const [activeTableId, setActiveTableId] = useState<string | null>(null);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
    const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [hiddenRows] = useState<number[]>([]);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);

    const activeTable = activeTableId ? allTables[activeTableId] : null;
    const rows = activeTable?.rows || [];
    const columnOrder = activeTable?.columnOrder || [];
    const fileName = activeTable?.name || "";

    const moveColumn = (index: number, direction: 'left' | 'right') => {
        if (!activeTableId) return;
        const newOrder = [...columnOrder];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newOrder.length) return;
        [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

        setAllTables(prev => ({
            ...prev,
            [activeTableId]: { ...prev[activeTableId], columnOrder: newOrder }
        }));
    };

    const t = translations[lang];
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dozvole
    const canEdit = userLevel >= 3;

    useEffect(() => {
        const loadAllFiles = async () => {
            try {
                let query = supabase
                    .from('files')
                    .select('*')
                    .filter('name', 'ilike', '%.xlsx');

                const { data } = await query.order('created_at', { ascending: false });

                if (data && data.length > 0) {
                    const tablesMap: any = {};
                    data.forEach((f: any) => {
                        const content = typeof f.content === 'string' ? JSON.parse(f.content) : f.content;
                        if (content.length > 0) {
                            tablesMap[f.id] = {
                                name: f.name,
                                rows: content,
                                columnOrder: Object.keys(content[0])
                            };
                        }
                    });
                    setAllTables(tablesMap);
                    setActiveTableId(data[0].id);
                    if (onDataUpdate) onDataUpdate(data[0].content);
                }
            } catch (e) {
                console.log("Supabase fetch error");
            }
        };
        loadAllFiles();
    }, []);

    const saveToCloud = async (name: string, content: any[]) => {
        if (!canEdit) return;
        setIsSyncing(true);
        try {
            await supabase.from('files').upsert({
                name,
                content: JSON.stringify(content),
                parent_id: 'f-reports',
                updated_at: new Date().toISOString()
            }, { onConflict: 'name' });
        } catch (e) {
            console.error("Sync error:", e);
        } finally {
            setTimeout(() => setIsSyncing(false), 800);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!canEdit) return;
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);
            const worksheet = workbook.getWorksheet(1);

            const jsonData: any[] = [];
            let headers: string[] = [];

            worksheet?.eachRow((row, rowNumber) => {
                const values = Array.isArray(row.values) ? row.values.slice(1) : [];
                if (rowNumber === 1) {
                    headers = values.map(v => String(v));
                } else {
                    const rowData: any = {};
                    headers.forEach((header, index) => {
                        rowData[header] = values[index] || "";
                    });
                    jsonData.push(rowData);
                }
            });

            if (jsonData.length > 0) {
                const newId = `file-${Date.now()}`;
                const newTable = {
                    name: file.name,
                    rows: jsonData,
                    columnOrder: headers
                };
                setAllTables(prev => ({ ...prev, [newId]: newTable }));
                setActiveTableId(newId);
                if (onDataUpdate) onDataUpdate(jsonData);
                await saveToCloud(file.name, jsonData);
            }
        } catch (err) {
            console.error('Error reading excel file:', err);
        }
    };

    const handleMerge = () => {
        if (!activeTableId || !mergeTargetId || activeTableId === mergeTargetId) return;
        const t1 = allTables[activeTableId];
        const t2 = allTables[mergeTargetId];

        // Pronalaženje zajedničke kolone
        const commonCol = t1.columnOrder.find(c => t2.columnOrder.includes(c));
        if (!commonCol) {
            alert(lang === 'sr' ? "Nema zajedničke kolone za spajanje!" : "No common column found for merge!");
            return;
        }

        const mergedRows = t1.rows.map(r1 => {
            const match = t2.rows.find(r2 => String(r1[commonCol]) === String(r2[commonCol]));
            return match ? { ...r1, ...match } : r1;
        });

        const newId = `merged-${Date.now()}`;
        const newName = `Merged: ${t1.name} + ${t2.name}`;
        const newTable = {
            name: newName,
            rows: mergedRows,
            columnOrder: Object.keys(mergedRows[0])
        };

        setAllTables(prev => ({ ...prev, [newId]: newTable }));
        setActiveTableId(newId);
        setMergeTargetId(null);
    };

    const removeTable = (id: string) => {
        setAllTables(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        if (activeTableId === id) setActiveTableId(Object.keys(allTables).find(k => k !== id) || null);
    };

    const filteredRows = useMemo(() => {
        return rows.filter((row, idx) => {
            if (hiddenRows.includes(idx)) return false;
            return columnOrder.every(col => {
                if (hiddenColumns.includes(col)) return true;
                const filterVal = filters[col];
                if (!filterVal || filterVal === "") return true;
                return String(row[col] || "").toLowerCase().includes(String(filterVal).toLowerCase());
            });
        });
    }, [rows, columnOrder, filters, hiddenRows, hiddenColumns]);

    const stats = useMemo(() => {
        if (filteredRows.length === 0) return null;
        const sums: Record<string, number> = {};

        const summableKeywords = ['cena', 'iznos', 'neto', 'bruto', 'total', 'price', 'amount', 'pax', 'adults', 'children', 'odrasli', 'deca', 'osoba', 'rooms', 'soba'];

        columnOrder.forEach(col => {
            const colLower = col.toLowerCase();
            const shouldSum = summableKeywords.some(k => colLower.includes(k));

            if (shouldSum) {
                const isNumeric = filteredRows.some(row => {
                    const val = String(row[col] || "");
                    return val !== "" && !isNaN(Number(val.replace(/[^\d.-]/g, '')));
                });

                if (isNumeric) {
                    sums[col] = filteredRows.reduce((acc, row) => {
                        const val = String(row[col] || "0").replace(/[^\d.-]/g, '');
                        const num = parseFloat(val);
                        return acc + (isNaN(num) ? 0 : num);
                    }, 0);
                }
            }
        });

        return { sums, count: filteredRows.length };
    }, [filteredRows, columnOrder]);

    const toggleColumn = (col: string) => {
        setHiddenColumns(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="analysis-module" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
            <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={onBack} className="back-btn" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>Mars ERP Analitika</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: 0 }}>{fileName || t.noData}</p>
                            {rows.length > 0 && (isSyncing ? <RefreshCw size={10} className="rotate" color="var(--accent)" /> : <CloudCheck size={10} color="var(--accent)" />)}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {canEdit ? (
                        <>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                            <button onClick={() => fileInputRef.current?.click()} className="action-btn-hub primary">
                                <Upload size={14} /> {t.uploadExcel}
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--glass-bg)', borderRadius: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <Lock size={12} /> {t.viewOnly}
                        </div>
                    )}
                    <button onClick={() => setIsColumnSettingsOpen(!isColumnSettingsOpen)} className="action-btn-hub">
                        <Settings size={14} />
                    </button>
                    <button onClick={onOpenChat} className="action-btn-hub success">
                        <Brain size={14} /> {t.aiAnalysis}
                    </button>
                </div>
            </div>

            {/* Table Selector bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', overflowX: 'auto', padding: '5px' }}>
                {Object.entries(allTables).map(([id, table]) => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: activeTableId === id ? 'var(--gradient-blue)' : 'var(--bg-card)', color: activeTableId === id ? '#fff' : 'var(--text-primary)', padding: '6px 15px', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }} onClick={() => { setActiveTableId(id); if (onDataUpdate) onDataUpdate(table.rows); }}>
                        <FileCode size={14} />
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{table.name}</span>
                        <Trash2 size={12} style={{ opacity: 0.6 }} onClick={(e) => { e.stopPropagation(); removeTable(id); }} />
                    </div>
                ))}
                {Object.keys(allTables).length >= 2 && (
                    <select
                        value={mergeTargetId || ""}
                        onChange={e => setMergeTargetId(e.target.value)}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '6px 10px', fontSize: '11px', color: 'var(--text-primary)', outline: 'none' }}
                    >
                        <option value="">{lang === 'sr' ? "Spoji sa..." : "Merge with..."}</option>
                        {Object.entries(allTables).filter(([id]) => id !== activeTableId).map(([id, t]) => (
                            <option key={id} value={id}>{t.name}</option>
                        ))}
                    </select>
                )}
                {mergeTargetId && (
                    <button onClick={handleMerge} style={{ background: 'var(--gradient-purple)', border: 'none', color: '#fff', padding: '6px 15px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        <Combine size={14} style={{ marginRight: '5px' }} /> {lang === 'sr' ? "Izvrši Spajanje" : "Merge Now"}
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isColumnSettingsOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '15px', marginBottom: '15px', overflow: 'hidden' }}
                    >
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {columnOrder.map((col, idx) => (
                                <div key={col} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-sidebar)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '11px' }}>
                                    <GripVertical size={12} style={{ cursor: 'move', opacity: 0.5 }} />
                                    <span style={{ color: hiddenColumns.includes(col) ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: hiddenColumns.includes(col) ? 'line-through' : 'none' }}>{col}</span>
                                    <button onClick={() => toggleColumn(col)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', color: 'var(--accent)' }}>
                                        {hiddenColumns.includes(col) ? <EyeOff size={12} /> : <Eye size={12} />}
                                    </button>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                        <button onClick={() => moveColumn(idx, 'left')} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '10px' }}>◀</button>
                                        <button onClick={() => moveColumn(idx, 'right')} disabled={idx === columnOrder.length - 1} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '10px' }}>▶</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!rows.length ? (
                <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)' }}>
                    <FileSpreadsheet size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px', opacity: 0.3 }} />
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{t.noData}</h3>
                </div>
            ) : (
                <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <table className="hub-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}><TableIcon size={14} /></th>
                                    {columnOrder.filter(c => !hiddenColumns.includes(c)).map(h => (
                                        <th key={h}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 600 }}>{h}</span>
                                                <input type="text" placeholder="..." className="hub-mini-input" onChange={(e) => setFilters(prev => ({ ...prev, [h]: e.target.value }))} />
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.slice(0, 100).map((row, i) => (
                                    <React.Fragment key={i}>
                                        <tr onClick={() => setExpandedRow(expandedRow === i ? null : i)} style={{ cursor: 'pointer' }}>
                                            <td style={{ textAlign: 'center' }}>{expandedRow === i ? <Minus size={12} /> : <Plus size={12} />}</td>
                                            {columnOrder.filter(c => !hiddenColumns.includes(c)).map((col, j) => (
                                                <td key={j}>{String(row[col] || "")}</td>
                                            ))}
                                        </tr>
                                        {expandedRow === i && (
                                            <tr>
                                                <td colSpan={columnOrder.length + 1} style={{ padding: 0 }}>
                                                    <div className="hub-detail-card" style={{ margin: '15px', background: 'var(--bg-sidebar)' }}>
                                                        {Object.entries(row).map(([k, v]) => (
                                                            <div key={k} className="hub-detail-item">
                                                                <label>{k}</label>
                                                                <span>{String(v)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                            <tfoot style={{ position: 'sticky', bottom: 0, background: 'var(--bg-sidebar)', zIndex: 10, borderTop: '2px solid var(--border)' }}>
                                <tr>
                                    <td style={{ fontWeight: 800, textAlign: 'center' }}>Σ</td>
                                    {columnOrder.filter(c => !hiddenColumns.includes(c)).map(col => (
                                        <td key={col} style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '11px' }}>
                                            {stats?.sums[col] !== undefined ? stats.sums[col].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}
                                        </td>
                                    ))}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            <style>{`
        .rotate { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .action-btn-hub { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--glass-bg); border: 1px solid var(--border); border-radius: 10px; color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer; }
        .action-btn-hub.primary { background: var(--gradient-blue); border: none; color: #fff; }
        .action-btn-hub.success { background: var(--gradient-green); border: none; color: #fff; }
        .hub-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .hub-table th { position: sticky; top: 0; background: var(--bg-sidebar); padding: 12px 16px; text-align: left; border-bottom: 2px solid var(--border); z-index: 2; }
        .hub-table td { padding: 10px 16px; border-bottom: 1px solid var(--border); color: var(--text-primary); white-space: nowrap; }
        .hub-table tr:hover td { background: var(--accent-glow); }
        .hub-mini-input { background: rgba(0,0,0,0.05); border: 1px solid var(--border); border-radius: 4px; padding: 4px 8px; color: var(--text-primary); font-size: 10px; outline: none; }
        .hub-detail-card { padding: 15px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; border-radius: 12px; }
        .hub-detail-item label { display: block; font-size: 9px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 2px; }
      `}</style>
        </motion.div>
    );
}

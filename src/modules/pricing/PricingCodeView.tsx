import React, { useState } from 'react';
import { 
    Play, 
    Save, 
    Download,
    Sun,
    Moon,
    FolderOpen,
    FileSpreadsheet,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Database
} from 'lucide-react';

interface ProductState {
    name: string;
    category?: string;
    type?: string;
    prefix?: string;
    view?: string;
}

interface PricePeriod {
    id: string;
    dateFrom: string;
    dateTo: string;
    netPrice: number;
    provisionPercent: number;
    minStay: number;
    basis: string;
}

interface Supplement {
    id: string;
    name: string;
    type: string;
    value: number;
    dateFrom: string;
    dateTo: string;
}

interface PricingCodeViewProps {
    pricelistTitle: string;
    pricelistId: string | null;
    productState: ProductState;
    pricePeriods: PricePeriod[];
    supplements: Supplement[];
    validationIssues: string[];
    saveSuccess: boolean;
    isSaving: boolean;
    isDarkMode: boolean;
    onTitleChange: (title: string) => void;
    onDarkModeToggle: () => void;
    onLoadPricelist: () => void;
    onExportJSON: () => void;
    onSaveDraft: () => void;
    onActivate: () => void;
    onProductChange: (product: ProductState) => void;
    onPeriodsChange: (periods: PricePeriod[]) => void;
    onSupplementsChange: (supplements: Supplement[]) => void;
}

export const PricingCodeView: React.FC<PricingCodeViewProps> = ({ 
    pricelistTitle,
    pricelistId,
    productState,
    pricePeriods,
    supplements,
    validationIssues,
    saveSuccess,
    isSaving,
    isDarkMode,
    onTitleChange,
    onDarkModeToggle,
    onLoadPricelist,
    onExportJSON,
    onSaveDraft,
    onActivate,
    onProductChange: _onProductChange,
    onPeriodsChange: _onPeriodsChange,
    onSupplementsChange: _onSupplementsChange
}) => {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [lineCount] = useState(100);

    const toggleRegion = (key: string) => {
        setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const renderLineNumbers = () => {
        const lines = [];
        for (let i = 1; i <= lineCount; i++) {
            lines.push(<div key={i} className="line-number">{i}</div>);
        }
        return lines;
    };

    return (
        <div className="pricing-editor-container">
            {/* Toolbar */}
            <div className="editor-toolbar">
                <div className="editor-toolbar-left">
                    <Database size={16} className="toolbar-icon" />
                    <input
                        type="text"
                        value={pricelistTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                        className="code-input"
                        placeholder="Naziv cenovnika..."
                        style={{ 
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--editor-variable)',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            outline: 'none',
                            width: '300px'
                        }}
                    />
                    {pricelistId && (
                        <span style={{ fontSize: '11px', color: 'var(--editor-comment)' }}>
                            ID: {pricelistId.slice(0, 8)}...
                        </span>
                    )}
                </div>

                <div className="editor-toolbar-right">
                    {/* Validation Indicator */}
                    {validationIssues.length > 0 && (
                        <div className="validation-badge error" title={validationIssues.join('\n')}>
                            <AlertCircle size={14} />
                            {validationIssues.length} problema
                        </div>
                    )}

                    {/* Save Success Indicator */}
                    {saveSuccess && (
                        <div className="validation-badge success">
                            <CheckCircle2 size={14} />
                            Sačuvano!
                        </div>
                    )}

                    <button
                        className="code-button"
                        onClick={onDarkModeToggle}
                        title="Toggle Dark Mode"
                    >
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>

                    <button className="code-button" onClick={onLoadPricelist} title="Učitaj sačuvani cenovnik">
                        <FolderOpen size={16} /> Učitaj
                    </button>

                    <button className="code-button"><FileSpreadsheet size={16} /> Import</button>
                    
                    <button className="code-button" onClick={onExportJSON} title="Izvezi konfiguraciju u JSON">
                        <Download size={16} /> Export
                    </button>

                    <button
                        className="code-button"
                        onClick={onSaveDraft}
                        disabled={isSaving}
                        title="Sačuvaj kao nacrt"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {' '}Sačuvaj
                    </button>

                    <button
                        className="code-button primary"
                        disabled={validationIssues.length > 0 || isSaving}
                        onClick={onActivate}
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        {' '}Aktiviraj
                    </button>
                </div>
            </div>

            {/* File Tabs */}
            <div className="editor-file-tabs">
                <button className="editor-tab active">
                    <span className="editor-tab-icon">📄</span>
                    <span>pricelist.config.ts</span>
                </button>
                <button className="editor-tab">
                    <span className="editor-tab-icon">📦</span>
                    <span>periods.data.json</span>
                </button>
                <button className="editor-tab">
                    <span className="editor-tab-icon">⚙️</span>
                    <span>rules.schema.ts</span>
                </button>
            </div>

            {/* Editor Content */}
            <div className="editor-content-wrapper">
                {/* Line Numbers */}
                <div className="editor-line-numbers">
                    {renderLineNumbers()}
                </div>

                {/* Code Area */}
                <div className="editor-code-area">
                    {/* Comments Header */}
                    <div className="code-line">
                        <span className="comment">// Pricing Intelligence - Configuration File</span>
                    </div>
                    <div className="code-line">
                        <span className="comment">// Generated: {new Date().toISOString()}</span>
                    </div>
                    <div className="code-line">
                        <span className="comment">// Status: draft</span>
                    </div>
                    <div className="code-line"></div>

                    {/* Imports */}
                    <div className="code-line">
                        <span className="keyword">import</span> <span className="punctuation">{'{'}</span> <span className="property">PricelistConfig</span>, <span className="property">PricePeriod</span>, <span className="property">PriceRule</span> <span className="punctuation">{'}'}</span> <span className="keyword">from</span> <span className="string">'@olympichub/pricing'</span><span className="punctuation">;</span>
                    </div>
                    <div className="code-line">
                        <span className="keyword">import</span> <span className="property">type</span> <span className="punctuation">{'{'}</span> <span className="property">Accommodation</span> <span className="punctuation">{'}'}</span> <span className="keyword">from</span> <span className="string">'../types'</span><span className="punctuation">;</span>
                    </div>
                    <div className="code-line"></div>

                    {/* Pricelist Object */}
                    <div className="code-section">
                        <div className="code-line">
                            <span className="keyword">export</span> <span className="keyword">const</span> <span className="variable">pricelist</span><span className="operator">:</span> <span className="property">PricelistConfig</span> <span className="operator">=</span> <span className="punctuation">{'{'}</span>
                        </div>

                        <div className="code-line indent-1">
                            <span className="property">id</span><span className="punctuation">:</span> <span className="string">"{pricelistId || 'new'}"</span><span className="punctuation">,</span>
                        </div>

                        <div className="code-line indent-1">
                            <span className="property">title</span><span className="punctuation">:</span> <span className="string">"{pricelistTitle || 'Novi Cenovnik'}"</span><span className="punctuation">,</span>
                        </div>

                        <div className="code-line indent-1">
                            <span className="property">status</span><span className="punctuation">:</span> <span className="string">"draft"</span><span className="punctuation">,</span>
                        </div>

                        <div className="code-line indent-1">
                            <span className="property">product</span><span className="punctuation">:</span> <span className="punctuation">{'{'}</span>
                        </div>

                        <div className="code-line indent-2">
                            <span className="property">service</span><span className="punctuation">:</span> <span className="string">"{productState?.category || 'BB'}"</span><span className="punctuation">,</span>
                        </div>

                        <div className="code-line indent-2">
                            <span className="property">name</span><span className="punctuation">:</span> <span className="string">"{productState?.name || 'Standard Room'}"</span><span className="punctuation">,</span>
                        </div>

                        <div className="code-line indent-2">
                            <span className="property">type</span><span className="punctuation">:</span> <span className="string">"{productState?.type || 'DBL'}"</span><span className="punctuation">,</span>
                        </div>

                        <div className="code-line indent-1">
                            <span className="punctuation">{'}'}</span><span className="punctuation">,</span>
                        </div>

                        <div className="code-line">
                            <span className="punctuation">{'}'}</span><span className="punctuation">;</span>
                        </div>
                    </div>

                    <div className="code-line"></div>

                    {/* Price Periods Array */}
                    <div className="code-section">
                        <div className="code-line">
                            <span className="region-toggle" onClick={() => toggleRegion('periods')}>
                                {collapsed.periods ? '▶' : '▼'}
                            </span>
                            <span className="comment">// #region Price Periods Configuration</span>
                        </div>

                        {!collapsed.periods && (
                            <div className="region-content">
                                <div className="code-line">
                                    <span className="keyword">export</span> <span className="keyword">const</span> <span className="variable">pricePeriods</span><span className="operator">:</span> <span className="property">PricePeriod</span><span className="punctuation">[]</span> <span className="operator">=</span> <span className="punctuation">[</span>
                                </div>

                                {pricePeriods.map((period, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="code-line indent-1">
                                            <span className="punctuation">{'{'}</span>
                                        </div>
                                        <div className="code-line indent-2">
                                            <span className="property">id</span><span className="punctuation">:</span> <span className="string">"{period.id}"</span><span className="punctuation">,</span>
                                        </div>
                                        <div className="code-line indent-2">
                                            <span className="property">dateFrom</span><span className="punctuation">:</span> <span className="string">"{period.dateFrom}"</span><span className="punctuation">,</span>
                                        </div>
                                        <div className="code-line indent-2">
                                            <span className="property">dateTo</span><span className="punctuation">:</span> <span className="string">"{period.dateTo}"</span><span className="punctuation">,</span>
                                        </div>
                                        <div className="code-line indent-2">
                                            <span className="property">netPrice</span><span className="punctuation">:</span> <span className="number">{period.netPrice?.toFixed(2)}</span><span className="punctuation">,</span> <span className="comment">// EUR</span>
                                        </div>
                                        <div className="code-line indent-2">
                                            <span className="property">provision</span><span className="punctuation">:</span> <span className="number">{period.provisionPercent}</span><span className="punctuation">,</span> <span className="comment">// %</span>
                                        </div>
                                        <div className="code-line indent-2">
                                            <span className="property">grossPrice</span><span className="punctuation">:</span> <span className="number">{(period.netPrice * (1 + period.provisionPercent / 100)).toFixed(2)}</span><span className="punctuation">,</span> <span className="comment">// Calculated</span>
                                        </div>
                                        <div className="code-line indent-2">
                                            <span className="property">minStay</span><span className="punctuation">:</span> <span className="number">{period.minStay}</span><span className="punctuation">,</span>
                                        </div>
                                        <div className="code-line indent-2">
                                            <span className="property">basis</span><span className="punctuation">:</span> <span className="string">"{period.basis}"</span><span className="punctuation">,</span>
                                        </div>
                                        <div className="code-line indent-1">
                                            <span className="punctuation">{'}'}</span>{idx < pricePeriods.length - 1 ? ',' : ''}
                                        </div>
                                        {idx < pricePeriods.length - 1 && <div className="code-line"></div>}
                                    </React.Fragment>
                                ))}

                                <div className="code-line">
                                    <span className="punctuation">];</span>
                                </div>

                                <div className="code-line">
                                    <span className="comment">// #endregion</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="code-line"></div>

                    {/* Supplements/Discounts */}
                    <div className="code-section">
                        <div className="code-line">
                            <span className="region-toggle" onClick={() => toggleRegion('rules')}>
                                {collapsed.rules ? '▶' : '▼'}
                            </span>
                            <span className="comment">// #region Supplements & Discounts</span>
                        </div>

                        {!collapsed.rules && (
                            <div className="region-content">
                                <div className="code-line">
                                    <span className="keyword">export</span> <span className="keyword">const</span> <span className="variable">priceRules</span><span className="operator">:</span> <span className="property">PriceRule</span><span className="punctuation">[]</span> <span className="operator">=</span> <span className="punctuation">[</span>
                                </div>

                                {supplements.map((rule, idx: number) => (
                                    <React.Fragment key={idx}>
                                        <div className="code-line indent-1">
                                            <span className="punctuation">{'{'}</span>
                                        </div>
                                        <div className="code-line indent-2">
                                            <span className="property">type</span><span className="punctuation">:</span> <span className="string">"{rule.type}"</span><span className="punctuation">,</span>
                                        </div>
                                        <div className="code-line indent-2">
                                            <span className="property">name</span><span className="punctuation">:</span> <span className="string">"{rule.name}"</span><span className="punctuation">,</span>
                                        </div>
                                        <div className="code-line indent-2">
                                            <span className="property">value</span><span className="punctuation">:</span> <span className="number">{rule.value}</span><span className="punctuation">,</span>
                                        </div>
                                        <div className="code-line indent-2">
                                            <span className="property">dateFrom</span><span className="punctuation">:</span> <span className="string">"{rule.dateFrom}"</span><span className="punctuation">,</span>
                                        </div>
                                        <div className="code-line indent-2">
                                            <span className="property">dateTo</span><span className="punctuation">:</span> <span className="string">"{rule.dateTo}"</span><span className="punctuation">,</span>
                                        </div>
                                        <div className="code-line indent-1">
                                            <span className="punctuation">{'}'}</span>{idx < supplements.length - 1 ? ',' : ''}
                                        </div>
                                    </React.Fragment>
                                ))}

                                <div className="code-line">
                                    <span className="punctuation">];</span>
                                </div>

                                <div className="code-line">
                                    <span className="comment">// #endregion</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="code-line"></div>

                    {/* Export Statement */}
                    <div className="code-line">
                        <span className="keyword">export</span> <span className="keyword">default</span> <span className="punctuation">{'{'}</span> <span className="variable">pricelist</span><span className="punctuation">,</span> <span className="variable">pricePeriods</span><span className="punctuation">,</span> <span className="variable">priceRules</span> <span className="punctuation">{'}'}</span><span className="punctuation">;</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

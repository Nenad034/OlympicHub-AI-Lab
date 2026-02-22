import type { FC } from 'react';
import type { StepProps } from '../types';

const BasicInfoStep: FC<StepProps> = ({ data, onChange }) => {
    return (
        <div>
            <div className="form-section">
                <h3 className="form-section-title">Identifikator Putovanja</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label required">Naziv Aranžmana</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="npr. Grand Tour: Italija i Krstarenje Mediteranom"
                            value={data.title || ''}
                            onChange={e => onChange({ title: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label required">Kategorija</label>
                        <select
                            className="form-select"
                            value={data.category}
                            onChange={e => onChange({ category: e.target.value as any })}
                        >
                            <option value="Grupno">Grupno Putovanje</option>
                            <option value="Individualno">Individualno Putovanje</option>
                            <option value="Krstarenje">Krstarenje</option>
                            <option value="StayAndCruise">Stay & Cruise (Kombinovano)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3 className="form-section-title">Datumi i Trajanje</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label required">Datum Polaska</label>
                        <input
                            type="date"
                            className="form-input"
                            value={data.startDate || ''}
                            onChange={e => onChange({ startDate: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label required">Datum Povratka</label>
                        <input
                            type="date"
                            className="form-input"
                            value={data.endDate || ''}
                            onChange={e => onChange({ endDate: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3 className="form-section-title">Opis Putovanja</h3>
                <div className="form-grid single">
                    <div className="form-group">
                        <label className="form-label">Kratak Opis (Teaser)</label>
                        <textarea
                            className="form-textarea"
                            rows={3}
                            placeholder="Ukratko o putovanju za listu aranžmana..."
                            value={data.shortDescription || ''}
                            onChange={e => onChange({ shortDescription: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Glavni Highlights (Jedno po redu)</label>
                        <textarea
                            className="form-textarea"
                            rows={4}
                            placeholder={'Direktni let kompanijom Air Serbia\n7 noćenja u hotelima 4*\nUključeno krstarenje od 3 dana'}
                            value={data.highlights?.join('\n') || ''}
                            onChange={e => onChange({ highlights: e.target.value.split('\n').filter(h => h.trim()) })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BasicInfoStep;

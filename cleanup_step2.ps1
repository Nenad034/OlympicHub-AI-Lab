$file = "src/pages/ReservationsDashboard.tsx"
$content = Get-Content $file -Raw

# 1. Replace Datumi Button
$oldButton = '(?s)\{/\* Date Filters with Modern Calendar \*/\}.*?\{showCalendar && \(.*?/\)\s*\}\s*</div>'
$newButton = @'
                    {/* Datumi Button */}
                    <button
                        onClick={() => setShowDateFilterModal(true)}
                        className="btn-secondary"
                        style={{
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '0 12px',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: (dateFilters.reservationFrom || dateFilters.stayFrom) ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '13px',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Calendar size={16} />
                        Datumi
                    </button>
'@
$matchButton = $content -match $oldButton
if ($matchButton) {
    $content = $content -replace $oldButton, $newButton
}
else {
    Write-Host "Warn: Button regex did not match"
}

# 2. Update List View Card
$oldListIdentity = '(?s)<div className="res-identity">.*?<div className="res-codes">.*?<span className="cis-code">\{res\.cisCode\}</span>.*?<span className="ref-code">REF: \{res\.refCode\}</span>.*?</div>.*?<div className="horizontal-status-tags">.*?\{\[.*?\]\.map.*?</div>'
$newListIdentity = @'
                                    <div className="res-identity">
                                        <div className="res-codes">
                                            <span className="ref-code" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{res.refCode}</span>
                                            <span className="cis-code" style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 400, marginTop: '2px' }}>{res.cisCode}</span>
                                        </div>
                                        <div className="horizontal-status-tags" style={{ marginTop: '4px' }}>
                                            <div
                                                className="status-badge"
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    backgroundColor: `${getStatusColor(res.status)}15`,
                                                    color: getStatusColor(res.status),
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    border: `1px solid ${getStatusColor(res.status)}30`,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                {getStatusIcon ? getStatusIcon(res.status) : null}
                                                {res.status}
                                            </div>
                                        </div>
                                    </div>
'@
$matchList = $content -match $oldListIdentity
if ($matchList) {
    $content = $content -replace $oldListIdentity, $newListIdentity
}
else {
    Write-Host "Warn: List regex did not match"
}

# 3. Update Grid View Card
$oldGridHeader = '(?s)<div className="card-header">.*?<span className="cis-code">\{res\.cisCode\}</span>.*?<div.*?className="status-badge".*?</div>.*?</div>'
$newGridHeader = @'
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="ref-code" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{res.refCode}</span>
                                        <span className="cis-code" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{res.cisCode}</span>
                                    </div>
                                    <div
                                        className="status-badge"
                                        style={{
                                            background: `${getStatusColor(res.status)}15`,
                                            color: getStatusColor(res.status),
                                            border: `1px solid ${getStatusColor(res.status)}30`,
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {res.status}
                                    </div>
                                </div>
'@

$matchGrid = $content -match $oldGridHeader
if ($matchGrid) {
    $content = $content -replace $oldGridHeader, $newGridHeader
}
else {
    Write-Host "Warn: Grid regex did not match"
}

# 4. Add Modal at the end
$modalCode = @'
            {/* Date Filter Modal */}
            {showDateFilterModal && (
                <div className="modal-overlay" onClick={() => setShowDateFilterModal(false)}>
                    <div className="modal-content date-filter-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Datumi</h2>
                            <button className="modal-close" onClick={() => setShowDateFilterModal(false)}>×</button>
                        </div>

                        <div className="modal-body" style={{ padding: '20px' }}>
                            <p className="filter-description">
                                Opciono možete filtrirati rezervacije po datumima. Ako ne želite filtriranje, kliknite "Nastavi".
                            </p>

                            <div className="date-filter-section">
                                <h3><Calendar size={18} /> Datum Rezervacije</h3>
                                <DateRangeInput
                                    label="Period Rezervacije"
                                    startValue={dateFilters.reservationFrom}
                                    endValue={dateFilters.reservationTo}
                                    onChange={(start, end) => setDateFilters({ ...dateFilters, reservationFrom: start, reservationTo: end })}
                                    placeholder="Izaberite period rezervacije"
                                />
                            </div>

                            <div className="date-filter-section" style={{ marginTop: '20px' }}>
                                <h3><Calendar size={18} /> Datum Boravka</h3>
                                <DateRangeInput
                                    label="Period Boravka"
                                    startValue={dateFilters.stayFrom}
                                    endValue={dateFilters.stayTo}
                                    onChange={(start, end) => setDateFilters({ ...dateFilters, stayFrom: start, stayTo: end })}
                                    placeholder="Izaberite period boravka"
                                />
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button className="btn-secondary" onClick={() => {
                                setDateFilters({ reservationFrom: '', reservationTo: '', stayFrom: '', stayTo: '' });
                                setShowDateFilterModal(false);
                            }}>
                                Nastavi (Bez Filtera)
                            </button>
                            <button className="btn-primary" onClick={() => setShowDateFilterModal(false)}>
                                <Filter size={16} />
                                Primeni Filter
                            </button>
                        </div>
                    </div>
                </div>
            )}
'@

if ($content -notmatch "Date Filter Modal") {
    # Match the end of the file specifically
    $endRegex = '(?s)(\s+\}\s+</div>\s+\);\s+\};)(?!.*?\};)'
    if ($content -match $endRegex) {
        $content = $content -replace $endRegex, ("`n$modalCode`n" + '$1')
    }
    else {
        Write-Host "Warn: End of file regex did not match"
    }
}

Set-Content $file -Value $content -NoNewline
Write-Host "UI changes applied."

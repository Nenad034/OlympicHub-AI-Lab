$file = "src/pages/ReservationsDashboard.tsx"
$content = Get-Content $file -Raw

# 1. Fix corrupted imports
$content = $content -replace 'FileText, CreditCard, Package, Globe, Truck, Bell, CheckCheck,.*?case,', 'FileText, CreditCard, Package, Globe, Truck, Bell, CheckCheck,'
$content = $content -replace 'BarChart3, ChevronUpSend,', 'BarChart3,'

# 2. Add DateRangeInput import
if ($content -notmatch "import DateRangeInput") {
    $content = $content -replace '(import ReservationEmailModal from .*?;)', "`$1`nimport DateRangeInput from '../components/DateRangeInput';"
}

# 3. Add state
if ($content -notmatch "showDateFilterModal") {
    $content = $content -replace 'const \[showStats, setShowStats\] = useState\(true\);', "const [showStats, setShowStats] = useState(true);`n    const [showDateFilterModal, setShowDateFilterModal] = useState(false);"
}

# 4. Update dateFilters state
$content = $content -replace 'const \[dateFilters, setDateFilters\] = useState\(\{ checkIn: '''', checkOut: '''' \}\);', 'const [dateFilters, setDateFilters] = useState({ reservationFrom: '''', reservationTo: '''', stayFrom: '''', stayTo: '''' });'

# 5. Update filtering logic
$oldFilter = '(?s)// Date filters\s*if \(dateFilters\.checkIn && res\.checkIn < dateFilters\.checkIn\) \{.*?return false;\s*\}'
$newFilter = @'
        // Date filters - Reservation Date
        if (dateFilters.reservationFrom && res.createdAt < dateFilters.reservationFrom) {
            return false;
        }
        if (dateFilters.reservationTo && res.createdAt > dateFilters.reservationTo) {
            return false;
        }

        // Date filters - Stay Date
        if (dateFilters.stayFrom && res.checkIn < dateFilters.stayFrom) {
            return false;
        }
        if (dateFilters.stayTo && res.checkOut > dateFilters.stayTo) {
            return false;
        }
'@
$content = $content -replace $oldFilter, $newFilter

Set-Content $file -Value $content -NoNewline
Write-Host "Initial cleanup done."

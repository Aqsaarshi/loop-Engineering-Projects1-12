#debug

$ProgressFile = "E:\loop-Engineering-Projects\project-12\progress.md"
$StateFile = "E:\loop-Engineering-Projects\project-12\dreaming-state.md"

$content = Get-Content $StateFile
$afterDate = $null
foreach ($line in $content) {
    if ($line -match 'last_reviewed_date:\s*(.+)') {
        $afterDate = $Matches[1]
    }
}

$lines = Get-Content $ProgressFile
$currentDate = $null
$currentContent = @()
$entries = @()

foreach ($line in $lines) {
    if ($line -match '^###\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+[AP]M)') {
        if ($currentDate -ne $null) {
            $entryDate = Get-Date $currentDate
            if ($entryDate -ge [datetime]$afterDate) {
                $entries += @{Date = $currentDate; Content = $currentContent}
            }
        }
        $currentDate = $Matches[1]
        $currentContent = @()
    } else {
        if ($currentDate -ne $null) {
            $currentContent += $line + "`n"
        }
    }
}
if ($currentDate -ne $null) {
    $entryDate = Get-Date $currentDate
    if ($entryDate -ge [datetime]$afterDate) {
        $entries += @{Date = $currentDate; Content = $currentContent}
    }
}

Write-Host ("Entries after {0} (inclusive): {1}" -f $afterDate, $entries.Count)

# Show entry dates
foreach ($entry in $entries) {
    $d = [datetime]$entry.Date
    Write-Host ("  {0}") -f $d.ToString('yyyy-MM-dd HH:mm:ss tt')
}

Write-Host "`n=== ERROR PATTERNS ==="

$errorMap = @{}
foreach ($entry in $entries) {
    $text = -join $entry.Content
    $textLines = $text -split "`r?`n"
    foreach ($tline in $textLines) {
        $trimmed = $tline.Trim()
        if ($trimmed -match '(?:TypeError|ERROR|FAILURE|⚠️)') {
            $normalized = $trimmed.ToLower() -replace '\s+', ' '
            if (-not $errorMap.ContainsKey($normalized)) {
                $errorMap[$normalized] = @()
            }
            $errorMap[$normalized] += @{Date = $entry.Date; Content = $trimmed}
        }
    }
}

Write-Host "`n=== Repeated failures (>=2 occurrences) ==="
foreach ($key in $errorMap.Keys) {
    $occurrences = $errorMap[$key]
    if ($occurrences.Count -ge 2) {
        Write-Host ("PATTERN: '{0}' (count: {1})") -f $key, $occurrences.Count
        foreach ($occ in $occurrences) {
            $d = [datetime]$occ.Date
            Write-Host ("  Date: {0}") -f $d.ToString('yyyy-MM-dd')
            Write-Host ("    Content: {0}") -f $occ.Content
        }
        Write-Host ""
    }
}
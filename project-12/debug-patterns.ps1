param(
    [string]$ProgressFile = "E:\loop-Engineering-Projects\project-12\progress.md",
    [string]$StateFile = "E:\loop-Engineering-Projects\project-12\dreaming-state.md"
)

$afterDate = $null
$content = Get-Content $StateFile
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
            if ($entryDate -gt [datetime]$afterDate) {
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
    if ($entryDate -gt [datetime]$afterDate) {
        $entries += @{Date = $currentDate; Content = $currentContent}
    }
}

Write-Host ("Entries after {0}: {1}" -f $afterDate, $entries.Count)

Write-Host "`n=== Error patterns (all, not just repeated) === "

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
            $errorMap[$normalized] += @{Date = $entry.Date; Line = $trimmed}
        }
    }
}

foreach ($key in $errorMap.Keys) {
    $occ = $errorMap[$key]
    Write-Host ("PATTERN: '{0}' (count: {1})" -f $key, $occ.Count)
    foreach ($o in $occ) {
        $d = [datetime]$o.Date
        Write-Host ("  Date: {0} | Content: {1}" -f $d.ToString('yyyy-MM-dd'), $o.Line)
    }
    Write-Host ""
}
# dreaming-loop.ps1 - Weekly Improvement Loop
# Reads progress.md after last_reviewed_date from dreaming-state.md
# Detects repeated failures and proposes rule changes

param(
    [string]$ProgressFile = "E:\loop-Engineering-Projects\project-12\progress.md",
    [string]$StateFile = "E:\loop-Engineering-Projects\project-12\dreaming-state.md",
    [string]$RulesFile = "E:\loop-Engineering-Projects\project-12\RULES.md"
)

function Read-LastReviewedDate {
    $content = Get-Content $StateFile
    foreach ($line in $content) {
        if ($line -match 'last_reviewed_date:\s*(.+)') {
            return $Matches[1]
        }
    }
    return $null
}

function Parse-ProgressEntries {
    param([string]$AfterDate)

    $entries = @()
    $lines = Get-Content $ProgressFile
    $currentDate = $null
    $currentContent = @()

    foreach ($line in $lines) {
        if ($line -match '^###\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+[AP]M)') {
            if ($currentDate -ne $null) {
                $entryDate = Get-Date $currentDate
                if ($entryDate -gt [datetime]$AfterDate) {
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
        if ($entryDate -gt [datetime]$AfterDate) {
            $entries += @{Date = $currentDate; Content = $currentContent}
        }
    }

    return $entries
}

# Find repeated failures by exact-repeated error lines
function Find-RepeatedFailures {
    param([array]$Entries)

    $errorMap = @{}

    foreach ($entry in $Entries) {
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

    $repeated = @()
    foreach ($key in $errorMap.Keys) {
        $occurrences = $errorMap[$key]
        if ($occurrences.Count -ge 2) {
            $repeated += @{ErrorKey = $key; Occurrences = $occurrences}
        }
    }

    return $repeated
}

function Generate-SmallestRule {
    param([string]$ErrorPattern)

    if ($ErrorPattern -match 'TypeError') {
        return "Never call a method on a value without checking it is not None first."
    }
    if ($ErrorPattern -match 'ERROR') {
        return "Always verify exit codes and error messages from external commands before proceeding."
    }
    if ($ErrorPattern -match 'FAILURE') {
        return "Review previous step output before re-attempting the operation."
    }
    return "Investigate and resolve the recurring issue before proceeding."
}

function Find-UnusedRule {
    param([string]$RulesFile, [array]$Entries)

    $rulesContent = Get-Content $RulesFile
    $rules = @()
    foreach ($ruleLine in $rulesContent) {
        if ($ruleLine -match '^\d+\.') {
            $ruleText = $ruleLine -replace '^\d+\.\s*', ''
            $rules += $ruleText
        }
    }

    $triggeredRules = @()
    foreach ($entry in $Entries) {
        $text = -join $entry.Content
        foreach ($rule in $rules) {
            if ($text -match [regex]::Escape($rule)) {
                $triggeredRules += $rule
            }
        }
    }

    $unused = @()
    foreach ($rule in $rules) {
        $ruleEscaped = [regex]::Escape($rule)
        $found = $false
        foreach ($tr in $triggeredRules) {
            if ($tr -eq $rule) {
                $found = $true
                break
            }
        }
        if (-not $found) {
            $unused += $rule
        }
    }

    return $unused
}

# Main execution
$lastReviewed = Read-LastReviewedDate
Write-Host ("Last reviewed date: {0}" -f $lastReviewed)

$entries = Parse-ProgressEntries $lastReviewed
Write-Host ("Entries after {0}: {1}" -f $lastReviewed, $entries.Count)

$repeated = Find-RepeatedFailures $entries
Write-Host ("Repeated failure groups found: {0}" -f $repeated.Count)

if ($repeated.Count -gt 0) {
    foreach ($rep in $repeated) {
        $rule = Generate-SmallestRule $rep.ErrorKey
        Write-Host ("Repeated error pattern: {0}" -f $rep.ErrorKey)
        Write-Host ("  Occurrences: {0}" -f $rep.Occurrences.Count)
        Write-Host "  Dates and quotes:"
        foreach ($occ in $rep.Occurrences) {
            $d = [datetime]$occ.Date
            Write-Host ("    - {0}: {1}") -f $d.ToString('yyyy-MM-dd HH:mm:ss tt'), $occ.Line
        }
    }
}

$unusedRules = Find-UnusedRule $RulesFile $entries
if ($unusedRules.Count -gt 0) {
    Write-Host "Unused rules (never triggered in reviewed window):"
    foreach ($u in $unusedRules) {
        Write-Host ("  - {0}" -f $u)
    }
} else {
    Write-Host "No unused rules found."
}
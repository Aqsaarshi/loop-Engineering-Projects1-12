$logFile = "C:\loop-Engineering-Projects\project-11\approval.log"
$token = "GATE-KEY-12345"
$port = 5000

# Create log file if it doesn't exist
if (-not (Test-Path $logFile)) {
    "approval log initialized" | Out-File -FilePath $logFile -Encoding UTF8
}

# Show the token ONCE
Write-Output "=== Routine B bearer token ==="
Write-Output $token
Write-Output "=== Above is the ONLY time this token is shown ==="
Write-Output "Store it as: \$env:B_TOKEN = '$token'"
Write-Output ""

# .NET HttpListener server
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Output "Routine B server listening on http://localhost:$port/approve"

while ($true) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    # Check for bearer token in authorization header
    $authHeader = $request.Headers["Authorization"]
    $approved = $false

    if ($authHeader -and $authHeader -eq "Bearer $token") {
        # Perform small reversible action: append "approved" to log
        $ts = (Get-Date).ToString("o") + ": approved"
        $ts | Out-File -FilePath $logFile -Append -Encoding UTF8
        Write-Output "Action logged: approved (log: $logFile)"
        $approved = $true
    } else {
        Write-Output "Invalid or missing bearer token"
    }

    # Send response
    $statusCode = if ($approved) { 200 } else { 403 }
    $response.StatusCode = $statusCode
    $response.Close()
}
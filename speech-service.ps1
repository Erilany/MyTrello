# MyTrello Speech Recognition - Minimal Version
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Output "SCRIPT:Starting"

try {
    Write-Output "SCRIPT:Loading System.Speech..."
    Add-Type -AssemblyName System.Speech
    
    Write-Output "SCRIPT:Creating recognizer..."
    $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    
    Write-Output "SCRIPT:Loading grammar..."
    $recognizer.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
    
    Write-Output "SCRIPT:Setting input device..."
    $recognizer.SetInputToDefaultAudioDevice()
    
    Write-Output "READY"
    
    $recognizer.SpeechRecognized += {
        param($sender, $e)
        Write-Output "RECOGNIZED:$($e.Result.Text)|$($e.Result.Confidence)"
    }
    
    Write-Output "SCRIPT:Starting async recognition..."
    $recognizer.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
    
    Write-Output "LISTENING"
    
    # Keep script running
    while ($true) {
        Start-Sleep -Milliseconds 500
    }
    
} catch {
    Write-Error "ERROR:$($_.Exception.Message)"
    Write-Error "ERROR:$($_.ScriptStackTrace)"
    exit 1
}

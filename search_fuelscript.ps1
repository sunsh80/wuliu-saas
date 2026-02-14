Get-ChildItem 'C:\Users\Administrator\Desktop\wuliu_project\' -Recurse -Include '*.yaml' | ForEach-Object { 
    $content = [System.IO.File]::ReadAllText($_.FullName)
    if ($content -match '燃油效率') { 
        Write-Output $('Found in: ' + $_.FullName) 
    } 
}
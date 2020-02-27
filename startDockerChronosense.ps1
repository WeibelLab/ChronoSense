#Start-Process -FilePath "C:\Program Files (x86)\Xming\Xming.exe"
#Start-Sleep -s 4

docker run -it -e DISPLAY=host.docker.internal:0 -v /tmp/.X11-unix:/tmp/.X11-unix -v C:\chronosense:/chronosense chronosense

$myshell = New-Object -com "Wscript.Shell"
$myshell.sendkeys("{ENTER}")
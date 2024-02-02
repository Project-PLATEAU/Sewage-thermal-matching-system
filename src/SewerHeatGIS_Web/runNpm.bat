@ECHO OFF
cd %~dp0
set PATH=%PATH%;..\node
call npm run build
pause
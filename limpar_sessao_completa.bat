@echo off
echo ====================================
echo   LIMPEZA COMPLETA DE SESSAO
echo ====================================
echo.
echo Isso vai remover TODOS os dados de autenticacao.
echo Voce precisara escanear o QR Code novamente.
echo.
pause

echo.
echo Limpando arquivos de sessao...

rmdir /s /q auth_info_baileys 2>nul
rmdir /s /q auth_info 2>nul
rmdir /s /q session 2>nul
rmdir /s /q baileys_auth 2>nul
del /f /q creds.json 2>nul
del /f /q qrcode.png 2>nul

echo.
echo ====================================
echo   LIMPEZA CONCLUIDA!
echo ====================================
echo.
echo Agora inicie o bot normalmente.
echo.
pause

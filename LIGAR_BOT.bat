@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: =============================================================
:: CONFIGURAÇÕES DA JANELA
:: =============================================================
title PREMIUM REGULADORA - CENTRAL DE COMANDO (V6.1)
mode con: cols=120 lines=45
color 0B

:LOOP_SISTEMA
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
echo  ║   PREMIUM REGULADORA  -  SISTEMA DE GESTAO DE BOT WHATSAPP                                                   ║
echo  ╠══════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
echo  ║                                                                                                              ║
echo  ║   [ STATUS DO SERVIDOR ]                                                                                     ║
echo  ║   DATA INICIO    : %date%                                                                                ║
echo  ║   HORARIO        : %time%                                                                               ║
echo  ║   OPERADOR       : %username%                                                                       ║
echo  ║                                                                                                              ║
echo  ║   [ MODULOS CARREGADOS ]                                                                                     ║
echo  ║   [OK] MODO ESPIAO ........: Reportando mensagens apagadas no grupo 'TESTE BOT'                              ║
echo  ║   [OK] ANTI-FLOOD .........: Protecao contra spam (5 segundos)                                               ║
echo  ║   [OK] LOGS AUDITORIA .....: Visualizacao em tempo real abaixo                                               ║
echo  ║                                                                                                              ║
echo  ║   [ CONTROLE REMOTO (VIA WHATSAPP) ]                                                                         ║
echo  ║   No grupo 'TESTE BOT', voce pode usar:                                                                      ║
echo  ║   * !espiao .......: Liga/Desliga o monitoramento de mensagens                                                               ║
echo  ║                                                                                                              ║
echo  ║   [ INSTRUCOES LOCAIS ]                                                                                      ║
echo  ║   NAO FECHE ESTA JANELA. Para desligar, clique no (X).                                                       ║
echo  ║   Se a janela fechar, o bot ficara OFFLINE.                                                                  ║
echo  ║                                                                                                              ║
echo  ╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
echo.
echo  ====================================================================================================================
echo   INICIANDO STREAM DE DADOS (LOGS)...
echo  ====================================================================================================================
echo.

:: Cria pasta de logs se necessario
if not exist "%~dp0logs" mkdir "%~dp0logs"

:: Abre painel de logs (comparo com Get-Content -Wait)
start "PAINEL LOGS" powershell -NoExit -Command "Get-Content -Path '%~dp0logs\\commands.log' -Wait -Tail 10"

echo.
:: =============================================================
:: EXECUTA O BOT
:: =============================================================
node index.js

:: =============================================================
:: REINICIO EM CASO DE ERRO
:: =============================================================
color 60
cls
echo.
echo      /----------------------------------------------------------------------\
echo      |           ⚠️  O SISTEMA FOI INTERROMPIDO POR UM ERRO  ⚠️           |
echo      |----------------------------------------------------------------------|
echo      |                                                                      |
echo      |   AGUARDE... TENTANDO RECONECTAR EM 5 SEGUNDOS.                      |
echo      |                                                                      |
echo      \----------------------------------------------------------------------/
echo.
timeout /t 5 >nul
color 0B
goto LOOP_SISTEMA
@echo off
setlocal enabledelayedexpansion

:: Thiết lập tiêu đề cửa sổ và mã hóa UTF-8 tiếng Việt
title ARUKAS 2.0 - Local-First Linguistic Suite
chcp 65001 >nul

cls
echo ========================================================================
echo   █████╗ ██████╗ ██╗   ██╗██╗  ██╗ █████╗ ███████╗    ██████╗     ██████╗ 
echo  ██╔══██╗██╔══██╗██║   ██║██║ ██╔╝██╔══██╗██╔════╝    ╚════██╗   ██╔═████╗
echo  ███████║██████╔╝██║   ██║█████╔╝ ███████║███████╗     █████╔╝   ██║██╔██║
echo  ██╔══██║██╔══██╗██║   ██║██╔═██╗ ██╔══██║╚════██║    ██╔═══╝    ████╔╝██║
echo  ██║  ██║██║  ██║╚██████╔╝██║  ██╗██║  ██║███████║    ███████╗██╗╚██████╔╝
echo  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝    ╚══════╝╚═╝ ╚═════╝ 
echo                      Local-First Linguistic Studio
echo ========================================================================
echo.

:: 1. Kiểm tra môi trường Node.js
echo [1/4] Đang kiểm tra môi trường Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI] Không tìm thấy Node.js trên máy của bạn!
    echo Vui lòng tải và cài đặt Node.js từ https://nodejs.org/ trước khi chạy.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VERSION=%%v
echo       - Đã phát hiện Node.js: %NODE_VERSION%

:: 2. Kiểm tra thư viện node_modules
echo.
echo [2/4] Đang kiểm tra thư viện dự án...
if not exist "node_modules\" (
    echo       - Chưa phát hiện thư viện node_modules. Đang tiến hành cài đặt (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo [LỖI] Cài đặt thư viện thất bại. Vui lòng kiểm tra lại kết nối mạng.
        pause
        exit /b 1
    )
    echo       - Đã cài đặt xong thư viện thành công!
) else (
    echo       - Thư viện node_modules đã sẵn sàng.
)

:: 3. Kiểm tra dịch vụ Ollama cục bộ
echo.
echo [3/4] Đang kiểm tra máy chủ AI cục bộ (Ollama)...
powershell -NoProfile -Command "(New-Object System.Net.Sockets.TcpClient).Connect('127.0.0.1', 11434)" >nul 2>nul
if %errorlevel% equ 0 (
    echo       - Dịch vụ Ollama đang hoạt động tại http://localhost:11434 [OK]
    
    :: Kiểm tra model qwen2.5:7b
    where ollama >nul 2>nul
    if %errorlevel% equ 0 (
        ollama list 2>nul | findstr /i "qwen2.5:7b" >nul
        if %errorlevel% equ 0 (
            echo       - Mô hình đề xuất qwen2.5:7b đã sẵn sàng [OK]
        ) else (
            echo       - [LƯU Ý] Chưa phát hiện mô hình qwen2.5:7b. Bạn có thể tải về bằng lệnh:
            echo         ollama run qwen2.5:7b
        )
    )
) else (
    echo       - [CẢNH BÁO] Ollama chưa được bật trên cổng 11434.
    echo         Đang thử khởi động dịch vụ Ollama...
    where ollama >nul 2>nul
    if %errorlevel% equ 0 (
        start /b "" ollama serve >nul 2>nul
        timeout /t 2 /nobreak >nul
        echo       - Đã gửi lệnh khởi động Ollama service.
    ) else (
        echo         Vui lòng bật ứng dụng Ollama để sử dụng tính năng bóc tách ngữ nghĩa AI.
    )
)

:: 4. Khởi động Vite Dev Server & Mở trình duyệt
echo.
echo [4/4] Đang khởi động Arukas 2.0 Studio...
echo       - Địa chỉ truy cập: http://localhost:5173/
echo       - Nhấn Ctrl + C để dừng máy chủ bất kỳ lúc nào.
echo ========================================================================
echo.

:: Tự động bật trình duyệt sau 2 giây
start /b "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173/"

:: Chạy máy chủ phát triển Vite
npm run dev

pause

# 🚀 ARUKAS 2.0 — Deployment & Operations Guide

> **Mục tiêu**: Hướng dẫn toàn diện cách khởi chạy nhanh, cài đặt môi trường và triển khai ARUKAS 2.0 trên các hệ điều hành khác nhau.

---

## 1. Khởi Chạy Siêu Tốc 1-Click trên Windows (Khuyên Dùng)

Dự án đã tích hợp sẵn script tự động hóa **`run.bat`** tại thư mục gốc:

1. Điều hướng đến thư mục dự án `Arukas2`.
2. **Click đúp vào tệp `run.bat`**.
3. Hệ thống sẽ tự động thực hiện 4 bước:
   - Kiểm tra phiên bản Node.js.
   - Tự động chạy `npm install` nếu chưa có thư mục `node_modules`.
   - Kiểm tra dịch vụ Ollama tại `http://localhost:11434` và kiểm tra model `qwen2.5:7b`.
   - Khởi động Vite server và **tự động mở trình duyệt web** tại `http://localhost:5173/`.

---

## 2. Khởi Chạy Thủ Công Qua Dòng Lệnh (CLI)

### Bước 1: Yêu cầu tiên quyết
- **Node.js**: Phiên bản 18.x trở lên (khuyên dùng Node 20 LTS).
- **Trình quản lý gói**: `npm` (hoặc `pnpm`, `yarn`).
- **Ollama**: Đã cài đặt từ [https://ollama.com/](https://ollama.com/).

### Bước 2: Tải các mô hình AI cần thiết
Mở Terminal hoặc Command Prompt và tải các mô hình mã nguồn mở tối ưu nhất:

```bash
# 1. Mô hình phân tích ngôn ngữ & CJKV tốt nhất hiện nay (4.7 GB):
ollama run qwen2.5:7b

# 2. Mô hình thị giác bóc tách ảnh & video (6.0 GB):
ollama run qwen2.5vl:7b
```

### Bước 3: Cài đặt và khởi chạy máy chủ phát triển
```bash
# Cài đặt thư viện:
npm install

# Khởi chạy server phát triển:
npm run dev
```
Truy cập ứng dụng tại: **`http://localhost:5173/`**

---

## 3. Đóng Gói Bản Sản Phẩm (Production Build)

Để đóng gói bản tối ưu hóa cho môi trường thực tế:

```bash
npm run build
```

Quá trình build sẽ:
1. Chạy `tsc` để kiểm tra toàn vẹn kiểu dữ liệu TypeScript.
2. Vite bundle mã nguồn, chia nhỏ các chunk vendor (`react-vendor`, `icons-vendor`, `motion-vendor`, `db-vendor`).
3. Tự động nén trước bằng thuật toán **Gzip** và **Brotli** (`vite-plugin-compression2`) giúp tải trang nhanh dưới 1 giây.
4. Đầu ra nằm trong thư mục `dist/`.

Để xem trước bản build production tại máy cục bộ:
```bash
npm run preview
```

---

## 4. Triển Khai Lên Đám Mây (Cloud Deployment)

### 4.1. Triển khai Static Site (Vercel / Netlify / Cloudflare Pages)
Do ARUKAS 2.0 là ứng dụng Client-Side SPA 100%:
1. Đẩy mã nguồn lên GitHub/GitLab.
2. Kết nối kho lưu trữ với **Vercel** hoặc **Netlify**.
3. Thiết lập cấu hình:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Lưu ý về Ollama**: Khi triển khai trên cloud hosting công cộng, người dùng cần cấu hình endpoint Ollama trong bảng Cài Đặt (Settings) trỏ về địa chỉ máy chủ cục bộ (ví dụ qua ngrok, Cloudflare Tunnel hoặc IP mạng nội bộ).

### 4.2. Triển khai Docker Container (Tùy chọn)
Tạo `Dockerfile` đơn giản với Nginx:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
Khởi chạy:
```bash
docker build -t arukas-two .
docker run -p 5173:80 arukas-two
```

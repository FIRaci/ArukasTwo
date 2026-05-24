# 🌸 ARUKAS - Ứng Dụng Học Tiếng Nhật Nâng Cao

> **Được phát triển bởi**: FIRaci
> **Tên dự án**: ARUKAS (Sakura đọc ngược)
> **Phiên bản**: 0.0.0 (Development)
> **Công nghệ**: React + TypeScript + Vite + TailwindCSS + Google Gemini AI

## 📋 Tổng Quan Dự Án

**ARUKAS** là một ứng dụng học tiếng Nhật toàn diện, mang đến trải nghiệm học tập vượt trội với các tính năng:
- ✨ **Phân tích câu bằng AI** (Google Gemini) để hiểu rõ từng thành phần
- 🎵 **Hiển thị Pitch Accent** trực quan theo từng mora
- 📚 **Phân tích ngữ pháp chi tiết** kèm công thức và cấp độ JLPT
- 🀄 **Hỗ trợ trọn bộ Hán Việt** cho Kanji và từ vựng
- 🔄 **Phân tách cấu trúc động từ** chuyên sâu
- 💾 **Từ điển Offline siêu nhẹ** với hơn 24.000 từ vựng và 1.800+ mẫu ngữ pháp
- 🎨 **Giao diện tuyệt đẹp** với hiệu ứng hoa anh đào rơi

## 🚀 Cài Đặt & Khởi Chạy

1. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

2. **Cấu hình API Key**:
   Tạo file `.env` trong thư mục gốc và thêm key Gemini:
   ```env
   VITE_API_KEY=your_google_gemini_api_key_here
   ```

3. **Chạy server phát triển**:
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại: `http://localhost:5173`

## 💡 Hướng Dẫn Sử Dụng

- 🔍 **Phân Tích Câu**: Nhập câu tiếng Nhật hoặc upload ảnh chứa chữ Nhật, nhấn `Ctrl+Enter` để phân tích ngay lập tức.
- 💾 **Lưu Trữ Tự Động**: Click vào bất kỳ từ vựng hay ngữ pháp nào để lưu vào **User Hub** (lưu trên LocalStorage).
- 🧠 **Học Sâu Hơn**: Sử dụng tính năng "Enrich" để AI tự động trích xuất ví dụ, từ đồng nghĩa/trái nghĩa.
- 🔄 **So Sánh Từ**: Giúp bạn hiểu rõ sắc thái giữa những từ vựng có ý nghĩa gần giống nhau.

## 🏗️ Cấu Trúc Dự Án

- `src/components/`: Chứa các React components (FallingPetals, SentenceBlock, PitchGraph...)
- `src/data/`: Chứa dữ liệu mock & database offline (`mockData.ts`)
- `src/services/`: Logic xử lý và gọi API (`analysisEngine.ts`)

---
*Dự án được xây dựng với 💖 và 🌸 dành cho những người yêu thích tiếng Nhật, bởi FIRaci.*

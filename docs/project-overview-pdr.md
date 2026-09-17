# 🌸 ARUKAS — Product Development & Requirements (PDR)

## 1. Giới thiệu dự án
- **Tên dự án**: ARUKAS (Sakura đọc ngược)
- **Mục tiêu**: Ứng dụng web học tiếng Nhật chuyên sâu toàn diện, kết hợp phân tích AI (Google Gemini) và từ điển ngoại tuyến (offline-first).
- **Điểm nổi bật**:
  - Phân tích cú pháp câu đa tầng (Mora, Romaji, Hán Việt, Vai trò ngữ pháp, Decomposition).
  - Biểu đồ Pitch Accent trực quan theo từng mora.
  - Phân tích hội thoại Manga và Anime từ tệp ảnh/video.
  - Từ điển 24.141 từ vựng và 1.811 cấu trúc ngữ pháp kèm ví dụ.
  - Giao diện thẩm mỹ phong cách hoa anh đào (Sakura petals, GSAP motion).

## 2. Công nghệ cốt lõi
- **Frontend**: React 18, TypeScript 5, Vite 5, TailwindCSS 3.
- **Hiệu ứng & Hoạt ảnh**: GSAP, Three.js, Lottie Web, Canvas Petals.
- **AI & Cloud**: Google Gen AI SDK (`@google/genai`), Firebase (Auth, Firestore).
- **Audio**: Google Cloud TTS / Web Speech API.

## 3. Đối tượng người dùng
- Người học tiếng Nhật từ trình độ sơ cấp (N5) đến cao cấp (N1).
- Người học muốn luyện phát âm chuẩn qua Pitch Accent (Cao độ từ).
- Người đọc Manga, xem Anime muốn tra cứu hội thoại trực tiếp theo ngữ cảnh.

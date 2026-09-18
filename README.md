# 🌐 ARUKAS 2.0 — Local-First Multi-Language Linguistic Suite

> **Tác giả**: FIRaci  
> **Kho lưu trữ chính thức**: [https://github.com/FIRaci/ArukasTwo](https://github.com/FIRaci/ArukasTwo)  
> **Phiên bản**: 2.0.0  
> **Kiến trúc**: React 18 + TypeScript + Vite + TailwindCSS + Local Ollama AI + IndexedDB (`idb-keyval`)

---

## 🌟 Tổng Quan Dự Án ARUKAS 2.0

**ARUKAS 2.0** là bước chuyển mình toàn diện từ dự án tiền nhiệm:
- ❌ **Xóa bỏ hoàn toàn**: Phụ thuộc Google Gemini API, hệ thống đăng ký/đăng nhập Firebase, và các bộ từ điển tĩnh đơn ngữ Nhật Bản cồng kềnh.
- ✅ **100% Cục bộ & Bảo mật (Local-First)**: Lưu trữ trên trình duyệt qua **IndexedDB**, không cần tạo tài khoản hay gửi dữ liệu lên máy chủ bên thứ ba.
- 🔄 **Dịch thuật & Bóc tách 2 chiều (Bi-directional Multi-language)** giữa **11 ngôn ngữ**:
  1. 🇻🇳 **Tiếng Việt** (Chữ Quốc Ngữ Latinh & 5 thanh điệu)
  2. 🇯🇵 **Tiếng Nhật** (Kanji, Hiragana, Katakana, Romaji)
  3. 🇰🇷 **Tiếng Hàn** (Hangul, Batchim, Phiên âm La-tinh hóa)
  4. 🇨🇳 **Tiếng Trung** (Chữ Hán phồn thể/giản thể, Pinyin & 4 thanh)
  5. 🇷🇺 **Tiếng Nga** (Bảng chữ cái Kirin 33 ký tự)
  6. 🇬🇧 **Tiếng Anh** (Latin & Phiên âm quốc tế IPA)
  7. 🇪🇸 **Tây Ban Nha** (Chữ cái tiếng Tây Ban Nha, dấu ngã Ñ)
  8. 🇫🇷 **Tiếng Pháp** (Chữ cái Pháp, các dấu phụ aigu, grave, circonflexe)
  9. 🇮🇹 **Tiếng Ý** (Hệ thống chữ cái và thanh âm Ý)
  10. 🇩🇪 **Tiếng Đức** (Bảng chữ cái Đức, biến âm Umlaute ä/ö/ü và Eszett ß)
  11. 🇵🇹 **Bồ Đào Nha** (Hệ thống vần mũi và âm lưỡi Bồ Đào Nha)

---

## 🎯 3 Trụ Cột Tính Năng Cốt Lõi

### 1. Phân Tích Câu Đa Chiều (Sentence Decomposition)
- Bóc tách cấu trúc ngữ pháp và phân loại từ loại (Danh từ, Động từ, Tính từ, Phó từ, Trợ từ, Liên từ...).
- Cung cấp phiên âm (Romaji, Pinyin, IPA), nghĩa ngữ cảnh, nguyên thể từ điển (Lemma) và vai trò ngữ pháp.
- Trích xuất công thức ngữ pháp kèm ví dụ thực tế và giải thích sắc thái văn hóa/văn phong (Trang trọng, Thân mật, Văn chương, Khẩu ngữ).
- Hỗ trợ nghe phát âm trực tiếp chuẩn bản xứ thông qua Web Speech Synthesis API.

### 2. Phân Tích Ảnh & Video Cục Bộ (Multimodal Vision Lab)
- Nhận diện ký tự OCR, khung thoại truyện tranh (Manga), biển hiệu, thực đơn và ảnh chụp tài liệu.
- Trích xuất khung hình video thời gian thực để dịch trực tiếp phụ đề hoặc biển cảnh trong video.
- Được vận hành bởi mô hình AI thị giác cục bộ (Vision) **`qwen2.5vl:7b`** trực tiếp trên máy người dùng, không tốn chi phí API hay lo rò rỉ dữ liệu nhạy cảm.

### 3. Kho Tri Thức Cục Bộ & Công Cụ So Sánh Sắc Thái (Local Memory Hub & Nuance Comparison)
- **Lưu trữ Từ Vựng & Ngữ Pháp**: 1-click lưu các mục quan tâm vào IndexedDB, tìm kiếm nhanh và lọc theo từng ngôn ngữ.
- **Công Cụ So Sánh Sắc Thái Chuyên Sâu (Nuance Comparison)**: Đặt 2 hoặc nhiều từ/cấu trúc tương đồng (ví dụ: `は` vs `が`, `por` vs `para`, `connaître` vs `savoir`, `make` vs `do`) để AI đối chiếu điểm khác biệt cốt lõi, ngữ cảnh phù hợp và ví dụ mẫu.
- **Sao Lưu & Khôi Phục (Backup & Restore)**: Xuất toàn bộ cơ sở dữ liệu ra tệp JSON chuẩn hoặc nhập lại dữ liệu bất cứ lúc nào.

### 4. Hệ Thống Tra Cứu Bảng Chữ Cái Toàn Cầu (Alphabets Guide)
- Cẩm nang toàn diện về 11 hệ thống văn tự trên thế giới với phiên âm, cách đọc, tên chữ cái, ví dụ thực tế và âm thanh phát âm mẫu.

---

## 🎨 Hệ Thống Giao Diện & Hiệu Ứng Rơi Đa Quốc Gia

- **Mặc định**: Phong cách **Trắng Tinh Khôi (Minimal White)**, **không có hiệu ứng rơi (None)** để tối ưu sự tập trung và tiết kiệm năng lượng.
- Người dùng có thể tùy chỉnh theo sở thích trong bảng **Cài đặt (Settings)**:
  - 🌸 **Nhật Bản**: Hoa Anh Đào rơi (*Sakura*)
  - 🌿 **Việt Nam**: Lá tre & lá sen rơi (*Bamboo*)
  - 🍂 **Hàn Quốc**: Lá ngân hạnh & phong đỏ rơi (*Ginkgo*)
  - 🏮 **Trung Quốc**: Thủy mặc & bụi vàng (*Ink*)
  - ❄️ **Nga & Đức**: Băng tuyết mùa đông rơi (*Snow*)
  - 🌻 **Tây Ban Nha & Ý**: Nắng ấm & hoa cúc dại (*Sunlight*)
  - 🪻 **Pháp & Anh**: Hoa oải hương bồng bềnh (*Lavender*)

---

## ⚙️ Cấu Hình Mô Hình AI Ollama Cục Bộ

ARUKAS 2.0 tự động kết nối tới Ollama tại `http://localhost:11434` và tự nhận diện danh sách model có sẵn trên máy của bạn.

### Các mô hình đã có sẵn trên máy:
- **`llama3.1:latest`**: Mô hình ngôn ngữ 8B chất lượng cao cho văn bản, cấu trúc ngữ pháp.
- **`qwen2.5vl:7b`**: Mô hình đa phương thức (Vision) cho OCR ảnh và trích xuất khung hình video.
- **`stheno:latest` / `L3-8B-Stheno-v3.2-GGUF`**: Mô hình đối thoại sáng tạo.

### Gợi ý tải thêm các mô hình tối ưu hơn:
```bash
# 1. Mô hình phân tích đa ngữ & CJKV (Việt, Nhật, Hàn, Trung) tốt nhất hiện nay
ollama run qwen2.5:7b

# 2. Mô hình suy luận sâu & giải thích ngữ pháp học thuật
ollama run deepseek-r1:8b

# 3. Mô hình thị giác nhẹ đa ngôn ngữ
ollama run minicpm-v
```

---

## 🚀 Khởi Chạy Ứng Dụng

### ⚡ Cách 1: Khởi chạy siêu tốc 1-Click với `run.bat` (Khuyên dùng trên Windows)
Chỉ cần **click đúp vào tệp `run.bat`** ở thư mục gốc của dự án!
Script sẽ tự động:
- Kiểm tra môi trường Node.js và tự động chạy `npm install` nếu thiếu thư viện.
- Kiểm tra máy chủ AI cục bộ **Ollama** và phát hiện mô hình đề xuất **`qwen2.5:7b`**.
- Khởi động máy chủ phát triển Vite và **tự động mở trình duyệt web** tại `http://localhost:5173/`.

### 💻 Cách 2: Khởi chạy thủ công qua Terminal / Command Prompt:
```bash
# 1. Cài đặt các gói phụ thuộc (lần đầu):
npm install

# 2. Chạy server phát triển cục bộ:
npm run dev
```
Truy cập: `http://localhost:5173/`

### 📦 Đóng gói bản Production:
```bash
npm run build
```

---

## 📂 Cấu Trúc Mã Nguồn

```
Arukas2/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx          # Thanh điều hướng & chọn ngôn ngữ 2 chiều ⇄
│   │   ├── ParticleCanvas.tsx  # Canvas hiệu ứng hạt rơi theo chủ đề 8 quốc gia
│   │   └── SettingsModal.tsx   # Hộp thoại cấu hình Ollama, theme, particle, backup
│   ├── contexts/
│   │   └── SettingsContext.tsx # Quản lý trạng thái cài đặt, theme, Ollama API
│   ├── pages/
│   │   ├── AnalyzePage.tsx     # Trang phân tích câu 2 chiều 11 ngôn ngữ
│   │   ├── MediaPage.tsx       # Trang phân tích ảnh OCR và trích xuất video
│   │   ├── AlphabetsPage.tsx   # Trang tra cứu 11 bảng chữ cái toàn cầu
│   │   └── HubPage.tsx         # Kho lưu trữ từ vựng, ngữ pháp, so sánh & backup
│   ├── services/
│   │   ├── alphabetData.ts     # Dữ liệu bảng chữ cái 11 ngôn ngữ
│   │   ├── localDbService.ts   # Tương tác IndexedDB cục bộ (idb-keyval)
│   │   └── ollamaService.ts    # Kết nối API Ollama (Chat, Vision, Compare)
│   ├── types.ts                # Khai báo TypeScript cho toàn bộ dự án
│   ├── App.tsx                 # Layout tổng thể
│   ├── main.tsx                # Khởi tạo React & Routing
│   └── index.css               # Styling TailwindCSS & Typography
├── vite.config.ts              # Cấu hình Vite với proxy Ollama & chunk splitting
└── package.json
```

---

*Được tái cấu trúc và phát triển bởi **FIRaci** — ARUKAS 2.0 (2026).*

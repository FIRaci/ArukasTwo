# 🌐 ARUKAS 2.0 — Product Development & Requirements (PDR)

> **Dự án**: ARUKAS 2.0 (Local-First Multi-Language Linguistic Suite)  
> **Phiên bản**: 2.0.0  
> **Tác giả / Maintainer**: FIRaci  
> **Kho lưu trữ chính thức**: [https://github.com/FIRaci/ArukasTwo](https://github.com/FIRaci/ArukasTwo)  
> **Kiến trúc**: React 18 + TypeScript + Vite 5 + TailwindCSS + Local Ollama AI + IndexedDB (`idb-keyval`)

---

## 1. Tầm Nhìn & Sứ Mệnh Sản Phẩm

**ARUKAS 2.0** là bước tiến hóa mang tính cách mạng từ dự án tiền nhiệm:
- ❌ **Xóa bỏ hoàn toàn phụ thuộc vào đám mây độc quyền**: Loại bỏ hoàn toàn Google Gemini API, hệ thống xác thực Firebase Auth, lưu trữ Firestore và các tệp từ điển tĩnh đơn ngữ Nhật Bản cồng kềnh.
- ✅ **Triết lý Cục Bộ Hóa Tuyệt Đối (100% Local-First & Privacy-Focused)**: Mọi dữ liệu phân tích, từ vựng, ngữ pháp và lịch sử học tập được lưu trữ trực tiếp trong trình duyệt người dùng qua **IndexedDB**, không gửi dữ liệu ra máy chủ bên ngoài, không cần tài khoản, không quảng cáo.
- 🔄 **Dịch thuật & Bóc tách ngữ nghĩa 2 chiều (Bi-directional Multi-language)**: Hỗ trợ chuyển đổi tự do 2 chiều giữa **11 ngôn ngữ toàn cầu**:
  1. 🇻🇳 **Tiếng Việt** (Chữ Quốc Ngữ, 6 thanh điệu)
  2. 🇯🇵 **Tiếng Nhật** (Kanji, Hiragana, Katakana, Romaji, Pitch Accent)
  3. 🇰🇷 **Tiếng Hàn** (Hangeul, âm bật hơi, âm căng, quy tắc Batchim)
  4. 🇨🇳 **Tiếng Trung** (Hán tự Giản/Phồn thể, Pinyin, 4 thanh điệu)
  5. 🇷🇺 **Tiếng Nga** (33 ký tự Cyrillic, nguyên âm cứng/mềm, Akan'ye)
  6. 🇬🇧 **Tiếng Anh** (Latinh, 44 âm vị phiên âm quốc tế Oxford IPA)
  7. 🇪🇸 **Tây Ban Nha** (27 ký tự RAE, dấu ngã Ñ, rung đầu lưỡi Rr)
  8. 🇫🇷 **Tiếng Pháp** (5 loại dấu phụ, âm mũi, âm R lưỡi gà, nối âm Liaison)
  9. 🇮🇹 **Tiếng Ý** (21 chữ cái truyền thống, phụ âm kép, biến âm C/G)
  10. 🇩🇪 **Tiếng Đức** (Biến âm Umlaute ä/ö/ü, Eszett ß, danh từ viết hoa)
  11. 🇵🇹 **Bồ Đào Nha** (Vần mũi Til ã/õ, Cédille ç, nguyên âm đóng/mở)

---

## 2. 4 Trụ Cột Tính Năng Cốt Lõi

### 2.1. Phân Tích Cấu Trúc Ngôn Ngữ 2 Chiều (Linguistic Studio Console)
- Bóc tách phân tầng câu văn: Chia nhỏ câu thành các token ngữ nghĩa độc lập.
- Hệ thống nhãn từ loại (Part-of-Speech POS Tags) với màu sắc trực quan: Danh từ, Động từ, Tính từ, Phó từ, Trợ từ, Liên từ, Giới từ...
- Khung soi từ ngữ cảnh (Word Inspector): Hiển thị phiên âm (Romaji, Pinyin, IPA), dạng nguyên thể từ điển (Lemma), vai trò cú pháp và phát âm bản xứ qua Web Speech Synthesis API.
- Bóc tách công thức ngữ pháp: Trích xuất các mẫu ngữ pháp cốt lõi (JLPT N5–N1, TOPIK I–II, HSK, CEFR), giải thích ngữ cảnh ứng dụng và sắc thái trang trọng/thân mật.
- Lưu trữ 1-click: Nhấn biểu tượng Bookmark để lưu ngay từ vựng hoặc cấu trúc vào cơ sở dữ liệu IndexedDB.

### 2.2. Phòng Thí Nghiệm Ảnh & Video Đa Phương Thức (Multimodal Vision Lab)
- Nhận diện ký tự OCR, dịch thuật và bóc tách trực tiếp từ hình ảnh tài liệu, thực đơn, biển báo giao thông và bong bóng thoại truyện tranh Manga.
- Tích hợp phát video HTML5 với tính năng **"Chụp Khung Hình Hiện Tại" (Video Frame Capture)**, phục vụ dịch phụ đề và phân tích hội thoại phim ảnh/anime theo thời gian thực.
- Vận hành nội bộ bởi mô hình thị giác AI cục bộ **`qwen2.5vl:7b`** (hoặc `minicpm-v`).

### 2.3. Cẩm Nang Tra Cứu 11 Bảng Chữ Cái Toàn Cầu (Global Alphabets & Masterclass)
- Dữ liệu đầy đủ 100% không góc khuyết cho 11 ngôn ngữ:
  - 46 Hiragana, 46 Katakana, 25 âm đục Dakuten, 36 âm ghép Yoon tiếng Nhật.
  - Phụ âm đơn, kép, nguyên âm đơn, ghép và quy tắc 7 nhóm Batchim tiếng Hàn.
  - 21 thanh mẫu, 36 vận mẫu đơn/kép/mũi và 4 thanh điệu Pinyin tiếng Trung.
  - 44 âm vị IPA Oxford (12 nguyên âm đơn, 8 nguyên âm đôi, 24 phụ âm).
  - Biến âm Umlaute, Eszett, dấu Til, Cédille và 33 chữ cái Cyrillic.
- Cụm **Cẩm Nang Ngôn Ngữ & Phát Âm Chuyên Sâu (Linguistic Masterclass)**: Phân tích nguồn gốc lịch sử, quy tắc cấu trúc âm tiết, kỹ thuật khẩu hình miệng và mẹo tránh bẫy phát âm sai cho người học.

### 2.4. Kho Tri Thức Cục Bộ & Đấu Trường Sắc Thái (Local Vault & Nuance Arena)
- Quản lý từ vựng và ngữ pháp đã lưu với bộ lọc ngôn ngữ và thanh tìm kiếm nhanh.
- **Đấu Trường So Sánh Sắc Thái (Nuance Arena)**: Đối chiếu sự khác biệt tinh tế giữa 2 từ đồng nghĩa/dễ nhầm lẫn (ví dụ: `は` vs `が`, `por` vs `para`, `make` vs `do`, `きれい` vs `うつくしい`), phân tích cốt lõi khi nào dùng A / khi nào dùng B kèm ví dụ minh họa.
- Sao lưu & Khôi phục: Xuất toàn bộ cơ sở dữ liệu ra tệp JSON chuẩn hoặc nhập tệp sao lưu.
- Tính năng **Xóa Sạch Dữ Liệu (Reset Clean Slate)** cho phép người dùng dọn sạch bộ nhớ bất kỳ lúc nào.

---

## 3. Kiến Trúc Kỹ Thuật & Hiệu Năng

| Thành Phần | Công Nghệ Lựa Chọn | Lý Do Kỹ Thuật |
|---|---|---|
| **Core Framework** | React 18 + TypeScript 5 | Đảm bảo tính an toàn kiểu dữ liệu, component hóa linh hoạt |
| **Build Tool** | Vite 5 | HMR cực nhanh, tối ưu chunking và nén Gzip/Brotli |
| **Styling** | TailwindCSS 3 | Utility-first, thiết kế giao diện hiện đại, responsive |
| **Local AI Engine** | Ollama (`qwen2.5:7b` & `qwen2.5vl:7b`) | Chạy mô hình mã nguồn mở trực tiếp trên GPU/CPU nội bộ |
| **Local Database** | IndexedDB via `idb-keyval` | Bền vững, dung lượng lớn (>50MB), không giới hạn như LocalStorage |
| **TTS Audio** | Web Speech Synthesis API | Phát âm chuẩn giọng bản xứ từng quốc gia mà không cần gọi API mạng |
| **Motion & Theme** | Canvas API + Tailwind Themes | Hiệu ứng hạt rơi 8 phong cách văn hóa không gây giật lag (60 FPS) |

---

## 4. Yêu Cầu Vận Hành

- **Trình duyệt**: Google Chrome, Microsoft Edge, Mozilla Firefox, Brave (hỗ trợ Web Speech API và IndexedDB).
- **Phần mềm AI bổ trợ**: Ollama cài đặt tại `http://localhost:11434` với các mô hình đề xuất:
  - Text: `qwen2.5:7b` (hoặc `llama3.1:latest`, `deepseek-r1:8b`).
  - Vision: `qwen2.5vl:7b` (hoặc `minicpm-v`).
- **Khởi chạy Windows**: 1-click thông qua tệp `run.bat` tự động phát hiện môi trường.

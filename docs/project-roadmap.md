# 🗺️ ARUKAS 2.0 — Project Roadmap & Milestones

> **Tầm nhìn**: Xây dựng nền tảng học tập và nghiên cứu ngôn ngữ cục bộ (Local-First Linguistic Suite) mạnh mẽ nhất, kết hợp giữa AI mã nguồn mở tiên tiến và trải nghiệm người dùng không giới hạn.

---

## 1. Các Cột Mốc Đã Hoàn Thành (Completed Milestones)

### ✅ Giai Đoạn 1: Tái Cấu Trúc Toàn Diện (Arukas 1.0 -> Arukas 2.0)
- [x] Loại bỏ hoàn toàn sự phụ thuộc vào Google Gemini API độc quyền và Firebase Auth.
- [x] Chuyển đổi từ hệ thống đơn ngữ tiếng Nhật sang **đa ngôn ngữ 2 chiều giữa 11 ngôn ngữ toàn cầu** (Việt, Nhật, Hàn, Trung, Nga, Anh, Pháp, Tây Ban Nha, Ý, Đức, Bồ Đào Nha).
- [x] Tích hợp máy chủ AI cục bộ **Ollama** (`http://localhost:11434`) với mô hình đề xuất `qwen2.5:7b` cho văn bản và `qwen2.5vl:7b` cho thị giác.
- [x] Chuyển đổi tầng lưu trữ sang **IndexedDB** (`idb-keyval`), đảm bảo 100% dữ liệu nằm trong máy người dùng, an toàn và riêng tư tuyệt đối.

### ✅ Giai Đoạn 2: Hoàn Thiện Tính Năng & Trải Nghiệm Người Dùng
- [x] **Studio Phân Tích Câu (Sentence Analyzer)**: Bóc tách token đa chiều, mã màu từ loại (POS tags), khung soi từ ngữ cảnh và nghe phát âm chuẩn Web Speech API.
- [x] **Phòng Thí Nghiệm Đa Phương Thức (Media Lab)**: OCR hình ảnh tài liệu, dịch thuật truyện tranh Manga và tính năng bắt khung hình video thời gian thực.
- [x] **Đấu Trường Sắc Thái (Nuance Arena)**: Đối chiếu sự khác biệt cốt lõi giữa hai thuật ngữ đồng nghĩa/dễ nhầm lẫn.
- [x] **Hệ Thống 11 Bảng Chữ Cái Toàn Cầu**: Bổ sung đầy đủ 100% các bảng chữ cái, âm đục, âm ghép, vần Pinyin, Hangeul, 44 âm vị Oxford IPA.
- [x] **Cẩm Nang Ngôn Ngữ Chuyên Sâu (Linguistic Masterclass)**: Cung cấp kiến thức sâu sắc về nguồn gốc lịch sử, quy tắc tạo âm tiết, kỹ thuật khẩu hình miệng và mẹo tránh bẫy phát âm.

### ✅ Giai Đoạn 3: Tối Ưu Hóa & Trợ Năng
- [x] **Khởi chạy siêu tốc 1-Click `run.bat`** trên Windows tự động kiểm tra Node, Ollama, model và bật trình duyệt.
- [x] **Bộ chuyển đổi ngôn ngữ giao diện Web (i18n)**: Hỗ trợ tiếng Việt, English, 日本語, 한국어, 中文.
- [x] **Cẩm nang hướng dẫn sử dụng tương tác ngay trên web (`UserGuideModal`)**: 5 chương chi tiết.
- [x] **Làm sạch giao diện (Clean Slate)**: Loại bỏ toàn bộ ví dụ mẫu rác, bổ sung nút xóa sạch dữ liệu IndexedDB.

---

## 2. Kế Hoạch Phát Triển Tiếp Theo (Future Roadmap)

### 📌 Giai Đoạn 4: Nâng Cấp Nghe & Phân Tích Âm Thanh Ngoại Tuyến (v2.1)
- [ ] **Whisper Speech-to-Text Local**: Tích hợp mô hình Whisper (qua Ollama hoặc Transformers.js) để nghe và bóc tách trực tiếp từ tệp ghi âm giọng nói hoặc tệp âm thanh podcast ngoại tuyến.
- [ ] **Biểu đồ Pitch Accent tương tác thời gian thực**: Trực quan hóa cao độ âm sắc dựa trên phân tích âm thanh thu âm từ microphone người dùng.

### 📌 Giai Đoạn 5: Mở Rộng Học Tập & Ôn Tập Chủ Động (v2.2)
- [ ] **Thuật toán lặp lại ngắt quãng (Spaced Repetition System - FSRS/SM-2)**: Hệ thống ôn tập flashcard thông minh ngay trong Kho Tri Thức.
- [ ] **Xuất gói thẻ Anki (.apkg)**: 1-click xuất toàn bộ từ vựng và ngữ pháp đã lưu kèm phiên âm và audio sang định dạng Anki chuẩn.
- [ ] **Trình đọc sách EPUB & PDF tích hợp**: Đọc tài liệu ngoại ngữ với tính năng bóc tách từ vựng tức thời khi nhấp chuột (Instant Word Lookup Popover).

### 📌 Giai Đoạn 6: Đóng Gói Ứng Dụng Desktop Độc Lập (v2.3)
- [ ] **Đóng gói ứng dụng desktop với Tauri**: Dung lượng nhỏ gọn dưới 15MB, tự động quản lý vòng đời của Ollama daemon mà không cần mở terminal.
- [ ] **Hỗ trợ cài đặt PWA (Progressive Web App)**: Cài đặt trực tiếp lên điện thoại hoặc máy tính bảng như một ứng dụng native.

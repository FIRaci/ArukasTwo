# 🗺️ ARUKAS 2.0 — Codebase Summary & Architecture Directory Map

> **Tổng quan**: Tài liệu tóm tắt bản đồ cấu trúc toàn bộ các thư mục, tệp mã nguồn và trách nhiệm kỹ thuật của từng thành phần trong ARUKAS 2.0.

---

## 1. Cấu Trúc Cây Thư Mục (Directory Tree)

```
d:\Arukas2/
├── docs/                               # Toàn bộ tài liệu chuẩn hóa của dự án
│   ├── project-overview-pdr.md         # Bản mô tả sản phẩm và yêu cầu chi tiết
│   ├── system-architecture.md          # Kiến trúc kỹ thuật và luồng dữ liệu
│   ├── code-standards.md               # Quy chuẩn viết mã và module hóa
│   ├── codebase-summary.md             # Tài liệu này (Bản đồ mã nguồn)
│   ├── design-guidelines.md            # Quy chuẩn thiết kế UI/UX & theme
│   ├── deployment-guide.md             # Hướng dẫn khởi chạy & triển khai
│   └── project-roadmap.md              # Lộ trình phát triển & tính năng tương lai
├── public/                             # Tài nguyên tĩnh
│   ├── data/                           # Bộ dữ liệu từ điển JLPT tham khảo
│   └── sakura.svg                      # Biểu tượng cánh hoa anh đào
├── src/                                # Toàn bộ mã nguồn ứng dụng React
│   ├── components/                     # Các thành phần giao diện tái sử dụng
│   │   ├── Navbar.tsx                  # Thanh điều hướng 3 cột cân xứng & i18n switcher
│   │   ├── ParticleCanvas.tsx          # Canvas hiệu ứng hạt rơi đa quốc gia (60 FPS)
│   │   ├── SettingsModal.tsx           # Hộp thoại cài đặt mô hình, endpoint, theme
│   │   └── UserGuideModal.tsx          # Cẩm nang hướng dẫn sử dụng 5 chương tương tác
│   ├── contexts/                       # Quản lý trạng thái toàn cục
│   │   └── SettingsContext.tsx         # Context lưu trữ theme, model, i18n, endpoint
│   ├── pages/                          # Các trang màn hình chính
│   │   ├── AnalyzePage.tsx             # Studio bóc tách câu văn bản 2 chiều
│   │   ├── MediaPage.tsx               # Phòng thí nghiệm OCR ảnh & bắt khung hình video
│   │   ├── AlphabetsPage.tsx           # Cẩm nang tra cứu 11 bảng chữ cái & Masterclass
│   │   └── HubPage.tsx                 # Kho tri thức từ vựng, Đấu trường Nuance Arena & Backup
│   ├── services/                       # Tầng dịch vụ & giao tiếp ngoại vi
│   │   ├── alphabetData.ts             # 100% dữ liệu ký tự của 11 hệ thống chữ viết
│   │   ├── alphabet-masterclass-data.ts# Cẩm nang ngữ âm, lịch sử, quy tắc cấu trúc âm tiết
│   │   ├── i18n.ts                     # Từ điển chuyển đổi ngôn ngữ giao diện web
│   │   ├── localDbService.ts           # Tương tác IndexedDB (idb-keyval) lưu trữ offline
│   │   └── ollamaService.ts            # Tương tác với máy chủ AI Ollama nội bộ
│   ├── types.ts                        # Toàn bộ kiểu dữ liệu TypeScript của hệ thống
│   ├── App.tsx                         # Thành phần gốc & cấu hình định tuyến (Routing)
│   ├── main.tsx                        # Điểm khởi động ứng dụng React
│   └── index.css                       # Thiết lập kiểu dáng toàn cục & Tailwind
├── run.bat                             # Script khởi chạy nhanh 1-Click trên Windows
├── USER_GUIDE.md                       # Sổ tay hướng dẫn người dùng toàn diện
├── README.md                           # Giới thiệu tổng quan dự án trên GitHub
├── package.json                        # Khai báo các gói phụ thuộc và lệnh chạy
├── tsconfig.json                       # Cấu hình biên dịch TypeScript
└── vite.config.ts                      # Cấu hình máy chủ phát triển Vite & proxy Ollama
```

---

## 2. Chi Tiết Các Tệp Thành Phần Cốt Lõi

### 2.1. Tầng Trang Giao Diện (`src/pages/`)
- **`AnalyzePage.tsx`**: Trung tâm phân tích ngôn ngữ. Nhận đầu vào câu tự nhiên, gửi yêu cầu tới mô hình Ollama được chọn, bóc tách chuỗi token kèm vai trò cú pháp, cấp độ ngữ pháp và phát âm giọng đọc.
- **`MediaPage.tsx`**: Môi trường phân tích thị giác đa phương thức. Hỗ trợ OCR ảnh tĩnh (tài liệu, manga, biển báo) và trích xuất khung hình từ tệp video thời gian thực.
- **`AlphabetsPage.tsx`**: Bảng tra cứu chữ cái của 11 ngôn ngữ. Tích hợp module **Linguistic Masterclass** với 4 phân mục: Quy tắc cấu trúc âm tiết, Kỹ thuật phát âm khẩu hình, Mẹo ghi nhớ/lỗi thường gặp và Bối cảnh lịch sử.
- **`HubPage.tsx`**: Trung tâm lưu trữ cục bộ. Quản lý danh mục từ vựng và ngữ pháp đã bookmark, công cụ so sánh đối đầu **Nuance Arena**, xuất/nhập tệp sao lưu JSON và nút dọn sạch dữ liệu.

### 2.2. Tầng Thành Phần Hỗ Trợ (`src/components/`)
- **`Navbar.tsx`**: Thanh điều hướng trên cùng tuân thủ bố cục 3 cột cân xứng:
  - Khối Trái: Brand logo `A2`, nhãn phiên bản và trạng thái AI.
  - Khối Giữa: Segmented Ribbon căn giữa dẫn đến 4 trang chính.
  - Khối Phải: Bộ chọn ngôn ngữ hiển thị web (🇻🇳, 🇬🇧, 🇯🇵, 🇰🇷, 🇨🇳), Huy hiệu trạng thái mô hình + độ trễ (`qwen2.5:7b • 10ms`), Nút Cẩm nang hướng dẫn (`UserGuideModal`) và Nút Cài đặt (`SettingsModal`).
- **`UserGuideModal.tsx`**: Hộp thoại hướng dẫn người dùng trực quan 5 chương với các chỉ dẫn chi tiết về phím tắt, cách vận hành và mẹo sử dụng.
- **`ParticleCanvas.tsx`**: Hiệu ứng hạt rơi chạy trên Canvas API hiệu năng cao, hỗ trợ 8 chủ đề văn hóa (Hoa Anh Đào, Lá Tre, Lá Ngân Hạnh, Tuyết, Ánh Nắng, Oải Hương...).

### 2.3. Tầng Dịch Vụ (`src/services/`)
- **`ollamaService.ts`**: Quản lý kết nối tới `http://localhost:11434` thông qua proxy Vite `/ollama`. Điều phối các lệnh bóc tách câu (`analyzeTextBiDirectional`), OCR ảnh (`analyzeImageMultimodal`), và so sánh từ (`compareTermsWithOllama`).
- **`localDbService.ts`**: Đóng gói các hàm lưu trữ IndexedDB: `saveWordItem`, `getSavedWords`, `deleteWordItem`, `saveGrammarItem`, `saveComparisonItem`, `clearAllLocalData`, `exportAllLocalData`.
- **`i18n.ts`**: Cung cấp hàm dịch giao diện `getUITranslation(lang, key)` hỗ trợ 5 ngôn ngữ.
- **`alphabet-masterclass-data.ts`**: Chứa cẩm nang kiến thức ngữ âm học và cấu trúc của 11 ngôn ngữ.

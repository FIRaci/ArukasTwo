# 🏛️ ARUKAS — System Architecture

## 1. Kiến trúc tổng thể
ARUKAS là một Client-Side Single Page Application (SPA) phát triển trên nền tảng Vite + React 18:

```
[ Người dùng ]
      │
      ▼
[ React 18 UI / Pages ]
├── App (Trang chủ phân tích câu)
├── DictionaryPage (Từ điển JLPT N5-N1)
├── GrammarPage & GrammarDictPage (Tra cứu ngữ pháp)
├── MangaReaderPage (Đọc & phân tích Manga)
├── AnimePlayerPage (Xem & bóc tách video Anime)
└── ReferencePage (Bảng Kana, Kanji, quy tắc)
      │
      ▼
[ Services Layer ]
├── analysisEngine.ts (Điều phối phân tích AI & Local Fallback)
├── localTokenizer.ts (Tách từ & gán vai trò ngữ pháp offline)
├── localDataService.ts (Quản lý tra cứu từ vựng/ngữ pháp & cache)
├── localTranslationEngine.ts (Dịch cụm ngữ pháp SOV -> SVO)
├── mangaAnalysisEngine.ts (Xử lý OCR & bong bóng thoại truyện tranh)
├── animeAnalysisEngine.ts (Bóc tách audio/frame phụ đề hoạt hình)
└── firebase.ts & firestoreService.ts (Xác thực & đồng bộ đám mây)
```

## 2. Chiến lược xử lý ngoại tuyến (Local-First Fallback)
- Để giảm thiểu chi phí và độ trễ của Gemini API, `analysisEngine.ts` ưu tiên chạy `localPreTokenize` qua `localTokenizer.ts`.
- Nếu tỷ lệ từ điển nhận diện được từ vựng >= 85%, hệ thống trả về kết quả phân tích nội bộ ngay lập tức (0ms độ trễ) và lưu cache vào `localStorage`.
- Chỉ khi câu phức tạp hoặc có hình ảnh tải lên mới kích hoạt mô hình `gemini-2.5-flash`.

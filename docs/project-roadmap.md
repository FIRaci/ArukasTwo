# 🗺️ ARUKAS — Project Roadmap

## Pha 1: Ổn định & Khôi phục Quality Gate (Hoàn thành ✅)
- [x] Khắc phục 43 lỗi lint & type (`no-explicit-any`, fast-refresh warnings).
- [x] Tách module hóa các component nhỏ (`mangaColors.ts`, `settingsTypes.ts`, `RouteLoadingFallback.tsx`).
- [x] Dọn dẹp các tệp tạm / tệp lỗi cũ (`errors.txt`, scripts thừa).
- [x] Đưa `tsc --noEmit` và `npm run lint` về trạng thái 0 lỗi.

## Pha 2: Tái cấu trúc Kho dữ liệu (Data Pipeline Optimization) (Kế hoạch)
- [ ] Chuyển đổi 1.29 triệu dòng dữ liệu từ file `.ts` sang static JSON chunks trong `public/data/`.
- [ ] Tích hợp `idb-keyval` / IndexedDB lưu trữ từ điển trên browser, loại bỏ phình to RAM của JS bundle.
- [ ] Giảm bundle size khởi đầu từ 5MB xuống < 300KB.

## Pha 3: Modularize các Component Monolith (Kế hoạch)
- [ ] Tách `App.tsx` (1.223 dòng) thành sub-hooks và sub-sections.
- [ ] Tách `UserHub.tsx` (1.788 dòng) thành các tab riêng biệt.
- [ ] Tách `SentenceBlock.tsx` (1.046 dòng) thành các khối Token / PitchCanvas / DeepDive.

## Pha 4: Bảo mật & Học tập nâng cao (Kế hoạch)
- [ ] Cho phép người dùng tự lưu Gemini API Key cá nhân trong Settings (bảo mật, không lộ key admin).
- [ ] Thuật toán Spaced Repetition System (SRS) cho flashcard từ vựng.
- [ ] Quiz trắc nghiệm Kanji và Ngữ pháp theo cấp độ JLPT.

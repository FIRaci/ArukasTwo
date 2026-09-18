# 🏛️ ARUKAS 2.0 — System Architecture & Data Flow

> **Phiên bản**: 2.0.0  
> **Kiến trúc**: Client-Side Single Page Application (SPA) + Local Daemon AI + Local IndexedDB

---

## 1. Sơ Đồ Kiến Trúc Tổng Thể

```
+──────────────────────────────────────────────────────────────────────────+
|                       TRÌNH DUYỆT WEB NGƯỜI DÙNG                         |
|                                                                          |
|  [ Giao Diện Người Dùng (React 18 + TailwindCSS) ]                       |
|  ├── Navbar (Logo, Ribbon phân đoạn, Bộ đổi i18n, AI Pill, Guide, Gear)  |
|  ├── AnalyzePage (Studio bóc tách câu, Token Inspector, POS Badges)     |
|  ├── MediaPage (Dropzone ảnh, OCR Manga, Trích xuất frame video)        |
|  ├── AlphabetsPage (Tra cứu 11 bảng chữ cái & Cẩm nang Masterclass)      |
|  ├── HubPage (Kho từ vựng/ngữ pháp, Đấu trường Nuance Arena, Sao lưu)    |
|  ├── SettingsModal (Cấu hình model, endpoint, theme & hạt rơi)          |
|  └── UserGuideModal (Cẩm nang hướng dẫn sử dụng 5 chương trực quan)      |
|                                                                          |
|  [ Tầng Dịch Vụ & Logic Ứng Dụng (Services & Contexts) ]                 |
|  ├── SettingsContext (Quản lý endpoint, theme, ngôn ngữ nguồn/đích, i18n)|
|  ├── ollamaService.ts (Giao tiếp API với Ollama, bóc tách JSON an toàn)  |
|  ├── localDbService.ts (Quản lý lưu trữ bền vững qua IndexedDB)         |
|  ├── i18n.ts (Từ điển đa ngôn ngữ giao diện: vi, en, ja, ko, zh)        |
|  ├── alphabetData.ts (Dữ liệu 100% bảng ký tự của 11 ngôn ngữ)          |
|  └── alphabet-masterclass-data.ts (Cẩm nang lịch sử, cấu trúc & ngữ âm) |
+───────────────────────┬──────────────────────────┬───────────────────────+
                        │                          │
                        │ HTTP JSON                │ Key-Value Storage
                        ▼                          ▼
+───────────────────────────────────────+  +───────────────────────────────+
|         VITE PROXY SERVER             |  |      INDEXEDDB TRÌNH DUYỆT     |
|         (http://localhost:5173)       |  |      (Qua idb-keyval)          |
|  Proxy: /ollama/* -> :11434/*         |  |  • arukas2_saved_words        |
+───────────────────┬───────────────────+  |  • arukas2_saved_grammar      |
                    │                      |  • arukas2_saved_comparisons  |
                    ▼                      |  • arukas2_analysis_history   |
+───────────────────────────────────────+  +───────────────────────────────+
|         OLLAMA AI LOCAL DAEMON        |
|         (http://localhost:11434)      |
|  • qwen2.5:7b (Linguistic Analysis)   |
|  • qwen2.5vl:7b (Multimodal Vision)   |
|  • llama3.1 / deepseek-r1 / stheno    |
+───────────────────────────────────────+
```

---

## 2. Luồng Xử Lý Dữ Liệu (Data Flow)

### 2.1. Luồng Phân Tích Câu (Sentence Decomposition Flow)
1. **Người dùng nhập câu** tại `AnalyzePage` và chọn cặp ngôn ngữ (Nguồn -> Đích).
2. `ollamaService.ts` tạo System Prompt hướng dẫn cấu trúc JSON chặt chẽ gồm:
   - `detectedSourceLang`, `targetLang`, `naturalTranslation`
   - Mảng `tokens`: `{ text, reading, lemma, pos, meaning, role }`
   - Mảng `grammarPoints`: `{ structure, reading, meaning, formula, explanation }`
3. Gửi yêu cầu qua endpoint proxy `/ollama/api/generate`.
4. Nhận phản hồi, trích xuất chuỗi JSON an toàn (loại bỏ markdown block ` ```json `).
5. Trả về kết quả hiển thị dạng chip tương tác và lưu vào `arukas2_analysis_history` trong IndexedDB.

### 2.2. Luồng Phân Tích Ảnh & Video (Multimodal OCR Flow)
1. Người dùng chọn ảnh hoặc bấm "Chụp Khung Hình Video" trong `MediaPage`.
2. Ứng dụng chuyển đổi hình ảnh sang chuỗi `Base64` (loại bỏ phần header `data:image/...;base64,`).
3. Gửi tới mô hình thị giác (`qwen2.5vl:7b`) cùng prompt nhận diện OCR và dịch thuật 2 chiều.
4. Trả về danh sách các vùng văn bản bóc tách và bản dịch ngữ cảnh.

### 2.3. Luồng Đấu Trường Sắc Thái (Nuance Arena Flow)
1. Người dùng nhập Thuật ngữ A và Thuật ngữ B trong `HubPage` (tab Arena).
2. Hệ thống gọi `compareTermsWithOllama` yêu cầu AI đối chiếu điểm khác biệt bản chất.
3. Trả về đối tượng `SavedComparison` gồm `keyDifference`, `whenToUseA`, `whenToUseB`, `comparisonPoints` và lưu vào IndexedDB.

---

## 3. Kiến Trúc Lưu Trữ Cục Bộ (IndexedDB Schema)

Dự án sử dụng thư viện siêu nhẹ `idb-keyval` (dưới 1KB) để thao tác với IndexedDB:

| Khóa (Key) | Kiểu Dữ Liệu | Mục Đích |
|---|---|---|
| `arukas2_saved_words` | `SavedWord[]` | Lưu trữ từ vựng đã bookmark kèm phát âm, từ loại và ngữ cảnh |
| `arukas2_saved_grammar` | `SavedGrammar[]` | Lưu trữ cấu trúc ngữ pháp kèm công thức và giải thích |
| `arukas2_saved_comparisons` | `SavedComparison[]` | Lưu trữ các kết quả so sánh đối đầu từ Nuance Arena |
| `arukas2_analysis_history` | `TextAnalysisResult[]` | Lịch sử 100 câu phân tích gần nhất |
| `localStorage['arukas2_ui_lang']` | `'vi' \| 'en' \| 'ja' \| 'ko' \| 'zh'` | Ghi nhớ ngôn ngữ hiển thị giao diện web |
| `localStorage['arukas2_theme']` | `string` | Ghi nhớ chủ đề màu sắc và hiệu ứng hạt rơi |

---

## 4. Giải Quyết CORS & Proxy Vite

Do trình duyệt web chặn các yêu cầu Cross-Origin trực tiếp tới cổng `11434` của Ollama, tệp `vite.config.ts` được cấu hình proxy chuyển tiếp:

```typescript
server: {
  port: 5173,
  proxy: {
    '/ollama': {
      target: 'http://localhost:11434',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/ollama/, ''),
    },
  },
}
```
Cơ chế này cho phép ứng dụng frontend gọi `http://localhost:5173/ollama/api/...` hoàn toàn trong suốt, bảo mật và không bị lỗi CORS.

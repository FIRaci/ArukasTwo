# 📖 ARUKAS 2.0 — Sổ Tay Hướng Dẫn Sử Dụng Toàn Diện (User Master Guide)

> **Chào mừng bạn đến với ARUKAS 2.0** — Bộ công cụ ngôn ngữ học và dịch thuật phân tầng đa ngôn ngữ hoạt động 100% cục bộ (Local-First), bảo mật tối đa, không cần tài khoản, không quảng cáo và không phụ thuộc vào bất kỳ API đám mây nào.

---

## 📑 Mục Lục Hướng Dẫn

1. [Khởi Động Nhanh & run.bat (Windows 1-Click)](#1-khởi-động-nhanh--runbat-windows-1-click)
2. [Thiết Lập Máy Chủ AI Cục Bộ (Ollama)](#2-thiết-lập-máy-chủ-ai-cục-bộ-ollama)
3. [Phân Tích Cấu Trúc Câu 2 Chiều (Linguistic Studio)](#3-phân-tích-cấu-trúc-câu-2-chiều-linguistic-studio)
4. [Phòng Thí Nghiệm Ảnh & Video Đa Phương Thức (Multimodal Lab)](#4-phòng-thí-nghiệm-ảnh--video-đa-phương-thức-multimodal-lab)
5. [Cẩm Nang 11 Bảng Chữ Cái & Linguistic Masterclass](#5-cẩm-nang-11-bảng-chữ-cái--linguistic-masterclass)
6. [Kho Tri Thức & Đấu Trường Sắc Thái (Nuance Arena)](#6-kho-tri-thức--đấu-trường-sắc-thái-nuance-arena)
7. [Quản Lý Dữ Liệu: Sao Lưu, Khôi Phục & Làm Sạch](#7-quản-lý-dữ-liệu-sao-lưu-khôi-phục--làm-sạch)
8. [Tùy Biến Giao Diện, Theme Văn Hóa & Đổi Ngôn Ngữ Web (i18n)](#8-tùy-biến-giao-diện-theme-văn-hóa--đổi-ngôn-ngữ-web-i18n)
9. [Các Câu Hỏi Thường Gặp & Khắc Phục Sự Cố (FAQ)](#9-các-câu-hỏi-thường-gặp--khắc-phục-sự-cố-faq)

---

## 1. Khởi Động Nhanh & run.bat (Windows 1-Click)

Cách thuận tiện nhất để sử dụng ARUKAS 2.0 trên Windows:

1. Mở thư mục dự án `Arukas2`.
2. **Click đúp vào tệp `run.bat`**.
3. Cửa sổ lệnh sẽ hiển thị quy trình tự động:
   - `[1/4]` Kiểm tra Node.js trên máy.
   - `[2/4]` Tự động chạy `npm install` nếu bạn chưa cài thư viện.
   - `[3/4]` Kiểm tra kết nối máy chủ Ollama cổng `11434` và phát hiện mô hình đề xuất `qwen2.5:7b`.
   - `[4/4]` Khởi động máy chủ phát triển Vite và **tự động mở trình duyệt web** tại địa chỉ:  
     👉 **`http://localhost:5173/`**
4. Khi muốn tắt ứng dụng, chỉ cần nhấn tổ hợp phím **`Ctrl + C`** trong cửa sổ dòng lệnh.

---

## 2. Thiết Lập Máy Chủ AI Cục Bộ (Ollama)

ARUKAS 2.0 tận dụng sức mạnh tính toán trực tiếp trên phần cứng máy tính của bạn thông qua **Ollama**:

### 2.1. Cài đặt Ollama:
- Tải bộ cài đặt miễn phí cho Windows/macOS/Linux tại: [https://ollama.com/download](https://ollama.com/download).
- Sau khi cài đặt, Ollama sẽ tự động chạy ngầm ở cổng `11434`.

### 2.2. Các mô hình được khuyên dùng:
Mở Terminal / Command Prompt và gõ lệnh sau để tải các mô hình tối ưu nhất:

```bash
# 1. Mô hình phân tích ngôn ngữ & CJKV (Việt, Nhật, Hàn, Trung, Anh...) xuất sắc nhất:
ollama run qwen2.5:7b

# 2. Mô hình thị giác (Vision) cho bóc tách OCR ảnh và khung hình video:
ollama run qwen2.5vl:7b

# 3. Mô hình đối thoại và giải thích suy luận sâu (Tùy chọn):
ollama run llama3.1:latest
ollama run deepseek-r1:8b
```

---

## 3. Phân Tích Cấu Trúc Câu 2 Chiều (Linguistic Studio)

Truy cập trang chủ **Phân Tích Câu** (`/`):

1. **Chọn cặp ngôn ngữ**:
   - Ngôn ngữ Nguồn: Hỗ trợ tự động nhận diện hoặc chọn 1 trong 11 ngôn ngữ.
   - Ngôn ngữ Đích: Chọn ngôn ngữ bạn muốn dịch nghĩa và giải thích sang.
   - Nút **`⇄`** ở giữa: Đảo nhanh vị trí ngôn ngữ nguồn và đích chỉ với 1 click.
2. **Nhập câu văn bản**:
   - Nhập bất kỳ câu hoặc đoạn văn nào bạn muốn nghiên cứu.
   - Nhấn nút **"Bóc Tách & Phân Tích Câu"** (hoặc dùng phím tắt).
3. **Đọc hiểu kết quả phân tích**:
   - **Bản dịch tự nhiên**: Cung cấp bản dịch mượt mà, đúng văn phong bản xứ.
   - **Bóc tách từ vựng & Mã màu từ loại (POS Badges)**:
     - 🟦 *Xanh dương*: Danh từ (Noun)
     - 🟩 *Xanh lục*: Động từ (Verb)
     - 🟨 *Vàng*: Tính từ (Adjective)
     - 🟪 *Tím*: Phó từ (Adverb)
     - 🌸 *Hồng*: Trợ từ ngữ pháp (Particle)
   - **Khung soi từ (Inspector)**: Bấm vào bất kỳ từ nào trong câu để xem phiên âm chi tiết (Romaji, Pinyin, IPA), dạng nguyên thể từ điển (Lemma), vai trò cú pháp và bấm icon loa 🔊 để nghe phát âm.
   - **Công thức ngữ pháp**: Hiển thị cấu trúc ngữ pháp tương ứng (JLPT N5–N1, TOPIK, HSK, CEFR), giải thích ngữ cảnh và phân loại văn phong (Trang trọng / Thân mật).
   - **Lưu trữ**: Bấm icon Bookmark 🔖 để lưu từ hoặc cấu trúc vào Kho Tri Thức.

---

## 4. Phòng Thí Nghiệm Ảnh & Video Đa Phương Thức (Multimodal Lab)

Truy cập tab **Ảnh & Video** (`/media`):

### 4.1. OCR & Dịch Truyện Tranh / Tài Liệu Hình Ảnh:
- Kéo thả tệp ảnh (`.jpg`, `.png`, `.webp`) hoặc bấm vào dropzone để chọn tệp từ máy.
- Hệ thống AI thị giác sẽ quét các vùng chứa văn bản, khung thoại truyện tranh Manga, menu ẩm thực hoặc biển hiệu đường phố.
- Kết quả hiển thị từng khối văn bản bóc tách kèm bản dịch tương ứng.

### 4.2. Trích Xuất Khung Hình Video Thời Gian Thực:
- Tải tệp video (`.mp4`, `.webm`) vào trình phát video tích hợp.
- Phát video đến thời điểm có phụ đề hoặc hình ảnh bạn muốn nghiên cứu.
- Nhấn nút **"Chụp Khung Hình & Phân Tích"**: Hệ thống sẽ tự động chụp lại khung hình tại giây đó và phân tích ngữ nghĩa ngay lập tức.

---

## 5. Cẩm Nang 11 Bảng Chữ Cái & Linguistic Masterclass

Truy cập tab **Bảng Chữ Cái** (`/alphabets`):

1. **Tra cứu 11 ngôn ngữ**: Chuyển đổi linh hoạt giữa các tab:
   - 🇻🇳 Tiếng Việt: 29 chữ cái, 6 thanh điệu, 11 phụ âm ghép.
   - 🇯🇵 Tiếng Nhật: Đầy đủ 46 Hiragana, 46 Katakana, 25 âm đục Dakuten, 36 âm ghép Yoon.
   - 🇰🇷 Tiếng Hàn: 19 phụ âm (đơn, kép), 21 nguyên âm (đơn, ghép), 7 nhóm quy tắc Batchim.
   - 🇨🇳 Tiếng Trung: 21 thanh mẫu, 36 vận mẫu đơn/kép/mũi, 4 thanh điệu chuẩn Pinyin.
   - 🇬🇧 Tiếng Anh: 26 chữ cái Latinh, trọn vẹn 44 âm vị phiên âm quốc tế Oxford IPA.
   - 🇫🇷 🇩🇪 🇮🇹 🇪🇸 🇵🇹 🇷🇺: Bảng chữ cái kèm dấu thanh điệu, Umlaute, Eszett, Til, Cédille, 33 chữ cái Cyrillic.
2. **Cẩm Nang Ngôn Ngữ Chuyên Sâu (Linguistic Masterclass)**:
   - Bấm **"Xem cẩm nang"** để mở cẩm nang giáo trình chi tiết:
     - 📐 *Quy Tắc Cấu Trúc*: Cách ghép âm tiết, quy tắc ngữ pháp chính tả.
     - 🗣️ *Kỹ Thuật Phát Âm*: Vị trí khẩu hình môi-lưỡi, cao độ Pitch Accent và ngữ điệu.
     - 💡 *Mẹo & Lỗi Hay Mắc*: Các cạm bẫy người học ngôn ngữ (đặc biệt người Việt) hay mắc phải.
     - 🏛️ *Nguồn Gốc Lịch Sử*: Bối cảnh văn hóa và nguồn cội hình thành hệ thống chữ viết.
3. **Nghe phát âm chuẩn**: Nhấn icon loa 🔊 trên bất kỳ thẻ ký tự nào để nghe mẫu âm chuẩn xác.

---

## 6. Kho Tri Thức & Đấu Trường Sắc Thái (Nuance Arena)

Truy cập tab **Kho Tri Thức & So Sánh** (`/hub`):

### 6.1. Quản Lý Từ Vựng & Ngữ Pháp Đã Lưu:
- Xem danh sách toàn bộ từ vựng và công thức ngữ pháp bạn đã bookmark.
- Tìm kiếm nhanh bằng từ khóa hoặc lọc theo từng quốc gia.
- Nghe lại phát âm, xem lại câu ví dụ ngữ cảnh ban đầu khi bạn lưu từ.
- Xóa từng mục dễ dàng bằng icon thùng rác.

### 6.2. Đấu Trường So Sánh Sắc Thái (Nuance Arena):
- Công cụ đắc lực giải quyết các cặp từ đồng nghĩa gây bối rối nhất:
  - Tiếng Nhật: `は` (wa) vs `が` (ga), `きれい` vs `うつくしい`
  - Tiếng Tây Ban Nha: `por` vs `para`, `ser` vs `estar`
  - Tiếng Pháp: `connaître` vs `savoir`
  - Tiếng Anh: `make` vs `do`, `affect` vs `effect`
  - Tiếng Việt: `quá` vs `lắm`
- Nhập Thuật ngữ A và Thuật ngữ B -> Nhấn **"Khởi Động Đấu Trường So Sánh"**.
- AI sẽ chỉ ra:
  - *Điểm khác biệt cốt lõi* (Key Difference).
  - *Khi nào nên dùng A* và *Khi nào nên dùng B*.
  - *Bảng đối chiếu ví dụ trực quan*.

---

## 7. Quản Lý Dữ Liệu: Sao Lưu, Khôi Phục & Làm Sạch

Tại tab **Sao Lưu & Dữ Liệu** trong `/hub`:

- **Xuất Tệp JSON (Export)**: Tải toàn bộ từ vựng, ngữ pháp, các phép so sánh và lịch sử phân tích thành 1 tệp JSON duy nhất về máy tính của bạn.
- **Khôi Phục JSON (Import)**: Nhập tệp sao lưu JSON đã lưu để đồng bộ dữ liệu giữa các máy tính hoặc trình duyệt khác nhau.
- **Xóa Sạch Dữ Liệu (Reset Clean Slate)**: Xóa toàn bộ dữ liệu trong IndexedDB của trình duyệt để trả về trạng thái khởi tạo tinh khôi 100%.

---

## 8. Tùy Biến Giao Diện, Theme Văn Hóa & Đổi Ngôn Ngữ Web (i18n)

### 8.1. Chuyển Đổi Ngôn Ngữ Hiển Thị Web:
- Bấm vào menu chọn ngôn ngữ có biểu tượng lá cờ ở góc trên bên phải Header:
  - 🇻🇳 **Tiếng Việt** (Mặc định)
  - 🇬🇧 **English**
  - 🇯🇵 **日本語**
  - 🇰🇷 **한국어**
  - 🇨🇳 **中文**
- Toàn bộ nhãn hiển thị, thanh điều hướng và menu sẽ chuyển đổi ngay lập tức và tự động ghi nhớ vào `localStorage`.

### 8.2. Cá Nhân Hóa Không Gian & Hiệu Ứng Rơi:
- Bấm vào biểu tượng bánh răng ⚙️ để mở bảng Cài Đặt (Settings):
  - **Mặc định**: Phong cách Trắng Tối Giản, không có hạt rơi để tiết kiệm pin.
  - **8 Chủ đề văn hóa**: Hoa Anh Đào rơi (🌸 Sakura), Lá Tre (🌿 Bamboo), Lá Ngân Hạnh (🍂 Ginkgo), Mực Thủy Mặc (🏮 Ink), Bông Tuyết (❄️ Snow), Nắng Ấm (🌻 Sunlight), Hoa Oải Hương (🪻 Lavender).
  - Điều chỉnh mật độ rơi: Ít (Thưa thớt), Vừa phải, Nhiều (Dày đặc).

---

## 9. Các Câu Hỏi Thường Gặp & Khắc Phục Sự Cố (FAQ)

**H: Tôi mở ứng dụng nhưng thấy thông báo "Ollama Offline"?**  
*Đ:* Kiểm tra xem ứng dụng Ollama đã được bật trên máy tính của bạn chưa. Bạn có thể mở Command Prompt và gõ lệnh `ollama serve`, hoặc click đúp vào tệp `run.bat` để script tự động phát hiện và khởi động dịch vụ.

**H: Làm sao để đổi mô hình AI đang phân tích?**  
*Đ:* Bấm vào biểu tượng bánh răng ⚙️ ở góc trên bên phải, bạn sẽ thấy danh sách các mô hình đang có trên máy tính của bạn và có thể chọn mô hình mong muốn.

**H: Dữ liệu của tôi có bị gửi lên Google hay đám mây không?**  
*Đ:* Tuyệt đối KHÔNG. ARUKAS 2.0 hoạt động theo triết lý **Local-First 100%**. Toàn bộ quá trình suy luận AI diễn ra trên GPU/CPU máy tính bạn qua Ollama, và dữ liệu được lưu cục bộ trong IndexedDB của trình duyệt.

**H: Tôi dùng máy tính không có card đồ họa rời (GPU) thì có chạy được không?**  
*Đ:* Hoàn toàn được. Các mô hình như `qwen2.5:7b` được tối ưu hóa rất tốt trên CPU hiện đại (Intel Core i5/i7/i9 hoặc AMD Ryzen thế hệ mới, Apple Silicon M1/M2/M3) với tốc độ phản hồi từ 10ms đến 2 giây cho một câu văn.

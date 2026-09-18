# 📐 ARUKAS 2.0 — Code Standards & Engineering Guidelines

> **Mục tiêu**: Đảm bảo mã nguồn nhất quán, an toàn kiểu dữ liệu, module hóa sạch sẽ và dễ bảo trì cho các kỹ sư và AI agents.

---

## 1. Quy Chuẩn Module Hóa (Modularization Policy)

- **Ngưỡng 200 dòng (Soft Cap)**:
  - Nếu một tệp mã nguồn vượt quá **200 dòng code**, cần cân nhắc phân rã và module hóa.
  - Phân tích ranh giới logic: Tách riêng phần dữ liệu tĩnh (`data/`), kiểu dữ liệu (`types/`), hàm tiện ích (`utils/`) và các component con tái sử dụng (`components/`).
  - *Ví dụ*: Tách cẩm nang chuyên sâu `src/services/alphabet-masterclass-data.ts` ra khỏi `src/services/alphabetData.ts`.
- **Quy tắc đặt tên tệp**:
  - Tên tệp component: Sử dụng **PascalCase** (ví dụ: `UserGuideModal.tsx`, `SettingsModal.tsx`).
  - Tên tệp service, helper, module con: Sử dụng **kebab-case** có tính tự mô tả cao (ví dụ: `alphabet-masterclass-data.ts`, `local-db-service.ts`).
  - Không viết tắt tối nghĩa.

---

## 2. Quy Chuẩn TypeScript & An Toàn Kiểu Dữ Liệu

- **Nghiêm cấm lạm dụng `any`**:
  - Mọi hàm, tham số và giá trị trả về phải có kiểu dữ liệu tường minh hoặc được suy luận chặt chẽ.
  - Sử dụng Union Types cho các mã ngôn ngữ: `LanguageCode = 'vi' | 'ja' | 'ko' | 'zh' | 'en' | ...`.
- **Interface & Types rõ ràng**:
  - Toàn bộ kiểu dữ liệu nghiệp vụ cốt lõi phải được tập trung tại `src/types.ts`.
  - Khuyến khích sử dụng `readonly` cho các cấu hình hằng số.

```typescript
// Chuẩn mực
export interface AnalysisToken {
  text: string;
  reading?: string;
  lemma?: string;
  pos: string;
  meaning?: string;
  role?: string;
}
```

---

## 3. Quy Chuẩn Giao Tiếp AI Cục Bộ (Ollama Integration)

- **Strict JSON Enforcement**:
  - Trong Prompt, luôn yêu cầu mô hình phản hồi duy nhất một khối JSON hợp lệ:
    `"Respond ONLY with a valid JSON object. Do not include introductory text or markdown ticks."`
- **Phòng thủ khi phân tích JSON (Defensive Parsing)**:
  - Luôn sử dụng hàm bóc tách an toàn để loại bỏ các ký tự bọc markdown trước khi `JSON.parse`:
    ```typescript
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '');
    if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '');
    if (cleaned.endsWith('```')) cleaned = cleaned.replace(/\s*```$/, '');
    ```
  - Bắt lỗi `try...catch` và có cơ chế fallback nhân bản rõ ràng khi mô hình gặp sự cố timeout.

---

## 4. Quy Chuẩn Giao Diện & TailwindCSS (UI/UX)

- **Bố cục 3 Cột Cân Xứng (Balanced Three-Column Grid)**:
  - Header Navbar luôn duy trì tỷ lệ vàng: Khối nhận diện thương hiệu bên trái, Khối điều hướng phân đoạn căn giữa tuyệt đối, Khối tiện ích công cụ bên phải.
- **Mã Màu Từ Loại Thống Nhất (POS Color System)**:
  - `NOUN` (Danh từ): `bg-blue-50 text-blue-700 border-blue-200`
  - `VERB` (Động từ): `bg-emerald-50 text-emerald-700 border-emerald-200`
  - `ADJECTIVE` (Tính từ): `bg-amber-50 text-amber-700 border-amber-200`
  - `ADVERB` (Phó từ): `bg-purple-50 text-purple-700 border-purple-200`
  - `PARTICLE` (Trợ từ): `bg-rose-50 text-rose-700 border-rose-200`
- **Trạng thái Trống Thanh Lịch (Clean Empty States)**:
  - Không để dữ liệu mẫu (dummy data/seed data) tự động tràn vào giao diện khi người dùng chưa thao tác.
  - Khi chưa có dữ liệu, hiển thị card nét đứt với thông điệp hướng dẫn nhẹ nhàng, truyền cảm hứng.

---

## 5. Quy Chuẩn Git & Commit

- Sử dụng quy chuẩn **Conventional Commits**:
  - `feat:` Thêm tính năng mới (vd: `feat: add run.bat launcher`).
  - `fix:` Sửa lỗi hệ thống hoặc giao diện.
  - `refactor:` Tái cấu trúc mã nguồn mà không thay đổi hành vi nghiệp vụ.
  - `docs:` Cập nhật tài liệu kỹ thuật.
  - `test:` Bổ sung hoặc chạy bộ kiểm thử.
- **Lưu ý đặc biệt**: Không sử dụng `chore` và `docs` trong commit messages của thư mục cấu hình `.claude` hay hệ thống agent.

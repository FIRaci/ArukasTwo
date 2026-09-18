# 🎨 ARUKAS 2.0 — Design Guidelines & Visual System

> **Triết lý thiết kế**: Tinh hoa thẩm mỹ tối giản (Japanese-inspired minimalism), trải nghiệm người dùng hiện đại, loại bỏ các chi tiết thừa thãi và tối ưu sự tập trung tối đa cho người học ngôn ngữ.

---

## 1. Nguyên Tắc Thiết Kế Cốt Lõi (Core Principles)

1. **Trắng Tinh Khôi Mặc Định (Minimal Pristine White)**:
   - Mặc định khởi chạy với nền trắng tinh khôi, tương phản cao, phông chữ thanh mảnh dễ đọc.
   - Không lạm dụng hiệu ứng rơi khi không cần thiết nhằm tiết kiệm tài nguyên GPU và tránh gây mất tập trung.
2. **Bố Cục 3 Cột Cân Xứng Hoàn Hảo (Balanced 3-Column Grid)**:
   - Thanh Header Navbar được chia làm 3 khối độc lập có trọng lượng thị giác cân đối:
     - **Cột Trái (Brand Identity)**: Logo `A2` bo tròn hiện đại, huy hiệu phiên bản `2.0`, và chấm AI trạng thái nhấp nháy êm dịu.
     - **Cột Giữa (Segmented Ribbon)**: Cụm nút điều hướng dạng viên thuốc (pill) căn giữa tuyệt đối, hiệu ứng hover nhẹ nhàng.
     - **Cột Phải (Control Hub)**: Bộ chọn ngôn ngữ hiển thị có cờ quốc gia, huy hiệu Model AI hiển thị thời gian phản hồi, Nút Cẩm nang hướng dẫn và Nút Cài đặt.
3. **Trạng Thái Trống Sạch Sẽ (Clean Slate)**:
   - Giao diện không chứa các câu mẫu hoặc ảnh mẫu mặc định làm rối mắt.
   - Các bảng nhập liệu luôn bắt đầu từ trạng thái rỗng và sẵn sàng đón nhận dữ liệu từ người dùng.

---

## 2. Hệ Thống Màu Sắc Phân Loại Từ Loại (POS Tokens)

Để người học dễ dàng nhận biết ngữ pháp chỉ bằng trực giác, hệ thống áp dụng bảng màu tiêu chuẩn quốc tế:

| Từ Loại | Tên Tiếng Anh | Mã Lớp Tailwind | Màu Sắc Thị Giác |
|---|---|---|---|
| **Danh từ** | Noun | `bg-blue-50 text-blue-700 border-blue-200` | Xanh dương dịu |
| **Động từ** | Verb | `bg-emerald-50 text-emerald-700 border-emerald-200` | Xanh ngọc lục bảo |
| **Tính từ** | Adjective | `bg-amber-50 text-amber-700 border-amber-200` | Vàng hổ phách |
| **Phó từ** | Adverb | `bg-purple-50 text-purple-700 border-purple-200` | Tím thạch anh |
| **Đại từ** | Pronoun | `bg-pink-50 text-pink-700 border-pink-200` | Hồng phấn |
| **Trợ từ** | Particle | `bg-rose-50 text-rose-700 border-rose-200` | Đỏ hoa hồng |
| **Giới từ** | Preposition | `bg-indigo-50 text-indigo-700 border-indigo-200` | Xanh chàm |
| **Liên từ** | Conjunction | `bg-cyan-50 text-cyan-700 border-cyan-200` | Xanh lơ |

---

## 3. Hệ Thống Chủ Đề Văn Hóa & Hạt Rơi (Cultural Themes)

Người dùng có thể cá nhân hóa không gian học tập trong hộp thoại Cài Đặt (`SettingsModal`):

| Chủ Đề | Biểu Tượng | Hiệu Ứng Hạt Rơi (Canvas) | Bảng Màu Nền & Thẻ |
|---|---|---|---|
| **Tối giản (Mặc định)** | ⚪ | Không có hạt rơi (`none`) | Nền trắng tinh khiết, viền đá xám nhẹ |
| **Nhật Bản (Sakura)** | 🌸 | Cánh hoa anh đào lượn sóng | Hồng phớt hoa đào, thanh lịch |
| **Việt Nam (Bamboo)** | 🌿 | Lá tre và búp sen rơi | Xanh ngọc tre ngà thanh bình |
| **Hàn Quốc (Ginkgo)** | 🍂 | Lá ngân hạnh vàng & phong đỏ | Vàng ấm áp mùa thu Seoul |
| **Trung Quốc (Ink)** | 🏮 | Vệt mực thủy mặc và bụi vàng | Cổ điển, huyền bí trầm mặc |
| **Nga & Đức (Snow)** | ❄️ | Bông tuyết mùa đông rơi đa tầng | Trắng băng giá tinh khôi |
| **Tây Ban Nha & Ý (Sunlight)** | 🌻 | Đốm nắng ấm & cánh cúc dại | Vàng cam Địa Trung Hải tươi sáng |
| **Pháp & Anh (Lavender)** | 🪻 | Cánh hoa oải hương bồng bềnh | Tím pastel quý phái |

---

## 4. Quy Chuẩn Kiểu Chữ (Typography & Micro-interactions)

- Phông chữ hệ thống không chân hiện đại (Inter, SF Pro, Segoe UI, Roboto) giúp hiển thị chuẩn xác cả ký tự Latinh, tượng hình CJK (Hán tự, Hangeul, Kana) và chữ Kirin.
- Các nút tương tác tích hợp hiệu ứng nhấn thực tế: `active:scale-95` hoặc `hover:scale-102`.
- Modal và thẻ nội dung bo góc tròn lớn (`rounded-3xl` hoặc `rounded-2xl`) tạo cảm giác mềm mại, thân thiện.

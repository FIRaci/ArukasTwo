// ============================================================
//  USER GUIDE MODAL — ARUKAS 2.0
//  Comprehensive Interactive Guide & Documentation Modal
// ============================================================

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Zap,
  Sparkles,
  Camera,
  Layers,
  Globe,
  Terminal,
  CheckCircle2,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideChapter = 'quickstart' | 'analyzer' | 'media' | 'arena' | 'alphabets';

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const { currentThemeConfig, textModel, visionModel } = useSettings();
  const [activeChapter, setActiveChapter] = useState<GuideChapter>('quickstart');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl bg-white overflow-hidden ${currentThemeConfig.cardStyle}`}
      >
        {/* ── MODAL HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-stone-900 tracking-tight">
                  Cẩm Nang Hướng Dẫn Sử Dụng
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                  ARUKAS 2.0
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Toàn bộ hướng dẫn sử dụng, mẹo thao tác nhanh và cấu hình AI cục bộ 100% riêng tư.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── CHAPTER TABS NAVIGATION ── */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-stone-100/70 border-b border-stone-200/80 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setActiveChapter('quickstart')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeChapter === 'quickstart'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/80 border border-stone-200 text-stone-600 hover:bg-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1. Khởi Động Nhanh & run.bat</span>
          </button>

          <button
            onClick={() => setActiveChapter('analyzer')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeChapter === 'analyzer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/80 border border-stone-200 text-stone-600 hover:bg-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. Phân Tích Cấu Trúc Câu</span>
          </button>

          <button
            onClick={() => setActiveChapter('media')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeChapter === 'media'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/80 border border-stone-200 text-stone-600 hover:bg-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>3. Phòng Thí Nghiệm Ảnh & Video</span>
          </button>

          <button
            onClick={() => setActiveChapter('arena')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeChapter === 'arena'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/80 border border-stone-200 text-stone-600 hover:bg-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4. Kho Tri Thức & Nuance Arena</span>
          </button>

          <button
            onClick={() => setActiveChapter('alphabets')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeChapter === 'alphabets'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/80 border border-stone-200 text-stone-600 hover:bg-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>5. 11 Bảng Ký Tự & Đổi Giao Diện</span>
          </button>
        </div>

        {/* ── CHAPTER CONTENT BODY ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-stone-700 leading-relaxed scrollbar-thin">
          {/* ──── CHAPTER 1: QUICKSTART ──── */}
          {activeChapter === 'quickstart' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  Khởi Động Siêu Tốc 1-Click với run.bat
                </h3>
                <p className="text-xs text-stone-500">
                  Arukas 2.0 được tối ưu hóa cho môi trường Windows, khởi động chỉ với một cú click chuột.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-xs uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cách dùng run.bat</span>
                  </div>
                  <ol className="text-xs space-y-1.5 list-decimal list-inside text-stone-600">
                    <li>Mở thư mục dự án <strong>Arukas2</strong>.</li>
                    <li>Click đúp vào tệp <strong>run.bat</strong>.</li>
                    <li>Script tự kiểm tra Node.js, tự cài thư viện nếu thiếu.</li>
                    <li>Tự kiểm tra kết nối Ollama và model <code>qwen2.5:7b</code>.</li>
                    <li>Tự động mở trình duyệt tại <code>http://localhost:5173/</code>.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-xs uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    <span>Cấu hình Ollama Cục Bộ</span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Máy chủ AI chạy nội bộ tại <code>http://localhost:11434</code>. Dữ liệu của bạn không bao giờ gửi ra Internet.
                  </p>
                  <div className="p-2 rounded-xl bg-stone-900 text-stone-100 font-mono text-[11px] space-y-1">
                    <div># Tải mô hình đa ngữ tốt nhất:</div>
                    <div className="text-emerald-400">ollama run qwen2.5:7b</div>
                    <div># Tải mô hình OCR ảnh & video:</div>
                    <div className="text-emerald-400">ollama run qwen2.5vl:7b</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs space-y-1">
                <div className="font-bold">💡 Mẹo xử lý khi Ollama chưa kết nối:</div>
                <p>
                  Mở menu Cài Đặt (icon bánh răng góc trên bên phải) để kiểm tra trạng thái kết nối cổng 11434 hoặc chuyển sang mô hình khác đã tải trên máy bạn.
                </p>
              </div>
            </div>
          )}

          {/* ──── CHAPTER 2: ANALYZER ──── */}
          {activeChapter === 'analyzer' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Phân Tích Cấu Trúc Ngôn Ngữ 2 Chiều (Linguistic Studio)
                </h3>
                <p className="text-xs text-stone-500">
                  Bóc tách câu văn tự nhiên thành các thành phần ngữ pháp, từ loại, nguyên thể từ điển và sắc thái văn phong.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900">Các tính năng chính trong bảng điều khiển:</div>
                  <ul className="space-y-2 list-disc list-inside text-stone-600">
                    <li>
                      <strong>Chọn ngôn ngữ linh hoạt:</strong> Hỗ trợ dịch và bóc tách 2 chiều qua lại giữa 11 ngôn ngữ (Việt, Nhật, Hàn, Trung, Nga, Anh, Pháp, Tây Ban Nha, Ý, Đức, Bồ Đào Nha).
                    </li>
                    <li>
                      <strong>Mã màu từ loại (POS Tags):</strong> Danh từ (xanh dương), Động từ (xanh lục), Tính từ (vàng hổ phách), Phó từ (tím), Trợ từ (hồng), Liên từ (xanh lam).
                    </li>
                    <li>
                      <strong>Khung soi từ chuyên sâu (Inspector):</strong> Bấm vào bất kỳ từ nào để xem phiên âm Romaji/Pinyin/IPA, nguyên thể từ điển (Lemma), vai trò ngữ pháp và nghe phát âm bản xứ.
                    </li>
                    <li>
                      <strong>Bóc tách công thức ngữ pháp:</strong> Tự động nhận diện cấu trúc JLPT (N5-N1), TOPIK, HSK kèm giải thích ngữ cảnh phù hợp.
                    </li>
                    <li>
                      <strong>Lưu trữ tức thì:</strong> Nhấn biểu tượng Bookmark trên từ hoặc cấu trúc để lưu vào Kho Tri Thức ngoại tuyến.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ──── CHAPTER 3: MEDIA ──── */}
          {activeChapter === 'media' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Phòng Thí Nghiệm Ảnh & Video Đa Phương Thức (Multimodal Lab)
                </h3>
                <p className="text-xs text-stone-500">
                  Nhận diện văn bản, truyện tranh Manga, tài liệu, biển hiệu và phụ đề video với mô hình thị giác {visionModel}.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5 text-blue-700">
                    <Camera className="w-4 h-4" />
                    <span>OCR Tài Liệu & Manga</span>
                  </div>
                  <p className="text-stone-600">
                    Kéo thả bất kỳ tệp hình ảnh (.jpg, .png, .webp) vào dropzone. Hệ thống AI thị giác sẽ phát hiện các khối văn bản, dịch sang ngôn ngữ đích và bóc tách từ vựng.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5 text-purple-700">
                    <VideoIcon className="w-4 h-4" />
                    <span>Trích Xuất Khung Hình Video</span>
                  </div>
                  <p className="text-stone-600">
                    Tải tệp video (.mp4, .webm). Khi đến đoạn có biển cảnh hoặc phụ đề cần dịch, nhấn nút <strong>"Chụp Khung Hình & Phân Tích"</strong> để bóc tách ngay lập tức.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ──── CHAPTER 4: ARENA ──── */}
          {activeChapter === 'arena' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Kho Tri Thức & Đấu Trường So Sánh Sắc Thái (Nuance Arena)
                </h3>
                <p className="text-xs text-stone-500">
                  Lưu trữ từ vựng, ngữ pháp ngoại tuyến và công cụ đối chiếu sự khác biệt tinh tế giữa hai thuật ngữ dễ nhầm lẫn.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900">Cách sử dụng Đấu Trường Sắc Thái:</div>
                  <ol className="space-y-1.5 list-decimal list-inside text-stone-600">
                    <li>Nhập thuật ngữ A (ví dụ: trợ từ <code>は</code> trong tiếng Nhật, hoặc <code>make</code> trong tiếng Anh).</li>
                    <li>Nhập thuật ngữ B (ví dụ: trợ từ <code>が</code> trong tiếng Nhật, hoặc <code>do</code> trong tiếng Anh).</li>
                    <li>Nhấn nút <strong>"Khởi Động Đấu Trường So Sánh"</strong>.</li>
                    <li>Mô hình {textModel} sẽ phân tích chi tiết: Điểm khác biệt cốt lõi, quy tắc khi nào dùng A / khi nào dùng B, và bảng so sánh ví dụ thực tế.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-1">
                  <div className="font-bold">🔒 Bảo mật & Quản trị dữ liệu:</div>
                  <p>
                    Dữ liệu được lưu trong trình duyệt qua IndexedDB. Bạn có thể xuất tệp sao lưu chuẩn JSON hoặc sử dụng nút <strong>"Xóa Sạch Dữ Liệu (Reset Clean Slate)"</strong> trong tab Sao Lưu bất cứ lúc nào.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ──── CHAPTER 5: ALPHABETS ──── */}
          {activeChapter === 'alphabets' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Hệ Thống 11 Bảng Chữ Cái & Tùy Biến Giao Diện
                </h3>
                <p className="text-xs text-stone-500">
                  Cẩm nang tra cứu chữ viết chuẩn xác và các tùy biến giao diện đa quốc gia.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900">11 Hệ Thống Ký Tự Toàn Cầu:</div>
                  <p className="text-stone-600">
                    Tra cứu đầy đủ 100% các ký tự, phiên âm IPA, âm đục, âm ghép, bảng vần Pinyin, Hangeul và bảng mã Cyrillic kèm phát âm mẫu từng chữ.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900">Đổi Ngôn Ngữ Giao Diện Web (i18n):</div>
                  <p className="text-stone-600">
                    Chọn quốc kỳ ở góc trên thanh Header để chuyển toàn bộ giao diện sang: 🇻🇳 Tiếng Việt, 🇬🇧 English, 🇯🇵 日本語, 🇰🇷 한국어, 🇨🇳 中文.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── MODAL FOOTER ── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-100 bg-stone-50/90 text-xs">
          <div className="text-stone-500 font-medium">
            Phím tắt: Bấm <kbd className="px-1.5 py-0.5 rounded bg-stone-200 text-stone-800 font-mono">Esc</kbd> để đóng
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-sm transition active:scale-95"
          >
            Đã Hiểu & Bắt Đầu
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper VideoIcon component
const VideoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

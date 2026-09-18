import React, { useState } from 'react';
import { X, Copy, Check, Download, Share2 } from 'lucide-react';
import { TextAnalysisResult } from '../../types';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TextAnalysisResult;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [format, setFormat] = useState<'markdown' | 'anki' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    const lines = [
      `# ARUKAS 2.0 — Báo Cáo Phân Tích Cú Pháp Ngôn Ngữ`,
      `*Thời gian: ${new Date(result.analyzedAt).toLocaleString()}*`,
      `*Ngôn ngữ: ${result.resolvedSourceLang.toUpperCase()} → ${result.targetLang.toUpperCase()}*`,
      ``,
      `## 1. Văn Bản Gốc`,
      `> ${result.sourceText}`,
      ``,
      `## 2. Bản Dịch Tự Nhiên`,
      `**Dịch:** ${result.summary.translation}`,
      result.summary.literalTranslation ? `**Sát nghĩa:** ${result.summary.literalTranslation}` : '',
      `**Sắc thái:** ${result.summary.tone}`,
      result.summary.culturalContext ? `**Bối cảnh:** ${result.summary.culturalContext}` : '',
      ``,
    ];

    if (result.keyTerms && result.keyTerms.length > 0) {
      lines.push(`## 3. Từ Vựng Trọng Tâm`);
      lines.push(`| Từ vựng | Phiên âm | Hán-Việt | Nghĩa ngữ cảnh | Phân loại |`);
      lines.push(`| :--- | :--- | :--- | :--- | :--- |`);
      for (const t of result.keyTerms) {
        lines.push(`| **${t.text}** | \`${t.reading || ''}\` | ${t.hanViet || '-'} | ${t.meaning} | ${t.level || t.pos || '-'} |`);
      }
      lines.push(``);
    }

    if (result.grammarPoints.length > 0) {
      lines.push(`## 4. Cấu Trúc Ngữ Pháp`);
      for (const g of result.grammarPoints) {
        lines.push(`### ${g.structure} ${g.level ? `(${g.level})` : ''}`);
        if (g.formula) lines.push(`- **Công thức:** \`${g.formula}\``);
        lines.push(`- **Ý nghĩa:** ${g.meaning}`);
        lines.push(`- **Giải thích:** ${g.explanation}`);
        if (g.examples && g.examples.length > 0) {
          for (const ex of g.examples) {
            lines.push(`  - *Ví dụ:* ${ex.original} — ${ex.translation}`);
          }
        }
        lines.push(``);
      }
    }

    return lines.filter(Boolean).join('\n');
  };

  const generateAnki = () => {
    const rows = [];
    // Key terms
    if (result.keyTerms) {
      for (const t of result.keyTerms) {
        rows.push(`${t.text}\t${t.reading || ''}<br><b>${t.meaning}</b><br><small>${t.hanViet ? `Hán-Việt: ${t.hanViet}` : ''}</small>`);
      }
    }
    // Grammar
    for (const g of result.grammarPoints) {
      rows.push(`${g.structure}\t${g.meaning}<br><code>${g.formula || ''}</code><br>${g.explanation}`);
    }
    return rows.join('\n');
  };

  const getExportContent = () => {
    if (format === 'markdown') return generateMarkdown();
    if (format === 'anki') return generateAnki();
    return JSON.stringify(result, null, 2);
  };

  const content = getExportContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === 'markdown' ? 'md' : format === 'anki' ? 'txt' : 'json';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arukas2_analysis_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-black text-stone-900">Xuất Báo Cáo Phân Tích</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Select Bar */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-2 border-b border-stone-100 bg-stone-50/50">
          {(['markdown', 'anki', 'json'] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setFormat(fmt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize ${
                format === fmt
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {fmt === 'markdown' ? 'Markdown Báo Cáo' : fmt === 'anki' ? 'Thẻ Anki (TSV)' : 'Dữ Liệu JSON'}
            </button>
          ))}
        </div>

        {/* Preview Area */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-xs text-stone-800 bg-stone-900/5 whitespace-pre-wrap">
          {content}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50/50">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép nội dung'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Tải tệp xuống</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExportReportModal;

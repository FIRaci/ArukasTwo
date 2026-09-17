import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  UploadCloud,
  Sparkles,
  AlertCircle,
  Volume2,
  BookmarkPlus,
  Check,
  Eye,
  Camera,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  getLanguageInfo,
  MediaAnalysisResult,
  DetectedSegment,
} from '../types';
import { analyzeImageMultimodal } from '../services/ollamaService';
import { saveWordItem } from '../services/localDbService';

export const MediaPage: React.FC = () => {
  const {
    sourceLang,
    setSourceLang,
    targetLang,
    setTargetLang,
    visionModel,
    ollamaEndpoint,
    isOllamaConnected,
    openSettings,
    currentThemeConfig,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MediaAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedSegments, setSavedSegments] = useState<Set<string>>(new Set());

  // Video playback helper
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUri = loadEvt.target?.result as string;
      setSelectedImage(dataUri);
      setAnalysisResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setSelectedVideoUrl(url);
    setAnalysisResult(null);
    setError(null);
  };

  const captureVideoFrame = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleAnalyzeImage = async (customImageUri?: string) => {
    const imgUri = customImageUri || selectedImage;
    if (!imgUri) {
      setError('Vui lòng chọn hoặc tải lên một hình ảnh trước.');
      return;
    }

    if (!isOllamaConnected) {
      setError('Ollama chưa được kết nối. Vui lòng bật Ollama trên máy.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeImageMultimodal({
        base64Image: imgUri,
        sourceLang,
        targetLang,
        model: visionModel,
        endpoint: ollamaEndpoint,
      });

      setAnalysisResult(result);
    } catch (err: unknown) {
      console.error('Vision analysis error:', err);
      const msg = err instanceof Error ? err.message : 'Có lỗi khi phân tích hình ảnh.';
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeCurrentVideoFrame = () => {
    const frameData = captureVideoFrame();
    if (!frameData) {
      setError('Không thể chụp khung hình từ video. Hãy đảm bảo video đã phát hoặc đang tạm dừng.');
      return;
    }
    handleAnalyzeImage(frameData);
  };

  const handleSpeak = (text: string, lang: LanguageCode) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const info = getLanguageInfo(lang);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = info.speechVoiceLang;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const handleSaveSegment = async (seg: DetectedSegment) => {
    if (!analysisResult) return;
    try {
      await saveWordItem({
        id: `media_word_${Date.now()}_${seg.id}`,
        text: seg.originalText,
        reading: seg.reading || '',
        meaning: seg.translation,
        pos: seg.type,
        lang: analysisResult.sourceLang,
        targetLang: analysisResult.targetLang,
        contextSentence: seg.originalText,
        tags: ['media-ocr', seg.type],
        savedAt: Date.now(),
        notes: seg.notes,
      });
      setSavedSegments((prev) => new Set(prev).add(seg.id));
    } catch (e) {
      console.error('Save segment error:', e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* ── HEADER ── */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-stone-100 text-stone-700 border border-stone-200">
          <Eye className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          <span>ARUKAS 2 • MULTIMODAL VISION LAB</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          Phân Tích Ảnh & Video Cục Bộ
        </h1>
        <p className="text-stone-500 text-sm sm:text-base max-w-2xl mx-auto">
          Nhận diện thoại manga, ảnh chụp tài liệu, biển hiệu và phân tích khung hình video với mô hình Vision cục bộ (
          <code className="text-stone-700 font-mono text-xs font-semibold">{visionModel}</code>).
        </p>
      </div>

      {/* ── CONNECTION NOTICE ── */}
      {!isOllamaConnected && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-semibold">Ollama chưa kết nối:</span> Hãy bật Ollama để sử dụng mô hình thị giác{' '}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">{visionModel}</code>.
            </div>
          </div>
          <button
            onClick={openSettings}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition shadow-sm"
          >
            Cài Đặt
          </button>
        </div>
      )}

      {/* ── TAB & LANGUAGE CONTROLS ── */}
      <div className={`p-4 rounded-2xl border transition-all ${currentThemeConfig.cardStyle} flex flex-wrap items-center justify-between gap-4`}>
        {/* Switcher Tab */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'image'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <span>Hình Ảnh / Manga / Biển Hiệu</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'video'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <VideoIcon className="w-4 h-4 text-purple-600" />
            <span>Trích Xuất Từ Video</span>
          </button>
        </div>

        {/* Language Options */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-stone-400">Nguồn:</span>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value as LanguageCode | 'auto')}
              className="bg-stone-50 border border-stone-200 text-stone-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="auto">🌐 Nhận diện tự động</option>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-stone-400">Đích:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
              className="bg-stone-50 border border-stone-200 text-stone-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── TAB 1: IMAGE & MANGA OCR ── */}
      {activeTab === 'image' && (
        <div className="space-y-6">
          {/* Upload and Preview Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Preview / Upload Area */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/50 overflow-hidden flex flex-col items-center justify-center p-4 min-h-[320px]">
                {selectedImage ? (
                  <div className="relative w-full flex flex-col items-center">
                    <img
                      src={selectedImage}
                      alt="Tài liệu tải lên"
                      className="max-h-[380px] w-auto object-contain rounded-lg shadow-sm"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Đổi ảnh khác</span>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="text-center space-y-3 cursor-pointer p-6"
                  >
                    <UploadCloud className="w-12 h-12 text-stone-400 mx-auto" />
                    <div>
                      <span className="text-sm font-semibold text-stone-800">
                        Nhấn để tải ảnh hoặc kéo thả vào đây
                      </span>
                      <p className="text-xs text-stone-400 mt-1">Hỗ trợ PNG, JPG, WebP, SVG tài liệu/manga</p>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-mono">
                  Vision Model: <strong className="text-stone-700">{visionModel}</strong>
                </span>
                <button
                  onClick={() => handleAnalyzeImage()}
                  disabled={isAnalyzing || !selectedImage}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang quét mắt AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Bóc Tách & Dịch Ảnh</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Result Column */}
            <div className="lg:col-span-5 space-y-4">
              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {error}
                </div>
              )}

              {analysisResult ? (
                <div className="space-y-4 animate-fadeIn">
                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tổng quan bối cảnh</span>
                    </div>
                    <div className="text-xs text-stone-700 leading-relaxed">
                      {analysisResult.summary}
                    </div>
                  </div>

                  {/* Segments List */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Đoạn thoại & Văn bản nhận diện ({analysisResult.segments.length})
                    </div>

                    <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                      {analysisResult.segments.map((seg) => {
                        const isSaved = savedSegments.has(seg.id);

                        return (
                          <div
                            key={seg.id}
                            className="p-3.5 rounded-xl bg-white border border-stone-200 hover:border-blue-300 transition shadow-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider bg-stone-100 px-2 py-0.5 rounded">
                                {seg.speaker || 'Thoại'}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleSpeak(seg.originalText, analysisResult.sourceLang)}
                                  title="Nghe phát âm thoại gốc"
                                  className="p-1 rounded text-stone-400 hover:text-blue-600 transition"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleSaveSegment(seg)}
                                  disabled={isSaved}
                                  title="Lưu câu này vào kho lưu trữ"
                                  className={`p-1 rounded transition ${
                                    isSaved ? 'text-emerald-600' : 'text-stone-400 hover:text-stone-700'
                                  }`}
                                >
                                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            <div className="text-sm font-semibold text-stone-900">{seg.originalText}</div>

                            {seg.reading && (
                              <div className="text-xs font-mono text-blue-600">{seg.reading}</div>
                            )}

                            <div className="text-xs text-stone-600 pt-1 border-t border-stone-100">
                              <strong className="text-stone-800">Dịch:</strong> {seg.translation}
                            </div>

                            {seg.notes && (
                              <div className="text-[11px] text-stone-500 italic bg-stone-50 p-2 rounded-lg">
                                {seg.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-stone-200 bg-stone-50/40 text-center space-y-2">
                  <Eye className="w-8 h-8 text-stone-300 mx-auto" />
                  <div className="text-xs font-semibold text-stone-500">Chưa có kết quả phân tích</div>
                  <p className="text-[11px] text-stone-400">
                    Bấm "Bóc Tách & Dịch Ảnh" để nhận diện khung thoại và dịch sang {getLanguageInfo(targetLang).name}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: VIDEO FRAME EXTRACTION ── */}
      {activeTab === 'video' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Phân Tích Khung Hình Video (Frame-by-Frame OCR)</h3>
                <p className="text-xs text-stone-500">
                  Tải video lên từ máy, tạm dừng ở phân đoạn có phụ đề/thoại và chụp ảnh khung hình để bóc tách.
                </p>
              </div>

              <button
                onClick={() => videoInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Chọn tệp Video</span>
              </button>
              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoFileChange}
                accept="video/*"
                className="hidden"
              />
            </div>

            {selectedVideoUrl ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black max-w-2xl mx-auto shadow-md">
                  <video
                    ref={videoRef}
                    src={selectedVideoUrl}
                    controls
                    className="w-full h-auto max-h-[380px]"
                  />
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleAnalyzeCurrentVideoFrame}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang phân tích khung hình...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>Chụp Khung Hình Hiện Tại & Phân Tích</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => videoInputRef.current?.click()}
                className="p-12 text-center border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-blue-400 transition"
              >
                <VideoIcon className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                <div className="text-sm font-semibold text-stone-700">Chưa chọn video nào</div>
                <div className="text-xs text-stone-400 mt-1">Nhấn vào đây để tải video MP4, WebM, MKV</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default MediaPage;

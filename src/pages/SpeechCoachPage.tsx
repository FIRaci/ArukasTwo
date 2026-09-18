import React, { useState } from 'react';
import { Sparkles, Volume2, AlertCircle, Headphones } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { RoleplayScenario, SpeechEvaluationResult } from '../types';
import { ROLEPLAY_SCENARIOS } from '../services/speech-coach-data';
import { evaluateSpokenResponse } from '../services/speechCoachService';
import { RoleplayScenarioSelector } from '../components/speech/RoleplayScenarioSelector';
import { VoiceRecorderCard } from '../components/speech/VoiceRecorderCard';
import { InSpeechWordAssistModal } from '../components/speech/InSpeechWordAssistModal';
import { AccentGuideCard } from '../components/speech/AccentGuideCard';
import { SpeechEvaluationCard } from '../components/speech/SpeechEvaluationCard';

export const SpeechCoachPage: React.FC = () => {
  const {
    targetLang,
    ollamaEndpoint,
    textModel,
    isOllamaConnected,
    openSettings,
    currentThemeConfig,
  } = useSettings();

  // Find default scenario for current targetLang or fallback to Japanese Izakaya
  const defaultScenario =
    ROLEPLAY_SCENARIOS.find((sc) => sc.lang === targetLang) || ROLEPLAY_SCENARIOS[0];

  const [currentScenario, setCurrentScenario] = useState<RoleplayScenario>(defaultScenario);
  const [selectedStarter, setSelectedStarter] = useState<string>('');
  const [isWordAssistOpen, setIsWordAssistOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<SpeechEvaluationResult | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    { role: 'user' | 'assistant'; text: string }[]
  >([{ role: 'assistant', text: defaultScenario.initialMessage }]);
  const [error, setError] = useState<string | null>(null);

  const handleSelectScenario = (sc: RoleplayScenario) => {
    setCurrentScenario(sc);
    setSelectedStarter(sc.suggestedStarters[0]?.text || '');
    setEvaluation(null);
    setConversationHistory([{ role: 'assistant', text: sc.initialMessage }]);
    setError(null);
  };

  const handleSpeak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmitSpeech = async (spokenText: string) => {
    if (!spokenText.trim()) return;
    if (!isOllamaConnected) {
      setError('Ollama chưa kết nối. Vui lòng bật Ollama trên máy để chạy mô hình ' + textModel);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await evaluateSpokenResponse({
        scenario: currentScenario,
        userSpeechText: spokenText,
        conversationHistory,
        model: textModel,
        endpoint: ollamaEndpoint,
      });

      setEvaluation(result);
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', text: spokenText },
        { role: 'assistant', text: result.aiResponse.text },
      ]);
    } catch (err: unknown) {
      console.error('Evaluation error:', err);
      const msg = err instanceof Error ? err.message : 'Có lỗi khi đánh giá bài nói.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* ── TOP STUDIO HERO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span>ARUKAS 2.0 • INTERACTIVE SPEECH & ACCENT STUDIO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 mt-1">
            Phòng Luyện Nói & Accent Chuyên Sâu
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Nhập vai thực tế, trợ lý cứu cánh bí từ tức thì và đánh giá nhận xét chuẩn xác với{' '}
            <strong className="text-stone-800 font-mono">{textModel}</strong> trên Ollama cục bộ.
          </p>
        </div>

        {/* Ollama Status */}
        {!isOllamaConnected && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Ollama chưa kết nối.</span>
            <button onClick={openSettings} className="font-bold underline text-amber-800">
              Cài đặt
            </button>
          </div>
        )}
      </div>

      {/* ── SCENARIO SELECTOR ── */}
      <RoleplayScenarioSelector
        selectedScenario={currentScenario}
        onSelectScenario={handleSelectScenario}
        targetLang={targetLang}
      />

      {/* ── MAIN WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT PANE: DIALOGUE CONSOLE & RECORDER (6 Cols) ── */}
        <div className="lg:col-span-6 space-y-6">
          {/* Persona Greeting Card */}
          <div className={`p-6 rounded-3xl border transition-all shadow-xs ${currentThemeConfig.cardStyle} space-y-4`}>
            <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-2xl flex items-center justify-center shadow-xs">
                  {currentScenario.avatar}
                </div>
                <div>
                  <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span>{currentScenario.personaName}</span>
                    <span className="text-[10px] text-stone-400 font-normal">
                      ({currentScenario.personaRole})
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-600 font-medium">
                    Ngữ cảnh: {currentScenario.title}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSpeak(currentScenario.initialMessage)}
                className="p-2 rounded-xl text-stone-500 hover:text-blue-600 hover:bg-blue-50 transition"
                title="Nghe lời chào của nhân vật"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Persona Dialogue Balloon */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
              <div className="text-sm sm:text-base font-black text-stone-900 leading-relaxed">
                {currentScenario.initialMessage}
              </div>

              {currentScenario.initialMessageReading && (
                <div className="text-xs font-mono font-medium text-blue-600">
                  {currentScenario.initialMessageReading}
                </div>
              )}

              <div className="text-xs text-stone-500 italic">
                "{currentScenario.initialMessageTranslation}"
              </div>
            </div>

            {/* Suggested Starter Chips */}
            {currentScenario.suggestedStarters.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  💡 Gợi ý câu mở đầu có thể dùng:
                </span>
                <div className="space-y-1.5">
                  {currentScenario.suggestedStarters.map((starter, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedStarter(starter.text);
                        handleSpeak(starter.text);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-stone-50 hover:bg-blue-50 border border-stone-200/70 hover:border-blue-300 transition text-xs space-y-0.5 group"
                    >
                      <div className="font-bold text-stone-800 group-hover:text-blue-700 flex items-center justify-between">
                        <span>{starter.text}</span>
                        <Volume2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                      <div className="text-[11px] text-stone-500">{starter.meaning}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Voice Recorder & Input Card */}
          <VoiceRecorderCard
            targetLang={currentScenario.lang}
            expectedStarterText={selectedStarter}
            onOpenWordAssist={() => setIsWordAssistOpen(true)}
            onSubmitSpeech={handleSubmitSpeech}
            isSubmitting={isSubmitting}
          />

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Lỗi xử lý giọng nói</div>
                <div>{error}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANE: EVALUATION SCORECARD & ACCENT GUIDE (6 Cols) ── */}
        <div className="lg:col-span-6 space-y-6">
          {/* Evaluation Card if available */}
          {evaluation ? (
            <SpeechEvaluationCard
              evaluation={evaluation}
              targetLang={currentScenario.lang}
              personaName={currentScenario.personaName}
              personaAvatar={currentScenario.avatar}
            />
          ) : (
            <div className="p-10 text-center border-2 border-dashed border-stone-200 rounded-3xl bg-white/50 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
                <Headphones className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-stone-800">Sẵn Sàng Nhập Vai Giao Tiếp</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Hãy bấm micro ở khung bên trái để trả lời câu hỏi của {currentScenario.personaName}.
                  Hệ thống AI sẽ chấm điểm độ trôi chảy, ngữ điệu và phát hiện lỗi accent để giúp bạn sửa ngay.
                </p>
              </div>
            </div>
          )}

          {/* Deep Linguistic Accent Guide for Current Language */}
          <AccentGuideCard targetLang={currentScenario.lang} />
        </div>
      </div>

      {/* In-Speech Word Assist Modal */}
      <InSpeechWordAssistModal
        isOpen={isWordAssistOpen}
        onClose={() => setIsWordAssistOpen(false)}
        targetLang={currentScenario.lang}
        scenarioTitle={currentScenario.title}
        onSelectSuggestion={(text) => {
          setSelectedStarter(text);
          handleSpeak(text);
        }}
        model={textModel}
        endpoint={ollamaEndpoint}
      />
    </div>
  );
};
export default SpeechCoachPage;

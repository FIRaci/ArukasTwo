import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Square, Lightbulb, RotateCcw, Send } from 'lucide-react';
import { LanguageCode, getLanguageInfo } from '../../types';

interface VoiceRecorderCardProps {
  targetLang: LanguageCode;
  expectedStarterText?: string;
  onOpenWordAssist: () => void;
  onSubmitSpeech: (spokenText: string) => Promise<void>;
  isSubmitting: boolean;
}

export const VoiceRecorderCard: React.FC<VoiceRecorderCardProps> = ({
  targetLang,
  expectedStarterText,
  onOpenWordAssist,
  onSubmitSpeech,
  isSubmitting,
}) => {
  const targetInfo = getLanguageInfo(targetLang);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null); // Web Speech Recognition

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = targetInfo.speechVoiceLang;

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (e: any) => {
        console.warn('[SpeechRecognition] Error:', e.error);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [targetLang]);

  // Audio Waveform Visualizer
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      ctx.fillStyle = `rgb(59, 130, 246, ${dataArray[i] / 255 + 0.2})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Audio Context for visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
        if (audioCtx.state !== 'closed') audioCtx.close();
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.lang = targetInfo.speechVoiceLang;
        try {
          recognitionRef.current.start();
        } catch {
          // ignore if already started
        }
      }

      drawWaveform();
    } catch (err) {
      console.warn('Microphone access denied or error:', err);
      alert('Vui lòng cấp quyền truy cập Microphone trong trình duyệt để thu âm giọng nói của bạn.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const playRecordedAudio = () => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    setIsPlayingRecorded(true);
    audio.onended = () => setIsPlayingRecorded(false);
    audio.play();
  };

  const playNativeReference = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetInfo.speechVoiceLang;
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isRecording ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-stone-900">
              Thu Âm & Theo Dõi Giọng Nói Thời Gian Thực
            </h3>
            <p className="text-xs text-stone-400">
              Microphone nhận diện giọng đọc và bóc tách ngữ âm trực tiếp phía client
            </p>
          </div>
        </div>

        {/* Word Assist Button */}
        <button
          type="button"
          onClick={onOpenWordAssist}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 shadow-2xs transition"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
          <span>Bí từ? Gợi ý cách nói</span>
        </button>
      </div>

      {/* Waveform Canvas & Mic Controls */}
      <div className="p-5 rounded-2xl bg-stone-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-400/50'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
            }`}
            title={isRecording ? 'Dừng thu âm' : 'Bắt đầu thu âm giọng nói'}
          >
            {isRecording ? <Square className="w-6 h-6 fill-white" /> : <Mic className="w-6 h-6" />}
          </button>

          <div className="space-y-0.5">
            <div className="text-xs font-bold">
              {isRecording ? '🔴 Đang lắng nghe giọng bạn...' : 'Bấm Micro để bắt đầu nói'}
            </div>
            <div className="text-[11px] text-stone-400">
              {targetInfo.flag} Đang nhận diện tiếng {targetInfo.name}
            </div>
          </div>
        </div>

        {/* Live Audio Visualizer Canvas */}
        <canvas
          ref={canvasRef}
          width={180}
          height={40}
          className="w-44 h-10 rounded-lg bg-stone-800/80 border border-stone-700"
        />
      </div>

      {/* Real-time Spoken Transcript Box */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>Lời bạn nói (hoặc gõ chỉnh sửa nếu mic chưa nhận diện chuẩn):</span>
          {audioUrl && (
            <button
              type="button"
              onClick={playRecordedAudio}
              disabled={isPlayingRecorded}
              className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 transition"
            >
              <Play className="w-3 h-3" />
              <span>{isPlayingRecorded ? 'Đang phát lại...' : 'Nghe lại giọng mình'}</span>
            </button>
          )}
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={`Nói hoặc nhập câu tiếng ${targetInfo.name} tại đây...`}
          rows={3}
          className="w-full p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition resize-y"
        />
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {expectedStarterText ? (
          <button
            type="button"
            onClick={() => {
              setTranscript(expectedStarterText);
              playNativeReference(expectedStarterText);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-blue-600 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử câu mẫu: "{expectedStarterText.slice(0, 30)}..."</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={() => onSubmitSpeech(transcript.trim())}
          disabled={isSubmitting || !transcript.trim()}
          className="w-full sm:w-auto px-6 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 transition shadow-xs flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang chấm điểm & phân tích accent...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Nộp Bài Nói & Đánh Giá Nhận Xét</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
export default VoiceRecorderCard;

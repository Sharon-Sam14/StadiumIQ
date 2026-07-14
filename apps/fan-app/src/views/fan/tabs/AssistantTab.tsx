import React, { useState, useCallback, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Sparkles, Globe } from "lucide-react";
import { AIBadge } from "@/components/ui/Badge";
import { LoadingDots } from "@/components/ui/Skeleton";
import { sanitizeInput } from "@/utils/sanitize";
import { generateId } from "@/utils/formatters";
import type { Language, ChatMessage } from "@/types/fan";

// ============================================================
// ASSISTANT TAB — Multilingual AI Concierge
// ============================================================

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English",    flag: "🇺🇸" },
  { code: "ar", label: "عربي",       flag: "🇸🇦" },
  { code: "fr", label: "Français",   flag: "🇫🇷" },
  { code: "es", label: "Español",    flag: "🇪🇸" },
  { code: "pt", label: "Português",  flag: "🇧🇷" },
];

// Domain-specific response trees (realistic, FIFA World Cup context)
const RESPONSE_TREES: Record<Language, Record<string, string>> = {
  en: {
    default: "Hello! I'm your StadiumIQ AI Concierge for FIFA World Cup 2026 at MetLife Stadium. I can help with directions, food, transport, and match info. What do you need?",
    food: "The nearest halal food option is 'Halal Bites' on the West Concourse near Section 112. Current wait time: ~3 minutes. They serve certified halal burgers, wraps, and hot dogs. Vegan options are available at Vegan Corner on the North Plaza.",
    gate: "Gate A is currently at 92% capacity — I recommend using Gate B instead. Gate B wait time is approximately 2.4 minutes and is located on the east side of the stadium. Head past the fan zone plaza and follow the gold directional markers.",
    seat: "Your seat is in Section 212, Row 12, Seat 4. From Gate B, follow the green BLE-guided route on the Navigate tab. Estimated walking time: 6 minutes. Accessible ramps are available at Entrances B2 and B4.",
    transport: "After the match, I recommend exiting via Gate C (lowest congestion: 2.4 min wait) and boarding NJ Transit at Meadowlands Station. Expected arrival at Newark Penn Station: 38 minutes. Train departs at 22:45.",
    toilet: "The nearest restrooms to your current estimated position (near Gate B) are on Level 2, North Concourse — approximately 90 meters. A family-accessible restroom is available on Level 1, Section 210.",
  },
  ar: {
    default: "مرحباً! أنا مساعد StadiumIQ الذكي لكأس العالم 2026. يمكنني مساعدتك في التنقل والطعام والمواصلات. كيف يمكنني مساعدتك؟",
    food: "أقرب مطعم حلال هو 'Halal Bites' في الجناح الغربي قرب القسم 112. وقت الانتظار الحالي: ~3 دقائق. يقدمون برغر وسندويشات وهوت دوج حلال.",
    gate: "البوابة A مزدحمة حاليًا بنسبة 92٪. أنصحك باستخدام البوابة B — وقت الانتظار حوالي 2.4 دقيقة وهي في الجهة الشرقية.",
    default_fallback: "سأحاول مساعدتك. هل يمكنك توضيح سؤالك؟ يمكنني مساعدتك في الطعام أو التنقل أو المواصلات.",
  },
  fr: {
    default: "Bonjour! Je suis votre assistant IA StadiumIQ pour la Coupe du Monde 2026. Comment puis-je vous aider avec la navigation, la restauration ou les transports?",
    food: "Le restaurant halal le plus proche est 'Halal Bites' dans le couloir Ouest près de la Section 112. Temps d'attente actuel: ~3 minutes.",
    gate: "La Porte A est à 92% de capacité. Je recommande d'utiliser la Porte B — temps d'attente d'environ 2,4 minutes, située côté est du stade.",
    default_fallback: "Je vais essayer de vous aider. Pouvez-vous préciser votre question?",
  },
  es: {
    default: "¡Hola! Soy tu asistente IA StadiumIQ para la Copa del Mundo 2026. ¿En qué puedo ayudarte con la navegación, comida o transporte?",
    food: "El restaurante halal más cercano es 'Halal Bites' en el pasillo Oeste cerca de la Sección 112. Tiempo de espera actual: ~3 minutos.",
    gate: "La Puerta A está al 92% de capacidad. Te recomiendo usar la Puerta B — tiempo de espera de aproximadamente 2,4 minutos.",
    default_fallback: "Voy a intentar ayudarte. ¿Puedes aclarar tu pregunta?",
  },
  pt: {
    default: "Olá! Sou seu assistente IA StadiumIQ para a Copa do Mundo 2026. Como posso ajudá-lo com navegação, comida ou transporte?",
    food: "O restaurante halal mais próximo é 'Halal Bites' no corredor Oeste perto da Seção 112. Tempo de espera atual: ~3 minutos.",
    gate: "O Portão A está a 92% da capacidade. Recomendo usar o Portão B — tempo de espera de aproximadamente 2,4 minutos.",
    default_fallback: "Vou tentar ajudá-lo. Você pode esclarecer sua pergunta?",
  },
};

function getResponse(language: Language, userText: string): string {
  const lower = userText.toLowerCase();
  const tree = RESPONSE_TREES[language];
  if (!tree) return RESPONSE_TREES.en.default;

  if (lower.includes("halal") || lower.includes("food") || lower.includes("eat") ||
      lower.includes("nourriture") || lower.includes("comida") || lower.includes("طعام")) {
    return tree.food ?? RESPONSE_TREES.en.food;
  }
  if (lower.includes("gate") || lower.includes("porte") || lower.includes("puerta") ||
      lower.includes("portão") || lower.includes("بوابة") || lower.includes("crowd")) {
    return tree.gate ?? RESPONSE_TREES.en.gate;
  }
  if (lower.includes("seat") || lower.includes("section") || lower.includes("seat")) {
    return RESPONSE_TREES.en.seat;
  }
  if (lower.includes("transport") || lower.includes("train") || lower.includes("exit") ||
      lower.includes("metro") || lower.includes("مواصلات")) {
    return RESPONSE_TREES.en.transport;
  }
  if (lower.includes("toilet") || lower.includes("bathroom") || lower.includes("restroom") ||
      lower.includes("wc") || lower.includes("toilette")) {
    return RESPONSE_TREES.en.toilet;
  }

  return tree.default_fallback ?? tree.default ?? RESPONSE_TREES.en.default;
}

const CONTEXT_CHUNKS = [
  { similarity: 0.912, content: "'Halal Bites: West Concourse, Section 112. Certified halal. Wait ~3 min.'", source: "venue_faq.md" },
  { similarity: 0.854, content: "'Gate A: High congestion zone (92%). AI recommends Gate B redirect.'",  source: "crowd_telemetry_live" },
  { similarity: 0.733, content: "'NJ Transit departs Meadowlands Station 10 min post-match.'",           source: "transport_schedule.json" },
  { similarity: 0.698, content: "'Section 212 accessible via Ramps B2, B4. Elevator at Gate B Level 1.'", source: "venue_faq.md" },
];

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export const AssistantTab = React.memo(function AssistantTab(): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: generateId("msg"),
    role: "assistant",
    text: RESPONSE_TREES.en.default,
    language: "en",
    timestamp: new Date().toISOString(),
  }]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [showInspector, setShowInspector] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSendDisabled, setIsSendDisabled] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback((): void => {
    const raw = inputText.trim();
    if (!raw || isSendDisabled) return;

    const sanitized = sanitizeInput(raw, 300);
    if (!sanitized) return;

    // Rate limiting
    setIsSendDisabled(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setIsSendDisabled(false), 300);

    const userMsg: ChatMessage = {
      id: generateId("msg"),
      role: "user",
      text: sanitized,
      language,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const reply = getResponse(language, sanitized);
      const aiMsg: ChatMessage = {
        id: generateId("msg"),
        role: "assistant",
        text: reply,
        language,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700 + Math.random() * 600);
  }, [inputText, isSendDisabled, language]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleVoiceInput = useCallback((): void => {
    const SpeechRecognitionAPI = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Voice input is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = language === "ar" ? "ar-SA" : language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : language === "pt" ? "pt-BR" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any): void => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };
    recognition.onerror = (): void => setIsListening(false);
    recognition.onend = (): void => setIsListening(false);
  }, [isListening, language]);

  const handleLanguageChange = useCallback((lang: Language): void => {
    setLanguage(lang);
    setMessages([{
      id: generateId("msg"),
      role: "assistant",
      text: RESPONSE_TREES[lang]?.default ?? RESPONSE_TREES.en.default,
      language: lang,
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  const PLACEHOLDER_TEXT: Record<Language, string> = {
    en: "Ask about food, directions, gates, transport...",
    ar: "اسأل عن الطعام، الاتجاهات، البوابات...",
    fr: "Posez des questions sur la restauration, les directions...",
    es: "Pregunte sobre comida, direcciones, transporte...",
    pt: "Pergunte sobre comida, direções, transporte...",
  };

  return (
    <div className="flex flex-col h-full animate-fade-in gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--brand-gold)]" aria-hidden="true" />
          <span className="font-display font-bold text-sm text-[var(--text-primary)]">
            AI Concierge
          </span>
          <AIBadge label="Powered by GenAI" />
        </div>
        <button
          onClick={() => setShowInspector((p) => !p)}
          className="text-[10px] text-[var(--brand-gold)] border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/10 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-[var(--brand-gold)]/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-expanded={showInspector}
          aria-label={showInspector ? "Hide prompt inspector" : "Show prompt inspector"}
        >
          <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
          {showInspector ? "Hide" : "Show"} Inspector
        </button>
      </div>

      {/* Language Selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Select language for AI assistant">
        {LANGUAGES.map(({ code, label, flag }) => (
          <button
            key={code}
            onClick={() => handleLanguageChange(code)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              language === code
                ? "bg-[var(--brand-gold)] text-black"
                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
            }`}
            aria-pressed={language === code}
            aria-label={`Switch to ${label}`}
          >
            <Globe className="w-3 h-3" aria-hidden="true" />
            {flag} {label}
          </button>
        ))}
      </div>

      {/* GenAI Inspector (collapsible) */}
      {showInspector && (
        <div className="rounded-xl border border-[var(--brand-gold)]/20 bg-[var(--brand-gold)]/5 p-4 space-y-2 text-[9px] font-mono overflow-y-auto max-h-40 animate-slide-up">
          <p className="text-[var(--brand-gold)] font-bold text-[10px]">SYSTEM PROMPT TEMPLATE</p>
          <p className="text-[var(--text-secondary)]">
            "You are a helpful FIFA World Cup 2026 concierge assistant for MetLife Stadium. Use retrieved venue context chunks (pgvector cosine similarity) to answer fan queries in their preferred language."
          </p>
          <p className="text-[var(--brand-gold)] font-bold text-[10px] mt-2">RETRIEVED VECTOR CONTEXTS</p>
          {CONTEXT_CHUNKS.map((chunk, i) => (
            <p key={i} className={`leading-relaxed ${chunk.similarity > 0.85 ? "text-green-400" : chunk.similarity > 0.75 ? "text-yellow-400" : "text-[var(--text-tertiary)]"}`}>
              [{chunk.similarity.toFixed(3)}] {chunk.content}
              <span className="text-[var(--text-tertiary)] ml-1">— {chunk.source}</span>
            </p>
          ))}
        </div>
      )}

      {/* Chat Messages */}
      <div
        ref={messageListRef}
        className="flex-1 overflow-y-auto space-y-3 pr-1 scroll-thin min-h-0"
        style={{ maxHeight: "calc(100vh - 420px)", minHeight: "200px" }}
        aria-label="AI assistant conversation"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <span className="text-[9px] text-[var(--text-tertiary)] px-1">
              {msg.role === "user" ? "You" : "StadiumIQ AI"}
            </span>
            <div
              className={`px-4 py-3 rounded-2xl text-sm max-w-[90%] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-br-sm"
                  : "bg-[var(--brand-green-deep)]/30 border border-[var(--brand-green-light)]/20 text-[var(--text-primary)] rounded-bl-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex flex-col gap-1 items-start">
            <span className="text-[9px] text-[var(--text-tertiary)] px-1">StadiumIQ AI</span>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[var(--brand-green-deep)]/30 border border-[var(--brand-green-light)]/20">
              <LoadingDots />
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="flex gap-2 mt-auto">
        {/* Voice button */}
        <button
          onClick={handleVoiceInput}
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            isListening
              ? "bg-red-500/20 border-red-500/50 text-red-400 animate-recording"
              : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
          }`}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
        >
          {isListening
            ? <MicOff className="w-4 h-4" aria-hidden="true" />
            : <Mic className="w-4 h-4" aria-hidden="true" />}
        </button>

        <input
          type="text"
          placeholder={PLACEHOLDER_TEXT[language]}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-10 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--brand-gold)] focus-visible:outline-none transition-colors"
          aria-label="Type your message to the AI concierge"
          maxLength={300}
          disabled={isTyping}
        />

        <button
          onClick={handleSend}
          disabled={!inputText.trim() || isSendDisabled || isTyping}
          className="shrink-0 w-10 h-10 rounded-xl bg-[var(--brand-gold)] text-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});

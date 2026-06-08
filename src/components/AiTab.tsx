/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  User, 
  HelpCircle,
  Loader2,
  Bookmark,
  RefreshCw
} from 'lucide-react';

interface AiTabProps {
  darkMode: boolean;
}

// Simple dynamic parser to render bullet items, bold headings, and markdown table structures securely.
function CustomMarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');
  const formattedElements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];
  let isInTable = false;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Parse Markdown tables: e.g. | NIP | Nama | ... |
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      const parts = trimmedLine.split('|').map(p => p.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // Divider column list e.g. |---|---|
      if (parts.every(p => p.match(/^:?-+:?$/))) {
        return; // Ignore divider lines
      }

      if (!isInTable) {
        isInTable = true;
        tableHeaders = parts;
      } else {
        tableRows.push(parts);
      }
      return;
    } else {
      // If table turns active, render and clear it first before treating normal text line
      if (isInTable) {
        const renderHeaders = tableHeaders;
        const renderRows = [...tableRows];
        formattedElements.push(
          <div key={`table-${index}`} className="my-3 overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 dark:bg-gray-850 font-bold uppercase text-[10px] text-gray-400">
                <tr>
                  {renderHeaders.map((h, i) => <th key={i} className="p-2.5 border-b border-gray-200 dark:border-gray-800">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-medium">
                {renderRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-500/5">
                    {row.map((cell, cellIdx) => <td key={cellIdx} className="p-2.5 dark:text-gray-200">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        tableHeaders = [];
        isInTable = false;
      }
    }

    // Parse headings: ### Heading 3 or ## Heading 2
    if (trimmedLine.startsWith('###')) {
      formattedElements.push(
        <h4 key={index} className="text-sm font-extrabold text-amber-500 tracking-wide uppercase font-display mt-4 mb-1.5">
          {trimmedLine.replace(/^###\s+/, '')}
        </h4>
      );
      return;
    }
    if (trimmedLine.startsWith('##') || trimmedLine.startsWith('#')) {
      formattedElements.push(
        <h3 key={index} className="text-base font-bold text-slate-800 dark:text-gray-100 tracking-tight font-display mt-5 mb-2.5">
          {trimmedLine.replace(/^##?\s+/, '')}
        </h3>
      );
      return;
    }

    // Parse Bullet Lines e.g., - Bullet or * Bullet
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      const text = trimmedLine.replace(/^[-*]\s+/, '');
      formattedElements.push(
        <li key={index} className="text-xs md:text-sm text-gray-700 dark:text-gray-200 ml-4 list-disc pl-1 py-0.5 leading-relaxed font-sans">
          {parseBoldText(text)}
        </li>
      );
      return;
    }

    // Parse normal lines with potential bold triggers
    if (trimmedLine !== '') {
      formattedElements.push(
        <p key={index} className="text-xs md:text-sm leading-relaxed text-gray-700 dark:text-gray-200 mb-2 font-sans font-medium">
          {parseBoldText(trimmedLine)}
        </p>
      );
    } else {
      formattedElements.push(<div key={index} className="h-2" />);
    }
  });

  // Render any remaining table block
  if (isInTable && tableHeaders.length > 0) {
    formattedElements.push(
      <div key="table-end" className="my-3 overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-100 dark:bg-gray-850 font-bold uppercase text-[10px] text-gray-400">
            <tr>
              {tableHeaders.map((h, i) => <th key={i} className="p-2.5 border-b border-gray-200 dark:border-gray-850">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-medium">
            {tableRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-500/5">
                {row.map((cell, cellIdx) => <td key={cellIdx} className="p-2.5 dark:text-gray-200">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div className="space-y-1">{formattedElements}</div>;
}

// Inline helper to render nested **Bold** markdown
function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-amber-500 dark:text-amber-400">
          {part.substring(2, part.length - 2)}
        </strong>
      );
    }
    return part;
  });
}

export default function AiTab({ darkMode }: AiTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'ai-welcome',
      sender: 'assistant',
      text: 'Halo Admin! Saya **SIMPATI AI**, Asisten Pintar Kepegawaian (Smart ASN Assistant).\n\nSaya dapat membantu mencari data pegawai secara instan, menyaring informasi pangkat, mendeteksi KGB mendatang, dan menyusun ringkasan pensiun dengan bahasa alami.\n\nContoh pertanyaan yang bisa Anda ajukan seperti chip saran di bawah ini.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Suggestions definitions matching prompt
  const suggestions = [
    'Siapa yang pensiun tahun ini?',
    'Siapa yang KGB bulan depan?',
    'Berapa jumlah pegawai Golongan IV?',
    'Tampilkan data Sri Wahyuni'
  ];

  // Auto-scroll on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Request trigger to backend API
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    // Append User message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          chatHistory: messages.slice(-8) // Send latest 8 rounds for context pacing
        })
      });

      const data = await response.json();
      
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.text || data.error || 'Mohon maaf, saya saat ini sedang tidak dapat melayani permintaan analisa kepegawaian.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('AI API Query failure:', err);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: 'Waduh, terjadi kegagalan jaringan saat menghubungi server AI SIMPATI. Silakan periksa kunci `GEMINI_API_KEY` Anda di panel Secrets.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (sug: string) => {
    handleSendMessage(sug);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'ai-welcome-reset',
        sender: 'assistant',
        text: 'Riwayat percakapan telah dibersihkan. Halo Admin! Ada yang bisa saya bantu terkait data pegawai PNS / PPPK kita hari ini?',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] md:h-[calc(100vh-95px)] pb-16 md:pb-6 relative space-y-4">
      
      {/* Upper info panel */}
      <div className={`p-4 rounded-[20px] border flex items-center justify-between shrink-0 transition-colors ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150 shadow-sm shadow-gray-100/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 bg-gradient-to-tr from-[#F4B400] to-yellow-400 text-slate-950 rounded-xl">
              <Bot className="w-5.5 h-5.5" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm md:text-base font-display flex items-center gap-1.5">
              SIMPATI AI Smart Assistant
              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase bg-[#F4B400]/15 text-[#F4B400]">PROACTIVE</span>
            </h3>
            <p className="text-[10px] text-gray-400 font-mono">Model: Gemini 3.5 Flash | Real-time Context</p>
          </div>
        </div>
        <button
          onClick={handleResetChat}
          className={`p-2.5 rounded-xl border text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
            darkMode ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
          }`}
          title="Bersihkan Percakapan"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Main chat conversation channel scrollable */}
      <div className={`flex-1 rounded-[20px] border p-4 overflow-y-auto space-y-4 ${
        darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-gray-50/50 border-gray-150'
      }`}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id}
              className={`flex items-start gap-3.5 max-w-[85%] md:max-w-[70%] group ${
                isUser ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Profile icon frame */}
              <div className={`p-2 rounded-xl shrink-0 ${
                isUser 
                  ? 'bg-[#F4B400] text-slate-950 shadow-md shadow-[#F4B400]/10' 
                  : 'bg-[#1F2937] text-white border border-gray-700'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Speech bubble */}
              <div className="space-y-1">
                <div className={`p-3.5 rounded-2xl ${
                  isUser
                    ? 'bg-[#F4B400] text-slate-950 font-bold shadow-md shadow-[#F4B400]/5'
                    : darkMode
                    ? 'bg-gray-850/90 text-gray-100 border border-neutral-800'
                    : 'bg-white text-slate-850 border border-gray-100 shadow-sm'
                }`}>
                  {isUser ? (
                    <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed font-sans font-medium">{msg.text}</p>
                  ) : (
                    <CustomMarkdownRenderer content={msg.text} />
                  )}
                </div>
                {/* Timestamp */}
                <p className={`text-[9px] font-mono font-medium text-gray-500 ${isUser ? 'text-right' : ''}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing loading indicators */}
        {loading && (
          <div className="flex items-start gap-3.5 scroll-mt-4">
            <div className="p-2 rounded-xl bg-[#1F2937] text-white border border-gray-750 shrink-0">
              <Bot className="w-4 h-4 animate-spin text-[#F4B400]" />
            </div>
            <div className={`p-3.5 rounded-2xl flex items-center gap-2 text-xs font-semibold tracking-wide ${
              darkMode ? 'bg-gray-850 border border-neutral-800 text-gray-400' : 'bg-white border text-slate-500 shadow-sm'
            }`}>
              <Loader2 className="w-4 h-4 animate-spin text-[#F4B400]" />
              SIMPATI AI sedang mengindeks data ASN...
            </div>
          </div>
        )}

        {/* Dummy spacer */}
        <div ref={chatBottomRef} />
      </div>

      {/* Suggestion Chips & Query Input wrapper */}
      <div className="space-y-3 shrink-0">
        
        {/* Suggestion Chips list */}
        {messages.length < 5 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mr-1.5 font-sans uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#F4B400]" />
              Saran Tanya:
            </span>
            {suggestions.map((sug) => (
              <button
                key={sug}
                onClick={() => handleSuggestionClick(sug)}
                className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold border transition-all cursor-pointer font-sans leading-none ${
                  darkMode 
                    ? 'border-gray-800 bg-gray-900 text-gray-200 hover:border-[#F4B400]/55 hover:text-amber-400' 
                    : 'border-gray-220 bg-white text-slate-650 hover:bg-gray-50 hover:text-amber-600'
                }`}
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Footer Query send block */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputVal);
          }}
          className={`p-2 rounded-[20px] border flex items-center gap-2 transition-colors ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150 shadow-sm shadow-gray-100/30'
          }`}
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={loading}
            placeholder="Tanyakan analisis, berkas, atau sebaran unit kerja..."
            className={`flex-1 pl-4 pr-2 py-2 text-sm border-none outline-none font-sans tracking-wide ${
              darkMode ? 'bg-transparent text-white placeholder-gray-500' : 'bg-transparent text-slate-900 placeholder-slate-400'
            }`}
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || loading}
            className={`p-3 rounded-xl bg-[#F4B400] text-[#1F2937] font-bold shadow-md shadow-[#F4B400]/10 cursor-pointer transition-transform duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

    </div>
  );
}

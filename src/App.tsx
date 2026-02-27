/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  GripVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Download, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Split, 
  Merge, 
  Settings2, 
  Type, 
  Palette, 
  Layout, 
  Eye, 
  Edit3,
  Check,
  X,
  Copy,
  Archive,
  Sparkles,
  Bell
} from 'lucide-react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { CarouselCard, CarouselConfig, AspectRatio, CardStyle } from './types';
import { DEFAULT_STYLE, FONTS, ASPECT_RATIOS, COLOR_PALETTES, EXAMPLE_TEXT } from './constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

type Lang = 'ru' | 'en';

const COPY = {
  ru: {
    appName: 'Content Carousel',
    heroDesc: 'Вставьте текст вашего поста, и мы автоматически разделим его на красивые карточки.',
    placeholderLongText: 'Ваш длинный текст здесь...',
    tryExample: 'Попробовать пример',
    createCards: 'Создать карточки',
    authorLine: 'Автор и эксперт: Фаррух Мамедов — бизнес-юрист и AI-евангелист.',
    contactLine: 'Связаться в Telegram:',
    edit: 'Редактор',
    preview: 'Предпросмотр',
    reset: 'Сбросить',
    downloadZip: 'Скачать ZIP',
    slidesTitle: (count: number) => `Слайды карусели (${count})`,
    addSlide: 'Добавить слайд',
    slideSettings: 'Параметры слайда',
    globalSettings: 'Глобальные настройки',
    text: 'Текст',
    chars: 'симв.',
    textPlaceholder: 'Введите текст...',
    split: 'Разделить',
    merge: 'Объединить',
    fontSize: 'Шрифт и Размер',
    align: 'Выравнивание',
    colors: 'Цвета и Палитры',
    applyToAll: 'Применить ко всем слайдам',
    downloadSlide: 'Скачать этот слайд',
    selectSlide: 'Выберите слайд слева,\nчтобы изменить его параметры',
    downloadPng: 'Скачать PNG',
    emptySlide: 'Пустой слайд...',
    autoLabel: 'Авто',
    autoOn: 'ВКЛ',
    autoOff: 'ВЫКЛ',
    confirmReset: 'Вы уверены, что хотите начать заново? Все изменения будут потеряны.',
    language: 'Язык',
    aspectRatioLabels: {
      '1:1': 'Квадрат (1:1)',
      '4:5': 'Портрет (4:5)',
    },
    toast: {
      enterText: 'Введите текст для генерации',
      splitFail: 'Не удалось разбить текст на слайды',
      styleApplied: 'Стиль применен ко всем слайдам',
      exportStart: 'Начинаем экспорт архива...',
      exportOk: 'Архив успешно скачан!',
      exportFail: 'Ошибка при создании архива',
      exportSingleFail: 'Ошибка при экспорте',
      addedSlide: 'Добавлен новый слайд',
    },
  },
  en: {
    appName: 'Content Carousel',
    heroDesc: 'Paste your post text and we will automatically split it into beautiful cards.',
    placeholderLongText: 'Your long text here...',
    tryExample: 'Try example',
    createCards: 'Create cards',
    authorLine: 'Author and expert: Farrukh Mamedov — business lawyer and AI evangelist.',
    contactLine: 'Contact on Telegram:',
    edit: 'Editor',
    preview: 'Preview',
    reset: 'Reset',
    downloadZip: 'Download ZIP',
    slidesTitle: (count: number) => `Carousel slides (${count})`,
    addSlide: 'Add slide',
    slideSettings: 'Slide settings',
    globalSettings: 'Global settings',
    text: 'Text',
    chars: 'chars',
    textPlaceholder: 'Enter text...',
    split: 'Split',
    merge: 'Merge',
    fontSize: 'Font and Size',
    align: 'Alignment',
    colors: 'Colors and Palettes',
    applyToAll: 'Apply to all slides',
    downloadSlide: 'Download this slide',
    selectSlide: 'Select a slide on the left\nto edit its settings',
    downloadPng: 'Download PNG',
    emptySlide: 'Empty slide...',
    autoLabel: 'Auto',
    autoOn: 'ON',
    autoOff: 'OFF',
    confirmReset: 'Are you sure you want to start over? All changes will be lost.',
    language: 'Language',
    aspectRatioLabels: {
      '1:1': 'Square (1:1)',
      '4:5': 'Portrait (4:5)',
    },
    toast: {
      enterText: 'Enter text to generate',
      splitFail: 'Could not split the text into slides',
      styleApplied: 'Style applied to all slides',
      exportStart: 'Starting ZIP export...',
      exportOk: 'Archive downloaded successfully!',
      exportFail: 'Error while creating archive',
      exportSingleFail: 'Export failed',
      addedSlide: 'New slide added',
    },
  },
} as const;

export default function App() {
  const [lang, setLang] = useState<Lang>('ru');
  const [inputText, setInputText] = useState('');
  const [cards, setCards] = useState<CarouselCard[]>([]);
  const [config, setConfig] = useState<CarouselConfig>({
    aspectRatio: '1:1',
    globalStyle: { ...DEFAULT_STYLE },
  });
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isExporting, setIsExporting] = useState(false);
  const [autoFontSize, setAutoFontSize] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const t = COPY[lang];

  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const getAutoFontSize = (text: string) => {
    const length = text.length;
    if (length > 400) return 28;
    if (length > 300) return 32;
    if (length > 200) return 36;
    if (length > 100) return 42;
    if (length < 50) return 56;
    return 48;
  };

  const updateCard = (id: string, updates: Partial<CarouselCard>) => {
    setCards(prev => prev.map(card => {
      if (card.id === id) {
        const newCard = { ...card, ...updates };
        if (autoFontSize && updates.text !== undefined) {
          newCard.style = { ...newCard.style, fontSize: getAutoFontSize(updates.text) };
        }
        return newCard;
      }
      return card;
    }));
  };

  // Auto-adjust font size for all cards when toggled on
  useEffect(() => {
    if (!autoFontSize) return;
    setCards(prev => prev.map(card => ({
      ...card,
      style: { ...card.style, fontSize: getAutoFontSize(card.text) }
    })));
  }, [autoFontSize]);

  // Split text into cards
  const generateCards = () => {
    if (!inputText.trim()) {
      addToast(t.toast.enterText, 'info');
      return;
    }

    // Split by double newlines, or by single newlines if they are long enough, or by sentence
    let parts = inputText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    
    // If we only have one part, try splitting by single newlines
    if (parts.length === 1) {
      const lines = inputText.split(/\n/).map(p => p.trim()).filter(Boolean);
      if (lines.length > 1) {
        parts = lines;
      }
    }

    // If still one part, try splitting by sentences
    if (parts.length === 1) {
      const sentences = inputText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
      const cleaned = sentences.map(p => p.trim()).filter(Boolean);
      if (cleaned.length > 1) {
        parts = cleaned;
      }
    }

    if (parts.length === 0) {
      addToast(t.toast.splitFail, 'error');
      return;
    }

    const newCards: CarouselCard[] = parts.map((text, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      style: { ...config.globalStyle },
    }));

    setCards(newCards);
    if (newCards.length > 0) setActiveCardId(newCards[0].id);
  };

  const resetApp = () => {
    if (confirm(t.confirmReset)) {
      setCards([]);
      setInputText('');
      setActiveCardId(null);
    }
  };

  const updateCardStyle = (id: string, styleUpdates: Partial<CardStyle>) => {
    setCards(prev => prev.map(card => 
      card.id === id ? { ...card, style: { ...card.style, ...styleUpdates } } : card
    ));
  };

  const applyGlobalStyle = (styleUpdates: Partial<CardStyle>) => {
    setConfig(prev => ({
      ...prev,
      globalStyle: { ...prev.globalStyle, ...styleUpdates }
    }));
    setCards(prev => prev.map(card => ({
      ...card,
      style: { ...card.style, ...styleUpdates }
    })));
    addToast(t.toast.styleApplied);
  };

  const deleteCard = (id: string) => {
    setCards(prev => prev.filter(card => card.id !== id));
    if (activeCardId === id) setActiveCardId(null);
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= cards.length) return;

    const newCards = [...cards];
    const [movedCard] = newCards.splice(index, 1);
    newCards.splice(newIndex, 0, movedCard);
    setCards(newCards);
  };

  const splitCard = (id: string) => {
    const index = cards.findIndex(c => c.id === id);
    if (index === -1) return;

    const card = cards[index];
    const words = card.text.split(' ');
    const mid = Math.ceil(words.length / 2);
    
    const text1 = words.slice(0, mid).join(' ');
    const text2 = words.slice(mid).join(' ');

    const newCard: CarouselCard = {
      id: Math.random().toString(36).substr(2, 9),
      text: text2,
      style: { ...card.style },
    };

    const newCards = [...cards];
    newCards[index] = { ...card, text: text1 };
    newCards.splice(index + 1, 0, newCard);
    setCards(newCards);
    setActiveCardId(newCard.id);
  };

  const mergeWithNext = (id: string) => {
    const index = cards.findIndex(c => c.id === id);
    if (index === -1 || index === cards.length - 1) return;

    const current = cards[index];
    const next = cards[index + 1];

    const newCards = [...cards];
    newCards[index] = { ...current, text: `${current.text}\n\n${next.text}` };
    newCards.splice(index + 1, 1);
    setCards(newCards);
  };

  const exportSingle = async (id: string) => {
    try {
      const exportContainer = document.getElementById('export-container');
      if (!exportContainer) throw new Error('Export container not found');

      const element = exportContainer.querySelector(
        `[data-slide-id="${id}"]`
      ) as HTMLElement | null;
      if (!element) throw new Error('Export element not found');

      const dataUrl = await toPng(element, { quality: 1, pixelRatio: 2 });
      saveAs(dataUrl, `card-${id}.png`);
    } catch (err) {
      console.error('Export failed', err);
      addToast(t.toast.exportSingleFail, 'error');
    }
  };

  const exportAll = async () => {
    if (cards.length === 0) return;
    setIsExporting(true);
    addToast(t.toast.exportStart, 'info');
    const zip = new JSZip();
    
    try {
      const exportContainer = document.getElementById('export-container');
      if (!exportContainer) throw new Error('Export container not found');

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const element = exportContainer.querySelector(`[data-slide-id="${card.id}"]`) as HTMLElement;
        
        if (element) {
          const dataUrl = await toPng(element, { 
            pixelRatio: 2,
            cacheBust: true,
          });
          const base64Data = dataUrl.split(',')[1];
          zip.file(`slide-${i + 1}.png`, base64Data, { base64: true });
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'insta-carousel.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast(t.toast.exportOk, 'success');
    } catch (err) {
      console.error('ZIP export failed', err);
      addToast(t.toast.exportFail, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const activeCard = cards.find(c => c.id === activeCardId);

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 rounded-2xl">
                <Layout className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{t.appName}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {t.language}
              </span>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                {(['ru', 'en'] as const).map((code) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                      lang === code ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            {t.heroDesc}
          </p>

          <textarea
            className="w-full h-64 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-gray-800"
            placeholder={t.placeholderLongText}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ratio }))}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      config.aspectRatio === ratio 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {t.aspectRatioLabels[ratio]}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setInputText(EXAMPLE_TEXT[lang])}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors px-1"
              >
                <Sparkles className="w-3 h-3" />
                {t.tryExample}
              </button>
            </div>

            <button
              onClick={generateCards}
              disabled={!inputText.trim()}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {t.createCards}
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500 leading-relaxed">
            <p>{t.authorLine}</p>
            <p>{t.contactLine} <a href="https://t.me/corporatelawyer" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">https://t.me/corporatelawyer</a></p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCards([])}>
            <div className="p-1.5 bg-indigo-600 rounded-lg">
              <Layout className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 hidden sm:inline">{t.appName}</span>
          </div>
          
          <div className="h-6 w-px bg-gray-200 mx-2" />
          
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('edit')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
                viewMode === 'edit' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Edit3 className="w-4 h-4" />
              {t.edit}
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
                viewMode === 'preview' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Eye className="w-4 h-4" />
              {t.preview}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {t.language}
            </span>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              {(['ru', 'en'] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                    lang === code ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={resetApp}
            className="px-3 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t.reset}
          </button>
          <button
            onClick={exportAll}
            disabled={isExporting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
            {t.downloadZip}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-8 flex flex-col items-center">
          <div className="max-w-5xl w-full space-y-8">
            {viewMode === 'edit' ? (
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Side: Slides List */}
                <div className="flex-1 w-full space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Layout className="w-5 h-5 text-indigo-600" />
                      {t.slidesTitle(cards.length)}
                    </h2>
                    <button 
                      onClick={() => {
                        const newCard: CarouselCard = {
                          id: Math.random().toString(36).substr(2, 9),
                          text: '',
                          style: { ...config.globalStyle },
                        };
                        setCards([...cards, newCard]);
                        setActiveCardId(newCard.id);
                        addToast(t.toast.addedSlide);
                      }}
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      {t.addSlide}
                    </button>
                  </div>

                  <Reorder.Group 
                    axis="y" 
                    values={cards} 
                    onReorder={setCards}
                    className="space-y-6"
                  >
                    {cards.map((card, index) => (
                      <Reorder.Item 
                        key={card.id}
                        value={card}
                        onClick={() => setActiveCardId(card.id)}
                        className={cn(
                          "relative cursor-pointer transition-all rounded-2xl overflow-hidden border-4",
                          activeCardId === card.id 
                            ? "border-indigo-500 shadow-xl ring-4 ring-indigo-50" 
                            : "border-transparent hover:border-gray-300 shadow-md"
                        )}
                      >
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 lg:opacity-100 text-white/50 hover:text-white transition-colors cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-6 h-6" />
                        </div>

                        <div className="absolute right-4 top-4 z-10 bg-black/30 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full">
                          {index + 1} / {cards.length}
                        </div>

                        <div 
                          ref={(el) => (cardRefs.current[card.id] = el)}
                          style={{
                            width: '100%',
                            aspectRatio: ASPECT_RATIOS[config.aspectRatio].width / ASPECT_RATIOS[config.aspectRatio].height,
                            backgroundColor: card.style.backgroundColor,
                            color: card.style.textColor,
                            fontFamily: card.style.fontFamily,
                            textAlign: card.style.textAlign,
                          }}
                          className="flex items-center justify-center p-12 overflow-hidden"
                        >
                          <div 
                            style={{ fontSize: `${card.style.fontSize / 2.5}px` }}
                            className="whitespace-pre-wrap break-words w-full leading-tight font-bold"
                          >
                            {card.text || <span className="opacity-20 italic">{t.emptySlide}</span>}
                          </div>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>

                {/* Right Side: Parameters Sidebar */}
                <aside className="w-full lg:w-[400px] lg:sticky lg:top-24 space-y-6">
                  {activeCard ? (
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-200 space-y-8">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          <Settings2 className="w-5 h-5 text-indigo-600" />
                          {t.slideSettings}
                        </h3>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => moveCard(cards.findIndex(c => c.id === activeCardId), 'up')}
                            disabled={cards.findIndex(c => c.id === activeCardId) === 0}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-20"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => moveCard(cards.findIndex(c => c.id === activeCardId), 'down')}
                            disabled={cards.findIndex(c => c.id === activeCardId) === cards.length - 1}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-20"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteCard(activeCard.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Global Quick Settings */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t.globalSettings}</span>
                        <div className="flex flex-wrap gap-2">
                          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl flex-1">
                            {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((ratio) => (
                              <button
                                key={ratio}
                                onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ratio }))}
                                className={cn(
                                  "flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                  config.aspectRatio === ratio 
                                    ? "bg-white text-indigo-600 shadow-sm" 
                                    : "text-gray-500 hover:text-gray-700"
                                )}
                              >
                                {t.aspectRatioLabels[ratio]}
                              </button>
                            ))}
                          </div>
                          <button 
                            onClick={() => setAutoFontSize(!autoFontSize)}
                            className={cn(
                              "text-[10px] px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                              autoFontSize ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            )}
                          >
                            <Type className="w-3 h-3" />
                            {t.autoLabel}: {autoFontSize ? t.autoOn : t.autoOff}
                          </button>
                        </div>
                      </div>

                      {/* Text Editor */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t.text}</span>
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                            activeCard.text.length > 200 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                          )}>
                            {activeCard.text.length} {t.chars}
                          </span>
                        </div>
                        <textarea
                          className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-gray-800 leading-relaxed text-sm"
                          value={activeCard.text}
                          onChange={(e) => updateCard(activeCard.id, { text: e.target.value })}
                          placeholder={t.textPlaceholder}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => splitCard(activeCard.id)}
                            className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                          >
                            <Split className="w-3.5 h-3.5" /> {t.split}
                          </button>
                          {cards.findIndex(c => c.id === activeCardId) < cards.length - 1 && (
                            <button 
                              onClick={() => mergeWithNext(activeCard.id)}
                              className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                            >
                              <Merge className="w-3.5 h-3.5" /> {t.merge}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Style Parameters */}
                      <div className="space-y-6 pt-4 border-t border-gray-100">
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t.fontSize}</span>
                          <div className="flex gap-2">
                            <select 
                              className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none font-medium"
                              value={activeCard.style.fontFamily}
                              onChange={(e) => updateCardStyle(activeCard.id, { fontFamily: e.target.value })}
                            >
                              {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                            </select>
                            <div className="w-24 flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                              <input 
                                type="number" 
                                className="w-full bg-transparent text-sm outline-none font-bold"
                                value={activeCard.style.fontSize}
                                onChange={(e) => {
                                  setAutoFontSize(false);
                                  updateCardStyle(activeCard.id, { fontSize: parseInt(e.target.value) || 0 });
                                }}
                              />
                              <span className="text-[10px] text-gray-400 font-bold">PX</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t.align}</span>
                          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                onClick={() => updateCardStyle(activeCard.id, { textAlign: align })}
                                className={cn(
                                  "flex-1 py-2 rounded-lg flex items-center justify-center transition-all",
                                  activeCard.style.textAlign === align 
                                    ? "bg-white text-indigo-600 shadow-sm" 
                                    : "text-gray-500 hover:text-gray-700"
                                )}
                              >
                                {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                {align === 'right' && <AlignRight className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t.colors}</span>
                          <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                              <div className="flex-1 flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                                <input 
                                  type="color" 
                                  className="w-6 h-6 rounded-md cursor-pointer border-none p-0 overflow-hidden"
                                  value={activeCard.style.backgroundColor}
                                  onChange={(e) => updateCardStyle(activeCard.id, { backgroundColor: e.target.value })}
                                />
                                <span className="text-[10px] font-mono uppercase text-gray-500">{activeCard.style.backgroundColor}</span>
                              </div>
                              <div className="flex-1 flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                                <input 
                                  type="color" 
                                  className="w-6 h-6 rounded-md cursor-pointer border-none p-0 overflow-hidden"
                                  value={activeCard.style.textColor}
                                  onChange={(e) => updateCardStyle(activeCard.id, { textColor: e.target.value })}
                                />
                                <span className="text-[10px] font-mono uppercase text-gray-500">{activeCard.style.textColor}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {COLOR_PALETTES.map((palette, pIdx) => (
                                <button
                                  key={pIdx}
                                  onClick={() => updateCardStyle(activeCard.id, { backgroundColor: palette.bg, textColor: palette.text })}
                                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden transition-transform hover:scale-110 shadow-sm"
                                  title={palette.name}
                                >
                                  <div className="w-1/2 h-full" style={{ backgroundColor: palette.bg }} />
                                  <div className="w-1/2 h-full" style={{ backgroundColor: palette.text }} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 flex flex-col gap-3">
                          <button 
                            onClick={() => applyGlobalStyle(activeCard.style)}
                            className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                          >
                            <Copy className="w-4 h-4" />
                            {t.applyToAll}
                          </button>
                          <button 
                            onClick={() => exportSingle(activeCard.id)}
                            className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                          >
                            <Download className="w-4 h-4" />
                            {t.downloadSlide}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-12 shadow-xl border border-dashed border-gray-300 text-center space-y-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                        <Edit3 className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-400 text-sm font-medium whitespace-pre-line">{t.selectSlide}</p>
                    </div>
                  )}
                </aside>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                {cards.map((card, index) => (
                  <div key={card.id} className="flex flex-col items-center gap-4">
                    <div 
                      ref={(el) => (cardRefs.current[card.id] = el)}
                      style={{
                        width: ASPECT_RATIOS[config.aspectRatio].width / 2,
                        height: ASPECT_RATIOS[config.aspectRatio].height / 2,
                        backgroundColor: card.style.backgroundColor,
                        color: card.style.textColor,
                        fontFamily: card.style.fontFamily,
                        textAlign: card.style.textAlign,
                      }}
                      className="shadow-lg rounded-sm flex items-center justify-center p-12 overflow-hidden relative"
                    >
                      <div 
                        style={{ fontSize: `${card.style.fontSize / 2}px` }}
                        className="whitespace-pre-wrap break-words w-full leading-tight font-bold"
                      >
                        {card.text}
                      </div>
                      <div className="absolute top-4 left-4 bg-black/20 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm font-bold">
                        {index + 1} / {cards.length}
                      </div>
                    </div>
                    <button 
                      onClick={() => exportSingle(card.id)}
                      className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      {t.downloadPng}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="bg-white border-t border-gray-200 py-6 px-6">
        <div className="max-w-5xl mx-auto text-sm text-gray-500 leading-relaxed">
          <p>{t.authorLine}</p>
          <p>{t.contactLine} <a href="https://t.me/corporatelawyer" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">https://t.me/corporatelawyer</a></p>
        </div>
      </footer>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={cn(
                "px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[240px] border",
                toast.type === 'success' ? "bg-white border-green-100 text-green-800" :
                toast.type === 'info' ? "bg-white border-indigo-100 text-indigo-800" :
                "bg-white border-red-100 text-red-800"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg",
                toast.type === 'success' ? "bg-green-50" :
                toast.type === 'info' ? "bg-indigo-50" :
                "bg-red-50"
              )}>
                {toast.type === 'success' && <Check className="w-4 h-4" />}
                {toast.type === 'info' && <Bell className="w-4 h-4" />}
                {toast.type === 'error' && <X className="w-4 h-4" />}
              </div>
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Скрытый контейнер для экспорта всех слайдов */}
      <div id="export-container" className="fixed -left-[9999px] -top-[9999px]" aria-hidden="true">
        {cards.map((card) => (
          <div 
            key={card.id}
            data-slide-id={card.id}
            style={{
              width: ASPECT_RATIOS[config.aspectRatio].width,
              height: ASPECT_RATIOS[config.aspectRatio].height,
              backgroundColor: card.style.backgroundColor,
              color: card.style.textColor,
              fontFamily: card.style.fontFamily,
              textAlign: card.style.textAlign,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            <div 
              style={{ fontSize: `${card.style.fontSize}px` }}
              className="whitespace-pre-wrap break-words w-full leading-tight font-bold"
            >
              {card.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

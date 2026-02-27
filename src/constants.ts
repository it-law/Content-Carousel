import { CardStyle } from './types';

export const FONTS = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Playfair', value: '"Playfair Display", serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Oswald', value: 'Oswald, sans-serif' },
  { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
];

export const DEFAULT_STYLE: CardStyle = {
  backgroundColor: '#ffffff',
  textColor: '#000000',
  fontSize: 48,
  fontFamily: 'Inter, sans-serif',
  textAlign: 'center',
};

export const ASPECT_RATIOS = {
  '1:1': { width: 1080, height: 1080, label: 'Квадрат (1:1)' },
  '4:5': { width: 1080, height: 1350, label: 'Портрет (4:5)' },
};

export const COLOR_PALETTES = [
  { bg: '#ffffff', text: '#000000', name: 'Classic' },
  { bg: '#000000', text: '#ffffff', name: 'Dark' },
  { bg: '#fef3c7', text: '#92400e', name: 'Amber' },
  { bg: '#ecfdf5', text: '#065f46', name: 'Emerald' },
  { bg: '#eef2ff', text: '#3730a3', name: 'Indigo' },
  { bg: '#fff1f2', text: '#9f1239', name: 'Rose' },
  { bg: '#fafaf9', text: '#1c1917', name: 'Stone' },
];

export const EXAMPLE_TEXT = `Как создать идеальную карусель? 🚀

1. Начните с сильного заголовка. Первый слайд должен зацепить внимание за 2 секунды.

2. Один слайд — одна мысль. Не перегружайте пользователя текстом.

3. Используйте контрастные цвета. Текст должен легко читаться даже на ярком солнце.

4. Призыв к действию в конце. Попросите сохранить пост или оставить комментарий.

Попробуйте наш инструмент Content Carousel прямо сейчас! ✨`;

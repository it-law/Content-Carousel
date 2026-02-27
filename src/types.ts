export type AspectRatio = '1:1' | '4:5';

export interface CardStyle {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface CarouselCard {
  id: string;
  text: string;
  style: CardStyle;
}

export interface CarouselConfig {
  aspectRatio: AspectRatio;
  globalStyle: CardStyle;
}

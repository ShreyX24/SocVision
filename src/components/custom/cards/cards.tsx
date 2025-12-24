import { ReactNode, CSSProperties } from 'react';

type CardStyle = 'square' | 'square_rounded' | 'circle';

interface CardsProps {
  card_style?: CardStyle;
  children?: ReactNode;
  className?: string;
  isPinned?: boolean;
  style?: CSSProperties;
}

export const Cards = ({
  card_style = 'square_rounded',
  children,
  className = '',
  style,
}: CardsProps) => {
  const borderRadiusStyles: Record<CardStyle, string> = {
    square: 'rounded-none',
    square_rounded: 'rounded-[4px]',
    circle: 'rounded-full',
  };

  const borderWidthStyles: Record<CardStyle, string> = {
    square: 'border-4',
    square_rounded: 'border-[3px]',
    circle: 'border-2',
  };

  return (
    <div className="relative w-full" style={style}>
      <div
        className="absolute inset-0 translate-x-[3px] translate-y-[3px] bg-black rounded-[4px]"
      />
      <div
        className={`${className} ${borderRadiusStyles[card_style]} ${borderWidthStyles[card_style]} bg-[#89ddd6] relative z-10 w-full border-gray-900 font-bold outline-none translate-x-0 translate-y-0`}
      >
        {children}
      </div>
    </div>
  );
};

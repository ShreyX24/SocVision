import { ColorPalette } from '../../types';

interface FooterProps {
  colors: ColorPalette;
}

export const Footer = ({ colors }: FooterProps) => {
  const year = new Date().getFullYear();

  return (
    <div
      className="border-t-[4px] border-gray-900 px-4 py-1 flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: colors.headerBg }}
    >
      <p className="text-sm font-bold" style={{ color: colors.headerText }}>
        Developed by <span className="font-black">Shreyansh Tripathy & Satyajit Bhuyan</span> @ Intel SiV Gaming LAB - {year}
      </p>
    </div>
  );
};

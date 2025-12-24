interface BtnBgShadowProps {
  borderRadius?: '0' | '3' | '4' | '14' | '100';
  translate?: '0' | '1' | '2' | '4' | '6';
  className?: string;
}

export const BtnBgShadow = ({
  borderRadius = '3',
  translate = '2',
  className = '',
}: BtnBgShadowProps) => {
  const radiusClasses: Record<string, string> = {
    '0': 'rounded-none',
    '3': 'rounded-[3px]',
    '4': 'rounded-[4px]',
    '14': 'rounded-[14px]',
    '100': 'rounded-full',
  };

  const translateClass: Record<string, string> = {
    '0': 'translate-[0px]',
    '1': 'translate-[1px]',
    '2': 'translate-[2px]',
    '4': 'translate-[4px]',
    '6': 'translate-[6px]',
  };

  const radiusClass = radiusClasses[borderRadius] || 'rounded-[3px]';

  return (
    <div
      className={`${translateClass[translate]} absolute inset-0 h-full w-full ${radiusClass} bg-black ${className}`}
    ></div>
  );
};

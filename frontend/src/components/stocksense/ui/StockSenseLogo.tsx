import React from 'react';

interface StockSenseLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  imgClassName?: string;
}

export const StockSenseLogo: React.FC<StockSenseLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = false,
  className = '',
  imgClassName = '',
}) => {
  const sizeMap = {
    xs: { img: 'w-6 h-6', text: 'text-sm', sub: 'text-[8px]' },
    sm: { img: 'w-8 h-8', text: 'text-base', sub: 'text-[9px]' },
    md: { img: 'w-10 h-10', text: 'text-lg', sub: 'text-[10px]' },
    lg: { img: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { img: 'w-20 h-20', text: 'text-3xl', sub: 'text-xs' },
    hero: { img: 'w-28 h-28 sm:w-36 sm:h-36', text: 'text-4xl sm:text-5xl', sub: 'text-xs sm:text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative ${currentSize.img} rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0 shadow-2xs`}
      >
        <img
          src="/stocksense-logo.jpg"
          alt="StockSense Logo"
          className={`w-full h-full object-cover object-center ${imgClassName}`}
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-semibold tracking-tight text-slate-900 ${currentSize.text} leading-none font-['Space_Grotesk']`}>
            Stock<span className="text-blue-600 font-bold">Sense</span>
          </span>

          {showSubtitle && (
            <span className={`text-slate-400 ${currentSize.sub} mt-0.5 font-mono uppercase tracking-wider`}>
              Inventory System
            </span>
          )}
        </div>
      )}
    </div>
  );
};

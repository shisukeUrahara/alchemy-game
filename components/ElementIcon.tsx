import React from 'react';

interface Props {
  name: string;
  emoji: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  isNew?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export const ElementIcon: React.FC<Props> = ({ name, emoji, color, size = 'md', isNew, onMouseDown }) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-20 h-20 text-3xl',
    lg: 'w-32 h-32 text-6xl',
  };

  return (
    <div
      onMouseDown={onMouseDown}
      className={`
        relative flex flex-col items-center justify-center 
        select-none cursor-grab active:cursor-grabbing
        transition-transform duration-200 hover:scale-105
        ${isNew ? 'animate-bounce' : ''}
      `}
    >
      <div
        className={`
          ${sizeClasses[size]} 
          rounded-full shadow-lg flex items-center justify-center
          border-2 border-white/20 backdrop-blur-sm
          transition-all duration-300
        `}
        style={{
          background: `linear-gradient(135deg, ${color}40, ${color}90)`,
          boxShadow: `0 0 20px ${color}60`,
        }}
      >
        <span className="filter drop-shadow-md">{emoji}</span>
      </div>
      <span className="mt-1 text-xs font-medium text-white/90 bg-black/50 px-2 py-0.5 rounded-full max-w-[100px] truncate">
        {name}
      </span>
    </div>
  );
};

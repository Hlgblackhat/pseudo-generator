import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  colorTheme?: 'brand' | 'amber' | 'violet';
}

const themeClasses = {
  brand: {
    ring: 'focus:ring-brand-primary',
    border: 'focus:border-brand-primary',
    text: 'text-brand-primary',
    bg: 'bg-brand-primary/10',
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-800'
  },
  amber: {
    ring: 'focus:ring-amber-500/20',
    border: 'focus:border-amber-500',
    text: 'text-amber-500',
    bg: 'bg-amber-500/10',
    hover: 'hover:bg-amber-50 dark:hover:bg-amber-500/10'
  },
  violet: {
    ring: 'focus:ring-violet-500/20',
    border: 'focus:border-violet-500',
    text: 'text-violet-500',
    bg: 'bg-violet-500/10',
    hover: 'hover:bg-violet-50 dark:hover:bg-violet-500/10'
  }
};

export default function CustomSelect({ value, onChange, options, colorTheme = 'brand' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const theme = themeClasses[colorTheme];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative group w-full" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white flex justify-between items-center transition-all ${isOpen ? theme.border + ' ring-2 ' + theme.ring : 'hover:border-slate-300 dark:hover:border-slate-600'}`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 ' + theme.text : 'group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isSelected 
                      ? `${theme.bg} ${theme.text} font-bold` 
                      : `text-slate-600 dark:text-slate-300 ${theme.hover}`
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

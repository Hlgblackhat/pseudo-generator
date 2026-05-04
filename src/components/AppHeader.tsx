import { Link } from 'react-router-dom';
import { Home, BookOpen, Github } from 'lucide-react';
import { ModeToggle } from './mode-toggle';
import MainNavigation from './MainNavigation';

const AppHeader = () => {
    return (
        <header className="px-6 py-3 border-b border-slate-200 dark:border-border-subtle bg-white/80 dark:bg-bg-card/80 backdrop-blur-xl flex justify-between items-center z-50 shrink-0 shadow-sm transition-colors w-full">
            <div className="flex items-center gap-3">
                <Link to="/" className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-lg shadow-sm hover:scale-105 transition-transform shrink-0">
                    <Home className="w-5 h-5" />
                </Link>
                <div className="flex items-baseline gap-2 overflow-hidden">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-widest uppercase truncate">
                        Pseudo<span className="text-brand-secondary italic">Gen</span>
                    </h1>
                    <span className="hidden sm:inline-block bg-slate-100 dark:bg-slate-800 text-[10px] font-black px-2 py-0.5 rounded border border-slate-200 dark:border-border-subtle text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        v1.2.0 official
                    </span>
                </div>
            </div>

            <div className="hidden md:block">
                <MainNavigation />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <Link
                    to="/doc"
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 shrink-0"
                    title="Documentación Técnica"
                >
                    <BookOpen size={18} />
                </Link>
                <a
                    href="https://github.com/Hlgblackhat/pseudo-generator"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 shrink-0"
                    title="Ver en GitHub"
                >
                    <Github size={18} />
                </a>
                <div className="shrink-0 scale-90 sm:scale-100">
                    <ModeToggle />
                </div>
            </div>
        </header>
    );
};

export default AppHeader;

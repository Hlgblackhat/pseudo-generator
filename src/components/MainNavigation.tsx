import { Link, useLocation } from 'react-router-dom';
import { Cpu, Activity, FlaskConical } from 'lucide-react';

const MainNavigation = () => {
  const location = useLocation();
  const path = location.pathname;

  const links = [
    { name: 'Generador', path: '/laboratory', icon: Cpu, color: 'text-sky-500', activeBg: 'border-sky-500' },
    { name: 'Variables', path: '/variables', icon: Activity, color: 'text-violet-500', activeBg: 'border-violet-500' },
    { name: 'Pruebas', path: '/stats', icon: FlaskConical, color: 'text-orange-500', activeBg: 'border-orange-500' },
  ];

  return (
    <nav className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/40 p-1 rounded-xl border border-slate-200 dark:border-border-subtle backdrop-blur-sm">
      {links.map((link) => {
        const isActive = path === link.path;
        const Icon = link.icon;
        
        return (
          <Link
            key={link.path}
            to={link.path}
            className={`
              flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all relative group
              ${isActive 
                ? 'bg-white dark:bg-bg-card shadow-sm text-slate-900 dark:text-white' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}
            `}
          >
            {isActive && (
                <div className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${link.activeBg.replace('border-', 'bg-')}`} />
            )}
            <Icon size={16} className={isActive ? link.color : 'group-hover:scale-110 transition-transform'} />
            <span className="hidden sm:block">{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MainNavigation;

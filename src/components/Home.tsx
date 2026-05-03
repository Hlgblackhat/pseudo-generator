import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Beaker, Activity, FileSpreadsheet, Cpu } from 'lucide-react';
import { ModeToggle } from './mode-toggle';

const Home: FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-bg-dark text-slate-900 dark:text-slate-100 font-sans flex flex-col items-center justify-center relative overflow-hidden transition-colors">
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-brand-primary/20 blur-[150px] rounded-full" />
      </div>

      <div className="absolute top-6 right-6 z-50">
        <ModeToggle />
      </div>

      <div className="z-10 flex flex-col items-center text-center max-w-3xl px-6">
        <div className="mb-8 p-4 bg-white dark:bg-bg-card rounded-3xl shadow-xl shadow-brand-primary/10 border border-slate-100 dark:border-border-subtle">
          <Beaker className="w-16 h-16 text-brand-primary" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
          Pseudo<span className="text-brand-primary italic">Gen</span> Suite
        </h1>
        <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 mb-12 max-w-xl font-medium">
          Plataforma avanzada para la simulación, generación y prueba empírica de números y variables pseudoaleatorias.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          
          {/* Card 1: Números Aleatorios */}
          <Link to="/laboratory" className="group bg-white dark:bg-bg-card p-8 rounded-3xl border border-slate-200 dark:border-border-subtle shadow-sm hover:shadow-xl hover:shadow-brand-primary/10 hover:border-brand-primary/50 transition-all text-left flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit relative z-10">
              <Cpu size={24} />
            </div>
            <div className="relative z-10 mt-2">
              <h2 className="text-2xl font-black tracking-tight mb-2">Números Aleatorios</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Genera secuencias uniformes usando 7 algoritmos matemáticos (LCG, BBS, LFSR, etc.) y aplícales pruebas de bondad de ajuste y homogeneidad.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">Generación</span>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">Pruebas Estadísticas</span>
              </div>
            </div>
          </Link>

          {/* Card 2: Variables Aleatorias */}
          <Link to="/variables" className="group bg-white dark:bg-bg-card p-8 rounded-3xl border border-slate-200 dark:border-border-subtle shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/50 transition-all text-left flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit relative z-10">
              <Activity size={24} />
            </div>
            <div className="relative z-10 mt-2">
              <h2 className="text-2xl font-black tracking-tight mb-2">Variables Aleatorias</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Transforma arreglos de números uniformes en distribuciones específicas (Exponencial, Poisson, Erlang, Binomial, Triangular) usando la transformada inversa.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">Transformación</span>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">Distribuciones</span>
              </div>
            </div>
          </Link>

        </div>
        
        <div className="mt-12 flex items-center gap-2 text-slate-400 text-xs font-medium">
          <FileSpreadsheet size={14} /> Soporte nativo para carga de datos vía Excel (.xlsx)
        </div>
      </div>
    </div>
  );
};

export default Home;

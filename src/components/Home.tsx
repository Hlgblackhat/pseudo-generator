import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Beaker, Activity, Cpu, Library, Github, BookOpen, Users } from 'lucide-react';
import { ModeToggle } from './mode-toggle';

const Home: FC = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-bg-dark text-slate-900 dark:text-slate-100 font-sans flex flex-col items-center relative overflow-hidden transition-colors">
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-slate-400 blur-[150px] rounded-full" />
      </div>

      <div className="absolute top-6 right-6 z-50">
        <ModeToggle />
      </div>

      <div className="z-10 flex flex-col items-center text-center max-w-5xl px-6 pt-16 pb-12">
        <div className="mb-6 p-4 bg-white dark:bg-bg-card rounded-3xl shadow-xl shadow-black/5 border border-slate-100 dark:border-border-subtle">
          <Beaker className="w-12 h-12 text-slate-900 dark:text-white" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
          Pseudo<span className="text-slate-900 dark:text-white italic">Gen</span>
        </h1>
        <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-xl font-medium">
          Un pequeño proyecto que armamos para generar, validar y jugar con números pseudoaleatorios sin complicarnos la vida.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <a 
            href="https://github.com/Hlgblackhat/pseudo-generator" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-black/10"
          >
            <Github size={18} /> Ver Repositorio
          </a>
          <Link 
            to="/doc/home"
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-2xl font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-black/5"
          >
            <BookOpen size={18} /> Documentación
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full lg:max-w-6xl">
          
          <Link to="/laboratory" className="group bg-white dark:bg-bg-card p-8 aspect-square rounded-[2.5rem] border border-slate-200 dark:border-border-subtle shadow-sm hover:shadow-2xl hover:shadow-sky-500/10 hover:border-sky-500 transition-all flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 dark:bg-sky-900/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-125" />
            <div className="p-5 bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 rounded-3xl relative z-10 transition-transform group-hover:rotate-12">
              <Cpu size={32} />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black tracking-tight mb-2">Crear Números</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                Usa métodos clásicos (como Cuadrados Medios o LCG) para generar tus propios números uniformes.
              </p>
            </div>
          </Link>

          <Link to="/variables" className="group bg-white dark:bg-bg-card p-8 aspect-square rounded-[2.5rem] border border-slate-200 dark:border-border-subtle shadow-sm hover:shadow-2xl hover:shadow-violet-500/10 hover:border-violet-500 transition-all flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 dark:bg-violet-900/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-125" />
            <div className="p-5 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-3xl relative z-10 transition-transform group-hover:-rotate-12">
              <Activity size={32} />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black tracking-tight mb-2">Variables Aleatorias</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                Convierte esos números uniformes en distribuciones como Normal, Poisson o Exponencial.
              </p>
            </div>
          </Link>

          <Link to="/stats" className="group bg-white dark:bg-bg-card p-8 aspect-square rounded-[2.5rem] border border-slate-200 dark:border-border-subtle shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 hover:border-orange-500 transition-all flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 dark:bg-orange-900/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-125" />
            <div className="p-5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-3xl relative z-10 transition-transform group-hover:scale-110">
              <Library size={32} />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black tracking-tight mb-2">Ponerlos a Prueba</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                Mira si tus números de verdad son "aleatorios" aplicándoles pruebas como Chi-Cuadrado o Poker.
              </p>
            </div>
          </Link>

          <Link to="/queues" className="group bg-white dark:bg-bg-card p-8 aspect-square rounded-[2.5rem] border border-slate-200 dark:border-border-subtle shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500 transition-all flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-125" />
            <div className="p-5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-3xl relative z-10 transition-transform group-hover:scale-110">
              <Users size={32} />
            </div>
            <div className="relative z-10">
              <div className="inline-block px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-[9px] font-black text-indigo-600 dark:text-indigo-400 rounded uppercase tracking-tighter mb-1">Trabajo 2</div>
              <h2 className="text-2xl font-black tracking-tight mb-2">Teoría de Colas</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                Simula el flujo de usuarios en un sistema de 3 cajeros con diferentes configuraciones de servicio.
              </p>
            </div>
          </Link>

        </div>
      </div>

      <footer className="mt-auto w-full px-8 py-6 border-t border-slate-200 dark:border-border-subtle bg-white/50 dark:bg-bg-card/50 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6 relative z-20">
        <div className="text-center md:text-left">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Proyecto Académico</p>
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Ingeniería de Sistemas - Universidad de Cartagena</p>
        </div>
        
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                <img src="https://github.com/Hlgblackhat.png" className="w-8 h-8 rounded-full border-2 border-white dark:border-bg-card object-cover" title="Haider López" />
                <img src="https://github.com/Josetorresdev.png" className="w-8 h-8 rounded-full border-2 border-white dark:border-bg-card object-cover" title="José Torres" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desarrolladores</span>
           </div>
        </div>
        
        <div className="text-center md:text-right">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">© 2026 PseudoGen Project. Cartagena, CO.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

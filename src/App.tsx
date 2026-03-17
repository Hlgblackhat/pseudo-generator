import { useState, useCallback } from 'react';
import GeneratorForm from './components/GeneratorForm';
import ResultsDisplay from './components/ResultsDisplay';
import { ModeToggle } from './components/mode-toggle';
import { createGenerator } from './engines';
import type { GeneratorParams } from './engines';
import { motion } from 'framer-motion';
import {
  Beaker,
  BarChart3,
  Cpu,
  History,
  Activity,
  Sparkles,
  RefreshCw
} from 'lucide-react';

/**
 * Componente principal de la aplicación PseudoGen.
 * Gestiona el estado global de la generación, validación y visualización de resultados.
 */
function App() {
  // Estado para almacenar los números generados en la secuencia actual
  const [numbers, setNumbers] = useState<number[]>([]);
  // Indica si el motor está trabajando actualmente en la generación de números
  const [isGenerating, setIsGenerating] = useState(false);
  // Almacena el nombre del algoritmo activo para mostrarlo en la UI
  const [methodName, setMethodName] = useState("Lineal Congruencial (Mixto)");

  // Estado para los resultados de la validación matemática y predicción de periodo
  const [validation, setValidation] = useState<{ errors: string[]; warnings: string[]; isFullPeriod: boolean }>({
    errors: [],
    warnings: [],
    isFullPeriod: false
  });

  // Información sobre la entropía inyectada si se usa el reloj del sistema
  const [entropyInfo, setEntropyInfo] = useState<{ active: boolean; offset: number }>({ active: false, offset: 0 });

  // Estado para la detección de ciclos (periodos) en la secuencia generada
  const [repeatState, setRepeatState] = useState<{ firstValue: number | null; repeatIndex: number | null }>({
    firstValue: null,
    repeatIndex: null
  });

  // Almacena los últimos parámetros usados para poder autoevaluar y hacer sugerencias
  const [lastParams, setLastParams] = useState<GeneratorParams | null>(null);

  /**
   * Función principal que orquestra la generación de números.
   * Instancia el motor seleccionado, valida parámetros y genera la secuencia asíncronamente
   * para no bloquear el hilo principal de la UI.
   */
  const startGeneration = useCallback(async (params: GeneratorParams) => {
    let semillaFinal = params.seed;
    let desplazamiento = 0;

    // Si se activa la entropía temporal, se suma el offset del reloj de sistema
    if (params.useTimeEntropy) {
      desplazamiento = Date.now() % 1000;
      semillaFinal = (params.seed + desplazamiento) % (params.m || 1000);
    }

    setEntropyInfo({ active: params.useTimeEntropy, offset: desplazamiento });

    // Guardar los parámetros actuales para posibles auto-correcciones
    setLastParams(params);

    // Instanciación del motor seleccionado mediante la factoría
    const motor = createGenerator(params.method, { ...params, seed: semillaFinal });
    setMethodName(motor.name);

    // Validación matemática (ej. Teorema de Hull-Dobell)
    const resultado = motor.validateParams();
    const esPeriodoCompleto = resultado.isValid && (resultado.warnings?.length === 0 || !resultado.warnings);

    setValidation({
      errors: resultado.errors,
      warnings: resultado.warnings || [],
      isFullPeriod: esPeriodoCompleto
    });

    // Detener si hay errores críticos en los parámetros
    if (!resultado.isValid) return;

    setIsGenerating(true);
    setNumbers([]);
    setRepeatState({ firstValue: null, repeatIndex: null });

    // Limitar la generación según el módulo m o un límite de seguridad para evitar bloqueos
    const totalAGenerar = params.m + 1;
    let numerosLocales: number[] = [];
    let valoresVistos = new Map<number, number>();
    let primerGenerado: number | null = null;
    let cicloDetectado = false;

    const LIMITE_SEGURIDAD = 20000;
    const limiteFinal = Math.min(totalAGenerar, LIMITE_SEGURIDAD);

    // Bucle de generación asíncrona por lotes (batching)
    for (let i = 0; i < limiteFinal; i++) {
      const siguienteNum = motor.next();
      if (i === 0) primerGenerado = siguienteNum;

      // Detección de ciclo: verifica si el número ya existía en la secuencia
      if (!cicloDetectado && valoresVistos.has(siguienteNum)) {
        cicloDetectado = true;
        setRepeatState({ firstValue: primerGenerado, repeatIndex: i });
      } else if (!cicloDetectado) {
        valoresVistos.set(siguienteNum, i);
      }

      numerosLocales.push(siguienteNum);

      // Actualización de la UI por lotes para mantener fluidez visual
      if (i % (limiteFinal > 500 ? 100 : 10) === 0 || i === limiteFinal - 1) {
        setNumbers([...numerosLocales]);
        if (i === 0) setRepeatState(prev => ({ ...prev, firstValue: primerGenerado }));

        // Pequeño delay para permitir que el navegador renderice los frames
        const retraso = limiteFinal > 1000 ? 1 : 10;
        await new Promise(resolve => setTimeout(resolve, retraso));
      }
    }

    setIsGenerating(false);
  }, []);

  /**
   * Ejecuta la sugerencia inteligente desde el motor y actualiza tanto el formulario como los resultados.
   */
  const handleAutoCorrect = useCallback(() => {
    if (!lastParams) return;
    const motor = createGenerator(lastParams.method, lastParams);
    const sugerencias = motor.suggestParams();
    const nuevosParams = { ...lastParams, ...sugerencias };
    
    // Disparamos un evento para que GeneradorForm actualice sus inputs visuales
    window.dispatchEvent(new CustomEvent('applyAutoCorrect', { detail: nuevosParams }));
    
    // Ejecutamos el algoritmo con los nuevos parámetros saneados
    startGeneration(nuevosParams);
  }, [lastParams, startGeneration]);

  /**
   * Genera dinámicamente el título del panel de análisis según el método.
   */
  const getValidationTitle = () => {
    if (!lastParams) return 'Predicción Inicial';
    switch (lastParams.method) {
      case 'mixed': return 'Análisis Hull-Dobell';
      case 'multiplicative': return 'Análisis Módulo-Potencia';
      case 'additive': return 'Análisis de Retrasos';
      case 'middle_square': return 'Análisis de Von Neumann';
      case 'lfsr': return 'Análisis Polinomial LFSR';
      default: return 'Predicción de Periodo';
    }
  };

  return (
    <div className="h-screen bg-[#f8fafc] dark:bg-bg-dark text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-primary selection:text-white flex flex-col overflow-hidden transition-colors">

      {/* Ambiente Visual de Fondo */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 blur-[120px] rounded-full" />
      </div>

      {/* Cabecera Principal */}
      <header className="px-6 py-3 border-b border-slate-200 dark:border-border-subtle bg-white/80 dark:bg-bg-card/80 backdrop-blur-xl flex justify-between items-center z-20 shrink-0 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-black dark:bg-brand-primary text-white rounded-lg shadow-sm">
            <Beaker className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-widest uppercase">
            Pseudo<span className="text-brand-primary italic">Gen</span>
          </h1>
          <span className="bg-slate-100 dark:bg-slate-800 text-[8px] font-black px-2 py-0.5 rounded border border-slate-200 dark:border-border-subtle text-slate-500 uppercase ml-2 tracking-widest">v2.5 Lab</span>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isGenerating ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${isGenerating ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
              {isGenerating ? 'Muestreando' : 'En Espera'}
            </span>
          </div>
          <ModeToggle />
        </div>
      </header>

      {/* Espacio de Trabajo de 3 Columnas */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4 relative z-10">

        {/* IZQUIERDA: Controles del Dashboard */}
        <aside className="w-72 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar pr-1">
          <GeneratorForm onGenerate={startGeneration} isLoading={isGenerating} />

          {/* Registro de Entropía Temporal */}
          <div className="bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-2xl p-4 space-y-3 shadow-sm transition-colors">
            <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-400 tracking-widest uppercase flex items-center gap-2">
              <History size={12} className="text-brand-primary" /> Log de Entropía
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500 font-medium">Estado:</span>
                <span className={entropyInfo.active ? 'text-green-600 font-bold' : 'text-slate-400'}>
                  {entropyInfo.active ? 'ACTIVO' : 'LISTO'}
                </span>
              </div>
              {entropyInfo.active && (
                <div className="p-2 bg-slate-50 dark:bg-bg-dark rounded-lg border border-slate-100 dark:border-border-subtle">
                  <p className="text-[9px] text-slate-600 dark:text-slate-400 leading-tight tabular-nums italic">
                    Desplazamiento: +{entropyInfo.offset}ms
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/50 dark:bg-bg-card/50 border border-slate-100 dark:border-border-subtle border-dashed rounded-2xl p-4 flex-1 flex flex-col items-center justify-center opacity-40 transition-colors">
            <Activity size={32} className="text-slate-300 dark:text-slate-300 mb-2" />
            <p className="text-[8px] uppercase font-black text-slate-400 tracking-[0.2em]">Señal Lista</p>
          </div>
        </aside>

        <section className="flex-1 flex flex-col overflow-hidden">
          <ResultsDisplay
            numbers={numbers}
            repeatIndex={repeatState.repeatIndex}
            methodName={methodName}
          />
        </section>

        {/* DERECHA: Analítica del Laboratorio */}
        <aside className="w-72 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar pl-1">

          {/* Estado del Ciclo (Determinismo) */}
          <div className={`p-5 rounded-3xl border transition-all duration-500 shadow-sm ${repeatState.repeatIndex ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400' : 'bg-white dark:bg-bg-card border-slate-200 dark:border-border-subtle'}`}>
            <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-3">
              <Cpu size={14} className={repeatState.repeatIndex ? 'text-rose-500 rotate-180' : 'text-slate-400'} />
              Análisis de Ciclo
            </h3>
            {repeatState.repeatIndex ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="text-3xl font-black tabular-nums">#{repeatState.repeatIndex + 1}</span>
                  <span className="text-[8px] font-black uppercase">Fase</span>
                </div>
                <p className="text-[9px] text-rose-500 dark:text-rose-400 uppercase leading-none font-bold">Determinismo detectado</p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-slate-400 italic font-medium">Buscando ciclos en la secuencia...</p>
            )}
          </div>

          {/* Validación Matemática y Predicciones */}
          <div className="bg-white dark:bg-bg-card p-5 rounded-3xl border border-slate-200 dark:border-border-subtle space-y-4 shadow-sm transition-colors">
            <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-brand-primary" /> {getValidationTitle()}
            </h3>

            <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black text-center border ${validation.isFullPeriod ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400'}`}>
              {validation.isFullPeriod ? 'ÓPTIMO (Periodo m)' : 'SUB-ÓPTIMO (Periodo < m)'}
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
              {validation.errors.length > 0 ? (
                validation.errors.map((err, i) => (
                  <div key={i} className="text-[9px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg border border-rose-100 dark:border-rose-900 italic">
                    {err}
                  </div>
                ))
              ) : validation.isFullPeriod ? (
                <p className="text-[9px] text-green-600 dark:text-green-400 italic leading-snug font-medium">
                  Condiciones cumplidas. El generador recorrerá exactamente {numbers.length > 0 ? numbers.length : 'm'} estados únicos.
                </p>
              ) : (
                validation.warnings.map((warn, i) => (
                  <div key={i} className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900 italic">
                    {warn}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel Inteligente de Auto-Corrección (Sugerencia Lab) */}
          {!validation.isFullPeriod && lastParams && validation.warnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-3xl border border-amber-200 dark:border-amber-900 space-y-3 shadow-sm transition-colors animation-fade-in">
              <h3 className="text-[10px] font-black text-amber-900 dark:text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} /> Sugerencia Lab
              </h3>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium italic leading-relaxed">
                Los parámetros escogidos no te generan un ciclo completo. Prueba con valores analizados matemáticamente.
              </p>
              <button 
                onClick={handleAutoCorrect}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest py-2 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} />
                AUTO-CORREGIR
              </button>
            </div>
          )}

          {/* Estadísticas en Tiempo Real */}
          <div className="bg-white dark:bg-bg-card p-5 rounded-3xl border border-slate-200 dark:border-border-subtle space-y-4 flex-1 shadow-sm transition-colors">
            <h4 className="text-[9px] font-black text-brand-primary uppercase tracking-widest">Estadísticas Lab</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 dark:text-slate-400">
                  <span>Media (&mu;)</span>
                  <span className="text-slate-900 dark:text-white tabular-nums">
                    {numbers.length > 0 ? (numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(4) : "0.0000"}
                  </span>
                </div>
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-primary"
                    initial={{ width: 0 }}
                    animate={{ width: numbers.length > 0 ? `${(numbers.reduce((a, b) => a + b, 0) / numbers.length) * 100}%` : 0 }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-border-subtle">
                <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 dark:text-slate-400">
                  <span>Eficiencia</span>
                  <span className={validation.isFullPeriod ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                    {validation.isFullPeriod ? '100%' : '55%'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1" />
            <div className="pt-4 flex justify-center opacity-20 transition-opacity">
              <BarChart3 size={48} className="text-slate-900 dark:text-white" />
            </div>
          </div>

        </aside>

      </main>

      {/* Estilos Personalizados para Barras de Desplazamiento */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

/**
 * Icono de Escudo de Validación (SVG Personalizado)
 */
const ShieldCheck = ({ size, className }: { size: number, className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
);

export default App;

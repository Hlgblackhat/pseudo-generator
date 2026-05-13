import { useState, useCallback, useRef } from 'react';
import GeneratorForm from './GeneratorForm';
import ResultsDisplay from './ResultsDisplay';
import { createGenerator } from '../engines';
import type { GeneratorParams } from '../engines';
// Removed unused motion import
import ExcelUploader from './ExcelUploader';
import { setSharedNumbers, setSharedGeneratorConfig } from '../store/dataStore';
import { exportGeneratorToExcel } from '../utils/excelExport';
// Removed unused imports
import {
  Cpu,
  History,
  Sparkles,
  RefreshCw,
  FlaskConical,
  ShieldCheck
} from 'lucide-react';
import AppHeader from './AppHeader';

function Laboratory() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [methodName, setMethodName] = useState("Lineal Congruencial (Mixto)");
  const [validation, setValidation] = useState<{ errors: string[]; warnings: string[]; isFullPeriod: boolean }>({
    errors: [],
    warnings: [],
    isFullPeriod: false
  });
  const [entropyInfo, setEntropyInfo] = useState<{ active: boolean; offset: number }>({ active: false, offset: 0 });
  const [repeatState, setRepeatState] = useState<{ firstValue: number | null; repeatIndex: number | null }>({
    firstValue: null,
    repeatIndex: null
  });
  const [lastParams, setLastParams] = useState<GeneratorParams | null>(null);
  const [simulationTime, setSimulationTime] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Refs para mantener el estado entre pausas
  const stopRef = useRef(false);
  const isPausedRef = useRef(false);
  const motorRef = useRef<any>(null);
  const numerosLocalesRef = useRef<number[]>([]);
  const valoresVistosRef = useRef<Map<number, number>>(new Map());
  const currentIndexRef = useRef(0);
  const startTimeRef = useRef(0);
  const accumulatedTimeRef = useRef(0);
  const limiteFinalRef = useRef(0);
  const primerGeneradoRef = useRef<number | null>(null);
  const cicloDetectadoRef = useRef(false);
  // Ref que indica si el generador activo tiene un estado interno de múltiples valores.
  // Para LFG y LFSR, detectar un valor repetido NO significa que el ciclo comenzó.
  const isMultiStateGeneratorRef = useRef(false);

  const stopGeneration = useCallback(() => {
    stopRef.current = true;
    isPausedRef.current = false;
    setIsPaused(false);
    // Si estaba pausado, el bucle no está corriendo para detectar el stopRef,
    // así que forzamos la finalización del estado de generación aquí.
    if (isGenerating) {
        setIsGenerating(false);
        // Sincronizar tiempo final
        setSimulationTime(accumulatedTimeRef.current);
    }
  }, [isGenerating]);

  const pauseGeneration = useCallback(() => {
    isPausedRef.current = true;
    setIsPaused(true);
    // Calcular tiempo acumulado hasta la pausa
    accumulatedTimeRef.current += performance.now() - startTimeRef.current;
  }, []);



  const runGenerationLoop = useCallback(async () => {
    startTimeRef.current = performance.now();
    
    for (let i = currentIndexRef.current; i < limiteFinalRef.current; i++) {
      if (stopRef.current || isPausedRef.current) {
        currentIndexRef.current = i;
        break;
      }

      const siguienteNum = motorRef.current.next();
      if (i === 0) primerGeneradoRef.current = siguienteNum;
      
      if (!cicloDetectadoRef.current && !isMultiStateGeneratorRef.current && valoresVistosRef.current.has(siguienteNum)) {
        cicloDetectadoRef.current = true;
        setRepeatState({ firstValue: primerGeneradoRef.current, repeatIndex: i });
      } else if (!cicloDetectadoRef.current && !isMultiStateGeneratorRef.current) {
        valoresVistosRef.current.set(siguienteNum, i);
      }
      
      numerosLocalesRef.current.push(siguienteNum);

      if (i % (limiteFinalRef.current > 500 ? 100 : 10) === 0 || i === limiteFinalRef.current - 1) {
        setNumbers([...numerosLocalesRef.current]);
        setSharedNumbers([...numerosLocalesRef.current]);
        if (i === 0) setRepeatState(prev => ({ ...prev, firstValue: primerGeneradoRef.current }));
        
        const retraso = limiteFinalRef.current > 1000 ? 1 : 10;
        await new Promise(resolve => setTimeout(resolve, retraso));
      }
    }

    if (!isPausedRef.current) {
      const finalTime = accumulatedTimeRef.current + (performance.now() - startTimeRef.current);
      setSimulationTime(finalTime);
      setIsGenerating(false);
      setIsPaused(false);
    }
  }, []);

  const startGeneration = useCallback(async (params: GeneratorParams) => {
    // Resetear todo para una nueva ejecución
    let semillaFinal = params.seed;
    let desplazamiento = 0;
    if (params.useTimeEntropy) {
      desplazamiento = Date.now() % 1000;
      semillaFinal = (params.seed + desplazamiento) % (params.m || 1000);
    }
    
    setEntropyInfo({ active: params.useTimeEntropy, offset: desplazamiento });
    setLastParams(params);
    
    const motor = createGenerator(params.method, { ...params, seed: semillaFinal });
    setMethodName(motor.name);
    
    setSharedGeneratorConfig({ ...params, seed: semillaFinal, methodName: motor.name });
    
    const resultado = motor.validateParams();
    const esPeriodoCompleto = resultado.isValid && (resultado.warnings?.length === 0 || !resultado.warnings);
    
    setValidation({
      errors: resultado.errors,
      warnings: resultado.warnings || [],
      isFullPeriod: esPeriodoCompleto
    });

    if (!resultado.isValid) return;

    // Inicializar refs de estado
    motorRef.current = motor;
    numerosLocalesRef.current = [];
    valoresVistosRef.current = new Map();
    currentIndexRef.current = 0;
    accumulatedTimeRef.current = 0;
    cicloDetectadoRef.current = false;
    primerGeneradoRef.current = null;
    // LFG y LFSR tienen estado multi-valor: un valor repetido NO es ciclo
    isMultiStateGeneratorRef.current = (
      params.method === 'lfg' || params.method === 'lfsr'
    );
    
    const totalAGenerar = params.count || (params.m + 1);
    const LIMITE_SEGURIDAD = 20000;
    limiteFinalRef.current = Math.min(totalAGenerar, LIMITE_SEGURIDAD);

    setIsGenerating(true);
    setIsPaused(false);
    stopRef.current = false;
    isPausedRef.current = false;
    setNumbers([]);
    setRepeatState({ firstValue: null, repeatIndex: null });

    await runGenerationLoop();
  }, [runGenerationLoop]);

  const resumeGeneration = useCallback(async () => {
    setIsPaused(false);
    isPausedRef.current = false;
    await runGenerationLoop();
  }, [runGenerationLoop]);

  const handleAutoCorrect = useCallback(() => {
    if (!lastParams) return;
    const motor = createGenerator(lastParams.method, lastParams);
    const sugerencias = motor.suggestParams();
    const nuevosParams = { ...lastParams, ...sugerencias };
    window.dispatchEvent(new CustomEvent('applyAutoCorrect', { detail: nuevosParams }));
    startGeneration(nuevosParams);
  }, [lastParams, startGeneration]);

  const getValidationTitle = () => {
    if (!lastParams) return 'Predicción Inicial';
    switch (lastParams.method) {
      case 'mixed': return 'Análisis Hull-Dobell';
      case 'multiplicative': return 'Análisis Módulo-Potencia';
      case 'additive': return 'Análisis de Retrasos';
      case 'middle_square': return 'Análisis de Von Neumann';
      case 'lfsr': return 'Análisis Polinomial LFSR';
      case 'bbs': return 'Análisis de Primos BBS';
      case 'lfg': return 'Análisis de Retraso LFG';
      default: return 'Predicción de Periodo';
    }
  };

  const getValidationBadge = () => {
    if (!lastParams) return 'PREDICCIÓN INICIAL';
    if (!validation.isFullPeriod) return 'SUB-ÓPTIMO (Periodo < m)';
    switch (lastParams.method) {
      case 'mixed': return 'ÓPTIMO (Periodo m)';
      case 'multiplicative': return 'ÓPTIMO (Periodo Máx Posible)';
      case 'additive': return 'VALIDADO (Configuración)';
      case 'middle_square': return 'VALIDADO (Experimental)';
      case 'lfsr': return 'ÓPTIMO (Semilla Válida)';
      case 'bbs': return 'ENCRIPTACIÓN SEGURA';
      case 'lfg': return 'PERIODO LARGO (LFG)';
      default: return 'ÓPTIMO';
    }
  };

  const getValidationSuccessMessage = () => {
    if (!lastParams) return 'Configura y ejecuta para obtener predicciones.';
    switch (lastParams.method) {
      case 'mixed': return `Condiciones cumplidas. El generador recorrerá exactamente ${numbers.length > 0 ? numbers.length : 'm'} estados únicos.`;
      case 'multiplicative': return 'Condiciones cumplidas. El periodo es el máximo posible para el módulo configurado.';
      case 'additive': return 'Parámetros válidos para comenzar la simulación aditiva según los retrasos.';
      case 'middle_square': return 'Semilla aceptada. El algoritmo empírico está listo para iniciar.';
      case 'lfsr': return 'Semilla no nula validada. Polinomio de retroalimentación acoplado.';
      case 'bbs': return 'Primos p y q validados. El producto M generará un ciclo de alta seguridad.';
      case 'lfg': return 'Buffer inicializado. La secuencia de rezago histórico está activa.';
      default: return 'Parámetros validados correctamente (Periodo Completo).';
    }
  };

  return (
    <div className="h-screen bg-[#f8fafc] dark:bg-bg-dark text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-primary selection:text-white flex flex-col overflow-hidden transition-colors">
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 blur-[120px] rounded-full" />
      </div>

      <AppHeader />

      <main className="flex-1 flex overflow-hidden p-6 gap-6 relative z-10">
        <aside className="w-96 flex flex-col gap-5 shrink-0 overflow-y-auto custom-scrollbar pr-1">
          <GeneratorForm 
            onGenerate={startGeneration} 
            isLoading={isGenerating} 
            isPaused={isPaused}
            onPause={pauseGeneration}
            onResume={resumeGeneration}
            onStop={stopGeneration} 
          />
          
          <div className="bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-lg p-4 space-y-3 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <History size={14} className="text-sky-500" /> Configuración Motor
              </h3>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${isGenerating ? (isPaused ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200' : 'bg-sky-50 dark:bg-sky-900/30 border-sky-200') : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                <div className={`w-1 h-1 rounded-full ${isGenerating ? (isPaused ? 'bg-amber-500' : 'bg-sky-500 animate-pulse') : 'bg-slate-400'}`} />
                <span className={`text-[10px] font-black uppercase tracking-tighter ${isGenerating ? (isPaused ? 'text-amber-600 dark:text-amber-400' : 'text-sky-600 dark:text-sky-400') : 'text-slate-400'}`}>
                    {isGenerating ? (isPaused ? 'Pausado' : 'Muestreando') : 'En Espera'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium text-xs">Estado:</span>
                <span className={entropyInfo.active ? 'text-green-600 font-bold' : 'text-slate-400'}>
                  {entropyInfo.active ? 'ACTIVO' : 'LISTO'}
                </span>
              </div>
              {entropyInfo.active && (
                <div className="p-2 bg-slate-50 dark:bg-bg-dark rounded-lg border border-slate-100 dark:border-border-subtle">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight tabular-nums italic">
                    Desplazamiento: +{entropyInfo.offset}ms
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="flex-1 flex flex-col overflow-hidden">
          <ResultsDisplay
            numbers={numbers}
            isGenerating={isGenerating}
            isPaused={isPaused}
            repeatIndex={repeatState.repeatIndex}
            methodName={methodName}
            simulationTime={simulationTime}
            onDownload={() => exportGeneratorToExcel(numbers, methodName)}
            emptyStateAction={
              <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto py-12">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner relative group overflow-hidden">
                    <div className="absolute inset-0 bg-sky-500/5 scale-0 group-hover:scale-150 transition-transform duration-700 rounded-full" />
                    <Sparkles size={32} className="text-sky-500 relative z-10" />
                </div>
                
                <div className="space-y-2 text-center">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Generar Números</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Mete los datos en el panel izquierdo para empezar a generar números, o sube tu propio archivo de Excel si ya tienes unos.
                    </p>
                </div>

                <div className="w-full pt-4">
                    <div className="p-1 bg-slate-50 dark:bg-bg-dark rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <ExcelUploader onNumbersExtracted={(nums) => {
                          setNumbers(nums);
                          setSharedNumbers(nums);
                          setSharedGeneratorConfig(null);
                          setMethodName("Datos Importados (Excel)");
                          setRepeatState({ firstValue: null, repeatIndex: null });
                          setValidation({ errors: [], warnings: [], isFullPeriod: true });
                        }} />
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-700">
                        <div className="h-px w-8 bg-current" />
                        ANÁLISIS EXTERNO DISPONIBLE
                        <div className="h-px w-8 bg-current" />
                    </div>
                </div>
              </div>
            }
          />
        </section>

        <aside className="w-96 flex flex-col gap-5 shrink-0 overflow-y-auto custom-scrollbar pl-1">
          {/* Cycle Analysis */}
          <div className={`p-5 rounded-xl border transition-all duration-500 shadow-sm ${repeatState.repeatIndex ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400' : 'bg-white dark:bg-bg-card border-slate-200 dark:border-border-subtle'}`}>
            <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-3">
              <Cpu size={14} className={repeatState.repeatIndex ? 'text-rose-500 rotate-180' : 'text-slate-400'} /> Análisis de Ciclo
            </h3>
            {repeatState.repeatIndex ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="text-3xl font-black tabular-nums">#{repeatState.repeatIndex + 1}</span>
                  <span className="text-[8px] font-black uppercase">Fase</span>
                </div>
                <p className="text-[9px] text-rose-500 dark:text-rose-400 uppercase leading-none font-bold">¡Ciclo detectado!</p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-slate-400 italic font-medium">Esperando a ver si los números se repiten...</p>
            )}
          </div>

          {/* Mathematical Validation */}
          <div className="bg-white dark:bg-bg-card p-5 rounded-xl border border-slate-200 dark:border-border-subtle space-y-4 shadow-sm transition-colors">
            <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-sky-500" /> {getValidationTitle()}
            </h3>
            <div className={`px-4 py-2.5 rounded-lg text-xs font-black text-center border ${validation.isFullPeriod ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {getValidationBadge()}
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {validation.errors.length > 0 ? (
                validation.errors.map((err, i) => (
                  <div key={i} className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-100 dark:border-rose-900 italic font-medium">{err}</div>
                ))
              ) : validation.isFullPeriod ? (
                <p className="text-xs text-green-600 dark:text-green-400 italic leading-relaxed font-medium">{getValidationSuccessMessage()}</p>
              ) : (
                validation.warnings.map((warn, i) => (
                  <div key={i} className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 italic font-medium">{warn}</div>
                ))
              )}
            </div>
          </div>

          {!validation.isFullPeriod && lastParams && (validation.warnings.length > 0 || validation.errors.length > 0) && (
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm transition-colors animation-fade-in shrink-0">
              <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <FlaskConical size={14} className="text-sky-500" /> Un pequeño detalle
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium italic leading-relaxed">
                Parece que estos valores no cumplen con las reglas de Hull-Dobell, así que los números se repetirán más rápido de lo esperado.
              </p>
              <button onClick={handleAutoCorrect} className="w-full bg-sky-600 hover:bg-sky-700 text-white text-[9px] font-black uppercase tracking-widest py-2 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} /> AUTO-CORREGIR
              </button>
            </div>
          )}
        </aside>
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

// Removed local ShieldCheck component to avoid conflict with lucide-react import

export default Laboratory;

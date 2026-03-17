import { useState, useCallback, useEffect } from 'react';
import GeneratorForm from './components/GeneratorForm';
import ResultsDisplay from './components/ResultsDisplay';
import StatisticalCharts from './components/StatisticalCharts';
import { ModeToggle } from './components/mode-toggle';
import { createGenerator } from './engines';
import type { GeneratorParams } from './engines';
import { availableTests, runSelectedTests } from './tests';
import type { TestResult } from './tests';
import { motion, AnimatePresence } from 'framer-motion';
import pkg from '../package.json';
import {
  Beaker,
  BarChart3,
  Cpu,
  History,
  Activity,
  Sparkles,
  RefreshCw,
  Library,
  Maximize2,
  Minimize2,
  Github
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

  // Estado para la gestión de las Pruebas Estadísticas
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Estado para expandir el panel de analítica
  const [isLabExpanded, setIsLabExpanded] = useState(false);

  // Efecto que recalcula los resultados de las pruebas estadísticas
  // cuando la generación finaliza, o cuando el usuario activa/desactiva un checkbox posteriormente.
  useEffect(() => {
    if (!isGenerating && numbers.length > 0 && selectedTests.length > 0) {
      try {
        setTestResults(runSelectedTests(selectedTests, numbers));
      } catch (e) {
        console.error("Test Error", e);
      }
    } else if (selectedTests.length === 0) {
      setTestResults([]);
    }
  }, [isGenerating, numbers, selectedTests]);

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
      case 'bbs': return 'Análisis de Primos BBS';
      case 'lfg': return 'Análisis de Retraso LFG';
      default: return 'Predicción de Periodo';
    }
  };

  /**
   * Genera dinámicamente el texto del badge de estado.
   */
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

  /**
   * Genera dinámicamente el mensaje verde de éxito cuando se cumplen las condiciones de un método.
   */
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
          <span className="bg-slate-100 dark:bg-slate-800 text-[8px] font-black px-2 py-0.5 rounded border border-slate-200 dark:border-border-subtle text-slate-500 uppercase ml-2 tracking-widest text-[9px]">
            v{pkg.version} official
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isGenerating ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${isGenerating ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
              {isGenerating ? 'Muestreando' : 'En Espera'}
            </span>
          </div>
          <a
            href="https://github.com/Hlgblackhat/pseudo-generator"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-primary transition-all flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title="Ver Código en GitHub"
          >
            <Github size={18} />
          </a>
          <ModeToggle />
        </div>
      </header>

      {/* Espacio de Trabajo de 3 Columnas */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4 relative z-10">

        {/* IZQUIERDA: Controles del Dashboard */}
        <aside className="w-80 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar pr-1">
          <GeneratorForm onGenerate={startGeneration} isLoading={isGenerating} />

          {/* Registro de Entropía Temporal */}
          <div className="bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-lg p-4 space-y-3 shadow-sm transition-colors">
            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase flex items-center gap-2">
              <History size={14} className="text-brand-primary" /> Log de Entropía
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

          {/* Panel de Selección de Pruebas Estadísticas */}
          <div className="bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-lg p-4 space-y-3 shadow-sm transition-colors">
            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase flex items-center gap-2">
              <Library size={14} className="text-indigo-500" /> Pruebas Estadísticas
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed italic mb-2">
              Selecciona las pruebas empíricas a ejecutar sobre la secuencia terminada.
            </p>
            <div className="space-y-2">
              {Object.keys(availableTests).map((testId) => {
                const isSelected = selectedTests.includes(testId);
                return (
                  <label key={testId} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-900/20' : 'border-transparent'}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5 w-3 h-3 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 dark:bg-bg-dark"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTests(prev => [...prev, testId]);
                        else setSelectedTests(prev => prev.filter(v => v !== testId));
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white leading-tight">
                        {availableTests[testId].name}
                      </span>
                      <span className="text-[8px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                        {availableTests[testId].description}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
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
        <aside className="w-80 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar pl-1">

          {/* Estado del Ciclo (Determinismo) */}
          <div className={`p-5 rounded-xl border transition-all duration-500 shadow-sm ${repeatState.repeatIndex ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400' : 'bg-white dark:bg-bg-card border-slate-200 dark:border-border-subtle'}`}>
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
          <div className="bg-white dark:bg-bg-card p-5 rounded-xl border border-slate-200 dark:border-border-subtle space-y-4 shadow-sm transition-colors">
            <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-brand-primary" /> {getValidationTitle()}
            </h3>

            <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black text-center border ${validation.isFullPeriod ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400'}`}>
              {getValidationBadge()}
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
                  {getValidationSuccessMessage()}
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
            <div className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-xl border border-amber-200 dark:border-amber-900 space-y-3 shadow-sm transition-colors animation-fade-in shrink-0">
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

          {/* Estadísticas Lab y Resultados de Pruebas (Tarjeta lateral pequeña) */}
          <div className="bg-white dark:bg-bg-card p-5 rounded-xl border border-slate-200 dark:border-border-subtle space-y-4 flex-1 shadow-sm transition-colors flex flex-col shrink-0 min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <h4 className="text-[11px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={14} /> Estadísticas Lab
              </h4>
              <button
                onClick={() => setIsLabExpanded(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Expandir centro de diagnóstico"
              >
                <Maximize2 size={14} />
              </button>
            </div>

            {/* Estadísticas Básicas */}
            <div className="space-y-3 shrink-0">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
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

            {/* Diagnóstico Estadístico (Pruebas Empíricas) */}
            {testResults.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-border-subtle flex-1 min-h-0 flex flex-col gap-2">
                <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1 shrink-0">
                  <Library size={12} className="text-indigo-500" /> Diagnóstico Empírico
                </div>
                <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 flex-1">
                  {testResults.map((result, i) => (
                    <div key={i} className={`p-4 rounded-xl border flex flex-col gap-2 shrink-0 ${result.passed ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'}`}>
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate pr-2" title={result.name}>
                          {result.name}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${result.passed ? 'bg-green-200/50 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-rose-200/50 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'}`}>
                          {result.passed ? 'PASS' : 'FAILED'}
                        </span>
                      </div>
                      <p className={`text-[10px] italic leading-snug ${result.passed ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-400'}`}>
                        {result.message}
                      </p>
                      <p className="text-[8px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed" title={result.details}>
                        {result.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {testResults.length === 0 && (
              <>
                <div className="flex-1" />
                <div className="pt-4 flex justify-center opacity-20 transition-opacity shrink-0">
                  <BarChart3 size={48} className="text-slate-900 dark:text-white" />
                </div>
              </>
            )}
          </div>

        </aside>

        {/* Modal Flotante de Altas Estadísticas */}
        <AnimatePresence>
          {isLabExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm"
            >
              <div className="bg-white dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl p-6 shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">

                {/* Header Modal */}
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center">
                      <Library size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">
                        Centro de Diagnóstico Empírico
                      </h2>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">
                        Laboratorio de Pruebas: {methodName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsLabExpanded(false)}
                    className="p-3 rounded-lg text-slate-400 bg-slate-50 dark:bg-slate-800/50 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Cerrar diagnóstico"
                  >
                    <Minimize2 size={24} />
                  </button>
                </div>

                {/* Layout Principal del Centro (2 Columnas) */}
                <div className="flex-1 flex gap-6 min-h-0">

                  {/* Columna Izquierda: KPIs y Lista de Pruebas */}
                  <div className="w-[30%] flex flex-col gap-4">
                    {/* Tarjetas KPI Rápido */}
                    <div className="grid grid-cols-2 gap-4 shrink-0">
                      <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-border-subtle">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Media Global Muestral</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                          {numbers.length > 0 ? (numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(4) : "0.0000"}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-border-subtle">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Eficiencia Ciclo</span>
                        <span className={`text-xl font-black ${validation.isFullPeriod ? 'text-green-600 dark:text-green-500' : 'text-amber-500'}`}>
                          {validation.isFullPeriod ? '100%' : '55%'}
                        </span>
                      </div>
                    </div>

                    {/* Scrollable: Resultados de Pruebas */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pt-2 sticky top-0 bg-white dark:bg-bg-dark pb-2">
                        Desglose de Pruebas
                      </h3>
                      {testResults.length === 0 ? (
                        <div className="text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl opacity-50">
                          <p className="text-xs uppercase font-bold text-slate-400">Sin pruebas seleccionadas</p>
                        </div>
                      ) : (
                        testResults.map((result, i) => (
                          <div key={i} className={`p-4 rounded-lg border flex flex-col gap-2 ${result.passed ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'}`}>
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2" title={result.name}>
                                {result.name}
                              </span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${result.passed ? 'bg-green-200/50 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-rose-200/50 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'}`}>
                                {result.passed ? 'PASS' : 'FAILED'}
                              </span>
                            </div>
                            <p className={`text-[11px] italic leading-snug ${result.passed ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-400'}`}>
                              {result.message}
                            </p>
                            <p className="text-[9px] font-mono text-slate-500 mt-1" title={result.details}>
                              {result.details}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Columna Derecha: Proyección Gráfica */}
                  <div className="flex-1 bg-slate-50/50 dark:bg-bg-card rounded-xl border border-slate-100 dark:border-border-subtle p-6 flex flex-col relative overflow-hidden">
                    {numbers.length > 0 ? (
                      <StatisticalCharts numbers={numbers} />
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-center text-slate-400 dark:text-slate-500 opacity-60 flex-col gap-4">
                        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                          <Activity size={40} />
                        </div>
                        <p className="text-sm font-black uppercase tracking-widest max-w-[200px]">
                          Esperando datos...
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


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
      <footer className="px-6 py-4 border-t border-slate-200 dark:border-border-subtle bg-white/50 dark:bg-bg-card/50 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-4 z-20 shrink-0 mt-auto">
        <div className="flex items-center gap-4">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Proyecto Académico</p>
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Ingeniería de Sistemas - Universidad de Cartagena</p>
            <p className="text-[9px] text-slate-500 italic">Clase: Simulación Digital</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-100/50 dark:bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-200/50 dark:border-border-subtle">
          <img
            src="https://github.com/Hlgblackhat.png"
            alt="Colaborador"
            className="w-8 h-8 rounded-full border-2 border-brand-primary shadow-sm"
          />
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-900 dark:text-white leading-none">Haider López</span>
            <span className="text-[9px] text-brand-primary font-bold">@Hlgblackhat</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-medium">© 2026 PseudoGen Project. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Icono de Escudo de Validación (SVG Personalizado)
 */
const ShieldCheck = ({ size, className }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default App;

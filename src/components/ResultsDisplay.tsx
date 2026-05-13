import React from 'react';
import { type FC, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Clock } from 'lucide-react';

interface ResultsDisplayProps {
    numbers: number[];
    repeatIndex: number | null;
    methodName: string;
    emptyStateAction?: React.ReactNode;
    onDownload?: () => void;
    isGenerating?: boolean;
    isPaused?: boolean;
    simulationTime?: number;
}

/**
 * Utilidad para formatear el tiempo de simulación de manera legible.
 * Escala automáticamente de segundos a minutos u horas.
 */
const formatTime = (ms: number) => {
    if (ms === 0) return "0.0000s";
    const totalSeconds = ms / 1000;
    
    if (totalSeconds < 60) {
        return `${totalSeconds.toFixed(4)}s`;
    }
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    
    if (minutes < 60) {
        return `${minutes}m ${seconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m ${seconds}s`;
};

/**
 * Sub-componente dedicado para el cronómetro para evitar re-renders innecesarios
 * del listado principal de números durante la generación.
 */
const LiveTimer: FC<{ isGenerating: boolean, isPaused?: boolean, simulationTime?: number }> = ({ isGenerating, isPaused, simulationTime }) => {
    const timeRef = useRef<HTMLSpanElement>(null);
    const requestRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const accumulatedRef = useRef(0);

    const animate = (time: number) => {
        if (startTimeRef.current !== null && timeRef.current) {
            const elapsed = accumulatedRef.current + (time - startTimeRef.current);
            timeRef.current.textContent = formatTime(elapsed);
        }
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        if (isGenerating && !isPaused) {
            startTimeRef.current = performance.now();
            requestRef.current = requestAnimationFrame(animate);
        } else if (isPaused) {
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
            }
            if (startTimeRef.current !== null) {
                accumulatedRef.current += performance.now() - startTimeRef.current;
            }
            startTimeRef.current = null;
        } else {
            // Detener o Resetear
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
            }
            if (timeRef.current) {
                timeRef.current.textContent = formatTime(simulationTime || 0);
            }
            startTimeRef.current = null;
            accumulatedRef.current = 0;
        }
        return () => {
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
        };
    }, [isGenerating, isPaused, simulationTime]);

    return (
        <div className="flex flex-col items-center px-6 border-x border-slate-100 dark:border-slate-800">
            <span 
                ref={timeRef}
                className={`text-2xl font-black tabular-nums leading-none transition-colors ${
                    isGenerating 
                        ? (isPaused ? 'text-amber-500' : 'text-sky-400') 
                        : 'text-sky-500'
                }`}
            >
                {formatTime(simulationTime || 0)}
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                <Clock size={10} className={isGenerating && !isPaused ? 'animate-spin' : ''} /> 
                {isGenerating ? (isPaused ? 'En Pausa' : 'Cronómetro') : 'Simulación'}
            </p>
        </div>
    );
};

/**
 * Componente que muestra el flujo de datos generados.
 * Incluye visualización de números normalizados, detección visual de ciclos y límites de renderizado.
 */
const ResultsDisplay: FC<ResultsDisplayProps> = ({ numbers, repeatIndex, methodName, emptyStateAction, onDownload, isGenerating = false, isPaused = false, simulationTime }) => {
    const limiteVista = 5000;

    const numerosAMostrar = numbers.length > limiteVista ? numbers.slice(-limiteVista) : numbers;
    const indiceInicio = Math.max(0, numbers.length - limiteVista);

    return (
        <div className="bg-white dark:bg-bg-card rounded-xl border border-slate-200 dark:border-border-subtle h-full flex flex-col shadow-sm relative overflow-hidden group transition-colors">

            {/* Cabecera de la columna de resultados */}
            {/* Cabecera de la columna de resultados */}
            <div className="p-6 border-b border-slate-100 dark:border-border-subtle flex justify-between items-center bg-slate-50/50 dark:bg-bg-dark/50 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-10 bg-black dark:bg-brand-primary rounded-full" />
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                                Números Generados
                            </h3>
                            {isGenerating ? (
                                <div className={`flex items-center gap-2 px-2.5 py-1 border rounded-full ${
                                    isPaused 
                                        ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' 
                                        : 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800'
                                }`}>
                                    <div className={`w-1 h-1 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-sky-500 animate-pulse'}`} />
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isPaused ? 'text-amber-600 dark:text-amber-400' : 'text-sky-600 dark:text-sky-400'}`}>
                                        {isPaused ? 'En Pausa' : 'Iterando'}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full">
                                    <div className="w-1 h-1 bg-slate-400 rounded-full" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Reposo</span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-400 font-black uppercase tracking-widest mt-1.5">
                            {methodName}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    {onDownload && numbers.length > 0 && (
                        <button
                            onClick={onDownload}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-brand-primary text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Download size={14} /> Exportar
                        </button>
                    )}

                    <LiveTimer isGenerating={isGenerating} isPaused={isPaused} simulationTime={simulationTime} />

                    <div className="text-right">
                        <span className="text-4xl font-black text-black dark:text-white leading-none tabular-nums">
                            {numbers.length}
                        </span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-widest mt-1">Total de elementos</p>
                    </div>
                </div>
            </div>

            {/* Área de desplazamiento donde se muestran las celdas de números */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar bg-white dark:bg-bg-card transition-colors relative">

                {/* Estado vacío: mostrar el componente que el padre proporcione */}
                {numbers.length === 0 && emptyStateAction ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                        <div className="w-full max-w-sm space-y-4">
                            {emptyStateAction}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {numerosAMostrar.map((num, idx) => {
                                    const indiceGlobal = indiceInicio + idx;
                                    const esPrimero = indiceGlobal === 0;
                                    const esRepeticion = indiceGlobal === repeatIndex;

                                    return (
                                        <motion.div
                                            key={`${indiceGlobal}-${num}`}
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`
                                                border rounded-xl px-2 py-3 text-[11px] font-mono text-center transition-all cursor-default relative overflow-hidden flex flex-col items-center justify-center gap-1
                                                ${esPrimero ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 shadow-sm ring-1 ring-green-100 dark:ring-green-900/50' :
                                                    esRepeticion ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 shadow-sm ring-1 ring-rose-100 dark:ring-rose-900/50' :
                                                        'bg-slate-50 dark:bg-bg-dark border-slate-100 dark:border-border-subtle text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-brand-primary hover:bg-slate-100 dark:hover:bg-bg-dark/80'}
                                            `}
                                        >
                                            <span className="text-[10px] opacity-40 absolute top-1.5 left-2.5 font-bold select-none text-slate-400 dark:text-slate-500">#{indiceGlobal + 1}</span>
                                            <span className="relative z-10 font-bold tracking-tight text-sm">{num.toFixed(6)}</span>

                                            {/* Etiqueta para el valor semilla original */}
                                            {esPrimero && (
                                                <span className="text-[7px] font-black bg-green-600 text-white px-1 rounded absolute bottom-1 right-1 uppercase">SEMILLA</span>
                                            )}
                                            {/* Etiqueta para marcar el inicio de un ciclo detectado */}
                                            {esRepeticion && (
                                                <span className="text-[7px] font-black bg-rose-600 text-white px-1 rounded absolute bottom-1 right-1 uppercase animate-pulse">PERIODO</span>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Aviso cuando se supera el límite de renderizado visual */}
                        {numbers.length > limiteVista && (
                            <div className="mt-8 p-4 border border-dashed border-slate-200 dark:border-border-subtle rounded-lg text-center transition-colors">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
                                    Mostrando los últimos {limiteVista} resultados
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Superposición estética de degradado al final */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white dark:from-bg-card to-transparent pointer-events-none z-10 transition-colors" />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(0, 0, 0, 0.05);
                  border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.05);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </div>
    );
};

export default ResultsDisplay;

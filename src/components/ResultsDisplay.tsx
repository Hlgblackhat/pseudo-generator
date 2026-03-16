import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultsDisplayProps {
    numbers: number[];
    repeatIndex: number | null;
    methodName: string;
}

/**
 * Componente que muestra el flujo de datos generados.
 * Incluye visualización de números normalizados, detección visual de ciclos y límites de renderizado.
 */
const ResultsDisplay: FC<ResultsDisplayProps> = ({ numbers, repeatIndex, methodName }) => {
    // Límite de renderizado para evitar problemas de rendimiento con secuencias muy largas
    const limiteVista = 5000;
    const numerosAMostrar = numbers.length > limiteVista ? numbers.slice(-limiteVista) : numbers;
    const indiceInicio = Math.max(0, numbers.length - limiteVista);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 h-full flex flex-col shadow-sm relative overflow-hidden group">

            {/* Cabecera de la columna de resultados */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-black rounded-full" />
                        Flujo de Datos
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                        {methodName}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-black leading-none tabular-nums">
                        {numbers.length}
                    </span>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Iteraciones</p>
                </div>
            </div>

            {/* Área de desplazamiento donde se muestran las celdas de números */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar bg-white">
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
                                        ${esPrimero ? 'bg-green-50 border-green-200 text-green-700 shadow-sm ring-1 ring-green-100' :
                                            esRepeticion ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm ring-1 ring-rose-100' :
                                                'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-100'}
                                    `}
                                >
                                    <span className="text-[8px] opacity-40 absolute top-1 left-2 font-bold select-none text-slate-400">#{indiceGlobal + 1}</span>
                                    <span className="relative z-10 font-bold tracking-tight">{num.toFixed(6)}</span>

                                    {/* Etiqueta para el valor semilla original */}
                                    {esPrimero && (
                                        <span className="text-[7px] font-black bg-green-600 text-white px-1 rounded absolute bottom-1 right-1 uppercase">ROOT</span>
                                    )}
                                    {/* Etiqueta para marcar el inicio de un ciclo detectado */}
                                    {esRepeticion && (
                                        <span className="text-[7px] font-black bg-rose-600 text-white px-1 rounded absolute bottom-1 right-1 uppercase animate-pulse">LOOP</span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Aviso cuando se supera el límite de renderizado visual */}
                {numbers.length > limiteVista && (
                    <div className="mt-8 p-4 border border-dashed border-slate-200 rounded-2xl text-center">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                            Mostrando los últimos {limiteVista} resultados
                        </p>
                    </div>
                )}
            </div>

            {/* Superposición estética de degradado al final */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />

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
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </div>
    );
};

export default ResultsDisplay;

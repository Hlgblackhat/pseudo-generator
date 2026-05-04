import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { exportFrequenciesToExcel } from '../utils/excelExport';

interface FrequencyTableProps {
    data: number[];
    variableName: string;
}

interface IntervalData {
    min: number;
    max: number;
    count: number;
    relativeFrequency: number;
}

const FrequencyTable: React.FC<FrequencyTableProps> = ({ data, variableName }) => {
    const analysis = useMemo(() => {
        if (data.length === 0) return null;

        const n = data.length;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;

        // Regla de Sturges para el número de intervalos
        const k = Math.ceil(1 + 3.322 * Math.log10(n));
        const intervalWidth = range / k;

        const intervals: IntervalData[] = [];

        for (let i = 0; i < k; i++) {
            const start = min + i * intervalWidth;
            const end = i === k - 1 ? max : start + intervalWidth;
            
            const count = data.filter(val => 
                i === k - 1 
                ? (val >= start && val <= end) 
                : (val >= start && val < end)
            ).length;

            intervals.push({
                min: start,
                max: end,
                count,
                relativeFrequency: count / n
            });
        }

        return {
            intervals,
            total: n,
            min,
            max,
            k
        };
    }, [data]);

    if (!analysis || data.length === 0) return null;

    const maxCount = Math.max(...analysis.intervals.map(i => i.count));

    return (
        <div className="bg-white dark:bg-bg-card rounded-xl border border-slate-200 dark:border-border-subtle p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">
                        Distribución de Frecuencias
                    </h3>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {variableName} <span className="text-violet-500 font-mono text-sm">/ {analysis.k} Intervalos</span>
                    </h4>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => exportFrequenciesToExcel(analysis.intervals, variableName)}
                        className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Download size={14} /> Excel
                    </button>
                    <div className="text-right">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Muestra (n)</span>
                        <span className="text-xl font-black text-violet-600 dark:text-violet-400 tabular-nums">{analysis.total}</span>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-bg-dark border-b border-slate-100 dark:border-slate-800">
                            <th className="px-4 py-3 text-xs font-black uppercase text-slate-500 tracking-widest w-1/3">Intervalo de Clase</th>
                            <th className="px-4 py-3 text-xs font-black uppercase text-slate-500 tracking-widest text-center">Freq. Absoluta (fᵢ)</th>
                            <th className="px-4 py-3 text-xs font-black uppercase text-slate-500 tracking-widest text-right">Freq. Relativa (%)</th>
                            <th className="px-4 py-3 text-xs font-black uppercase text-slate-500 tracking-widest w-1/4">Densidad</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {analysis.intervals.map((interval, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        [{interval.min.toFixed(4)}
                                    </span>
                                    <span className="mx-1 opacity-40">—</span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {interval.max.toFixed(4)}]
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                        {interval.count}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="text-sm font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                                        {(interval.relativeFrequency * 100).toFixed(2)}%
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(interval.count / maxCount) * 100}%` }}
                                            transition={{ duration: 0.8, delay: idx * 0.05 }}
                                            className="h-full bg-violet-500 group-hover:bg-violet-400 transition-colors"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="flex gap-4 pt-2">
                <div className="flex-1 p-3 bg-slate-50 dark:bg-bg-dark rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Rango del Muestreo</span>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Amplitud: <span className="text-slate-900 dark:text-white">{(analysis.max - analysis.min).toFixed(6)}</span>
                    </p>
                </div>
                <div className="flex-1 p-3 bg-slate-50 dark:bg-bg-dark rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Ancho de Clase</span>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        W: <span className="text-slate-900 dark:text-white">{( (analysis.max - analysis.min) / analysis.k ).toFixed(6)}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FrequencyTable;

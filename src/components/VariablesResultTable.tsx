import { useMemo } from 'react';
import { TrendingUp, Hash, ArrowRight } from 'lucide-react';

interface VariablesResultTableProps {
    uniforms: number[];
    transformed: number[];
    distributionName: string;
}

function computeStats(values: number[]) {
    if (values.length === 0) return { mean: 0, std: 0, min: 0, max: 0, median: 0 };
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[n - 1];
    const median = n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)];
    return { mean, std, min, max, median };
}

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-bg-dark rounded-xl border border-slate-100 dark:border-border-subtle">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <span className={`text-lg font-black tabular-nums leading-none ${color}`}>
            {Math.abs(value) < 1000 ? value.toFixed(4) : value.toExponential(3)}
        </span>
    </div>
);

const VariablesResultTable = ({ uniforms, transformed, distributionName }: VariablesResultTableProps) => {
    const stats = useMemo(() => computeStats(transformed), [transformed]);
    const maxTransformed = Math.max(...transformed.map(Math.abs));

    return (
        <div className="bg-white dark:bg-bg-card rounded-xl border border-slate-200 dark:border-border-subtle h-full flex flex-col shadow-sm overflow-hidden transition-colors">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-border-subtle bg-slate-50/50 dark:bg-bg-dark/50 shrink-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            Resultados
                        </h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                            Distribución {distributionName}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-black dark:text-white leading-none tabular-nums">{transformed.length}</span>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Muestras</p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-5 gap-2 mt-4">
                    <StatCard label="Media (μ)" value={stats.mean} color="text-emerald-600 dark:text-emerald-400" />
                    <StatCard label="Desv. Est. (σ)" value={stats.std} color="text-indigo-600 dark:text-indigo-400" />
                    <StatCard label="Mínimo" value={stats.min} color="text-sky-600 dark:text-sky-400" />
                    <StatCard label="Mediana" value={stats.median} color="text-amber-600 dark:text-amber-400" />
                    <StatCard label="Máximo" value={stats.max} color="text-rose-600 dark:text-rose-400" />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-border-subtle">
                            <th className="px-4 py-2.5 text-left font-black text-[10px] uppercase tracking-widest text-slate-400 w-14">
                                <Hash size={11} className="inline mr-1" />#
                            </th>
                            <th className="px-4 py-2.5 text-left font-black text-[10px] uppercase tracking-widest text-slate-400">
                                Uniforme U(0,1)
                            </th>
                            <th className="px-4 py-2.5 text-center font-black text-[10px] uppercase tracking-widest text-slate-300 w-8">
                                <ArrowRight size={12} className="mx-auto" />
                            </th>
                            <th className="px-4 py-2.5 text-left font-black text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                X ~ {distributionName}
                            </th>
                            <th className="px-4 py-2.5 text-left font-black text-[10px] uppercase tracking-widest text-slate-300 w-36">
                                Magnitud relativa
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {transformed.map((x, i) => {
                            const u = uniforms[i] ?? 0;
                            const relWidth = maxTransformed > 0 ? (Math.abs(x) / maxTransformed) * 100 : 0;
                            const isAboveMean = x > stats.mean;

                            return (
                                <tr
                                    key={i}
                                    className="border-b border-slate-50 dark:border-border-subtle/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                                >
                                    <td className="px-4 py-2 text-[10px] font-bold text-slate-300 dark:text-slate-600 tabular-nums">
                                        {i + 1}
                                    </td>
                                    <td className="px-4 py-2 font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                                        {u.toFixed(6)}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <ArrowRight size={11} className="text-slate-200 dark:text-slate-700 mx-auto group-hover:text-emerald-400 transition-colors" />
                                    </td>
                                    <td className="px-4 py-2 font-mono font-bold tabular-nums">
                                        <span className={isAboveMean ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}>
                                            {x.toFixed(6)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${isAboveMean ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                    style={{ width: `${relWidth}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VariablesResultTable;

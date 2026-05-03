import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Home, RefreshCw, BarChart3, Database, Download } from 'lucide-react';
import { ModeToggle } from './mode-toggle';
import { getSharedNumbers, subscribeToSharedNumbers } from '../store/dataStore';
import ExcelUploader from './ExcelUploader';
import { availableVariables } from '../variables';
import type { VariableParams } from '../variables';
import ResultsDisplay from './ResultsDisplay';
import { exportVariablesToExcel } from '../utils/excelExport';

const VariablesLab = () => {
    const [baseUniforms, setBaseUniforms] = useState<number[]>(getSharedNumbers());
    const [transformedNumbers, setTransformedNumbers] = useState<number[]>([]);
    const [selectedVar, setSelectedVar] = useState<string>('exponential');
    const [params, setParams] = useState<VariableParams>({
        lambda: 2,
        k: 3,
        n: 10,
        p: 0.5,
        a: 1,
        b: 10,
        c: 5
    });

    useEffect(() => {
        const unsubscribe = subscribeToSharedNumbers((nums) => {
            setBaseUniforms(nums);
        });
        return unsubscribe;
    }, []);

    const handleGenerate = () => {
        if (baseUniforms.length === 0) return;
        const generator = availableVariables[selectedVar];
        const result = generator.generate(baseUniforms, params);
        setTransformedNumbers(result);
    };

    const handleUpload = (nums: number[]) => {
        const validUniforms = nums.filter(n => n >= 0 && n <= 1);
        if (validUniforms.length > 0) {
            setBaseUniforms(validUniforms);
        } else {
            alert('Los números del Excel deben ser uniformes en el rango [0, 1] para poder transformarlos.');
        }
    };

    const handleDownload = () => {
        if (transformedNumbers.length === 0) return;
        exportVariablesToExcel(baseUniforms, transformedNumbers, currentGenerator.name);
    };

    const currentGenerator = availableVariables[selectedVar];

    const uploaderNode = (
        <div className="space-y-4 text-center">
            <BarChart3 size={48} className="opacity-10 mx-auto text-slate-400" />
            <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Sin datos uniformes
                </p>
                <p className="text-[10px] text-slate-400">
                    Sube un Excel con números U(0,1) o genera desde el laboratorio principal.
                </p>
            </div>
            <ExcelUploader onNumbersExtracted={handleUpload} />
        </div>
    );

    return (
        <div className="h-screen bg-[#f8fafc] dark:bg-bg-dark text-slate-900 dark:text-slate-100 font-sans flex flex-col overflow-hidden transition-colors">
            <header className="px-6 py-3 border-b border-slate-200 dark:border-border-subtle bg-white/80 dark:bg-bg-card/80 backdrop-blur-xl flex justify-between items-center z-20 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link to="/" className="p-1.5 bg-black dark:bg-emerald-500 text-white rounded-lg shadow-sm hover:scale-105 transition-transform">
                        <Home className="w-4 h-4" />
                    </Link>
                    <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-widest uppercase flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        Variables<span className="text-emerald-500 italic">Lab</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    {transformedNumbers.length > 0 && (
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm shadow-emerald-500/20 active:scale-95"
                        >
                            <Download size={13} /> Descargar Excel
                        </button>
                    )}
                    <ModeToggle />
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden p-4 gap-4 relative z-10">
                <aside className="w-80 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar pr-1">
                    <div className="bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-xl p-5 shadow-sm space-y-4">
                        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Database size={14} className="text-indigo-500" /> Origen de Datos
                        </h3>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Uniformes disponibles</span>
                            <span className={`text-sm font-black tabular-nums ${baseUniforms.length > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {baseUniforms.length}
                            </span>
                        </div>
                        {baseUniforms.length === 0 && (
                            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold italic leading-snug">
                                Genera números en el Laboratorio principal o sube un Excel desde el área de resultados.
                            </p>
                        )}
                    </div>

                    <div className="bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-xl p-5 shadow-sm space-y-4">
                        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14} className="text-emerald-500" /> Método de Transformación
                        </h3>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Distribución</label>
                            <select
                                value={selectedVar}
                                onChange={(e) => setSelectedVar(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 transition-colors"
                            >
                                {Object.keys(availableVariables).map(key => (
                                    <option key={key} value={key}>{availableVariables[key].name}</option>
                                ))}
                            </select>
                            <p className="text-[9px] text-slate-400 italic mt-1 leading-snug">
                                {currentGenerator.description}
                            </p>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            {(selectedVar === 'exponential' || selectedVar === 'poisson') && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tasa (Lambda λ)</label>
                                    <input type="number" step="0.1" value={params.lambda} onChange={e => setParams({...params, lambda: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-xs font-mono" />
                                </div>
                            )}

                            {selectedVar === 'erlang' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tasa (Lambda λ)</label>
                                        <input type="number" step="0.1" value={params.lambda} onChange={e => setParams({...params, lambda: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-xs font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fases (k)</label>
                                        <input type="number" step="1" value={params.k} onChange={e => setParams({...params, k: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-xs font-mono" />
                                    </div>
                                </>
                            )}

                            {selectedVar === 'binomial' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ensayos (n)</label>
                                        <input type="number" step="1" value={params.n} onChange={e => setParams({...params, n: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-xs font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Probabilidad (p)</label>
                                        <input type="number" step="0.01" value={params.p} onChange={e => setParams({...params, p: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-xs font-mono" />
                                    </div>
                                </>
                            )}

                            {selectedVar === 'triangular' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mínimo (a)</label>
                                        <input type="number" step="0.1" value={params.a} onChange={e => setParams({...params, a: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-xs font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Moda (c)</label>
                                        <input type="number" step="0.1" value={params.c} onChange={e => setParams({...params, c: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-xs font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Máximo (b)</label>
                                        <input type="number" step="0.1" value={params.b} onChange={e => setParams({...params, b: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-xs font-mono" />
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={baseUniforms.length === 0}
                            className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <RefreshCw size={14} /> Transformar
                        </button>
                    </div>
                </aside>

                <section className="flex-1 flex flex-col overflow-hidden">
                    <ResultsDisplay
                        numbers={transformedNumbers}
                        repeatIndex={null}
                        methodName={transformedNumbers.length > 0 ? currentGenerator.name : 'Sin resultados'}
                        emptyStateAction={uploaderNode}
                    />
                </section>
            </main>
        </div>
    );
};

export default VariablesLab;

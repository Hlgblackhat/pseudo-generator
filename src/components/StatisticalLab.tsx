import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Home, Library, CheckCircle2, XCircle, FlaskConical, Database, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { ModeToggle } from './mode-toggle';
import { getSharedNumbers, subscribeToSharedNumbers } from '../store/dataStore';
import ExcelUploader from './ExcelUploader';
import StatisticalCharts from './StatisticalCharts';
import { availableTests, runSelectedTests } from '../tests';
import type { TestResult } from '../tests';
import { getCriteriaForMethod, engineQualityCriteria } from '../engines/qualityCriteria';
import { GeneratorMethod } from '../engines/types';
import type { GeneratorMethodType } from '../engines/types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function computeStats(values: number[]) {
    if (values.length === 0) return { mean: 0, variance: 0, min: 0, max: 0, n: 0 };
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { mean, variance, min, max, n };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const SummaryCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div className="bg-slate-50 dark:bg-bg-dark rounded-xl border border-slate-100 dark:border-border-subtle p-4">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className={`text-xl font-black tabular-nums leading-none ${color}`}>{value}</p>
    </div>
);

interface TestResultCardProps { result: TestResult; }
const TestResultCard = ({ result }: TestResultCardProps) => {
    const [expanded, setExpanded] = useState(false);
    const pass = result.passed;

    return (
        <div className={`rounded-xl border transition-all ${pass ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'}`}>
            <div className="flex items-start justify-between p-4 gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    {pass
                        ? <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                        : <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                    }
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{result.name}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${pass ? 'bg-green-200/60 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-rose-200/60 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'}`}>
                                {pass ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                        <p className={`text-xs italic mt-1 leading-snug ${pass ? 'text-green-700 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>{result.message}</p>
                    </div>
                </div>
                <button onClick={() => setExpanded(e => !e)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0">
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {expanded && (
                <div className="px-4 pb-4 border-t border-current/10 pt-3 grid grid-cols-3 gap-3">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estadístico</p>
                        <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{result.statistic.toFixed(4)}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Valor Crítico</p>
                        <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{result.criticalValue.toFixed(4)}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Alpha (α)</p>
                        <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{result.alpha}</p>
                    </div>
                    {result.details && (
                        <div className="col-span-3 mt-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Detalles</p>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug">{result.details}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────────────────────

const StatisticalLab = () => {
    const [data, setData] = useState<number[]>(getSharedNumbers());
    const [dataSource, setDataSource] = useState<string>(getSharedNumbers().length > 0 ? 'Datos del Generador' : '');
    const [selectedTests, setSelectedTests] = useState<string[]>([]);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [alpha, setAlpha] = useState<number>(0.05);
    const [selectedMethod, setSelectedMethod] = useState<GeneratorMethodType>(GeneratorMethod.MIXED);
    const [hasRun, setHasRun] = useState(false);

    // Subscribe to shared store
    useEffect(() => {
        const unsubscribe = subscribeToSharedNumbers((nums) => {
            if (nums.length > 0) {
                setData(nums);
                setDataSource('Datos del Generador');
                setTestResults([]);
                setHasRun(false);
            }
        });
        return unsubscribe;
    }, []);

    // When the selected method changes, auto-select recommended tests
    useEffect(() => {
        const criteria = getCriteriaForMethod(selectedMethod);
        setSelectedTests(criteria.recommendedTests);
    }, [selectedMethod]);

    const activeCriteria = useMemo(() => getCriteriaForMethod(selectedMethod), [selectedMethod]);
    const stats = useMemo(() => computeStats(data), [data]);

    const handleUpload = (nums: number[]) => {
        setData(nums);
        setDataSource('Datos Importados (Excel)');
        setTestResults([]);
        setHasRun(false);
    };

    const handleRunTests = () => {
        if (data.length === 0 || selectedTests.length === 0) return;
        try {
            const results = runSelectedTests(selectedTests, data, alpha);
            setTestResults(results);
            setHasRun(true);
        } catch (e) {
            console.error('Test error', e);
        }
    };

    const passCount = testResults.filter(r => r.passed).length;
    const failCount = testResults.filter(r => !r.passed).length;

    const uploaderNode = (
        <div className="space-y-4 text-center">
            <Library size={48} className="opacity-10 mx-auto text-slate-400" />
            <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Sin datos cargados</p>
                <p className="text-[10px] text-slate-400">Genera números en el Laboratorio principal, o sube un Excel con los datos que deseas analizar.</p>
            </div>
            <ExcelUploader onNumbersExtracted={handleUpload} />
        </div>
    );

    return (
        <div className="h-screen bg-[#f8fafc] dark:bg-bg-dark text-slate-900 dark:text-slate-100 font-sans flex flex-col overflow-hidden transition-colors">

            {/* Header */}
            <header className="px-6 py-3 border-b border-slate-200 dark:border-border-subtle bg-white/80 dark:bg-bg-card/80 backdrop-blur-xl flex justify-between items-center z-20 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link to="/" className="p-1.5 bg-black dark:bg-indigo-500 text-white rounded-lg shadow-sm hover:scale-105 transition-transform">
                        <Home className="w-4 h-4" />
                    </Link>
                    <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-widest uppercase flex items-center gap-2">
                        <Library className="w-5 h-5 text-indigo-500" />
                        Pruebas<span className="text-indigo-500 italic">Lab</span>
                    </h1>
                </div>
                <ModeToggle />
            </header>

            <main className="flex-1 flex overflow-hidden p-4 gap-4 relative z-10">

                {/* ── Left panel: controls ── */}
                <aside className="w-80 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar pr-1">

                    {/* Data source */}
                    <div className="bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-xl p-5 shadow-sm space-y-4">
                        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Database size={14} className="text-indigo-500" /> Datos de Entrada
                        </h3>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Muestra disponible</span>
                            <span className={`text-sm font-black tabular-nums ${data.length > 0 ? 'text-indigo-500' : 'text-slate-400'}`}>{data.length}</span>
                        </div>

                        {dataSource && (
                            <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold italic">Fuente: {dataSource}</p>
                        )}

                        <ExcelUploader onNumbersExtracted={handleUpload} />
                    </div>

                    {/* Method context */}
                    <div className="bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-xl p-5 shadow-sm space-y-3">
                        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <FlaskConical size={14} className="text-indigo-500" /> Contexto del Motor
                        </h3>
                        <p className="text-[9px] text-slate-400 leading-snug">
                            ¿Con qué algoritmo fueron generados los datos? Esto determina qué pruebas son relevantes.
                        </p>
                        <select
                            value={selectedMethod}
                            onChange={e => setSelectedMethod(e.target.value as GeneratorMethodType)}
                            className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 transition-colors"
                        >
                            {Object.entries(GeneratorMethod).map(([key, val]) => (
                                <option key={val} value={val}>{engineQualityCriteria[val]?.primaryCriterion ? `${key.replace(/_/g, ' ')}` : key}</option>
                            ))}
                        </select>

                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-lg">
                            <p className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">
                                Criterio: {activeCriteria.primaryCriterion}
                            </p>
                            <p className="text-[8px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-4">
                                {activeCriteria.qualityNote}
                            </p>
                        </div>
                    </div>

                    {/* Test selector */}
                    <div className="bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-xl p-5 shadow-sm space-y-3">
                        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Library size={14} className="text-indigo-500" /> Pruebas Estadísticas
                        </h3>

                        {/* Alpha selector */}
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Significancia (α)</label>
                            <select
                                value={alpha}
                                onChange={e => setAlpha(parseFloat(e.target.value))}
                                className="bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
                            >
                                <option value={0.01}>α = 0.01 (99%)</option>
                                <option value={0.05}>α = 0.05 (95%)</option>
                                <option value={0.10}>α = 0.10 (90%)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            {Object.keys(availableTests).map((testId) => {
                                const isSelected = selectedTests.includes(testId);
                                const isRecommended = activeCriteria.recommendedTests.includes(testId);
                                const isIrrelevant = activeCriteria.irrelevantTests.includes(testId);
                                return (
                                    <label
                                        key={testId}
                                        className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
                                            isIrrelevant
                                                ? 'opacity-40 cursor-not-allowed border-transparent'
                                                : isSelected
                                                    ? 'border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-900/20'
                                                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="mt-0.5 w-3 h-3 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 dark:bg-bg-dark"
                                            checked={isSelected}
                                            disabled={isIrrelevant}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedTests(prev => [...prev, testId]);
                                                else setSelectedTests(prev => prev.filter(v => v !== testId));
                                            }}
                                        />
                                        <div className="flex flex-col flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[10px] font-bold text-slate-900 dark:text-white leading-tight">{availableTests[testId].name}</span>
                                                {isRecommended && <span className="text-[7px] font-black bg-emerald-500 text-white px-1 py-0.5 rounded uppercase">✓ Rec.</span>}
                                                {isIrrelevant && <span className="text-[7px] font-black bg-slate-300 dark:bg-slate-700 text-slate-500 px-1 py-0.5 rounded uppercase">N/A</span>}
                                            </div>
                                            <span className="text-[8px] text-slate-400 leading-tight mt-0.5">{availableTests[testId].description}</span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleRunTests}
                            disabled={data.length === 0 || selectedTests.length === 0}
                            className="w-full mt-2 bg-indigo-600 hover:bg-white border border-indigo-600 text-white hover:text-indigo-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed disabled:border-transparent text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            <FlaskConical size={14} /> Ejecutar Pruebas
                        </button>
                    </div>
                </aside>

                {/* ── Center/Right: results ── */}
                <section className="flex-1 flex flex-col gap-4 overflow-hidden">

                    {/* Stats summary strip */}
                    {data.length > 0 && (
                        <div className="grid grid-cols-4 gap-3 shrink-0">
                            <SummaryCard label="Muestra (n)" value={stats.n.toString()} color="text-indigo-600 dark:text-indigo-400" />
                            <SummaryCard label="Media (μ)" value={stats.mean.toFixed(5)} color="text-slate-900 dark:text-white" />
                            <SummaryCard label="Varianza (σ²)" value={stats.variance.toFixed(5)} color="text-slate-900 dark:text-white" />
                            <SummaryCard label="Rango [min, max]" value={`[${stats.min.toFixed(3)}, ${stats.max.toFixed(3)}]`} color="text-slate-900 dark:text-white" />
                        </div>
                    )}

                    <div className="flex-1 flex gap-4 overflow-hidden min-h-0">

                        {/* Test results list */}
                        <div className="flex-1 flex flex-col bg-white dark:bg-bg-card rounded-xl border border-slate-200 dark:border-border-subtle shadow-sm overflow-hidden transition-colors">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-border-subtle flex justify-between items-center shrink-0 bg-slate-50/50 dark:bg-bg-dark/50">
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                        <div className="w-1.5 h-5 bg-indigo-500 rounded-full" /> Diagnóstico Empírico
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{dataSource || 'Sin datos'}</p>
                                </div>
                                {hasRun && testResults.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900 px-2.5 py-1 rounded-lg">{passCount} PASS</span>
                                        <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 px-2.5 py-1 rounded-lg">{failCount} FAIL</span>
                                    </div>
                                )}
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                                {!hasRun ? (
                                    <div className="h-full flex flex-col items-center justify-center p-8">
                                        <div className="w-full max-w-sm">
                                            {data.length === 0 ? uploaderNode : (
                                                <div className="text-center space-y-3">
                                                    <FlaskConical size={40} className="mx-auto opacity-20 text-indigo-400" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        {data.length} muestras listas — selecciona pruebas y ejecuta
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {testResults.map((result, i) => (
                                            <TestResultCard key={i} result={result} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Charts panel */}
                        {data.length > 0 && (
                            <div className="w-[340px] shrink-0 bg-white dark:bg-bg-card rounded-xl border border-slate-200 dark:border-border-subtle shadow-sm flex flex-col overflow-hidden transition-colors">
                                <div className="px-5 py-4 border-b border-slate-100 dark:border-border-subtle shrink-0 bg-slate-50/50 dark:bg-bg-dark/50">
                                    <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                                        <BarChart3 size={14} className="text-indigo-500" /> Distribución Visual
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-hidden p-3">
                                    <StatisticalCharts numbers={data} />
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
            `}</style>
        </div>
    );
};

export default StatisticalLab;

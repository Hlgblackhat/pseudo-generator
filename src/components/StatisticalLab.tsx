import { useState, useEffect, useMemo } from 'react';
import { Library, CheckCircle2, XCircle, FlaskConical, Database, ChevronDown, ChevronUp, Activity, FileText, Loader2 } from 'lucide-react';
import { getSharedNumbers, subscribeToSharedNumbers } from '../store/dataStore';
import ExcelUploader from './ExcelUploader';
import StatisticalCharts from './StatisticalCharts';
import { availableTests, runSelectedTests } from '../tests';
import type { TestResult } from '../tests';
import { getCriteriaForMethod } from '../engines/qualityCriteria';
import { GeneratorMethod } from '../engines/types';
import type { GeneratorMethodType } from '../engines/types';
import AppHeader from './AppHeader';
import { generateReportPDF } from '../utils/pdfExport';
import CustomSelect from './CustomSelect';

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

const METHOD_NAMES: Record<string, string> = {
    [GeneratorMethod.MIXED]: 'Congruencial Mixto',
    [GeneratorMethod.MULTIPLICATIVE]: 'Congruencial Multiplicativo',
    [GeneratorMethod.LFSR]: 'LFSR (Tausworthe)',
    [GeneratorMethod.ADDITIVE]: 'Congruencial Aditivo',
    [GeneratorMethod.MIDDLE_SQUARE]: 'Cuadrados Medios',
    [GeneratorMethod.BBS]: 'Blum Blum Shub',
    [GeneratorMethod.LFG]: 'Lagged Fibonacci'
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const SummaryCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div className="bg-slate-50 dark:bg-bg-dark rounded-xl border border-slate-100 dark:border-border-subtle p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className={`text-2xl font-black tabular-nums leading-none ${color}`}>{value}</p>
    </div>
);

interface TestResultCardProps { result: TestResult; }
const TestResultCard = ({ result }: TestResultCardProps) => {
    const [expanded, setExpanded] = useState(false);
    const pass = result.passed;

    return (
        <div className={`rounded-xl border transition-all ${pass ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'}`}>
            <div className="flex items-start justify-between p-5 gap-3">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    {pass
                        ? <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
                        : <XCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                    }
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{result.name}</span>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${pass ? 'bg-green-200/60 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-rose-200/60 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'}`}>
                                {pass ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                        <p className={`text-sm font-medium mt-1 leading-snug ${pass ? 'text-green-700 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>{result.message}</p>
                    </div>
                </div>
                <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {expanded && (
                <div className="px-5 pb-5 border-t border-current/10 pt-4 grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400/80">Estadístico</p>
                        <p className="text-base font-black tabular-nums text-slate-900 dark:text-white">{result.statistic.toFixed(6)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400/80">Valor Crítico</p>
                        <p className="text-base font-black tabular-nums text-slate-900 dark:text-white">{result.criticalValue.toFixed(6)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400/80">Alpha (α)</p>
                        <p className="text-base font-black tabular-nums text-slate-900 dark:text-white">{result.alpha}</p>
                    </div>
                    {result.details && (
                        <div className="col-span-3 mt-2 p-3 bg-white/40 dark:bg-black/20 rounded-lg">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Análisis Detallado</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{result.details}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const QualityScore = ({ pass, total }: { pass: number; total: number }) => {
    const score = total > 0 ? (pass / total) * 100 : 0;
    const color = score >= 80 ? 'text-green-500' : score >= 50 ? 'text-orange-500' : 'text-rose-500';
    const label = score >= 80 ? 'EXCELENTE' : score >= 50 ? 'ACEPTABLE' : 'CRÍTICO';

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-bg-dark rounded-2xl border border-slate-100 dark:border-border-subtle relative overflow-hidden group">
            <div className={`absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.07] ${score >= 50 ? 'bg-green-500' : 'bg-rose-500'}`} />
            <div className="relative z-10 flex flex-col items-center">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Puntaje de Calidad</span>
                <div className="flex items-baseline gap-1">
                    <span className={`text-6xl font-black tabular-nums tracking-tighter ${color}`}>{score.toFixed(0)}</span>
                    <span className="text-2xl font-black text-slate-300">/100</span>
                </div>
                <div className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border shadow-sm ${score >= 80 ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700' : 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700'}`}>
                    {label}
                </div>
            </div>
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
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

    const handleGeneratePDF = async () => {
        if (!hasRun || data.length === 0) return;
        setIsGeneratingPDF(true);

        try {
            await generateReportPDF({
                data,
                results: testResults,
                stats: { ...stats, n: data.length },
                method: METHOD_NAMES[selectedMethod] || selectedMethod,
                dataSource,
                alpha,
                chartElementId: 'stats-charts-container'
            });
        } catch (e) {
            console.error('PDF error', e);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const passCount = testResults.filter(r => r.passed).length;
    const failCount = testResults.filter(r => !r.passed).length;

    const uploaderNode = (
        <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto py-12">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner relative group overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/5 scale-0 group-hover:scale-150 transition-transform duration-700 rounded-full" />
                <Database size={32} className="text-amber-500 relative z-10" />
            </div>
            
            <div className="space-y-2 text-center">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Laboratorio en Reposo</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Para iniciar el análisis estadístico, puedes generar números en el laboratorio principal o cargar un archivo de datos externo.
                </p>
            </div>

            <div className="w-full pt-4">
                <div className="p-1 bg-slate-50 dark:bg-bg-dark rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <ExcelUploader onNumbersExtracted={handleUpload} />
                </div>
                <div className="mt-4 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-700">
                    <div className="h-px w-8 bg-current" />
                    Formatos: .xlsx, .xls, .csv
                    <div className="h-px w-8 bg-current" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen bg-[#fafafa] dark:bg-bg-dark text-slate-900 dark:text-slate-100 font-sans flex flex-col overflow-hidden transition-colors">
            <AppHeader />

            <main className="flex-1 flex overflow-hidden p-6 gap-6 relative z-10">
                <aside className="w-96 flex flex-col gap-5 shrink-0 overflow-y-auto custom-scrollbar pr-1">
                    {/* Origen de Datos */}
                    <div className="bg-white dark:bg-bg-card rounded-2xl border border-slate-200 dark:border-border-subtle p-6 shadow-sm space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-amber-500 border border-slate-100 dark:border-slate-700">
                                <Database size={20} />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Origen de Datos</h3>
                        </div>
                        
                        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-border-subtle flex justify-between items-center transition-colors">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">Tamaño Muestra (n)</span>
                            <span className={`text-2xl font-black tabular-nums ${data.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                {data.length}
                            </span>
                        </div>
                        {dataSource && (
                            <div className="flex items-center gap-2 px-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold italic truncate">Fuente: {dataSource}</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-amber-500 border border-slate-100 dark:border-slate-700">
                                <FlaskConical size={20} />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Configuración</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Significancia (α)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[0.01, 0.05, 0.10].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setAlpha(val)}
                                            className={`py-2.5 rounded-xl text-xs font-black transition-all border ${alpha === val ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-50 dark:bg-bg-dark border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {(val * 100).toFixed(0)}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Algoritmo de Referencia</label>
                                <div className="relative group">
                                    <CustomSelect
                                        value={selectedMethod}
                                        onChange={(val) => setSelectedMethod(val as GeneratorMethodType)}
                                        colorTheme="amber"
                                        options={Object.entries(GeneratorMethod).map(([_, val]) => ({
                                            value: val,
                                            label: METHOD_NAMES[val] || val
                                        }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest px-1">Pruebas a Realizar</h4>
                            <div className="space-y-1.5">
                                {Object.keys(availableTests).map((testId) => {
                                    const isSelected = selectedTests.includes(testId);
                                    const isRecommended = activeCriteria.recommendedTests.includes(testId);
                                    const isIrrelevant = activeCriteria.irrelevantTests.includes(testId);
                                    return (
                                        <label
                                            key={testId}
                                            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                                                isIrrelevant
                                                    ? 'opacity-40 cursor-not-allowed border-transparent'
                                                    : isSelected
                                                        ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-900/20'
                                                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="mt-1 w-3.5 h-3.5 text-amber-600 border-slate-300 rounded focus:ring-amber-500 dark:bg-bg-dark"
                                                checked={isSelected}
                                                disabled={isIrrelevant}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedTests(prev => [...prev, testId]);
                                                    else setSelectedTests(prev => prev.filter(v => v !== testId));
                                                }}
                                            />
                                            <div className="flex flex-col flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{availableTests[testId].name}</span>
                                                    {isRecommended && <span className="text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase">Rec.</span>}
                                                </div>
                                                <span className="text-xs text-slate-400 leading-tight mt-0.5">{availableTests[testId].description}</span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            onClick={handleRunTests}
                            disabled={data.length === 0 || selectedTests.length === 0}
                            className="w-full mt-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest py-4.5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-xl active:scale-[0.98]"
                        >
                            <Library size={18} /> Ejecutar Análisis
                        </button>
                    </div>
                </aside>

                <section className="flex-1 flex flex-col overflow-hidden">
                    <div id="statistical-report-container" className="flex-1 flex flex-col bg-white dark:bg-bg-card rounded-2xl border border-slate-200 dark:border-border-subtle shadow-sm overflow-hidden transition-colors">
                        {/* Header with Export */}
                        {data.length > 0 && (
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-border-subtle flex justify-between items-center shrink-0 bg-slate-50/50 dark:bg-bg-dark/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Resultados</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">{dataSource || 'Sin fuente'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {hasRun && (
                                        <>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-bg-dark rounded-xl border border-slate-200 dark:border-slate-800 mr-2">
                                                <span className="text-xs font-black text-emerald-600">{passCount} PASS</span>
                                                <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
                                                <span className="text-xs font-black text-rose-600">{failCount} FAIL</span>
                                            </div>
                                            <button
                                                onClick={handleGeneratePDF}
                                                disabled={isGeneratingPDF}
                                                className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
                                            >
                                                {isGeneratingPDF ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                                                {isGeneratingPDF ? 'Generando...' : 'Reporte PDF'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            {data.length > 0 ? (
                                <div className="space-y-6">
                                    {/* Dashboard de Calidad */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        <div className="lg:col-span-4">
                                            <QualityScore pass={testResults.filter(r => r.passed).length} total={testResults.length} />
                                        </div>
                                        <div className="lg:col-span-8 bg-white dark:bg-bg-card rounded-2xl border border-slate-100 dark:border-border-subtle p-8 flex flex-col justify-center">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Métricas de la Muestra</h3>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <SummaryCard label="Media Experimental" value={stats.mean.toFixed(6)} color="text-slate-700 dark:text-slate-200" />
                                                <SummaryCard label="Varianza" value={stats.variance.toFixed(6)} color="text-slate-700 dark:text-slate-200" />
                                                <SummaryCard label="Valor Mínimo" value={stats.min.toFixed(6)} color="text-amber-500" />
                                                <SummaryCard label="Valor Máximo" value={stats.max.toFixed(6)} color="text-rose-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Charts & Visualization */}
                                    <div id="stats-charts-container" className="bg-white dark:bg-bg-card rounded-2xl border border-slate-200 dark:border-border-subtle p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                                <Activity size={16} className="text-amber-500" /> Visualización de Pruebas
                                            </h3>
                                        </div>
                                        <div className="h-[350px]">
                                            <StatisticalCharts numbers={data} />
                                        </div>
                                    </div>

                                    {/* Detailed Results */}
                                    <div className="space-y-4 pb-8">
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Detalle de las Pruebas</h3>
                                            {hasRun && (
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{passCount} Aprobadas</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{failCount} Fallidas</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            {hasRun ? (
                                                testResults.map((result, idx) => (
                                                    <TestResultCard key={idx} result={result} />
                                                ))
                                            ) : (
                                                <div className="p-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                                                    <FlaskConical size={32} className="text-slate-200 dark:text-slate-800" />
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Esperando a que corras el análisis...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center">
                                    {uploaderNode}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default StatisticalLab;

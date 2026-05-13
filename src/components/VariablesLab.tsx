import { useState, useEffect } from 'react';
import { Activity, RefreshCw, BarChart3, Database, Info } from 'lucide-react';
import { getSharedNumbers, subscribeToSharedNumbers } from '../store/dataStore';
import ExcelUploader from './ExcelUploader';
import { availableVariables } from '../variables';
import type { VariableParams } from '../variables';
import VariablesResultTable from './VariablesResultTable';
import VariablesCharts from './VariablesCharts';
import FrequencyTable from './FrequencyTable';
import AppHeader from './AppHeader';
import CustomSelect from './CustomSelect';
import { createGenerator, GeneratorMethod } from '../engines';
import { setSharedNumbers } from '../store/dataStore';
import { Zap, Play } from 'lucide-react';

const VARIABLE_PRESETS = [
    {
        id: 'bank',
        name: "🏦 Fila de Banco",
        engine: GeneratorMethod.MIXED,
        engineParams: { seed: 42, a: 21, c: 3, m: 100 },
        count: 200,
        dist: 'exponential',
        distParams: { mean: 0.5 },
        description: "Llegada de clientes: Motor Mixto (Hull-Dobell) + Distribución Exponencial (Media = 0.5)."
    },
    {
        id: 'quality',
        name: "🔩 Control Industrial",
        engine: GeneratorMethod.LFG,
        engineParams: { p: 7, q: 3, m: 100000 },
        count: 1200,
        dist: 'normal',
        distParams: { mean: 10, stdDev: 0.2 },
        description: "Diámetros de piezas: LFG (Fibonacci) + Normal (Suma de 12 - Coss Bu)."
    },
    {
        id: 'callcenter',
        name: "📞 Central Telefónica",
        engine: GeneratorMethod.LFSR,
        engineParams: { seed: 0xACE1 },
        count: 500,
        dist: 'poisson',
        distParams: { lambda: 5 },
        description: "Llamadas por hora: LFSR (Hardware-level) + Distribución de Poisson."
    }
];

const PARAM_INSTRUCTIONS: Record<string, { title: string; hint: string }> = {
    'uniform': { title: "Uniforme (a, b)", hint: "Define un rango donde todos los valores tienen igual probabilidad. 'a' es el límite inferior y 'b' el superior." },
    'exponential': { title: "Exponencial (β)", hint: "β (beta) es el tiempo promedio entre eventos. Si llega un cliente cada 5 minutos, β=5. Modela tiempos de espera." },
    'poisson': { title: "Poisson (λ)", hint: "λ representa el promedio de eventos esperados en un tiempo fijo. El resultado es un número entero de eventos." },
    'erlang': { title: "Erlang (k, λ)", hint: "Modela procesos con fases. 'k' es el número de fases (debe ser entero). Útil para tiempos de servicio complejos." },
    'binomial': { title: "Binomial (n, p)", hint: "n = número de intentos, p = probabilidad de éxito (0 a 1). Cuenta cuántos éxitos ocurren en n pruebas." },
    'triangular': { title: "Triangular (a, b, c)", hint: "Ideal cuando no hay datos. a=mínimo, b=máximo, c=moda (valor más probable)." },
    'normal': { title: "Normal Suma-12", hint: "μ (media) es el centro de la campana, σ (desviación) es el ancho. Usa el estándar de Coss Bu." },
    'normal-bm': { title: "Normal Box-Muller", hint: "μ es la media y σ la desviación. Generación trigonométrica de alta precisión." }
};

const VariablesLab = () => {
    const [baseUniforms, setBaseUniforms] = useState<number[]>(getSharedNumbers());
    const [transformedNumbers, setTransformedNumbers] = useState<number[]>([]);
    const [selectedVar, setSelectedVar] = useState<string>('normal');
    const [params, setParams] = useState<VariableParams>({
        lambda: 2,
        k: 3,
        n: 10,
        p: 0.5,
        a: 1,
        b: 10,
        c: 5,
        mean: 1,
        stdDev: 1
    });

    useEffect(() => {
        const unsubscribe = subscribeToSharedNumbers((nums) => {
            setBaseUniforms(nums);
        });
        return unsubscribe;
    }, []);

    const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'frequencies'>('overview');

    const handleGenerate = () => {
        if (baseUniforms.length === 0) return;
        const generator = availableVariables[selectedVar];
        const result = generator.generate(baseUniforms, params);
        setTransformedNumbers(result);
    };

    const handleQuickTest = (preset: typeof VARIABLE_PRESETS[0]) => {
        // 1. Crear motor y generar uniformes
        const engine = createGenerator(preset.engine, preset.engineParams);
        const uniforms: number[] = [];
        for (let i = 0; i < preset.count; i++) {
            uniforms.push(engine.next());
        }

        // 2. Actualizar estado global y local
        setSharedNumbers(uniforms);
        setBaseUniforms(uniforms);

        // 3. Configurar distribución y parámetros
        setSelectedVar(preset.dist);
        setParams({ ...params, ...preset.distParams });

        // 4. Ejecutar transformación (usando los nuevos datos)
        const generator = availableVariables[preset.dist];
        const result = generator.generate(uniforms, { ...params, ...preset.distParams });
        setTransformedNumbers(result);
        setActiveTab('overview');
    };

    const handleUpload = (nums: number[]) => {
        const validUniforms = nums.filter(n => n >= 0 && n <= 1);
        if (validUniforms.length > 0) {
            setBaseUniforms(validUniforms);
        } else {
            alert('Los números del Excel deben ser uniformes en el rango [0, 1] para poder transformarlos.');
        }
    };



    const currentGenerator = availableVariables[selectedVar];

    // Cálculos estadísticos simplificados y seguros
    const sampleSize = transformedNumbers.length;
    const sampleMean = sampleSize > 0 
        ? transformedNumbers.reduce((a, b) => a + b, 0) / sampleSize 
        : 0;
    
    const sampleStdDev = sampleSize > 0 
        ? Math.sqrt(transformedNumbers.reduce((a, b) => a + (b - sampleMean) ** 2, 0) / sampleSize) 
        : 0;

    const uploaderNode = (
        <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto py-12">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner relative group overflow-hidden">
                <div className="absolute inset-0 bg-violet-500/5 scale-0 group-hover:scale-150 transition-transform duration-700 rounded-full" />
                <BarChart3 size={32} className="text-violet-500 relative z-10" />
            </div>
            
            <div className="space-y-2 text-center">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Estación en Reposo</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Para ejecutar la transformación de variables, se requieren entradas estocásticas U(0,1). Provee datos desde el laboratorio base o mediante una carga de archivo local.
                </p>
            </div>

            <div className="w-full pt-4">
                <div className="p-1 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <ExcelUploader onNumbersExtracted={handleUpload} />
                </div>
                <div className="mt-4 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-700">
                    <div className="h-px w-8 bg-current" />
                    Requiere: Números en rango [0, 1]
                    <div className="h-px w-8 bg-current" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen bg-[#fafafa] dark:bg-bg-dark text-slate-900 dark:text-slate-100 font-sans flex flex-col overflow-hidden transition-colors">
            <AppHeader />

            <main className="flex-1 flex overflow-hidden p-6 gap-6 relative z-10">
                <aside className="w-96 flex flex-col shrink-0 overflow-y-auto custom-scrollbar pr-2 gap-5 pb-5">
                    {/* Header del Sidebar */}
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Consola de Control</h2>
                    </div>

                    {/* Origen de Datos */}
                    <div className="bg-white dark:bg-bg-card rounded-2xl border border-slate-200 dark:border-border-subtle p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-violet-500 border border-slate-100 dark:border-slate-700">
                                <Database size={16} />
                            </div>
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Insumo de Datos</h3>
                        </div>
                        
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center transition-colors">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Uniformes U(0,1)</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-lg font-black tabular-nums ${baseUniforms.length > 0 ? 'text-violet-600' : 'text-slate-400'}`}>
                                    {baseUniforms.length}
                                </span>
                            </div>
                        </div>

                        {baseUniforms.length === 0 && (
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-snug italic">
                                    No hay datos uniformes disponibles. Genera números en el lab principal o sube un archivo.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Escenarios Integrados */}
                    <div className="bg-white dark:bg-bg-card rounded-2xl border border-slate-200 dark:border-border-subtle p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 border border-amber-100 dark:border-amber-800/50">
                                <Zap size={16} />
                            </div>
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Modelos Preconfigurados</h3>
                        </div>

                        <div className="space-y-2">
                            {VARIABLE_PRESETS.map(preset => (
                                <button
                                    key={preset.id}
                                    onClick={() => handleQuickTest(preset)}
                                    className="w-full group p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-slate-100 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-800 rounded-xl transition-all text-left space-y-1"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors uppercase tracking-tight">
                                            {preset.name}
                                        </span>
                                        <Play size={10} className="text-slate-300 group-hover:text-violet-500 fill-current opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                    </div>
                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold leading-tight line-clamp-2">
                                        {preset.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-2xl p-5 shadow-sm space-y-5">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-violet-500 border border-slate-100 dark:border-slate-700">
                                <Activity size={16} />
                            </div>
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Conversión Estocástica</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Distribución Objetivo</label>
                            <div className="relative group">
                                <CustomSelect
                                    value={selectedVar}
                                    onChange={setSelectedVar}
                                    colorTheme="violet"
                                    options={Object.keys(availableVariables).map(key => ({
                                        value: key,
                                        label: availableVariables[key].name
                                    }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            {selectedVar === 'uniform' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Mín (a)</label>
                                        <input type="number" step="0.1" value={params.a} onChange={e => setParams({...params, a: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Máx (b)</label>
                                        <input type="number" step="0.1" value={params.b} onChange={e => setParams({...params, b: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all" />
                                    </div>
                                </div>
                            )}

                            {selectedVar === 'exponential' && (
                                <div className="space-y-1.5">
                                    {/* Ajuste: Para Exponencial, el usuario ingresa la Media (beta) segun Coss Bu */}
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Media (β)</label>
                                    <input type="number" step="0.1" value={params.mean} onChange={e => setParams({...params, mean: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all" />
                                </div>
                            )}

                            {selectedVar === 'poisson' && (
                                <div className="space-y-1.5">
                                    {/* Para Poisson, la Tasa (lambda) es equivalente a la Media */}
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tasa (λ)</label>
                                    <input type="number" step="0.1" value={params.lambda} onChange={e => setParams({...params, lambda: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all" />
                                </div>
                            )}

                            {selectedVar === 'erlang' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Tasa (λ)</label>
                                        <input type="number" step="0.1" value={params.lambda} onChange={e => setParams({...params, lambda: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono font-bold" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fases (k)</label>
                                        <input type="number" step="1" value={params.k} onChange={e => setParams({...params, k: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono font-bold" />
                                    </div>
                                </div>
                            )}

                            {selectedVar === 'binomial' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Ensayos (n)</label>
                                        <input type="number" step="1" value={params.n} onChange={e => setParams({...params, n: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono font-bold" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Prob (p)</label>
                                        <input type="number" step="0.01" value={params.p} onChange={e => setParams({...params, p: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono font-bold" />
                                    </div>
                                </div>
                            )}

                            {selectedVar === 'triangular' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Mín (a)</label>
                                            <input type="number" step="0.1" value={params.a} onChange={e => setParams({...params, a: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono font-bold" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Máx (b)</label>
                                            <input type="number" step="0.1" value={params.b} onChange={e => setParams({...params, b: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Moda (c)</label>
                                        <input type="number" step="0.1" value={params.c} onChange={e => setParams({...params, c: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono font-bold" />
                                    </div>
                                </div>
                            )}

                            {(selectedVar === 'normal' || selectedVar === 'normal-bm') && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Media (μ)</label>
                                        <input type="number" step="0.1" value={params.mean} onChange={e => setParams({...params, mean: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Desv (σ)</label>
                                        <input type="number" step="0.1" value={params.stdDev} onChange={e => setParams({...params, stdDev: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Panel de Ayuda Académica (Nuevo) */}
                        <div className="p-4 bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100/50 dark:border-violet-800/30 rounded-xl space-y-1.5">
                            <h4 className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">
                                {PARAM_INSTRUCTIONS[selectedVar]?.title || "Instrucciones"}
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed italic">
                                {PARAM_INSTRUCTIONS[selectedVar]?.hint || "Configura los parámetros para la transformación."}
                            </p>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={baseUniforms.length === 0}
                            className="w-full mt-6 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest py-4.5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md active:scale-[0.98]"
                        >
                            <RefreshCw size={16} className={baseUniforms.length > 0 ? "animate-spin-slow" : ""} /> Ejecutar Conversión
                        </button>
                    </div>
                </aside>

                <section className="flex-1 flex flex-col overflow-hidden gap-4">
                    {transformedNumbers.length > 0 ? (
                        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-bg-card rounded-2xl border border-slate-200 dark:border-border-subtle shadow-sm overflow-hidden">
                            {/* Tab Navigation */}
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-bg-dark/30">
                                <div className="flex gap-2">
                                    {[
                                        { id: 'overview', label: 'Vista General', icon: <BarChart3 size={14} /> },
                                        { id: 'data', label: 'Tabla de Datos', icon: <Database size={14} /> },
                                        { id: 'frequencies', label: 'Frecuencias', icon: <Activity size={14} /> },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`
                                                flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                                                ${activeTab === tab.id 
                                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' 
                                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}
                                            `}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Distribución</p>
                                        <p className="text-sm font-black text-violet-600 uppercase tracking-tighter">{currentGenerator.name}</p>
                                    </div>
                                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700" />
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Muestras</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums leading-none">{transformedNumbers.length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                {activeTab === 'overview' && (
                                    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* Cards de Resumen */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                                            <div className="p-6 bg-violet-600 text-white rounded-2xl shadow-lg shadow-violet-500/20 relative overflow-hidden group">
                                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                                <h4 className="text-xs font-black uppercase tracking-widest mb-2 opacity-80 relative z-10 text-violet-50 text-[9px]">Población (N)</h4>
                                                <div className="text-3xl font-black relative z-10 tabular-nums leading-none mb-2">{transformedNumbers.length}</div>
                                                <div className="text-[9px] font-bold opacity-70 uppercase relative z-10">Generadas con Éxito</div>
                                            </div>

                                            <div className="p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
                                                <div>
                                                    <h4 className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest flex items-center gap-2">
                                                        <div className="w-1.5 h-3 bg-violet-500 rounded-full" /> Centroide (X̄)
                                                    </h4>
                                                    <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                                        {sampleMean.toFixed(4)}
                                                    </div>
                                                </div>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-1 italic">
                                                    Objetivo: {selectedVar === 'exponential' ? (params.mean || 1).toFixed(1) : (params.lambda || 1).toFixed(1)}
                                                </p>
                                            </div>

                                            <div className="p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                                <h4 className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Varianza Operativa</h4>
                                                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                                    {sampleStdDev.toFixed(4)}
                                                </div>
                                                <div className="pt-2 border-t border-slate-50 dark:border-slate-800/50">
                                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                                                        {selectedVar === 'exponential' ? "Debe ser ≈ Media" : "Variabilidad Real"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                                <div>
                                                    <h4 className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Topología del Motor</h4>
                                                    <p className="text-[11px] font-black text-violet-600 dark:text-violet-400 uppercase">{currentGenerator.method}</p>
                                                </div>
                                                <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                        <span>Complejidad</span>
                                                        <span className="text-violet-600 font-bold">{currentGenerator.complexity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Panel de Teoría Académica (Restaurado y mejorado) */}
                                        <div className="p-6 bg-slate-50 dark:bg-bg-dark/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex gap-6 items-start">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                                                <Info size={20} className="text-violet-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                    Fundamento Teórico: {currentGenerator.name}
                                                </h4>
                                                <div className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                                    {currentGenerator.theory.replace(/\$/g, '')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Gráfica Principal */}
                                        <div className="flex-1 min-h-[350px] bg-slate-50 dark:bg-bg-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col">
                                            <div className="flex items-center justify-between mb-4">
                                              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Activity size={14} className="text-violet-500" /> Histograma de Distribución
                                              </h3>
                                            </div>
                                            <div className="flex-1 w-full">
                                              <VariablesCharts 
                                                  numbers={transformedNumbers} 
                                                  name={currentGenerator.name} 
                                                  type={selectedVar}
                                              />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'data' && (
                                    <div className="h-full animate-in fade-in slide-in-from-right-4 duration-500">
                                        <VariablesResultTable
                                            uniforms={baseUniforms}
                                            transformed={transformedNumbers}
                                            distributionName={currentGenerator.name}
                                        />
                                    </div>
                                )}

                                {activeTab === 'frequencies' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                        <FrequencyTable 
                                            data={transformedNumbers} 
                                            variableName={currentGenerator.name} 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-bg-card rounded-xl border border-slate-200 dark:border-border-subtle h-full flex flex-col shadow-sm overflow-hidden transition-colors">
                            <div className="flex-1 flex flex-col items-center justify-center p-8">
                                <div className="w-full max-w-sm space-y-4">
                                    {uploaderNode}
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default VariablesLab;

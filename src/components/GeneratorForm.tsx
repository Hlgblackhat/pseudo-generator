import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FC } from 'react';
import { RefreshCw, HelpCircle, Settings2, Sparkles, Square, Pause, Play, Rocket } from 'lucide-react';
import { GeneratorMethod, type GeneratorMethodType } from '../engines/types';
import { createGenerator } from '../engines';
import CustomSelect from './CustomSelect';

interface GeneratorFormProps {
    onGenerate: (params: any) => void;
    isLoading: boolean;
    isPaused?: boolean;
    onPause?: () => void;
    onResume?: () => void;
    onStop?: () => void;
}

const GeneratorForm: FC<GeneratorFormProps> = ({ onGenerate, isLoading, isPaused, onPause, onResume, onStop }) => {
    const [searchParams] = useSearchParams();
    // Estado para el método seleccionado por el usuario
    const [method, setMethod] = useState<GeneratorMethodType>(GeneratorMethod.MIXED);

    // Estado consolidado para todos los parámetros de los diferentes algoritmos
    const [params, setParams] = useState({
        seed: 42,
        a: 1664525,
        c: 1013904223,
        m: 4294967296, // 2^32, mejor para las pruebas estadísticas
        k: 10, // Retraso mayor (LFG)
        j: 7, // Retraso menor (LFG)
        d: 4, // Cantidad de dígitos para Cuadrados Medios
        p: 499, // Primo p para BBS
        q: 503, // Primo q para BBS
        count: 100, // Cantidad de números a generar deseada
        useTimeEntropy: false
    });

    /**
     * Manejador genérico para cambios en los inputs del formulario.
     * Soporta inputs numéricos y checkboxes.
     * Nota: guardamos el valor de string tal cual para no perder el cero al escribir,
     * pero lo convertimos a número sólo si es válido.
     */
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const esCheckbox = type === 'checkbox';

        if (esCheckbox) {
            const checked = (e.target as HTMLInputElement).checked;
            setParams(prev => ({ ...prev, [name]: checked }));
        } else {
            const parsed = parseInt(value, 10);
            // Solo actualizar si el valor es un número válido o está vacío (para permitir borrar)
            if (!isNaN(parsed)) {
                setParams(prev => ({ ...prev, [name]: parsed }));
            }
        }
    };

    /**
     * Envía los parámetros al componente padre (App) para iniciar la generación.
     */
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onGenerate({ ...params, method });
    };

    /**
     * Ref para manejar el auto-run desde URL sin side-effects en el updater de setParams.
     */
    const pendingAutoRun = useRef<{ finalParams: any } | null>(null);

    /**
     * Efecto para procesar parámetros desde la URL.
     * IMPORTANTE: No llamamos onGenerate dentro del updater de setParams porque
     * React StrictMode puede invocar los updaters dos veces.
     */
    useEffect(() => {
        const initMethod = searchParams.get('method') as GeneratorMethodType;
        if (!initMethod || !Object.values(GeneratorMethod).includes(initMethod)) return;

        // Construimos los overrides desde la URL
        const overrides: Record<string, number | string | boolean> = {};
        if (searchParams.has('seed')) overrides.seed = parseInt(searchParams.get('seed')!);
        if (searchParams.has('a')) overrides.a = parseInt(searchParams.get('a')!);
        if (searchParams.has('c')) overrides.c = parseInt(searchParams.get('c')!);
        if (searchParams.has('m')) overrides.m = parseInt(searchParams.get('m')!);
        if (searchParams.has('p')) overrides.p = parseInt(searchParams.get('p')!);
        if (searchParams.has('q')) overrides.q = parseInt(searchParams.get('q')!);
        if (searchParams.has('j')) overrides.j = parseInt(searchParams.get('j')!);
        if (searchParams.has('k')) overrides.k = parseInt(searchParams.get('k')!);
        if (searchParams.has('d')) overrides.d = parseInt(searchParams.get('d')!);
        if (searchParams.has('count')) overrides.count = parseInt(searchParams.get('count')!);

        setMethod(initMethod);
        setParams(prev => {
            const newParams = { ...prev, ...overrides };

            // Guardamos en un ref para que el efecto de abajo lo ejecute después del render
            if (searchParams.get('auto') === '1') {
                pendingAutoRun.current = { finalParams: { ...newParams, method: initMethod } };
            }

            return newParams;
        });
    }, [searchParams]);

    /**
     * Efecto separado que detecta el pendingAutoRun y dispara onGenerate de forma segura,
     * DESPUÉS de que el estado de React ya fue aplicado al DOM.
     */
    const onGenerateRef = useRef(onGenerate);
    useEffect(() => { onGenerateRef.current = onGenerate; });

    useEffect(() => {
        if (pendingAutoRun.current) {
            const { finalParams } = pendingAutoRun.current;
            pendingAutoRun.current = null;
            // Usamos el ref para evitar stale closure sobre onGenerate
            onGenerateRef.current(finalParams);
        }
    }, [params, method]); // Dispara cada vez que el estado cambia, pero el ref asegura una sola ejecución

    /**
     * Carga un ejemplo rápido y precarga el formulario.
     * Usa los valores nuevos directamente (no lee del estado) para evitar closures obsoletas.
     */
    const handleQuickTest = (testType: string) => {
        let newMethod: GeneratorMethodType = GeneratorMethod.MIXED;
        let overrides: Record<string, number> = {};

        switch(testType) {
            case 'mixed':
                newMethod = GeneratorMethod.MIXED;
                overrides = { seed: 42, a: 21, c: 3, m: 100, count: 100 };
                break;
            case 'bbs':
                newMethod = GeneratorMethod.BBS;
                overrides = { seed: 12345, p: 499, q: 503, count: 50 };
                break;
            case 'lfg':
                newMethod = GeneratorMethod.LFG;
                overrides = { seed: 12345, j: 7, k: 10, m: 100000, count: 200 };
                break;
            case 'middle_square':
                newMethod = GeneratorMethod.MIDDLE_SQUARE;
                overrides = { seed: 12, d: 2, count: 30 };
                break;
            case 'multiplicative':
                newMethod = GeneratorMethod.MULTIPLICATIVE;
                overrides = { seed: 123, a: 5, m: 1024, count: 100 };
                break;
            case 'additive':
                newMethod = GeneratorMethod.ADDITIVE;
                overrides = { seed: 123, k: 10, m: 1024, count: 100 };
                break;
            case 'lfsr':
                newMethod = GeneratorMethod.LFSR;
                overrides = { seed: 46080, count: 100 };
                break;
        }

        setMethod(newMethod);
        // Usamos el setter funcional para obtener los params actuales y aplicar los overrides
        setParams(prev => {
            const newParams = { ...prev, ...overrides };
            return newParams;
        });
    };

    /**
     * Efecto secundario para ajustar parámetros por defecto cuando cambia el método.
     * Por ejemplo, fuerza c=0 en el método Multiplicativo.
     */
    useEffect(() => {
        if (method === GeneratorMethod.MULTIPLICATIVE) {
            setParams(prev => ({ ...prev, c: 0 }));
        }
    }, [method]);

    /**
     * Escucha el evento global 'applyAutoCorrect' disparado desde el panel "Sugerencia Lab" en App.tsx.
     * Muta el estado visualmente para que los inputs reflejen los nuevos parámetros válidos.
     */
    useEffect(() => {
        const handleAutoCorrectEvent = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail) {
                if (detail.method) setMethod(detail.method);
                setParams(prev => ({ ...prev, ...detail }));
            }
        };
        window.addEventListener('applyAutoCorrect', handleAutoCorrectEvent);
        return () => window.removeEventListener('applyAutoCorrect', handleAutoCorrectEvent);
    }, []);

    /**
     * Sugiere parámetros óptimos consultando directamente al motor del algoritmo activo.
     * Cada motor implementa su propia lógica de sugerencia basada en reglas matemáticas.
     */
    const handleSuggest = () => {
        const motor = createGenerator(method, { ...params, method, useTimeEntropy: false });
        const sugerencias = motor.suggestParams();
        if (Object.keys(sugerencias).length > 0) {
            setParams(prev => ({ ...prev, ...sugerencias }));
        }
    };

    /**
     * Devuelve el texto de ayuda contextual según el método activo,
     * explicando los requisitos y restricciones matemáticas del algoritmo.
     */
    const getHelpText = (): string => {
        switch (method) {
            case GeneratorMethod.MIXED:
                return 'Hull-Dobell: mCD(c,m)=1, todos los primos de m dividen (a-1) y si 4|m entonces 4|(a-1).';
            case GeneratorMethod.MULTIPLICATIVE:
                return 'Para m=2ⁿ: semilla impar y a≡3 o 5 (mod 8). Periodo máximo = m/4.';
            case GeneratorMethod.ADDITIVE:
                return 'Retraso k≥2 requerido. La secuencia inicial se genera con un LCG interno.';
            case GeneratorMethod.MIDDLE_SQUARE:
                return 'La semilla debe tener exactamente d dígitos. Semillas "intercaladas" evitan el colapso a 0.';
            case GeneratorMethod.LFSR:
                return 'La semilla nunca puede ser 0. Usa polinomio primitivo x¹⁶+x¹⁴+x¹³+x¹¹+1 (0xB400).';
            case GeneratorMethod.BBS:
                return 'Requiere dos primos p y q tales que p,q ≡ 3 (mod 4). mCD(semilla, p*q)=1.';
            case GeneratorMethod.LFG:
                return 'Requiere j < k. El sistema pre-llena el buffer con un LCG para mayor estabilidad.';
            default:
                return 'Configure los parámetros del algoritmo seleccionado.';
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Pruebas Rápidas */}
            <div className="bg-white dark:bg-bg-card p-4 rounded-lg shadow-sm border border-slate-200 dark:border-border-subtle transition-colors">
                <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Rocket size={14} className="text-brand-primary" /> Pruebas Rápidas
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        type="button"
                        onClick={() => handleQuickTest('mixed')}
                        className="text-[11px] font-bold bg-slate-50 dark:bg-bg-dark text-slate-600 dark:text-slate-300 py-1.5 px-2 rounded hover:bg-brand-primary/10 hover:text-brand-primary dark:hover:bg-brand-primary/20 transition-colors text-left"
                    >
                        Súper Bien (Mixto)
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleQuickTest('bbs')}
                        className="text-[11px] font-bold bg-slate-50 dark:bg-bg-dark text-slate-600 dark:text-slate-300 py-1.5 px-2 rounded hover:bg-brand-primary/10 hover:text-brand-primary dark:hover:bg-brand-primary/20 transition-colors text-left"
                    >
                        Criptografía (BBS)
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleQuickTest('lfg')}
                        className="text-[11px] font-bold bg-slate-50 dark:bg-bg-dark text-slate-600 dark:text-slate-300 py-1.5 px-2 rounded hover:bg-brand-primary/10 hover:text-brand-primary dark:hover:bg-brand-primary/20 transition-colors text-left"
                    >
                        Ciclos Largos (LFG)
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleQuickTest('middle_square')}
                        className="text-[11px] font-bold bg-slate-50 dark:bg-bg-dark text-slate-600 dark:text-slate-300 py-1.5 px-2 rounded hover:bg-brand-primary/10 hover:text-brand-primary dark:hover:bg-brand-primary/20 transition-colors text-left"
                    >
                        Cómo Falla (Cuad.)
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleQuickTest('multiplicative')}
                        className="text-[11px] font-bold bg-slate-50 dark:bg-bg-dark text-slate-600 dark:text-slate-300 py-1.5 px-2 rounded hover:bg-brand-primary/10 hover:text-brand-primary dark:hover:bg-brand-primary/20 transition-colors text-left"
                    >
                        M=2ⁿ (Mult.)
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleQuickTest('additive')}
                        className="text-[11px] font-bold bg-slate-50 dark:bg-bg-dark text-slate-600 dark:text-slate-300 py-1.5 px-2 rounded hover:bg-brand-primary/10 hover:text-brand-primary dark:hover:bg-brand-primary/20 transition-colors text-left"
                    >
                        Memoria (Aditivo)
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleQuickTest('lfsr')}
                        className="text-[11px] font-bold bg-slate-50 dark:bg-bg-dark text-slate-600 dark:text-slate-300 py-1.5 px-2 rounded hover:bg-brand-primary/10 hover:text-brand-primary dark:hover:bg-brand-primary/20 transition-colors text-left"
                    >
                        Bits/LFSR (16-bit)
                    </button>
                </div>
            </div>

            {/* Selector de Algoritmo */}
            <div className="bg-white dark:bg-bg-card p-4 rounded-lg shadow-sm border border-slate-200 dark:border-border-subtle transition-colors">
                <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2.5 block">
                    Algoritmo de Generación
                </label>
                <CustomSelect 
                    value={method}
                    onChange={(val) => setMethod(val as GeneratorMethodType)}
                    colorTheme="brand"
                    options={[
                        { value: GeneratorMethod.MIXED, label: 'Lineal Congruencial (Mixto)' },
                        { value: GeneratorMethod.MULTIPLICATIVE, label: 'Congruencial Multiplicativo' },
                        { value: GeneratorMethod.ADDITIVE, label: 'Congruencial Aditivo' },
                        { value: GeneratorMethod.MIDDLE_SQUARE, label: 'Cuadrados Medios' },
                        { value: GeneratorMethod.LFSR, label: 'LFSR (Bits)' },
                        { value: GeneratorMethod.BBS, label: 'Blum Blum Shub (BBS)' },
                        { value: GeneratorMethod.LFG, label: 'Lagged Fibonacci (LFG)' }
                    ]}
                />
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-bg-card p-5 rounded-lg shadow-sm border border-slate-200 dark:border-border-subtle gap-4 flex flex-col relative overflow-hidden shrink-0 transition-colors">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <Settings2 size={18} /> Configuración
                    </h2>
                    {(method === GeneratorMethod.MIXED || method === GeneratorMethod.MULTIPLICATIVE || method === GeneratorMethod.BBS || method === GeneratorMethod.LFG) && (
                        <button
                            type="button"
                            onClick={handleSuggest}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-primary transition-colors tooltip"
                            title="Sugerir valores óptimos"
                        >
                            <Sparkles size={16} />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Parámetro común: Semilla */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Semilla ($x_0$)</label>
                        <input
                            type="number"
                            name="seed"
                            value={params.seed}
                            onChange={handleChange}
                            className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-brand-primary outline-none transition-all tabular-nums font-medium"
                        />
                    </div>

                    {/* Campos dinámicos según el método seleccionado */}
                    {(method === GeneratorMethod.MIXED || method === GeneratorMethod.MULTIPLICATIVE) && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Mult. ($a$)</label>
                            <input
                                type="number"
                                name="a"
                                value={params.a}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-4 py-2 text-base text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-brand-primary outline-none transition-all tabular-nums font-medium"
                            />
                        </div>
                    )}

                    {method === GeneratorMethod.MIXED && (
                        <div className="space-y-1">
                            <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Incr. ($c$)</label>
                            <input
                                type="number"
                                name="c"
                                value={params.c}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-brand-primary outline-none transition-all tabular-nums font-medium"
                            />
                        </div>
                    )}

                    {method === GeneratorMethod.ADDITIVE && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Retraso ($k$)</label>
                            <input
                                type="number"
                                name="k"
                                value={params.k}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-brand-primary outline-none transition-all tabular-nums font-medium"
                            />
                        </div>
                    )}

                    {method === GeneratorMethod.MIDDLE_SQUARE && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Dígitos ($d$)</label>
                            <input
                                type="number"
                                name="d"
                                value={params.d}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-brand-primary outline-none transition-all tabular-nums font-medium"
                            />
                        </div>
                    )}

                    {method === GeneratorMethod.LFG && (
                        <>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Retraso j</label>
                                <input
                                    type="number"
                                    name="j"
                                    value={params.j}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-brand-primary outline-none transition-all tabular-nums font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Retraso mayor ($k$)</label>
                                <input
                                    type="number"
                                    name="k"
                                    value={params.k}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-brand-primary outline-none transition-all tabular-nums font-medium"
                                />
                            </div>
                        </>
                    )}

                    {method === GeneratorMethod.BBS && (
                        <>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Primo ($p$)</label>
                                <input
                                    type="number"
                                    name="p"
                                    value={params.p}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-brand-primary outline-none transition-all tabular-nums font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Primo ($q$)</label>
                                <input
                                    type="number"
                                    name="q"
                                    value={params.q}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-brand-primary outline-none transition-all tabular-nums font-medium"
                                />
                            </div>
                        </>
                    )}

                    {(method !== GeneratorMethod.MIDDLE_SQUARE && method !== GeneratorMethod.LFSR && method !== GeneratorMethod.BBS) && (
                        <div className="space-y-1">
                            <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Módulo ($m$)</label>
                            <input
                                type="number"
                                name="m"
                                value={params.m}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-brand-primary outline-none font-black transition-all tabular-nums"
                            />
                        </div>
                    )}
                    <div className="space-y-1 col-span-2">
                        <label className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Cantidad a Generar ($n$)</label>
                        <input
                            type="number"
                            name="count"
                            value={params.count}
                            onChange={handleChange}
                            min="1"
                            max="20000"
                            className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-lg px-4 py-2 text-base font-bold text-brand-primary dark:text-brand-primary focus:ring-1 focus:ring-black dark:focus:ring-brand-primary outline-none transition-all tabular-nums"
                        />
                    </div>
                </div>

                {/* Ayuda contextual sobre el periodo y parámetros */}
                <div className="p-3 bg-slate-50 dark:bg-bg-dark rounded-xl border border-slate-100 dark:border-border-subtle flex items-start gap-2">
                    <HelpCircle size={14} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight italic">
                            {getHelpText()}
                        </p>
                        {isLoading && (
                            <p className="text-[8px] text-sky-600 dark:text-sky-400 font-bold uppercase tracking-tight">
                                Generando Secuencia...
                            </p>
                        )}
                    </div>
                </div>

                {/* Toggle para inyectar entropía basada en el reloj de sistema */}
                <div className="bg-slate-50 dark:bg-bg-dark p-3 rounded-xl border border-slate-100 dark:border-border-subtle">
                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">Desplazamiento Temporal</span>
                            <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-black">Usa el Reloj del Sistema</span>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                name="useTimeEntropy"
                                checked={params.useTimeEntropy}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:bg-black dark:peer-checked:bg-brand-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                        </div>
                    </label>
                </div>

                {/* Botón de acción */}
                {!isLoading ? (
                    <button
                        type="submit"
                        className="w-full group bg-sky-600 hover:bg-sky-700 text-white text-xs font-black py-4.5 rounded-2xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98]"
                    >
                        <RefreshCw size={16} className="group-hover:rotate-[360deg] transition-transform duration-700" />
                        <span>EJECUTAR ALGORITMO</span>
                    </button>
                ) : (
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={isPaused ? onResume : onPause}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                                    isPaused 
                                        ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20' 
                                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                }`}
                            >
                                {isPaused ? (
                                    <>
                                        <Play size={14} className="fill-current" />
                                        <span>Reanudar</span>
                                    </>
                                ) : (
                                    <>
                                        <Pause size={14} className="fill-current" />
                                        <span>Pausar</span>
                                    </>
                                )}
                            </button>
                            
                            <button
                                type="button"
                                onClick={onStop}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                            >
                                <Square size={14} className="fill-current" />
                                <span>Detener</span>
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default GeneratorForm;

import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import type { FC } from 'react';
import { RefreshCw, HelpCircle, Layers, Settings2 } from 'lucide-react';
import { GeneratorMethod, type GeneratorMethodType } from '../engines/types';

interface GeneratorFormProps {
    onGenerate: (params: any) => void;
    isLoading: boolean;
}

const GeneratorForm: FC<GeneratorFormProps> = ({ onGenerate, isLoading }) => {
    // Estado para el método seleccionado por el usuario
    const [method, setMethod] = useState<GeneratorMethodType>(GeneratorMethod.MIXED);

    // Estado consolidado para todos los parámetros de los diferentes algoritmos
    const [params, setParams] = useState({
        seed: 42,
        a: 21,
        c: 3,
        m: 100,
        k: 2, // Retraso para el método Aditivo
        d: 4, // Cantidad de dígitos para Cuadrados Medios
        useTimeEntropy: false
    });

    /**
     * Manejador genérico para cambios en los inputs del formulario.
     * Soporta inputs numéricos y checkboxes.
     */
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const esCheckbox = type === 'checkbox';
        const valor = esCheckbox ? (e.target as HTMLInputElement).checked : (parseInt(value) || 0);

        setParams(prev => ({
            ...prev,
            [name]: valor
        }));
    };

    /**
     * Envía los parámetros al componente padre (App) para iniciar la generación.
     */
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onGenerate({ ...params, method });
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

    return (
        <div className="flex flex-col gap-4">
            {/* Selector de Algoritmo */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                    Algoritmo de Generación
                </label>
                <div className="relative">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as GeneratorMethodType)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 appearance-none focus:ring-1 focus:ring-black outline-none transition-all cursor-pointer"
                    >
                        <option value={GeneratorMethod.MIXED}>Lineal Congruencial (Mixto)</option>
                        <option value={GeneratorMethod.MULTIPLICATIVE}>Congruencial Multiplicativo</option>
                        <option value={GeneratorMethod.ADDITIVE}>Congruencial Aditivo</option>
                        <option value={GeneratorMethod.MIDDLE_SQUARE}>Cuadrados Medios</option>
                        <option value={GeneratorMethod.LFSR}>LFSR (Bits)</option>
                    </select>
                    <Layers size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 gap-4 flex flex-col relative overflow-hidden shrink-0">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <Settings2 size={18} /> Configuración
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Parámetro común: Semilla */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semilla ($x_0$)</label>
                        <input
                            type="number"
                            name="seed"
                            value={params.seed}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:ring-1 focus:ring-black outline-none transition-all tabular-nums font-medium"
                        />
                    </div>

                    {/* Campos dinámicos según el método seleccionado */}
                    {(method === GeneratorMethod.MIXED || method === GeneratorMethod.MULTIPLICATIVE) && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mult. ($a$)</label>
                            <input
                                type="number"
                                name="a"
                                value={params.a}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:ring-1 focus:ring-black outline-none transition-all tabular-nums font-medium"
                            />
                        </div>
                    )}

                    {method === GeneratorMethod.MIXED && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incr. ($c$)</label>
                            <input
                                type="number"
                                name="c"
                                value={params.c}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:ring-1 focus:ring-black outline-none transition-all tabular-nums font-medium"
                            />
                        </div>
                    )}

                    {method === GeneratorMethod.ADDITIVE && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retraso ($k$)</label>
                            <input
                                type="number"
                                name="k"
                                value={params.k}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:ring-1 focus:ring-black outline-none transition-all tabular-nums font-medium"
                            />
                        </div>
                    )}

                    {method === GeneratorMethod.MIDDLE_SQUARE && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dígitos ($d$)</label>
                            <input
                                type="number"
                                name="d"
                                value={params.d}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:ring-1 focus:ring-black outline-none transition-all tabular-nums font-medium"
                            />
                        </div>
                    )}

                    {(method !== GeneratorMethod.MIDDLE_SQUARE && method !== GeneratorMethod.LFSR) && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo ($m$)</label>
                            <input
                                type="number"
                                name="m"
                                value={params.m}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:ring-1 focus:ring-black outline-none font-black transition-all tabular-nums"
                            />
                        </div>
                    )}
                </div>

                {/* Ayuda contextual sobre el periodo y parámetros */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                    <HelpCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-slate-500 leading-tight italic">
                        {method === GeneratorMethod.MIXED ? 'Módulo m define el límite del periodo máximo (Hull-Dobell).' :
                            method === GeneratorMethod.MULTIPLICATIVE ? 'Módulo m con incremento c=0.' :
                                'Configure los parámetros específicos del algoritmo seleccionado.'}
                    </p>
                </div>

                {/* Toggle para inyectar entropía basada en el reloj de sistema */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900">Desplazamiento Temporal</span>
                            <span className="text-[8px] text-slate-400 uppercase font-black">Usa el Reloj del Sistema</span>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                name="useTimeEntropy"
                                checked={params.useTimeEntropy}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:bg-black transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                        </div>
                    </label>
                </div>

                {/* Botón de acción */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full group bg-black hover:bg-slate-800 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <RefreshCw size={14} className={`${isLoading ? 'animate-spin' : 'group-hover:rotate-[360deg] transition-transform duration-700'}`} />
                    <span>{isLoading ? 'GENERANDO...' : 'EJECUTAR ALGORITMO'}</span>
                </button>
            </form>
        </div>
    );
};

export default GeneratorForm;

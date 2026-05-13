import { useState } from 'react';
import { 
    Settings, TrendingUp, Users, Clock, 
    CheckCircle2, HelpCircle, AlertCircle,
    Plus, X
} from 'lucide-react';
import QueueVisualizer from './QueueVisualizer';
import AppHeader from './AppHeader';

type Topology = 'parallel' | 'multiple' | 'series' | 'multi-series';
type Distribution = 'exponential' | 'uniform' | 'normal' | 'poisson';

interface ServerConfig {
    id: number;
    name: string;
    dist: Distribution;
    lambda: number;
    min: number;
    max: number;
    mu: number;
    sigma: number;
    colorClass: string;
    colorHex: string;
}

const SERVER_COLORS = [
    { class: 'teal', hex: '#14b8a6', border: 'border-teal-500/30', bg: 'bg-teal-500/10', text: 'text-teal-600' },
    { class: 'amber', hex: '#f59e0b', border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-600' },
    { class: 'purple', hex: '#a855f7', border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-600' },
    { class: 'rose', hex: '#f43f5e', border: 'border-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-600' },
];

export default function QueuesLab() {
    const [daysToSimulate, setDaysToSimulate] = useState(1);
    const [hoursPerDay, setHoursPerDay] = useState(8);
    const [arrivalsPerHour, setArrivalsPerHour] = useState(20);
    const [topology, setTopology] = useState<Topology>('parallel');
    const [isSimulating, setIsSimulating] = useState(false);
    const [speed, setSpeed] = useState(5);
    const [tableData, setTableData] = useState<any[]>([]);
    const [simulationStats, setSimulationStats] = useState<any>(null);
    const [insights, setInsights] = useState<any>(null);
    
    const [serverConfigs, setServerConfigs] = useState<ServerConfig[]>([
        { id: 1, name: 'Cajero 1', dist: 'exponential', lambda: 0.5, min: 1, max: 5, mu: 3, sigma: 0.8, colorClass: SERVER_COLORS[0].class, colorHex: SERVER_COLORS[0].hex },
        { id: 2, name: 'Cajero 2', dist: 'uniform', lambda: 0.5, min: 1, max: 5, mu: 3, sigma: 0.8, colorClass: SERVER_COLORS[1].class, colorHex: SERVER_COLORS[1].hex },
        { id: 3, name: 'Cajero 3', dist: 'normal', lambda: 0.5, min: 1, max: 5, mu: 3, sigma: 0.8, colorClass: SERVER_COLORS[2].class, colorHex: SERVER_COLORS[2].hex },
    ]);

    const addServer = () => {
        if (serverConfigs.length >= 4) return;
        const newId = serverConfigs.length > 0 ? Math.max(...serverConfigs.map(s => s.id)) + 1 : 1;
        const colorIdx = (newId - 1) % SERVER_COLORS.length;
        setServerConfigs([...serverConfigs, { 
            id: newId, 
            name: `Cajero ${newId}`, 
            dist: 'exponential', 
            lambda: 0.5, min: 1, max: 5, mu: 3, sigma: 0.8,
            colorClass: SERVER_COLORS[colorIdx].class,
            colorHex: SERVER_COLORS[colorIdx].hex
        }]);
    };

    const removeServer = (id: number) => {
        setServerConfigs(serverConfigs.filter(s => s.id !== id));
    };

    const runSimulation = () => {
        setIsSimulating(true);
        setTimeout(() => {
            const totalMinutes = daysToSimulate * hoursPerDay * 60;
            const lambdaArrival = arrivalsPerHour / 60; 
            const rows: any[] = [];
            
            const serverState = serverConfigs.map(s => ({
                ...s,
                nextFreeTime: 0,
                totalServiceTime: 0,
                clientsServed: 0,
                totalWaitTime: 0
            }));

            let clock = 0;
            let clientId = 1;
            let maxQueueLength = 0;

            const getServiceTime = (s: ServerConfig) => {
                const U = Math.random() || 0.0001;
                if (s.dist === 'exponential' || s.dist === 'poisson') {
                    return - (1 / s.lambda) * Math.log(1 - U);
                }
                if (s.dist === 'uniform') {
                    return s.min + (s.max - s.min) * U;
                }
                if (s.dist === 'normal') {
                    const u1 = Math.random();
                    const u2 = Math.random();
                    const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
                    return Math.max(0.1, s.mu + s.sigma * z0);
                }
                return 2;
            };

            while (clock < totalMinutes) {
                const interArrival = -Math.log(1 - (Math.random() || 0.0001)) / lambdaArrival;
                clock += interArrival;
                if (clock >= totalMinutes) break;

                const arrivalTime = clock;
                let stages: any[] = [];

                if (topology === 'series') {
                    // S1 -> S2 -> S3 ...
                    let currentStartTime = arrivalTime;
                    for (let i = 0; i < serverState.length; i++) {
                        const s = serverState[i];
                        const start = Math.max(currentStartTime, s.nextFreeTime);
                        const serv = getServiceTime(s);
                        const end = start + serv;
                        
                        const waitInStage = start - currentStartTime;
                        s.nextFreeTime = end;
                        s.totalServiceTime += serv;
                        s.totalWaitTime += waitInStage;
                        s.clientsServed++;
                        
                        stages.push({ serverName: s.name, start, end, wait: waitInStage });
                        currentStartTime = end;
                    }
                } else if (topology === 'parallel') {
                    // 1 Queue -> N Servers (M/M/s)
                    const sel = serverState.reduce((prev, curr, idx, arr) => curr.nextFreeTime < arr[prev].nextFreeTime ? idx : prev, 0);
                    const s = serverState[sel];
                    const start = Math.max(arrivalTime, s.nextFreeTime);
                    const serv = getServiceTime(s);
                    const end = start + serv;
                    
                    const wait = start - arrivalTime;
                    s.nextFreeTime = end;
                    s.totalServiceTime += serv;
                    s.totalWaitTime += wait;
                    s.clientsServed++;
                    
                    stages.push({ serverName: s.name, start, end, wait });
                } else if (topology === 'multiple') {
                    // N Queues -> N Servers (Client chooses server with earliest nextFreeTime)
                    const sel = serverState.reduce((prev, curr, idx, arr) => curr.nextFreeTime < arr[prev].nextFreeTime ? idx : prev, 0);
                    const s = serverState[sel];
                    const start = Math.max(arrivalTime, s.nextFreeTime);
                    const serv = getServiceTime(s);
                    const end = start + serv;
                    
                    const wait = start - arrivalTime;
                    s.nextFreeTime = end;
                    s.totalServiceTime += serv;
                    s.totalWaitTime += wait;
                    s.clientsServed++;
                    
                    stages.push({ serverName: s.name, start, end, wait });
                } else if (topology === 'multi-series') {
                    // Hybrid: [S1, S2] -> [S3]
                    // First stage: Parallel S1 or S2
                    const s1Choices = serverState.length >= 2 ? [serverState[0], serverState[1]] : [serverState[0]];
                    const sel1Idx = s1Choices.reduce((prev, curr, idx, arr) => curr.nextFreeTime < arr[prev].nextFreeTime ? idx : prev, 0);
                    const s1 = s1Choices[sel1Idx];
                    
                    const start1 = Math.max(arrivalTime, s1.nextFreeTime);
                    const serv1 = getServiceTime(s1);
                    const end1 = start1 + serv1;
                    
                    s1.nextFreeTime = end1;
                    s1.totalServiceTime += serv1;
                    s1.totalWaitTime += (start1 - arrivalTime);
                    s1.clientsServed++;
                    stages.push({ serverName: s1.name, start: start1, end: end1, wait: start1 - arrivalTime });

                    // Second stage: S3
                    if (serverState.length >= 3) {
                        const s2 = serverState[2];
                        const start2 = Math.max(end1, s2.nextFreeTime);
                        const serv2 = getServiceTime(s2);
                        const end2 = start2 + serv2;
                        
                        s2.nextFreeTime = end2;
                        s2.totalServiceTime += serv2;
                        s2.totalWaitTime += (start2 - end1);
                        s2.clientsServed++;
                        stages.push({ serverName: s2.name, start: start2, end: end2, wait: start2 - end1 });
                    }
                }

                // Estimate queue length at this moment
                const currentInQueue = rows.filter(r => r.end > arrivalTime && r.start > arrivalTime).length;
                if (currentInQueue > maxQueueLength) maxQueueLength = currentInQueue;

                rows.push({
                    id: clientId++,
                    arrival: arrivalTime,
                    wait: stages[0].wait, // Primary wait (first stage)
                    totalWait: stages.reduce((acc, st) => acc + st.wait, 0),
                    start: stages[0].start,
                    service: stages.reduce((acc, st) => acc + (st.end - st.start), 0),
                    end: stages[stages.length - 1].end,
                    server: stages.map(st => st.serverName).join(' -> '),
                    stages
                });
            }

            const totalWait = rows.reduce((acc, r) => acc + r.totalWait, 0);
            const totalInSystem = rows.reduce((acc, r) => acc + (r.end - r.arrival), 0);
            
            // Server comparison
            const serverPerformance = serverState.map(s => ({
                name: s.name,
                avgService: s.clientsServed > 0 ? s.totalServiceTime / s.clientsServed : 0,
                utilization: s.totalServiceTime / totalMinutes
            }));

            const fastest = [...serverPerformance].sort((a, b) => a.avgService - b.avgService)[0];
            const slowest = [...serverPerformance].sort((a, b) => b.avgService - a.avgService)[0];

            const stats = {
                avgWait: totalWait / rows.length,
                avgInSystem: totalInSystem / rows.length,
                utilization: serverState.reduce((acc, s) => acc + (s.totalServiceTime / totalMinutes), 0) / serverConfigs.length,
                probWait: rows.filter(r => r.totalWait > 0.01).length / rows.length,
                maxQueue: maxQueueLength,
                fastest,
                slowest,
                serverPerformance
            };

            setSimulationStats(stats);
            setTableData(rows);
            setInsights({
                isStable: stats.utilization < 1,
                avgQueue: (totalWait / totalMinutes), // Lq = Wq * lambda
                dailyAvg: rows.length / daysToSimulate
            });
            setIsSimulating(false);
        }, 600);
    };

    return (
        <div className="h-screen bg-[#f1f5f9] dark:bg-bg-dark text-slate-900 dark:text-white font-sans flex flex-col overflow-hidden">
            <AppHeader />
            <main className="flex-1 flex overflow-hidden p-6 gap-6">
                
                <aside className="w-[30rem] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
                    <div className="bg-white dark:bg-bg-card rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5 space-y-6 shrink-0">
                        <div className="flex items-center gap-2 text-indigo-600">
                            <Settings size={18} />
                            <h2 className="text-sm font-bold uppercase tracking-wider">Parámetros</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Días a Simular" value={daysToSimulate} onChange={setDaysToSimulate} />
                            <InputField label="Horas Jornada" value={hoursPerDay} onChange={setHoursPerDay} />
                        </div>
                        <InputField label="Llegadas por Hora" value={arrivalsPerHour} onChange={setArrivalsPerHour} />
                    </div>

                    <div className="bg-white dark:bg-bg-card rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5 space-y-4 shrink-0">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Topología</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <TopologyMiniBtn active={topology === 'parallel'} onClick={() => setTopology('parallel')} label="Paralelo" />
                            <TopologyMiniBtn active={topology === 'multiple'} onClick={() => setTopology('multiple')} label="Múltiples" />
                            <TopologyMiniBtn active={topology === 'series'} onClick={() => setTopology('series')} label="Serie" />
                            <TopologyMiniBtn active={topology === 'multi-series'} onClick={() => setTopology('multi-series')} label="Híbrido" />
                        </div>
                    </div>

                    <div className="space-y-4 pb-4">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Configuración de Cajeros</h2>
                            <button onClick={addServer} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/10 text-indigo-600 rounded-full text-[10px] font-bold border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all">
                                <Plus size={12}/> Agregar cajero
                            </button>
                        </div>

                        {serverConfigs.map((s, idx) => {
                            const colors = SERVER_COLORS[idx % SERVER_COLORS.length];
                            return (
                                <div key={s.id} className={`p-6 bg-white dark:bg-bg-card rounded-3xl border-2 shadow-sm relative space-y-4 ${colors.border}`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${colors.bg} ${colors.text}`}>{s.id}</span>
                                            <h3 className="text-sm font-black">{s.name}</h3>
                                        </div>
                                        <button onClick={() => removeServer(s.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                            <X size={18}/>
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Distribución de tiempo de servicio</label>
                                        <div className="flex flex-wrap gap-2">
                                            <DistPill active={s.dist === 'exponential'} onClick={() => {
                                                const nc = [...serverConfigs]; nc[idx].dist = 'exponential'; setServerConfigs(nc);
                                            }} label="Exponencial (λ)" />
                                            <DistPill active={s.dist === 'uniform'} onClick={() => {
                                                const nc = [...serverConfigs]; nc[idx].dist = 'uniform'; setServerConfigs(nc);
                                            }} label="Uniforme (a, b)" />
                                            <DistPill active={s.dist === 'normal'} onClick={() => {
                                                const nc = [...serverConfigs]; nc[idx].dist = 'normal'; setServerConfigs(nc);
                                            }} label="Normal (μ, σ)" />
                                            <DistPill active={s.dist === 'poisson'} onClick={() => {
                                                const nc = [...serverConfigs]; nc[idx].dist = 'poisson'; setServerConfigs(nc);
                                            }} label="Poisson (λ)" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 items-end">
                                        {s.dist === 'exponential' || s.dist === 'poisson' ? (
                                            <div className="col-span-1 space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">λ (Tasa/Min)</label>
                                                <input type="number" step="0.1" value={s.lambda} onChange={e => {
                                                    const nc = [...serverConfigs]; nc[idx].lambda = Number(e.target.value); setServerConfigs(nc);
                                                }} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 text-sm font-bold outline-none" />
                                                <p className="text-[9px] text-slate-400 italic">media ≈ {(1/s.lambda).toFixed(2)} min</p>
                                            </div>
                                        ) : s.dist === 'uniform' ? (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">A (Mínimo)</label>
                                                    <input type="number" value={s.min} onChange={e => {
                                                        const nc = [...serverConfigs]; nc[idx].min = Number(e.target.value); setServerConfigs(nc);
                                                    }} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 text-sm font-bold outline-none" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">B (Máximo)</label>
                                                    <input type="number" value={s.max} onChange={e => {
                                                        const nc = [...serverConfigs]; nc[idx].max = Number(e.target.value); setServerConfigs(nc);
                                                    }} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 text-sm font-bold outline-none" />
                                                    <p className="text-[9px] text-slate-400 italic text-right">media ≈ {((s.min + s.max)/2).toFixed(2)} min</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">M (Media)</label>
                                                    <input type="number" value={s.mu} onChange={e => {
                                                        const nc = [...serverConfigs]; nc[idx].mu = Number(e.target.value); setServerConfigs(nc);
                                                    }} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 text-sm font-bold outline-none" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Σ (Desv.)</label>
                                                    <input type="number" step="0.1" value={s.sigma} onChange={e => {
                                                        const nc = [...serverConfigs]; nc[idx].sigma = Number(e.target.value); setServerConfigs(nc);
                                                    }} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 text-sm font-bold outline-none" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-3xl space-y-2">
                            <p className="text-[10px] text-amber-600 leading-relaxed">
                                <span className="font-black uppercase mr-1">Nota:</span> 
                                Las llegadas siguen un proceso de Poisson (tiempo entre llegadas exponencial). Cuando varios servidores están libres se elige uno con probabilidad igual — usando una variable aleatoria uniforme segmentada en tramos iguales.
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={runSimulation} disabled={isSimulating}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 sticky bottom-0"
                    >
                        {isSimulating ? 'Simulando...' : 'Iniciar Simulación'}
                    </button>
                </aside>

                <section className="flex-1 flex flex-col gap-6 overflow-hidden">
                    <div className="h-[45%] bg-white dark:bg-bg-card rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden relative">
                        <QueueVisualizer 
                            servers={serverConfigs} customers={tableData.slice(0, 100)} topology={topology} 
                            isSimulating={isSimulating} speed={speed} hoursPerDay={hoursPerDay}
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <MetricCard icon={<Clock size={20}/>} label="Tiempo de Espera" value={simulationStats ? `${simulationStats.avgWait.toFixed(2)} min` : '-'} color="indigo" />
                        <MetricCard icon={<TrendingUp size={20}/>} label="Uso del Sistema" value={simulationStats ? `${(simulationStats.utilization * 100).toFixed(1)}%` : '-'} color="emerald" />
                        <MetricCard icon={<Users size={20}/>} label="Clientes en Fila" value={insights ? insights.avgQueue.toFixed(2) : '-'} color="amber" />
                        <MetricCard icon={<CheckCircle2 size={20}/>} label="Total Atendidos" value={tableData.length} color="rose" />
                    </div>

                    <div className="flex-1 bg-white dark:bg-bg-card rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col p-6">
                        <div className="flex justify-between items-center mb-4 text-slate-400">
                            <h3 className="text-xs font-bold uppercase tracking-widest">Tabla de Resultados</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold uppercase whitespace-nowrap">Velocidad ({speed} min/s)</span>
                                <input type="range" min="1" max="120" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-24 accent-indigo-600" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-[10px] text-left">
                                <thead className="sticky top-0 bg-white dark:bg-bg-card border-b border-slate-100 dark:border-white/5">
                                    <tr className="text-slate-400">
                                        <th className="p-2">ID</th>
                                        <th className="p-2">Llegada</th>
                                        <th className="p-2">Espera</th>
                                        <th className="p-2">Servicio</th>
                                        <th className="p-2">Salida</th>
                                        <th className="p-2">Cajero</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.slice(0, 100).map((r, i) => (
                                        <tr key={i} className="border-b border-slate-50 dark:border-white/5">
                                            <td className="p-2 font-bold text-indigo-600">{r.id}</td>
                                            <td className="p-2">{r.arrival.toFixed(2)}</td>
                                            <td className="p-2 font-bold text-rose-500">{r.totalWait.toFixed(2)}</td>
                                            <td className="p-2">{r.service.toFixed(2)}</td>
                                            <td className="p-2 font-bold">{r.end.toFixed(2)}</td>
                                            <td className="p-2 text-slate-400 uppercase truncate max-w-[150px]" title={r.server}>{r.server}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <aside className="w-96 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                    {/* INTERROGANTES - ACTUALIZADOS SEGÚN REQUERIMIENTOS */}
                    <div className="bg-white dark:bg-bg-card rounded-[2.5rem] p-8 shadow-sm border border-slate-200 dark:border-white/5 space-y-6">
                        <div className="flex items-center gap-2 text-indigo-600">
                            <HelpCircle size={20} />
                            <h2 className="text-sm font-bold uppercase tracking-widest">Interrogantes del Profesor</h2>
                        </div>
                        <div className="space-y-4">
                            <QuestionCard 
                                q="1. ¿Son suficientes los cajeros?" 
                                a={simulationStats ? (simulationStats.utilization < 0.9 ? `SÍ. Utilización del ${(simulationStats.utilization * 100).toFixed(1)}%.` : 'NO. El sistema está al límite o saturado.') : 'Pendiente...'} 
                                status={simulationStats?.utilization < 0.9 ? 'ok' : 'error'} 
                            />
                            <QuestionCard 
                                q="2. Tiempo promedio en el sistema" 
                                a={simulationStats ? `${simulationStats.avgInSystem.toFixed(2)} min (Espera + Servicio).` : '-'} 
                            />
                            <QuestionCard 
                                q="3. ¿Cuál es más rápido y lento?" 
                                a={simulationStats ? `Rápido: ${simulationStats.fastest.name} (${simulationStats.fastest.avgService.toFixed(2)} min). Lento: ${simulationStats.slowest.name} (${simulationStats.slowest.avgService.toFixed(2)} min).` : '-'} 
                            />
                            <QuestionCard 
                                q="4. Longitud de la cola (Máx / Prom)" 
                                a={simulationStats ? `Máxima: ${simulationStats.maxQueue} clientes. Promedio: ${insights?.avgQueue.toFixed(2)} clientes.` : '-'} 
                            />
                            <QuestionCard 
                                q="Probabilidad de espera" 
                                a={simulationStats ? `${(simulationStats.probWait * 100).toFixed(1)}% de los clientes hacen fila.` : '-'} 
                            />
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}

const DistPill = ({ active, onClick, label }: any) => (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-[9px] font-bold border transition-all ${active ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-indigo-300'}`}>{label}</button>
);

const TopologyMiniBtn = ({ active, onClick, label }: any) => (
    <button onClick={onClick} className={`py-2 rounded-xl text-[9px] font-bold border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-400 hover:border-indigo-200'}`}>{label}</button>
);

const MetricCard = ({ icon, label, value, color }: any) => (
    <div className="bg-white dark:bg-bg-card p-5 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col items-center text-center">
        <div className={`p-2 rounded-xl mb-3 ${color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>{icon}</div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black">{value}</p>
    </div>
);

const QuestionCard = ({ q, a, status }: any) => (
    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
        <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">{q}</p>
        <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{a}</p>
            {status === 'ok' && <CheckCircle2 size={12} className="text-emerald-500" />}
            {status === 'error' && <AlertCircle size={12} className="text-rose-500" />}
        </div>
    </div>
);

const InputField = ({ label, value, onChange }: any) => (
    <div className="space-y-1">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 transition-colors dark:text-white" />
    </div>
);

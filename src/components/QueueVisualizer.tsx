import { useEffect, useState, useMemo, useRef } from 'react';
import { Clock, Users, CheckCircle2 } from 'lucide-react';

interface Stage {
    serverName: string;
    start: number;
    end: number;
}

interface Customer {
    id: number;
    arrival: number;
    stages: Stage[];
}

interface QueueVisualizerProps {
    servers: any[];
    customers: Customer[]; 
    topology: string;
    isSimulating: boolean;
    speed: number;
    setSpeed: (speed: number) => void;
    hoursPerDay: number;
}

export default function QueueVisualizer({ servers, customers, topology, isSimulating, speed, setSpeed, hoursPerDay }: QueueVisualizerProps) {
    const [clock, setClock] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    
    const clockRef = useRef(0);
    const requestRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);
    const isSimulatingPrev = useRef(isSimulating);
    
    const maxFinishTime = useMemo(() => {
        if (!customers || customers.length === 0) return 0;
        return Math.max(...customers.map(c => c.stages[c.stages.length - 1]?.end || 0));
    }, [customers]);

    useEffect(() => {
        const animate = (time: number) => {
            if (lastTimeRef.current !== null) {
                const delta = (time - lastTimeRef.current) / 1000;
                if (customers.length > 0 && !isSimulating && clockRef.current < maxFinishTime) {
                    clockRef.current += (delta * speed);
                    if (clockRef.current >= maxFinishTime) {
                        clockRef.current = maxFinishTime;
                        setIsFinished(true);
                    } else {
                        setIsFinished(false);
                    }
                    setClock(clockRef.current);
                }
            }
            lastTimeRef.current = time;
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [customers, isSimulating, speed, maxFinishTime]);

    useEffect(() => {
        if (isSimulatingPrev.current === true && isSimulating === false && customers.length > 0) {
            clockRef.current = Math.min(...customers.map(c => c.arrival)) - 1;
            setClock(clockRef.current);
            setIsFinished(false);
            lastTimeRef.current = performance.now();
        }
        isSimulatingPrev.current = isSimulating;
    }, [isSimulating, customers]);

    const entities = useMemo(() => {
        const waitingLines: Record<string, number[]> = {};
        
        return customers.map((c) => {
            const currentStageIdx = c.stages.findIndex(s => clock >= s.start && clock <= s.end);
            const currentStage = currentStageIdx !== -1 ? c.stages[currentStageIdx] : null;
            
            let isWaiting = false;
            let waitingForServer = "";
            let stageIndexWaitingFor = -1;
            
            if (!currentStage) {
                if (clock >= c.arrival && clock < c.stages[0].start) {
                    isWaiting = true;
                    waitingForServer = c.stages[0].serverName;
                    stageIndexWaitingFor = 0;
                } else {
                    for (let i = 0; i < c.stages.length - 1; i++) {
                        if (clock > c.stages[i].end && clock < c.stages[i+1].start) {
                            isWaiting = true;
                            waitingForServer = c.stages[i+1].serverName;
                            stageIndexWaitingFor = i + 1;
                            break;
                        }
                    }
                }
            }

            const isDone = clock > (c.stages[c.stages.length - 1]?.end || 0);

            let x = 10, y = 50, opacity = 0, state = 'hidden', color = '#6366f1';

            if (currentStage) {
                const sIdx = servers.findIndex(s => s.name === currentStage.serverName);
                const server = servers[sIdx];
                x = 160; 
                y = (sIdx + 1) * (100 / (servers.length + 1));
                opacity = 1; state = 'serving';
                color = server?.colorHex || '#6366f1';
            } else if (isWaiting) {
                const sIdx = servers.findIndex(s => s.name === waitingForServer);
                const server = servers[sIdx];
                
                if (topology === 'parallel' && stageIndexWaitingFor === 0) {
                    const qKey = "central";
                    if (!waitingLines[qKey]) waitingLines[qKey] = [];
                    waitingLines[qKey].push(c.id);
                    const pos = waitingLines[qKey].indexOf(c.id);
                    x = 100 - (pos * 8);
                    y = 50;
                } else if (topology === 'series') {
                    const qKey = waitingForServer;
                    if (!waitingLines[qKey]) waitingLines[qKey] = [];
                    waitingLines[qKey].push(c.id);
                    const pos = waitingLines[qKey].indexOf(c.id);
                    const stageX = 40 + (stageIndexWaitingFor * 40);
                    x = stageX - (pos * 6);
                    y = (sIdx + 1) * (100 / (servers.length + 1));
                } else {
                    const qKey = waitingForServer;
                    if (!waitingLines[qKey]) waitingLines[qKey] = [];
                    waitingLines[qKey].push(c.id);
                    const pos = waitingLines[qKey].indexOf(c.id);
                    x = 140 - (pos * 8);
                    y = (sIdx + 1) * (100 / (servers.length + 1));
                }
                
                opacity = 1; state = 'waiting';
                color = server?.colorHex || '#6366f1';
            } else if (clock >= c.arrival - 2 && clock < c.arrival) {
                // Approaching state: appear at entrance
                x = 10; y = 50; opacity = 0.5; state = 'approaching';
            } else if (isDone) {
                x = 220; y = 50; opacity = 0;
            }

            return { id: c.id, x, y, opacity, state, color };
        });
    }, [clock, customers, servers, topology]);

    return (
        <div className="w-full h-full bg-[#f8fafc] dark:bg-slate-900/20 flex flex-col items-center justify-center relative p-8">
            <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monitor en Vivo</span>
            </div>

            <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-sm">
                {/* Zonas de Fila */}
                <g>
                    <text x="10" y="50" className="text-[3px] font-bold fill-slate-400 uppercase" textAnchor="middle">Entrada</text>
                    <circle cx="10" cy="50" r="1.5" className="fill-slate-200 dark:fill-slate-800" />
                </g>

                {topology === 'parallel' && (
                    <g>
                        <text x="70" y="42" className="text-[4px] font-black fill-slate-300 uppercase" textAnchor="middle">Fila Única</text>
                        <line x1="20" y1="50" x2="110" y2="50" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="2,2" />
                    </g>
                )}

                {servers.map((s, i) => {
                    const y = (i + 1) * (100 / (servers.length + 1));
                    const isBusy = entities.some(e => e.state === 'serving' && Math.abs(e.y - y) < 1);
                    
                    return (
                        <g key={s.id || s.name}>
                            {/* Líneas de Fila para Múltiple o Series */}
                            {(topology === 'multiple' || topology === 'series') && (
                                <g>
                                    <line x1="20" y1={y} x2="150" y2={y} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="1,2" />
                                    <text x="30" y={y - 4} className="text-[3px] font-bold fill-slate-300 uppercase">Fila {s.name}</text>
                                </g>
                            )}

                            <rect 
                                x="155" y={y - 8} width="16" height="16" rx="4" 
                                fill={isBusy ? s.colorHex : 'currentColor'} 
                                className={`transition-colors duration-500 ${isBusy ? '' : 'text-slate-200 dark:text-slate-800'}`} 
                            />
                            <text x="163" y={y + 12} className="text-[3px] font-bold fill-slate-400 uppercase" textAnchor="middle">{s.name}</text>
                            
                            {/* Indicador de Estado del Servidor */}
                            <circle cx="171" cy={y - 8} r="1.5" fill={isBusy ? '#ef4444' : '#10b981'} />
                        </g>
                    );
                })}

                {/* Clientes */}
                {entities.map(e => (
                    <g key={e.id} transform={`translate(${e.x}, ${e.y})`} className="transition-all duration-700 ease-out" style={{ opacity: e.opacity }}>
                        <circle r="3.5" fill={e.color} className="stroke-white dark:stroke-slate-900 shadow-lg" strokeWidth="0.5" />
                        <text dy=".35em" className="fill-white text-[2px] font-black" textAnchor="middle">{e.id}</text>
                    </g>
                ))}
            </svg>

            <div className="absolute bottom-6 left-6 flex items-center gap-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-2.5 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 z-20">
                <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase text-slate-400 tracking-tighter">Reloj de Jornada</span>
                    <div className="flex items-center gap-2">
                        <Clock size={12} className="text-indigo-600" />
                        <span className="text-xs font-black tabular-nums">{timeStr(clock, hoursPerDay)}</span>
                    </div>
                </div>
                <div className="w-px h-5 bg-slate-100 dark:bg-slate-700" />
                <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase text-slate-400 tracking-tighter">Espera</span>
                    <div className="flex items-center gap-2">
                        <Users size={12} className="text-indigo-600" />
                        <span className="text-xs font-black">{entities.filter(e => e.state === 'waiting').length}</span>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 right-6 flex items-center gap-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 z-20">
                <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black uppercase text-slate-400 tracking-tighter">Velocidad</span>
                    <span className="text-[9px] font-bold text-indigo-600 uppercase">{speed}x</span>
                </div>
                <input 
                    type="range" min="1" max="120" value={speed} 
                    onChange={e => setSpeed(Number(e.target.value))} 
                    className="w-20 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                />
            </div>

            {isFinished && customers.length > 0 && (
                <div className="absolute top-6 right-6 animate-in fade-in slide-in-from-top-4 duration-500 z-30">
                    <div className="bg-emerald-500 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-3">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Simulación Completa</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper para el string del tiempo (se asume que existe o se añade aquí)
const timeStr = (clock: number, hoursPerDay: number) => {
    const totalMin = hoursPerDay * 60;
    const day = Math.floor(clock / totalMin) + 1;
    const currentMin = clock % totalMin;
    const h = Math.floor(currentMin / 60);
    const m = Math.floor(currentMin % 60);
    return `Día ${day} · ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

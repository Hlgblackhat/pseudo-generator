import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

interface VariablesChartsProps {
  numbers: number[];
  name: string;
  type: string; // 'normal' | 'exponential' | 'poisson' | 'erlang' | 'binomial' | 'triangular'
}

export default function VariablesCharts({ numbers, name, type }: VariablesChartsProps) {
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 dark:bg-slate-800 text-white p-3 rounded-xl shadow-xl border border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{`Valor: ${label}`}</p>
          <p className="text-sm font-black text-violet-400">
            {`Frecuencia: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Determinamos si es discreta o continua
  const isDiscrete = type === 'poisson' || type === 'binomial';

  const chartData = useMemo(() => {
    if (numbers.length === 0) return [];
    
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    
    if (isDiscrete) {
      // Para discretas, contamos frecuencias de cada entero
      const counts: Record<number, number> = {};
      numbers.forEach(n => {
        const val = Math.round(n);
        counts[val] = (counts[val] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([val, count]) => ({ x: parseInt(val), frecuencia: count }))
        .sort((a, b) => a.x - b.x);
    } else {
      // Para continuas, usamos bins para crear la curva
      const binCount = 40; // Mayor resolución para la campana
      const bins = new Array(binCount).fill(0);
      const step = (max - min) / binCount;
      numbers.forEach(num => {
        let idx = Math.floor((num - min) / step);
        if (idx >= binCount) idx = binCount - 1;
        if (idx < 0) idx = 0;
        bins[idx]++;
      });
      return bins.map((count, i) => ({
        x: parseFloat((min + i * step + step/2).toFixed(2)),
        frecuencia: count
      }));
    }
  }, [numbers, isDiscrete]);

  if (numbers.length === 0) return null;

  return (
    <div className="w-full h-full flex flex-col p-5 bg-white dark:bg-bg-card rounded-2xl border border-slate-200 dark:border-border-subtle shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
          <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isDiscrete ? 'bg-violet-400' : 'bg-violet-600'}`} />
            Perfil {isDiscrete ? 'Discreto' : 'Continuo'}: {name}
          </h4>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest">
            {isDiscrete ? 'F. Masa (PMF)' : 'F. Densidad (PDF)'}
          </span>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {isDiscrete ? (
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="x" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
              />
              <Bar dataKey="frecuencia" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFreq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="x" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                content={<CustomTooltip />}
              />
              <Area type="monotone" dataKey="frecuencia" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFreq)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

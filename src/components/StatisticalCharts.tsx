import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

interface StatisticalChartsProps {
  numbers: number[];
}

export default function StatisticalCharts({ numbers }: StatisticalChartsProps) {
  
  const HistogramTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 dark:bg-slate-800 text-white p-3 rounded-xl shadow-xl border border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{`Intervalo: ${label}`}</p>
          <p className="text-sm font-black text-amber-500">
            {`Frecuencia: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 dark:bg-slate-800 text-white p-3 rounded-xl shadow-xl border border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Par ( Xᵢ , Xᵢ₊₁ )</p>
          <div className="flex gap-4 mt-2">
              <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest">X(i)</span>
                  <span className="text-sm font-black text-orange-400">{Number(payload[0].value).toFixed(4)}</span>
              </div>
              <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest">X(i+1)</span>
                  <span className="text-sm font-black text-orange-400">{Number(payload[1].value).toFixed(4)}</span>
              </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Configuración de los datos para el Histograma (Frecuencias de 0 a 1 en 10 intervalos)
  const histogramData = useMemo(() => {
    if (numbers.length === 0) return [];
    
    const bins = new Array(10).fill(0);
    numbers.forEach(num => {
      const p = Math.floor(num * 10);
      const binIndex = p >= 10 ? 9 : p;
      bins[binIndex]++;
    });

    return bins.map((count, i) => ({
      interval: `${(i * 0.1).toFixed(1)}-${((i + 1) * 0.1).toFixed(1)}`,
      frecuencia: count
    }));
  }, [numbers]);

  // Configuración de los datos para el Scatter Plot (Pares i, i+1)
  const scatterData = useMemo(() => {
    if (numbers.length < 2) return [];
    const pts = [];
    const limit = Math.min(numbers.length - 1, 1000); // Visualizamos un maximo para no saturar Recharts
    for (let i = 0; i < limit; i++) {
      pts.push({ x: numbers[i], y: numbers[i + 1] });
    }
    return pts;
  }, [numbers]);

  if (numbers.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full h-[350px]">
      {/* Gráfico 1: Histograma de Frecuencias (Prueba Uniformidad aprox) */}
      <div className="flex-1 min-h-[200px] bg-white dark:bg-bg-dark rounded-xl p-5 border border-slate-100 dark:border-border-subtle shadow-sm flex flex-col relative overflow-hidden group">
        <h4 className="text-[11px] font-black uppercase text-slate-500 mb-4 shrink-0 px-2 tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          Distribución (Histograma - 10 Intervalos)
        </h4>
        <div className="flex-1 min-h-0 pl-[-20px] pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis dataKey="interval" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                content={<HistogramTooltip />}
                cursor={{ fill: 'currentColor', className: 'text-slate-100 dark:text-slate-800/50' }}
              />
              <Bar dataKey="frecuencia" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Diagrama de Dispersión (Prueba de Series aprox) */}
      <div className="flex-1 min-h-[200px] bg-white dark:bg-bg-dark rounded-xl p-5 border border-slate-100 dark:border-border-subtle shadow-sm flex flex-col relative overflow-hidden group">
        <h4 className="text-[11px] font-black uppercase text-slate-500 mb-4 shrink-0 px-2 tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          Dispersión 2D (Pares Secuenciales)
        </h4>
        <div className="flex-1 min-h-0 pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis type="number" dataKey="x" name="X(i)" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 1]} axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="y" name="X(i+1)" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 1]} axisLine={false} tickLine={false} />
              <ZAxis range={[15, 15]} /> {/* Fixed dot size */}
              <Tooltip 
                cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }}
                content={<ScatterTooltip />}
              />
              <Scatter name="Pares" data={scatterData} fill="#f97316" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

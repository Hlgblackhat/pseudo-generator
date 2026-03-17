import type { StatisticalTest, TestResult } from './types';

/**
 * Prueba de Uniformidad de Kolmogorov-Smirnov (K-S).
 * Mide empíricamente si la Función de Distribución Acumulada (CDF) de la muestra no difiere
 * significativamente de la Distribución Uniforme Continua $U(0,1)$. Es ideal para distribuciones continuas.
 */
export class KolmogorovSmirnovTest implements StatisticalTest {
    id = "ks";
    name = "Kolmogorov-Smirnov (Uniformidad)";
    description = "Evalúa la distancia acumulada máxima D entre los números distribuidos empíricamente y los teóricos uniformes $U(0,1)$.";

    run(data: number[], alpha: number = 0.05): TestResult {
        const n = data.length;
        if (n < 35) { // Empíricamente, n > 35 es necesario para KS aproximación asintótica simple.
            return {
                name: this.name,
                description: this.description,
                passed: false,
                statistic: 0,
                criticalValue: 0,
                alpha,
                message: "Muestra insuficiente",
                details: "La prueba K-S de gran tamaño n exige n >= 35."
            };
        }

        // 1. Array ordenado de forma ascendente.
        // Hacemos una copia para no alterar el original porque ordenarlo rompería correlación.
        const sortedData = [...data].sort((a, b) => a - b);

        let dMax = 0; // Estadístico D

        // 2. Evaluamos F_n(x) vs F_theoretical(x) [ F_theoretical(x) para U(0,1) es x directamente en (0,1) ]
        // $D^+ = \max ( \frac{i}{n} - X_i )$
        // $D^- = \max ( X_i - \frac{i-1}{n} )$
        // $D = \max(D^+, D^-)$
        for (let i = 0; i < n; i++) {
            const F_n = (i + 1) / n;            // Frecuencia acumulada empírica por arriba
            const F_n_ant = i / n;              // Frecuencia acumulada empírica por abajo
            const X_i = sortedData[i];          // Frecuencia teórica Uniforme U(0,1) = X_i

            const dPlus = F_n - X_i;          // Distancia de diferencia por arriba
            const dMinus = X_i - F_n_ant;     // Distancia de diferencia por abajo

            const localMax = Math.max(dPlus, dMinus);
            if (localMax > dMax) dMax = localMax;
        }

        // 3. Valor crítico: para una muestra grande (n > 35), con α = 0.05, el de la tabla es 1.358 / sqrt(n)
        const criticalD = 1.3581 / Math.sqrt(n); // Constante de Smirnov para 95% de confianza (5% Error)

        const passed = dMax < criticalD;

        return {
            name: this.name,
            description: this.description,
            passed, // ¿La desviación máxima $D$ fue menor que la permitida por la tabla estadística?
            statistic: parseFloat(dMax.toFixed(5)),
            criticalValue: parseFloat(criticalD.toFixed(5)),
            alpha,
            message: passed 
                ? "Distribución confirmada. La rampa acumulada no discrepa de un generador perfectamente uniforme." 
                : "Rechazo contundente. La dispersión de los datos revela graves asimetrías subyacentes.",
            details: `Desviación D máxima = ${dMax.toFixed(5)} < Tolerado Crítico = ${criticalD.toFixed(5)}.`
        };
    }
}

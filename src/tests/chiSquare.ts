import type { StatisticalTest, TestResult } from './types';

/**
 * Prueba de Uniformidad de Chi-Cuadrada (χ²).
 * Verifica empíricamente si la frecuencia observada de los números se distribuye de manera balanceada (uniforme)
 * a lo largo de todo el rango [0, 1), usando $k$ intervalos de clase (cubetas).
 */
export class ChiSquareTest implements StatisticalTest {
    id = "chi_square";
    name = "Chi-Cuadrada (Uniformidad)";
    description = "Evalúa si la frecuencia de aparición de los números en distintos sub-intervalos es uniforme [0, 1).";

    /**
     * @param data Conjunto de datos a probar
     * @param alpha Nivel de significancia (estándar 0.05)
     */
    run(data: number[], alpha: number = 0.05): TestResult {
        const n = data.length;

        // Validaciones base para prueba estadística
        if (n < 30) {
            return {
                name: this.name,
                description: this.description,
                passed: false,
                statistic: 0,
                criticalValue: 0,
                alpha,
                message: "Muestra insuficiente",
                details: "La prueba Chi-Cuadrada exige n >= 30."
            };
        }

        // 1. Determinar el número de clases k. Solemos usar la raíz de n (Regla empírica).
        // Se trunca a enteros y aseguramos un mínimo de 10 cubetas.
        let k = Math.max(10, Math.floor(Math.sqrt(n)));
        
        // Exigimos que E_i >= 5. Así que n/k >= 5 => k <= n/5.
        if (n / k < 5) k = Math.floor(n / 5);

        // 2. Definir cubetas (ancho del intervalo)
        const expectedFrequency = n / k;
        const observedFrequencies = new Array(k).fill(0);

        // 3. Contar la caída de los datos generados
        for (const value of data) {
            let index = Math.floor(value * k);
            if (index >= k) index = k - 1; // Seguridad por si value es exactamente 1.0 (no debiese por ser PRNG [0,1))
            observedFrequencies[index]++;
        }

        // 4. Calcular el estadístico de prueba (χ² sumatoria)
        let chiSquareStat = 0;
        for (let i = 0; i < k; i++) {
            const diff = observedFrequencies[i] - expectedFrequency;
            chiSquareStat += (diff * diff) / expectedFrequency;
        }

        const degreesOfFreedom = k - 1;

        // 5. Encontrar Valor Crítico (Aproximación asintótica simple de Wilson-Hilferty o tabla para n>30)
        // Ya que los grados de libertad varían dinámicamente según la muestra,
        // usamos la Aproximación de Wilson-Hilferty para χ² Inversa al "5% significancia" (Z_0.05 = 1.64485 cola derecha)
        const zValue = 1.64485; // Cola derecha para α=0.05
        let criticalChiSquare = degreesOfFreedom * Math.pow(1 - (2 / (9 * degreesOfFreedom)) + (zValue * Math.sqrt(2 / (9 * degreesOfFreedom))), 3);

        const passed = chiSquareStat < criticalChiSquare;

        return {
            name: this.name,
            description: this.description,
            passed, // ¿Rechazamos H0? Si es MENOR que el valor crítico, NO rechazamos: "PASA".
            statistic: parseFloat(chiSquareStat.toFixed(4)),
            criticalValue: parseFloat(criticalChiSquare.toFixed(4)),
            alpha,
            message: passed 
                ? "Uniformidad ratificada. No hay caídas inusuales en la frecuencia de la secuencia." 
                : "Se detectó fuerte sesgo o agrupamiento irrazonable de números. No es una muestra uniforme de calidad.",
            details: `Grados de libertad: ${degreesOfFreedom} (k = ${k}). Chi² = ${chiSquareStat.toFixed(4)} < Crítico = ${criticalChiSquare.toFixed(4)}.`
        };
    }
}

import type { StatisticalTest, TestResult } from './types';

/**
 * Prueba de Series (Pares de números).
 * Unifica los números en duplas (x_i, x_{i+1}) para verificar que rellenan el plano R²
 * distribuidos homogéneamente sin dejarse subcuadrantes vacíos.
 */
export class SeriesTest implements StatisticalTest {
    id = "series";
    name = "Prueba de Series (Plano 2D)";
    description = "Acopla la secuencia en pares adyacentes para asegurar que cubren el espectro (0,1) x (0,1) del plano estadístico bidimensional uniformemente.";

    run(data: number[], alpha: number = 0.05): TestResult {
        const numPares = Math.floor(data.length / 2);
        
        if (numPares < 25) { // 25 pares requiere 50 números generados
            return {
                name: this.name,
                description: this.description,
                passed: false,
                statistic: 0,
                criticalValue: 0,
                alpha,
                message: "Secuencia demasiado corta",
                details: "La división en celdas matriciales exige n >= 50 (25 pares)."
            };
        }

        // Subdivisión del plano en k x k cuadrículas. (5x5 es estándar para laboratorios)
        const k = 5;
        const totalCeldas = k * k; // 25 Casillas
        
        const freqEsperada = numPares / totalCeldas;
        const matrixFrecuenciasObservadas = new Array(totalCeldas).fill(0);

        for (let i = 0; i < data.length - 1; i += 2) {
            const numX = data[i];
            const numY = data[i + 1];

            // Localizar columna (x) y fila (y) de 0 a 4.
            let columna = Math.floor(numX * k);
            let fila = Math.floor(numY * k);
            
            // Failsafe matemático por si llega un 1 cerrado absoluto
            if (columna >= k) columna = k - 1;
            if (fila >= k) fila = k - 1;

            matrixFrecuenciasObservadas[fila * k + columna]++;
        }

        let chiSquareStat = 0;
        for (let i = 0; i < totalCeldas; i++) {
            const freqOb = matrixFrecuenciasObservadas[i];
            chiSquareStat += Math.pow(freqOb - freqEsperada, 2) / freqEsperada;
        }

        const df = totalCeldas - 1; // 24 grados
        
        // Wilson-Hilferty de nuevo en 95% Confianza con 1 cola derecha. Z=1.64485
        const zAlpha = 1.64485;
        const criticalChiSquare = df * Math.pow(1 - 2/(9*df) + zAlpha * Math.sqrt(2/(9*df)), 3);

        const passed = chiSquareStat < criticalChiSquare;

        return {
            name: this.name,
            description: this.description,
            passed,
            statistic: parseFloat(chiSquareStat.toFixed(4)),
            criticalValue: parseFloat(criticalChiSquare.toFixed(4)),
            alpha,
            message: passed 
                ? "Dispersión bidimensional perfecta. Los valores no se arrastran linealmente." 
                : "Dependencia bidimensional fuerte. Se dibujan líneas espurias ocultas en la gráfica.",
            details: `χ²_pares = ${chiSquareStat.toFixed(4)} < Crítico tolerado = ${criticalChiSquare.toFixed(4)} (25 sub-planos evaluados).`
        };
    }
}

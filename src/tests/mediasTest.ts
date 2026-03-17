import type { StatisticalTest, TestResult } from './types';

/**
 * Prueba de Medias.
 * Verifica si el valor esperado (promedio) de la muestra se acerca estadísticamente a 0.5.
 */
export class MediasTest implements StatisticalTest {
    id = "medias";
    name = "Prueba de Medias";
    description = "Evalúa si el promedio de todos los números generados coincide con el valor esperado de 0.5.";

    run(data: number[], alpha: number = 0.05): TestResult {
        const n = data.length;
        if (n < 30) {
            return {
                name: this.name,
                description: this.description,
                passed: false,
                statistic: 0,
                criticalValue: 0,
                alpha,
                message: "Muestra insuficiente",
                details: "Se requieren al menos 30 números para usar la distribución Normal estándar."
            };
        }

        const mean = data.reduce((a, b) => a + b, 0) / n;
        
        // Z = (media observada - media teórica) * raiz(12 * N)
        // Ya que media teórica = 0.5 y varianza = 1/12
        const z = (mean - 0.5) * Math.sqrt(12 * n);
        
        // Valor crítico para Z (Prueba de dos colas a 95%)
        const criticalZ = 1.95996;
        
        const passed = Math.abs(z) < criticalZ;

        return {
            name: this.name,
            description: this.description,
            passed,
            statistic: parseFloat(Math.abs(z).toFixed(4)),
            criticalValue: parseFloat(criticalZ.toFixed(4)),
            alpha,
            message: passed 
                ? "Uniformidad del promedio validada. La media muestral converge a 0.5 correctamente." 
                : "La media muestral difiere drásticamente de 0.5, revelando sesgos en las magnitudes.",
            details: `Promedio observado: ${mean.toFixed(5)}. Z calculado = |${z.toFixed(4)}| < Tolerado = ${criticalZ.toFixed(4)}.`
        };
    }
}

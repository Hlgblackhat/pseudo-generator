import type { StatisticalTest, TestResult } from './types';

/**
 * Prueba Cuantitativa de Varianza.
 * Comprueba si la dispersión de los datos alrededor de su media teórica es adecuada.
 * Una distribución uniforme real en [0, 1) debe tener Varianza = 1/12 ≈ 0.0833.
 */
export class VarianzaTest implements StatisticalTest {
    id = "varianza";
    name = "Prueba de Varianza";
    description = "Mide si la amplitud de datos oscila consistentemente con la varianza estandar de 1/12 (0.0833).";

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
                details: "La prueba Chi-Cuadrada Normal exige al menos 30 observaciones."
            };
        }

        // Calcular Varianza muestral
        const total = data.reduce((a, b) => a + b, 0);
        const mean = total / n;
        
        let sumaVariacion = 0;
        for (const num of data) {
            sumaVariacion += Math.pow(num - mean, 2);
        }
        
        const varianza = sumaVariacion / (n - 1);

        // Chi^2 estadístico = 12 * (Varianza * (N-1))
        // Dado que la varianza teorica Uniforme es 1/12
        const chiSquare = 12 * sumaVariacion;

        // Grados de libertad (n-1)
        const df = n - 1;
        
        // Uso de aproximación asintótica Wilson-Hilferty para Chi-Cuadrada inversa a alfa 5% (dos colas)
        const zAlpha2 = 1.95996;
        
        // Limite superior crítico y Limite inferior crítico
        const upperCrit = df * Math.pow(1 - 2/(9*df) + zAlpha2 * Math.sqrt(2/(9*df)), 3);
        const lowerCrit = df * Math.pow(1 - 2/(9*df) - zAlpha2 * Math.sqrt(2/(9*df)), 3);

        const passed = chiSquare > lowerCrit && chiSquare < upperCrit;

        return {
            name: this.name,
            description: this.description,
            passed,
            statistic: parseFloat(chiSquare.toFixed(4)),
            criticalValue: parseFloat(upperCrit.toFixed(4)),
            alpha,
            message: passed 
                ? "Dispersión variacional aceptada. Ausencia de estancamientos o estallidos." 
                : "Varianza inaceptable indicando secuencias aglomeradas o excesivamente ruidosas.",
            details: `Varianza S² = ${varianza.toFixed(5)}. Chi² Calculado = ${chiSquare.toFixed(4)} dentro de Límites: [${lowerCrit.toFixed(2)}, ${upperCrit.toFixed(2)}].`
        };
    }
}

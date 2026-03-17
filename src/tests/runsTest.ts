import type { StatisticalTest, TestResult } from './types';

/**
 * Prueba Cuantitativa de Rachas (Corridas) Arriba y Abajo de la Media.
 * Analiza la dependencia temporal e "Independencia". Busca patrones consecutivos
 * (muchos números altos seguidos, o muchos bajos) que revelen que la secuencia no es aleatoria verdadera.
 */
export class RunsTest implements StatisticalTest {
    id = "runs";
    name = "Prueba de Rachas (Independencia)";
    description = "Evalúa si existen secuencias no aleatorias (Rachas) arriba o debajo de la media.";

    run(data: number[], alpha: number = 0.05): TestResult {
        const n = data.length;

        // Requiere una muestra amplia estadísticamente para ser significativa Z Normal (R >= 20, o N >= 30).
        if (n < 30) {
            return {
                name: this.name,
                description: this.description,
                passed: false,
                statistic: 0,
                criticalValue: 0,
                alpha,
                message: "Muestra insuficiente",
                details: "La prueba exige al menos 30 elementos para asintótica Z Normal."
            };
        }

        // 1. Contar Corridas o Rachas 'R' basadas en el crecimiento (Up / Down)
        let R = 1; // La primera racha (Arriba(+) o Abajo(-)) siempre es 1.
        let isIncreasing = data[1] > data[0]; 

        for (let i = 2; i < n; i++) {
            const currentDir = data[i] > data[i - 1]; // ¿Es mayor que el anterior?
            
            if (currentDir !== isIncreasing) {
                // Hay un cambio de dirección. Rompimos la racha anterior y empezamos otra.
                R++;
                isIncreasing = currentDir;
            }
        }

        // 2. Parámetros teóricos (Acercamiento asintótico de Z para rachas Arriba/Abajo)
        // La media teórica μ_R = (2 * n - 1) / 3
        const expectedMean = (2 * n - 1) / 3;

        // La varianza teórica (σ_R)² = (16 * n - 29) / 90
        const expectedVariance = (16 * n - 29) / 90;

        // 3. Evaluar el estadístico normalizado Z
        // $Z = (R - μ) / √(σ) $
        const Z = (R - expectedMean) / Math.sqrt(expectedVariance);

        // 4. Valor Crítico para Z_0.025 (1.96). La prueba es Bilateral.
        // Toleramos 95% (-1.96 a +1.96). 5% (Alfa) de nivel de error
        const criticalZ = 1.95996; // 95% Doble Cola

        // Si |Z| < 1.96. Se rechaza la zona de H0.
        const passed = Math.abs(Z) < criticalZ;

        return {
            name: this.name,
            description: this.description,
            passed, // ¿La desviación estuvo controlada y los quiebres/burbujas fueron razonables?
            statistic: parseFloat(Math.abs(Z).toFixed(5)),
            criticalValue: parseFloat(criticalZ.toFixed(5)),
            alpha,
            message: passed 
                ? "Secuencia independiente y caótica sin memorias latentes." 
                : (Z > 0 
                   ? "La secuencia osciló salvajemente sin estabilizarse, evidenciando ruido estructurado falso."
                   : "Patrón lento o congelado; no existen variaciones esperadas de una simulación neutral."),
            details: `Calculado Z = |${Z.toFixed(5)}| < Z-Normal = ${criticalZ.toFixed(5)} (Corridas empíricas R = ${R}).`
        };
    }
}

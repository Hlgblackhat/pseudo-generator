import type { StatisticalTest, TestResult } from './types';

/**
 * Prueba de Poker (5 Decimales).
 * Agrupa los decimales de cada número generado para buscar si simulan manos de Poker
 * (un par, dos pares, trío, etc.) en las proporciones correctas.
 */
export class PokerTest implements StatisticalTest {
    id = "poker";
    name = "Prueba de Poker";
    description = "Evalúa la independencia mirando combinaciones internas de 5 fracciones decimales como si fueran cartas (Tríos, Full House, etc).";

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
                details: "Poker se debilita drásticamente con menos de 30 muestras. Ideal > 1000."
            };
        }

        // Categorías:
        // 0: Todos Distintos
        // 1: Un Par
        // 2: Dos Pares
        // 3: Trío
        // 4: Full House (3 y 2)
        // 5: Poker (4)
        // 6: Quintilla (5)
        
        const obs = [0, 0, 0, 0, 0, 0, 0];
        // Probabilidad matemática para 5 decimales independientes (10 digitos posibles de 0-9)
        const prob = [0.3024, 0.5040, 0.1080, 0.0720, 0.0090, 0.0045, 0.0001];

        // Extracción e Inspección
        for (const num of data) {
            // Forzar cadena decimal truncada y normalizada a 5 dígitos puros ".xxxxx"
            const decString = String(num.toFixed(5)).split('.')[1] || '00000';
            const digitsObj: Record<string, number> = {};
            
            for (const char of decString) {
                digitsObj[char] = (digitsObj[char] || 0) + 1;
            }
            
            // Frecuencias numéricas descendentes
            const conteos = Object.values(digitsObj).sort((a,b) => b - a);
            
            if (conteos[0] === 5) obs[6]++;
            else if (conteos[0] === 4) obs[5]++;
            else if (conteos[0] === 3 && conteos[1] === 2) obs[4]++;
            else if (conteos[0] === 3) obs[3]++;
            else if (conteos[0] === 2 && conteos[1] === 2) obs[2]++;
            else if (conteos[0] === 2) obs[1]++;
            else obs[0]++;
        }

        // Calcular Chi-Cuadrada Agrupando categorías si Frecuencia Esperada (FE) < 5
        let chiSquare = 0;
        let obsAcumulada = 0;
        let expAcumulada = 0;
        
        const agrupadasObs: number[] = [];
        const agrupadasExp: number[] = [];

        // Agrupamos desde la probabilidad más extraña/pequeña (Quintilla) hacia atrás (Distintos)
        for (let i = 6; i >= 0; i--) {
            obsAcumulada += obs[i];
            expAcumulada += prob[i] * n;
            
            // Exigimos clase con frecuencia esperada > 5. Si pasamos al index 0 cerramos obligatoriamente.
            if (expAcumulada >= 5 || i === 0) {
                agrupadasObs.push(obsAcumulada);
                agrupadasExp.push(expAcumulada);
                obsAcumulada = 0;
                expAcumulada = 0;
            }
        }
        
        // Sumatoria
        for (let j = 0; j < agrupadasObs.length; j++) {
            const exp = agrupadasExp[j];
            const o = agrupadasObs[j];
            if (exp > 0) {
                chiSquare += Math.pow(o - exp, 2) / exp;
            }
        }

        const df = agrupadasObs.length - 1; // Grados de libertad

        if (df <= 0) {
           return {
                name: this.name, description: this.description, passed: false, statistic: 0, criticalValue: 0, alpha,
                message: "Imposible categorizar", details: "Todos los grupos colapsaron en uno solo (K=1)."
            }; 
        }

        const zAlpha = 1.64485; // Inv. Normal alpha 5% cola derecha
        
        const critValue = df * Math.pow(1 - 2/(9*df) + zAlpha * Math.sqrt(2/(9*df)), 3);
        const passed = chiSquare < critValue;

        return {
            name: this.name,
            description: this.description,
            passed,
            statistic: parseFloat(chiSquare.toFixed(4)),
            criticalValue: parseFloat(critValue.toFixed(4)),
            alpha,
            message: passed 
                ? "Las agrupaciones algorítmicas de números asimilan el azar probabilístico real." 
                : "Se repiten de más estructuras de dígitos gemelos, trillizos o quintillas. Muy riesgoso.",
            details: `Manos probadas agrupadas en ${df+1} categorías. χ² = ${chiSquare.toFixed(4)} < Tolerado = ${critValue.toFixed(4)} (GL=${df}).`
        };
    }
}

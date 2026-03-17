import type { PRNG, ValidationResult } from './types';

/**
 * Motor del Generador Congruencial Multiplicativo.
 * Variante del método mixto donde el incremento 'c' es 0.
 * Fórmula: x(i+1) = (a * x(i)) mod m
 */
export class MultiplicativeCongruential implements PRNG {
    name = "Congruencial Multiplicativo";
    private x: number; // Estado actual (semilla)
    private a: number; // Multiplicador
    private m: number; // Módulo

    constructor(seed: number, a: number, m: number) {
        this.x = seed;
        this.a = a;
        this.m = m;
    }

    /**
     * Calcula el siguiente número pseudoaleatorio.
     * El valor retornado está normalizado entre [0, 1).
     */
    next(): number {
        this.x = (this.a * this.x) % this.m;
        return this.x / this.m;
    }

    /**
     * Sugiere un multiplicador 'a' óptimo para el módulo m dado.
     * Para m potencia de 2, recomienda valores a ≡ 3 o 5 (mod 8) con semilla impar.
     */
    suggestParams(): Partial<import('./types').GeneratorParams> {
        const esPotenciaDe2 = (this.m & (this.m - 1)) === 0;
        if (esPotenciaDe2) {
            // Para potencias de 2: a mod 8 debe ser 3 o 5, semilla impar
            const base = Math.floor(this.m / 8) || 1;
            const aSugerido = base * 8 + 3; // garantiza a ≡ 3 (mod 8)
            return { a: aSugerido, seed: 1 }; // semilla impar
        }
        // Caso general: un multiplicador primo relativo aleatorio
        const aSugerido = Math.floor(Math.random() * (this.m / 4)) * 4 + 3;
        return { a: aSugerido };
    }

    /**
     * Valida los parámetros de entrada específicos para el método multiplicativo.
     * La semilla debe ser distinta de cero para que el generador no se anule.
     */
    validateParams(): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (this.m <= 0) errors.push("Módulo m debe ser > 0");
        if (this.a <= 0) errors.push("Multiplicador a debe ser > 0");
        if (this.x <= 0) errors.push("La semilla debe ser > 0 para el método multiplicativo.");

        if (errors.length > 0) return { isValid: false, errors, warnings };

        // Reglas específicas según si m es potencia de 2
        const esPotenciaDe2 = (this.m & (this.m - 1)) === 0;
        if (esPotenciaDe2) {
            if (this.x % 2 === 0) {
                warnings.push("Para m potencia de 2, la semilla debe ser impar para maximizar el periodo.");
            }
            const mod8 = this.a % 8;
            if (mod8 !== 3 && mod8 !== 5) {
                warnings.push("Para m potencia de 2, el multiplicador 'a' debería ser ≡ 3 o 5 (mod 8).");
            }
        } else {
            if (this.x % 2 === 0 && this.m % 2 === 0) {
                warnings.push("La semilla y el módulo son pares; el periodo será reducido significativamente.");
            }
        }

        return {
            isValid: true,
            errors: [],
            warnings
        };
    }
}

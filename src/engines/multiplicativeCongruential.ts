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
     * Valida los parámetros de entrada específicos para el método multiplicativo.
     * La semilla debe ser distinta de cero para que el generador no se anule.
     */
    validateParams(): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (this.m <= 0) errors.push("Módulo m debe ser > 0");
        if (this.a <= 0) errors.push("Multiplicador a debe ser > 0");
        if (this.x <= 0) errors.push("La semilla debe ser > 0 para el método multiplicativo.");

        // Condiciones simples para la longitud del periodo en el método multiplicativo
        if (this.x % 2 === 0 && this.m % 2 === 0) {
            warnings.push("La semilla y el módulo son pares; el periodo será reducido.");
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}

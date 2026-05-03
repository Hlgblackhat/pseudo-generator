import type { PRNG, ValidationResult } from './types';

/**
 * Motor del Generador Congruencial Aditivo.
 * Utiliza la suma de valores previos para generar el siguiente término.
 * Fórmula: x(i) = (x(i-1) + x(i-k)) mod m
 */
export class AdditiveCongruential implements PRNG {
    name = "Congruencial Aditivo";
    private state: number[] = []; // Buffer circular
    private m: number; // Módulo
    private k: number; // Valor de retraso (u orden del generador)
    private pointer: number; // Puntero actual

    constructor(seed: number, k: number, m: number) {
        this.m = m;
        this.k = Math.max(2, k);
        this.pointer = 0;

        // Inicializamos el buffer usando un LCG simple para generar los primeros k valores
        // necesarios para empezar el proceso aditivo basándonos en una única semilla.
        let ultimo = seed;
        for (let i = 0; i < this.k; i++) {
            ultimo = (31 * ultimo + 7) % m;
            this.state.push(ultimo);
        }
    }

    /**
     * Calcula el siguiente número basándose en el historial y el retraso k.
     * Retorna el valor normalizado en [0, 1).
     */
    next(): number {
        // Obtenemos los índices para el buffer circular
        const prevIdx = (this.pointer + this.k - 1) % this.k;
        const oldestIdx = this.pointer;

        // x(i) = (x(i-1) + x(i-k)) mod m
        const nuevoValor = (this.state[prevIdx] + this.state[oldestIdx]) % this.m;
        
        // Reemplazamos el valor más antiguo en el buffer
        this.state[this.pointer] = nuevoValor;
        // Avanzamos el puntero
        this.pointer = (this.pointer + 1) % this.k;

        return nuevoValor / this.m;
    }

    /**
     * Sugiere un retraso k efectivo para el algoritmo aditivo.
     * Valores de k como 7 o 55 son conocidos por dar secuencias largas y de calidad.
     */
    suggestParams(): Partial<import('./types').GeneratorParams> {
        return { k: 7 }; // Retraso estándar con buenos resultados estadísticos
    }

    /**
     * Valida que el módulo sea positivo y el retraso k sea válido para el algoritmo.
     */
    validateParams(): ValidationResult {
        const errors: string[] = [];
        if (this.m <= 0) errors.push("Módulo m debe ser > 0");
        if (this.k < 2) errors.push("El retraso k debe ser al menos 2 (requiere memoria previa)");

        return {
            isValid: errors.length === 0,
            errors,
            warnings: []
        };
    }
}

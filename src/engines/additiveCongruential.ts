import type { PRNG, ValidationResult } from './types';

/**
 * Motor del Generador Congruencial Aditivo.
 * Utiliza la suma de valores previos para generar el siguiente término.
 * Fórmula: x(i) = (x(i-1) + x(i-k)) mod m
 */
export class AdditiveCongruential implements PRNG {
    name = "Congruencial Aditivo";
    private history: number[] = []; // Almacena la secuencia para el cálculo aditivo
    private m: number; // Módulo
    private k: number; // Valor de retraso (u orden del generador)

    constructor(seed: number, k: number, m: number) {
        this.m = m;
        this.k = Math.max(2, k);

        // Inicializamos el historial usando un LCG simple para generar los primeros k valores
        // necesarios para empezar el proceso aditivo basándonos en una única semilla.
        let ultimo = seed;
        for (let i = 0; i < this.k; i++) {
            ultimo = (31 * ultimo + 7) % m;
            this.history.push(ultimo);
        }
    }

    /**
     * Calcula el siguiente número basándose en el historial y el retraso k.
     * Retorna el valor normalizado en [0, 1).
     */
    next(): number {
        const n = this.history.length;
        const nuevoValor = (this.history[n - 1] + this.history[n - this.k]) % this.m;
        this.history.push(nuevoValor);

        // Mantenemos el historial internamente para los cálculos siguientes
        return nuevoValor / this.m;
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

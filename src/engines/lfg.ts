import type { PRNG, GeneratorParams, ValidationResult } from './types';
import { MixedCongruential } from './mixedCongruential';

/**
 * Lagged Fibonacci Generator (LFG).
 * x_n = (x_{n-j} + x_{n-k}) mod m
 * Requiere un buffer inicial de tamaño k.
 */
export class LFGGenerator implements PRNG {
    name = "Lagged Fibonacci Generator (LFG)";
    private state: number[];
    private j: number;
    private k: number;
    private m: number;
    private pointer: number;

    constructor(params: GeneratorParams) {
        // En nuestro sistema usamos 'j' y 'k' para representar los lags (j < k)
        this.j = params.j || 7;
        this.k = params.k || 10; 
        this.m = params.m || Math.pow(2, 31);
        
        // Inicializamos el buffer usando un LCG clásico (Mixed Congruential)
        // ya que el LFG requiere k valores iniciales.
        const seedLCG = params.seed || 42;
        const lcg = new MixedCongruential(seedLCG, 1664525, 1013904223, this.m);
        this.state = [];
        for (let i = 0; i < this.k; i++) {
            // Generamos valores enteros para el estado interno
            const val = Math.floor(lcg.next() * this.m);
            this.state.push(val);
        }
        this.pointer = 0;
    }

    /**
     * Genera el siguiente número normalizado.
     */
    next(): number {
        const idxJ = (this.pointer + this.k - this.j) % this.k;
        const idxK = this.pointer;

        // x_n = (x_{n-j} + x_{n-k}) mod m
        const nextVal = (this.state[idxJ] + this.state[idxK]) % this.m;
        
        // Actualizamos el buffer circular
        this.state[this.pointer] = nextVal;
        this.pointer = (this.pointer + 1) % this.k;

        return nextVal / this.m;
    }

    /**
     * Valida que j < k para asegurar la lógica de retardos.
     */
    validateParams(): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (this.j <= 0 || this.k <= 0) {
            errors.push("Los retrasos deben ser números positivos.");
        }

        if (this.j >= this.k) {
            errors.push("El retraso j debe ser estrictamente menor que el retraso k.");
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Propone una configuración clásica y estable.
     */
    suggestParams(): Partial<GeneratorParams> {
        return {
            j: 7,
            k: 10,
            m: Math.pow(2, 31),
            seed: 12345
        };
    }
}

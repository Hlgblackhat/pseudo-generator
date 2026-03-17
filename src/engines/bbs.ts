import type { PRNG, GeneratorParams, ValidationResult } from './types';

/**
 * Algoritmo Blum Blum Shub (BBS).
 * Es un generador con fuertes propiedades criptográficas.
 * Su lógica es x_{n+1} = (x_n^2) mod M, donde M = p * q.
 */
export class BBSGenerator implements PRNG {
    name = "Blum Blum Shub (BBS)";
    private x: number;
    private M: number;

    constructor(params: GeneratorParams) {
        const { seed, p = 7, q = 11 } = params;
        this.M = p * q;
        this.x = seed % this.M;
        if (this.x === 0) this.x = 1; // Prevenir ciclo trivial de ceros
    }

    /**
     * Genera el siguiente número normalizado en el rango [0, 1).
     */
    next(): number {
        // x_{n+1} = (x_n * x_n) mod M
        this.x = Number((BigInt(this.x) * BigInt(this.x)) % BigInt(this.M));
        return this.x / this.M;
    }

    /**
     * Valida los parámetros p, q y la semilla.
     */
    validateParams(): ValidationResult {
        // En este prototipo académico simplificamos la validación de primos
        const errors: string[] = [];
        const warnings: string[] = [];

        // Aquí podríamos añadir validaciones de p ≡ 3 mod 4 para periodo máximo
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Propone parámetros óptimos para el método.
     */
    suggestParams(): Partial<GeneratorParams> {
        return {
            p: 499, // Primo p ≡ 3 mod 4
            q: 503, // Primo q ≡ 3 mod 4
            seed: 12345
        };
    }
}

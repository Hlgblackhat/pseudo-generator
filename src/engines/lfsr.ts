import type { PRNG, ValidationResult } from './types';

/**
 * Motor de Registro de Desplazamiento con Retroalimentación Lineal (LFSR).
 * Algoritmo basado en bits que utiliza desplazamientos y operaciones XOR.
 * Común en implementación de hardware para generación de ruido blanco.
 */
export class LFSRGenerator implements PRNG {
    name = "LFSR (Shift Register)";
    private estado: number; // Estado interno del registro (bits)
    private mascara: number; // Taps del polinomio (puntos de retroalimentación)
    private longitudBits: number; // Resolución del registro (ej. 16 bits)

    constructor(params: import('./types').GeneratorParams) {
        this.estado = params.seed || 1; // Un LFSR nunca puede empezar en 0
        this.longitudBits = 16;

        // Máscara por defecto para registros de 16 bits (Polinomio: x^16 + x^14 + x^13 + x^11 + 1)
        // Representación hexadecimal: 0xB400
        this.mascara = 0xB400;
    }

    /**
     * Calcula el siguiente estado realizando desplazamientos de bits y XOR.
     * Itera 16 veces para extraer 16 bits aleatorios y conformar un número uniforme.
     */
    next(): number {
        let resultBits = 0;
        for (let i = 0; i < this.longitudBits; i++) {
            const bitSalida = this.estado & 1; // Extraemos el bit menos significativo
            this.estado >>>= 1; // Desplazamiento lógico a la derecha

            // Si el bit extraído era 1, aplicamos la retroalimentación XOR (Mascara)
            if (bitSalida === 1) {
                this.estado ^= this.mascara;
            }
            
            // Acumulamos el bit
            resultBits = (resultBits << 1) | bitSalida;
        }

        // Normalización dividiendo por 2^longitudBits
        return (resultBits >>> 0) / Math.pow(2, this.longitudBits);
    }

    /**
     * Sugiere una semilla válida (distinta de cero).
     * En el LFSR cualquier valor != 0 es válido; sugerimos un patrón alternante.
     */
    suggestParams(): Partial<import('./types').GeneratorParams> {
        return { seed: 43690 }; // Valor determinista (0xAAAA) que cumple académicamente
    }

    /**
     * Valida que la semilla no sea cero, lo cual causaría un estado nulo infinito en XOR.
     */
    validateParams(): ValidationResult {
        const errors: string[] = [];
        if (this.estado === 0) {
            errors.push("Estado crítico: La semilla no puede ser 0 para el algoritmo LFSR.");
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings: []
        };
    }
}

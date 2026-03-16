import type { PRNG, ValidationResult } from './types';

/**
 * Motor de Registro de Desplazamiento con Retroalimentación Lineal (LFSR).
 * Algoritmo basado en bits que utiliza desplazamientos y operaciones XOR.
 * Común en implementación de hardware para generación de ruido blanco.
 */
export class LFSR implements PRNG {
    name = "LFSR (Shift Register)";
    private estado: number; // Estado interno del registro (bits)
    private mascara: number; // Taps del polinomio (puntos de retroalimentación)
    private longitudBits: number; // Resolución del registro (ej. 16 bits)

    constructor(semilla: number, longitudBits: number = 16) {
        this.estado = semilla || 1; // Un LFSR nunca puede empezar en 0
        this.longitudBits = longitudBits;

        // Máscara por defecto para registros de 16 bits (Polinomio: x^16 + x^14 + x^13 + x^11 + 1)
        // Representación hexadecimal: 0xB400
        this.mascara = 0xB400;
    }

    /**
     * Calcula el siguiente estado realizando un desplazamiento de bits y XOR.
     * Retorna el valor normalizado dividiendo por la capacidad máxima del registro.
     */
    next(): number {
        const bitSalida = this.estado & 1; // Extraemos el bit menos significativo
        this.estado >>= 1; // Desplazamos a la derecha

        // Si el bit extraído era 1, aplicamos la retroalimentación XOR (Mascara)
        if (bitSalida === 1) {
            this.estado ^= this.mascara;
        }

        // Normalización dividiendo por 2^longitudBits
        return this.estado / Math.pow(2, this.longitudBits);
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

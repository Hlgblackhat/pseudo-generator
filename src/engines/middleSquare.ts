import type { PRNG, ValidationResult } from './types';

/**
 * Motor del Generador de Cuadrados Medios (von Neumann).
 * Algoritmo basado en elevar al cuadrado el número actual y extraer los dígitos centrales.
 */
export class MiddleSquare implements PRNG {
    name = "Cuadrados Medios";
    private x: number; // Estado actual (semilla de d dígitos)
    private d: number; // Cantidad de dígitos a extraer

    constructor(seed: number, d: number) {
        this.x = seed;
        this.d = d;
    }

    /**
     * Calcula el siguiente número elevando x al cuadrado y tomando los d dígitos centrales.
     * Retorna el valor normalizado entre [0, 1).
     */
    next(): number {
        // Elevamos al cuadrado y convertimos a cadena para manipulación de dígitos
        let cadenaCuadrado = (this.x * this.x).toString();
        const longitudObjetivo = this.d * 2;

        // Rellenamos con ceros a la izquierda para alcanzar la longitud 2d necesaria
        while (cadenaCuadrado.length < longitudObjetivo) {
            cadenaCuadrado = '0' + cadenaCuadrado;
        }

        // Calculamos el índice de inicio para extraer los d dígitos centrales
        const inicio = Math.floor((cadenaCuadrado.length - this.d) / 2);
        const medio = cadenaCuadrado.substring(inicio, inicio + this.d);

        // Convertimos de nuevo a entero para el siguiente estado
        this.x = parseInt(medio) || 0;

        // Retornamos el valor normalizado dividiendo por 10^d
        return this.x / Math.pow(10, this.d);
    }

    /**
     * Valida que d sea suficiente para la operación y advierte si la semilla es inconsistente.
     */
    validateParams(): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (this.d < 2) errors.push("La cantidad de dígitos 'd' debe ser al menos 2");
        if (this.x.toString().length > this.d) {
            warnings.push(`La semilla tiene más dígitos de los especificados (${this.d}). Se truncará automáticamente.`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}

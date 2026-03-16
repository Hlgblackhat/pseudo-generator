/**
 * Representa el resultado de la validación académica de los parámetros.
 */
export interface ValidationResult {
    isValid: boolean; // Indica si el generador puede ejecutarse
    errors: string[]; // Errores críticos que impiden la ejecución
    warnings: string[]; // Advertencias sobre la calidad de la secuencia (ej. periodo corto)
}

/**
 * Interfaz base para todos los Motores de Generación de Números Pseudoaleatorios (PRNG).
 * Todos los algoritmos implementados deben cumplir con este contrato.
 */
export interface PRNG {
    name: string; // Nombre legible del algoritmo
    next(): number; // Genera el siguiente número normalizado en el rango [0, 1)
    validateParams(): ValidationResult; // Ejecuta validaciones matemáticas específicas del método
}

/**
 * Enumeración de los métodos de generación soportados por la plataforma.
 */
export const GeneratorMethod = {
    MIXED: 'mixed', // Lineal Congruencial Mixto
    ADDITIVE: 'additive', // Congruencial Aditivo
    MIDDLE_SQUARE: 'middle_square', // Cuadrados Medios (von Neumann)
    MULTIPLICATIVE: 'multiplicative', // Congruencial Multiplicativo
    LFSR: 'lfsr' // Registro de Desplazamiento con Retroalimentación Lineal
} as const;

export type GeneratorMethodType = typeof GeneratorMethod[keyof typeof GeneratorMethod];

/**
 * Interfaz que define todos los posibles parámetros configurables en la interfaz.
 */
export interface GeneratorParams {
    seed: number; // Semilla inicial (x0)
    a?: number; // Multiplicador
    c?: number; // Incremento
    m: number; // Módulo
    k?: number; // Valor de retraso (Para el método Aditivo)
    d?: number; // Cantidad de dígitos (Para Cuadrados Medios)
    taps?: number[]; // Puntos de retroalimentación (Para LFSR)
    useTimeEntropy: boolean; // Indica si se debe inyectar entropía basada en el reloj
    method: GeneratorMethodType; // Algoritmo seleccionado
}

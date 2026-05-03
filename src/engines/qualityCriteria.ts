import { GeneratorMethod } from '../engines/types';
import type { GeneratorMethodType } from '../engines/types';

/**
 * Define los criterios de calidad aplicables a cada motor PRNG.
 * Basado en la teoría matemática de cada algoritmo.
 */
export interface EngineQualityCriteria {
    /** IDs de pruebas estadísticas recomendadas para este motor */
    recommendedTests: string[];
    /** IDs de pruebas que NO aplican o son irrelevantes para este motor */
    irrelevantTests: string[];
    /** Etiqueta del criterio principal de calidad */
    primaryCriterion: string;
    /** Descripción académica del criterio de calidad del motor */
    qualityNote: string;
    /** ¿Debe normalizarse la salida a [0,1]? */
    requiresUniformity: boolean;
}

/**
 * Mapa de criterios de calidad por tipo de generador.
 * 
 * Referencias:
 * - LCG (Knuth, "The Art of Computer Programming", Vol. 2)
 * - LFSR (Golomb, "Shift Register Sequences")
 * - BBS (Blum, Blum & Shub, 1986)
 * - LFG (Marsaglia, 1985)
 */
export const engineQualityCriteria: Record<GeneratorMethodType, EngineQualityCriteria> = {

    [GeneratorMethod.MIXED]: {
        primaryCriterion: 'Uniformidad & Periodo',
        requiresUniformity: true,
        qualityNote:
            'El LCG Mixto es el generador de propósito general por excelencia. ' +
            'Su calidad se mide principalmente por la uniformidad de distribución (Chi-cuadrado, K-S) ' +
            'y la longitud del periodo. Con parámetros de Hull-Dobell, el periodo es igual al módulo m.',
        recommendedTests: ['chi_square', 'ks', 'medias', 'varianza', 'runs'],
        irrelevantTests: [],
    },

    [GeneratorMethod.MULTIPLICATIVE]: {
        primaryCriterion: 'Uniformidad & Independencia',
        requiresUniformity: true,
        qualityNote:
            'Variante del LCG sin incremento (c=0). Excelente uniformidad pero con periodo máximo de m/4. ' +
            'Las pruebas de correlación serial (Series) son especialmente relevantes para detectar ' +
            'patrones entre pares consecutivos (k-tuplas de Marsaglia).',
        recommendedTests: ['chi_square', 'ks', 'runs', 'series', 'poker'],
        irrelevantTests: ['medias'],
    },

    [GeneratorMethod.ADDITIVE]: {
        primaryCriterion: 'Balance & Correlación',
        requiresUniformity: false,
        qualityNote:
            'El generador aditivo (Fibonacci retardado) produce buena distribución marginal uniforme, ' +
            'pero tiene correlaciones inherentes entre términos separados por k posiciones. ' +
            'La prueba de series detecta esta correlación. La uniformidad individual se cumple ' +
            'pero falla en espacios de alta dimensión.',
        recommendedTests: ['series', 'runs', 'medias', 'varianza'],
        irrelevantTests: ['chi_square', 'ks'],
    },

    [GeneratorMethod.MIDDLE_SQUARE]: {
        primaryCriterion: 'Detección de Colapso',
        requiresUniformity: false,
        qualityNote:
            'El método de Cuadrados Medios (von Neumann, 1946) NO garantiza uniformidad y es ' +
            'conocido por colapsar a ciclos cortos o al cero. Su criterio principal es histórico/didáctico. ' +
            'Úsalo solo para ilustrar las limitaciones de los primeros PRNG. La prueba de rachas ' +
            'detecta ciclos cortos y el test de medias revela sesgo sistemático.',
        recommendedTests: ['runs', 'medias'],
        irrelevantTests: ['chi_square', 'ks', 'varianza', 'series', 'poker'],
    },

    [GeneratorMethod.LFSR]: {
        primaryCriterion: 'Periodo Máximo & Balance de Bits',
        requiresUniformity: false,
        qualityNote:
            'Un LFSR de grado n bien configurado (con polinomio primitivo) produce una secuencia de ' +
            'periodo 2^n - 1 con exactamente 2^(n-1) unos y 2^(n-1)-1 ceros (balance de bits). ' +
            'La uniformidad sobre flotantes es secundaria. La prueba de rachas (runs) es la más ' +
            'relevante para verificar el balance estadístico de la secuencia de bits.',
        recommendedTests: ['runs', 'series'],
        irrelevantTests: ['chi_square', 'ks', 'medias', 'varianza', 'poker'],
    },

    [GeneratorMethod.BBS]: {
        primaryCriterion: 'Imprevisibilidad Computacional',
        requiresUniformity: false,
        qualityNote:
            'Blum Blum Shub es un CSPRNG (Cryptographically Secure PRNG). Su calidad no se mide ' +
            'con pruebas estadísticas estándar sino con la dificultad de factorizar n = p*q. ' +
            'Los tests estadísticos no son el criterio correcto de evaluación, aunque puede ' +
            'pasarlos. Es lento por diseño (seguridad > velocidad).',
        recommendedTests: ['runs'],
        irrelevantTests: ['chi_square', 'ks', 'medias', 'varianza', 'poker', 'series'],
    },

    [GeneratorMethod.LFG]: {
        primaryCriterion: 'Uniformidad & Periodo Largo',
        requiresUniformity: true,
        qualityNote:
            'El Lagged Fibonacci Generator produce secuencias de periodo extremadamente largo ' +
            '(~2^31 * 2^k). Tiene excelente distribución estadística y supera la mayoría de pruebas ' +
            'estándar. Es adecuado para simulaciones Monte Carlo. La prueba de poker evalúa bien ' +
            'la calidad de sus "dígitos" de salida.',
        recommendedTests: ['chi_square', 'ks', 'runs', 'poker', 'medias', 'varianza'],
        irrelevantTests: ['series'],
    },
};

/**
 * Retorna los criterios de calidad para un método dado.
 * Si el método no tiene criterios registrados, devuelve un criterio genérico.
 */
export function getCriteriaForMethod(method: GeneratorMethodType): EngineQualityCriteria {
    return engineQualityCriteria[method] ?? {
        primaryCriterion: 'Uniformidad General',
        requiresUniformity: true,
        qualityNote: 'Criterios no especificados para este motor. Se aplican pruebas estándar.',
        recommendedTests: ['chi_square', 'medias', 'varianza'],
        irrelevantTests: [],
    };
}

import { MixedCongruential } from './mixedCongruential';
import { MultiplicativeCongruential } from './multiplicativeCongruential';
import { AdditiveCongruential } from './additiveCongruential';
import { MiddleSquare } from './middleSquare';
import { LFSRGenerator } from './lfsr';
import { BBSGenerator } from './bbs';
import { LFGGenerator } from './lfg';
import { GeneratorMethod } from './types';
import type { PRNG, GeneratorMethodType } from './types';

export * from './types';
export { BBSGenerator } from './bbs';

/**
 * Factoría de Generadores de Números Pseudoaleatorios.
 * Esta función es responsable de instanciar el algoritmo correcto basándose en la selección del usuario.
 * @param metodo El identificador del algoritmo seleccionado.
 * @param parametros Objeto que contiene los valores de configuración (semilla, a, c, m, etc.).
 * @returns Una instancia que cumple con la interfaz PRNG.
 */
export const createGenerator = (metodo: GeneratorMethodType, parametros: any): PRNG => {
    switch (metodo) {
        case GeneratorMethod.MIXED:
            // Algoritmo Lineal Congruencial Mixto estándar
            return new MixedCongruential(parametros.seed, parametros.a, parametros.c, parametros.m);

        case GeneratorMethod.MULTIPLICATIVE:
            // Variante donde el incremento c es forzado a 0
            return new MultiplicativeCongruential(parametros.seed, parametros.a, parametros.m);

        case GeneratorMethod.ADDITIVE:
            // Generador basado en la suma de términos anteriores con retraso k
            return new AdditiveCongruential(parametros.seed, parametros.k || 2, parametros.m);

        case GeneratorMethod.MIDDLE_SQUARE:
            // Algoritmo de von Neumann basado en dígitos centrales del cuadrado de la semilla
            return new MiddleSquare(parametros.seed, parametros.d || 4);

        case GeneratorMethod.LFSR:
            // Registro de desplazamiento basado en operaciones de bits (16-bit)
            return new LFSRGenerator(parametros);

        case GeneratorMethod.BBS:
            return new BBSGenerator(parametros);

        case GeneratorMethod.LFG:
            return new LFGGenerator(parametros);

        default:
            throw new Error(`Algoritmo ${metodo} no reconocido por el sistema.`);
    }
};

import type { PRNG, ValidationResult } from './types';

/**
 * Utilidad para calcular el Máximo Común Divisor (mCD).
 * Se utiliza primordialmente para verificar la condición de Hull-Dobell.
 */
const gcd = (a: number, b: number): number => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        a %= b;
        [a, b] = [b, a];
    }
    return a;
};

/**
 * Utilidad para obtener los factores primos de un número.
 * Esencial para verificar si (a-1) es divisible por todos los factores primos del módulo m.
 */
const getPrimeFactors = (n: number): number[] => {
    const factors: Set<number> = new Set();
    let d = 2;
    let temp = n;
    while (temp >= d * d) {
        if (temp % d === 0) {
            factors.add(d);
            temp /= d;
        } else {
            d++;
        }
    }
    if (temp > 1) factors.add(temp);
    return Array.from(factors);
};

/**
 * Motor del Generador Lineal Congruencial Mixto.
 * Implementa la fórmula clásica: x(n+1) = (a * x(n) + c) mod m.
 */
export class MixedCongruential implements PRNG {
    name = "Lineal Congruencial (Mixto)";
    private x: number; // Estado actual
    private a: number; // Multiplicador
    private c: number; // Incremento
    private m: number; // Módulo

    constructor(seed: number, a: number, c: number, m: number) {
        this.x = seed;
        this.a = a;
        this.c = c;
        this.m = m;
    }

    /**
     * Sugiere parámetros (a, c) que cumplen con el Teorema de Hull-Dobell
     * para el módulo m actual, garantizando un periodo completo.
     */
    suggestParams(): Partial<import('./types').GeneratorParams> {
        const factors = getPrimeFactors(this.m);
        // El producto de todos los factores primos únicos
        let product = factors.reduce((a, b) => a * b, 1);

        // Si m es divisible por 4, el producto debe ser divisible por 4
        if (this.m % 4 === 0 && product % 4 !== 0) {
            product *= (product % 2 === 0 ? 2 : 4);
        }

        // Sugerimos un 'a' que sea 1 + k*product (donde k es entero aleatorio)
        const k = Math.floor(Math.random() * 5) + 1; // k entre 1 y 5
        const aSugerido = 1 + (k * product);

        // Buscamos un c aleatorio que sea primo relativo con m (gcd(c, m) === 1)
        let cSugerido = Math.floor(Math.random() * (this.m - 1)) + 1;
        while (gcd(cSugerido, this.m) !== 1) {
            cSugerido = (cSugerido + 1) % this.m || 1;
        }

        return { a: aSugerido, c: cSugerido };
    }

    /**
     * Calcula y retorna el siguiente número de la secuencia.
     * Retorna un valor normalizado en el rango [0, 1).
     */
    next(): number {
        this.x = (this.a * this.x + this.c) % this.m;
        return this.x / this.m; // Retornar valor normalizado [0, 1)
    }

    /**
     * Validaciones basadas en el Teorema de Hull-Dobell para asegurar periodo máximo.
     * Verifica que el generador recorra todos los estados posibles antes de repetirse.
     */
    validateParams(): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (this.m <= 0) errors.push("El módulo 'm' debe ser mayor a 0.");
        if (this.a <= 0) errors.push("El multiplicador 'a' debe ser mayor a 0.");
        if (this.c < 0) errors.push("El incremento 'c' debe ser mayor o igual a 0.");
        if (this.x < 0) errors.push("La semilla debe ser mayor o igual a 0.");

        if (errors.length > 0) return { isValid: false, errors, warnings };

        // Condiciones del Teorema de Hull-Dobell:

        // 1. mCD(c, m) = 1 (c y m deben ser primos relativos)
        if (gcd(this.c, this.m) !== 1) {
            warnings.push("Periodo no máximo: c y m no son primos relativos (mCD ≠ 1).");
        }

        // 2. (a - 1) es divisible por todos los factores primos de m
        const primeFactorsM = getPrimeFactors(this.m);
        const am1 = this.a - 1;
        const allPrimeFactorsDivide = primeFactorsM.every(p => am1 % p === 0);
        if (!allPrimeFactorsDivide) {
            warnings.push("Periodo no máximo: (a - 1) no es divisible por todos los factores primos de m.");
        }

        // 3. Si m es divisible por 4, entonces (a - 1) también debe serlo
        if (this.m % 4 === 0 && am1 % 4 !== 0) {
            warnings.push("Periodo no máximo: m es divisible por 4 pero (a - 1) no lo es.");
        }

        return {
            isValid: true,
            errors: [],
            warnings
        };
    }
}

export interface VariableParams {
    lambda?: number;
    k?: number;
    n?: number;
    p?: number;
    a?: number;
    b?: number;
    c?: number;
}

export interface RandomVariableGenerator {
    name: string;
    description: string;
    generate(uniforms: number[], params: VariableParams): number[];
}

/**
 * 1. Distribución Exponencial
 * Utiliza el método de la transformada inversa: X = -(1/lambda) * ln(U)
 */
export const ExponentialVariable: RandomVariableGenerator = {
    name: "Exponencial",
    description: "Modela tiempos de espera entre eventos (Transformada Inversa).",
    generate: (uniforms, params) => {
        const lambda = params.lambda || 1;
        return uniforms.map(u => (-1 / lambda) * Math.log(1 - u));
    }
};

/**
 * 2. Distribución de Poisson
 * Método de multiplicación: Multiplicar U_i hasta que el producto sea < e^(-lambda)
 */
export const PoissonVariable: RandomVariableGenerator = {
    name: "Poisson",
    description: "Modela cantidad de eventos en un intervalo de tiempo fijo.",
    generate: (uniforms, params) => {
        const lambda = params.lambda || 1;
        const L = Math.exp(-lambda);
        const result: number[] = [];
        
        let p = 1.0;
        let k = 0;
        let uIndex = 0;

        while (uIndex < uniforms.length) {
            p *= uniforms[uIndex++];
            k++;
            if (p <= L) {
                result.push(k - 1);
                p = 1.0;
                k = 0;
            }
        }
        return result;
    }
};

/**
 * 3. Distribución Erlang
 * Es la suma de k variables exponenciales independientes con tasa lambda.
 * X = -(1/lambda) * ln(U1 * U2 * ... * Uk)
 */
export const ErlangVariable: RandomVariableGenerator = {
    name: "Erlang",
    description: "Suma de variables exponenciales. Modela sistemas de servicio en fases.",
    generate: (uniforms, params) => {
        const k_param = params.k || 2;
        const lambda = params.lambda || 1;
        const result: number[] = [];
        
        for (let i = 0; i <= uniforms.length - k_param; i += k_param) {
            let prod = 1.0;
            for (let j = 0; j < k_param; j++) {
                prod *= uniforms[i + j];
            }
            result.push((-1 / lambda) * Math.log(prod));
        }
        return result;
    }
};

/**
 * 4. Distribución Binomial
 * Modela el número de éxitos en n ensayos de Bernoulli con probabilidad p.
 */
export const BinomialVariable: RandomVariableGenerator = {
    name: "Binomial",
    description: "Suma de n ensayos de Bernoulli. Modela éxitos discretos.",
    generate: (uniforms, params) => {
        const n = params.n || 10;
        const p = params.p || 0.5;
        const result: number[] = [];
        
        for (let i = 0; i <= uniforms.length - n; i += n) {
            let successes = 0;
            for (let j = 0; j < n; j++) {
                if (uniforms[i + j] <= p) successes++;
            }
            result.push(successes);
        }
        return result;
    }
};

/**
 * 5. Distribución Triangular (Mayores, Menores, Igual)
 * Utiliza tres parámetros: a (mínimo), c (moda), b (máximo).
 * Dependiendo si U cae en el segmento de 'menores', 'mayores' o es 'igual'.
 */
export const TriangularVariable: RandomVariableGenerator = {
    name: "Triangular (Mayor/Menor/Igual)",
    description: "Modela asimetrías donde los datos tienden a ser mayores o menores a una moda c.",
    generate: (uniforms, params) => {
        const a = params.a ?? 0;
        const b = params.b ?? 10;
        const c = params.c ?? 5;
        
        const fc = (c - a) / (b - a);
        
        return uniforms.map(u => {
            if (u < fc) {
                // Rango 'Menores'
                return a + Math.sqrt(u * (b - a) * (c - a));
            } else if (u > fc) {
                // Rango 'Mayores'
                return b - Math.sqrt((1 - u) * (b - a) * (b - c));
            } else {
                // 'Igual' a la moda (raro al ser continuo, pero matemáticamente posible)
                return c;
            }
        });
    }
};

export const availableVariables: Record<string, RandomVariableGenerator> = {
    'exponential': ExponentialVariable,
    'poisson': PoissonVariable,
    'erlang': ErlangVariable,
    'binomial': BinomialVariable,
    'triangular': TriangularVariable
};

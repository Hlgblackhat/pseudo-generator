export interface VariableParams {
    lambda?: number;
    k?: number;
    n?: number;
    p?: number;
    a?: number;
    b?: number;
    c?: number;
    mean?: number;
    stdDev?: number;
}

export interface RandomVariableGenerator {
    name: string;
    description: string;
    method: string;
    theory: string;
    complexity: string;
    generate(uniforms: number[], params: VariableParams): number[];
}

/**
 * 1. Distribución Exponencial
 * Utiliza el método de la transformada inversa: X = -(1/lambda) * ln(U)
 */
export const ExponentialVariable: RandomVariableGenerator = {
    name: "Exponencial",
    description: "Modela tiempos de espera entre eventos (Transformada Inversa).",
    method: "Transformada Inversa",
    theory: "Se basa en la función acumulada inversa. Para la exponencial: X = -(1/λ) * ln(1-U), mapeando el rango [0,1] al dominio [0,∞).",
    complexity: "O(n)",
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
    method: "Algoritmo de Knuth",
    theory: "Método de multiplicación de variables uniformes. Se detiene cuando el producto acumulado cae por debajo de e^-λ.",
    complexity: "O(n * λ)",
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
    method: "Producto de Uniformes",
    theory: "Derivada de la propiedad de que la suma de k exponenciales es una Erlang. Algoritmo: X = -(1/λ) * ln(Π U_i).",
    complexity: "O(n * k)",
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
    method: "Ensayos de Bernoulli",
    theory: "Se realizan n comparaciones (U ≤ p). La suma de éxitos determina el valor de la variable discreta.",
    complexity: "O(n * N)",
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
    method: "Transformada Inversa (Tramos)",
    theory: "Divide la distribución en dos triángulos. Usa la raíz cuadrada de U o (1-U) para mapear los tramos linealmente crecientes/decrecientes.",
    complexity: "O(n)",
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

/**
 * 6. Distribución Normal (Campana de Gauss)
 * Utiliza la Transformada de Box-Muller: 
 * Z = sqrt(-2 * ln(U1)) * cos(2 * pi * U2)
 */
export const NormalVariable: RandomVariableGenerator = {
    name: "Normal (Gauss)",
    description: "La campana de Gauss. Modela fenómenos naturales y errores (Box-Muller).",
    method: "Box-Muller",
    theory: "Transforma un par de variables U(0,1) en un par de variables normales estándar independientes usando coordenadas polares.",
    complexity: "O(n)",
    generate: (uniforms, params) => {
        const mean = params.mean ?? 0;
        const stdDev = params.stdDev ?? 1;
        const result: number[] = [];
        
        // Box-Muller requiere pares de números uniformes
        for (let i = 0; i < uniforms.length - 1; i += 2) {
            const u1 = uniforms[i];
            const u2 = uniforms[i + 1];
            
            // Generamos dos variables normales estándar independientes
            const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
            // const z1 = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.sin(2.0 * Math.PI * u2); // Podríamos usar z1 también
            
            // Transformamos a la media y desviación estándar deseada
            result.push(z0 * stdDev + mean);
        }
        return result;
    }
};

export const availableVariables: Record<string, RandomVariableGenerator> = {
    'normal': NormalVariable,
    'exponential': ExponentialVariable,
    'poisson': PoissonVariable,
    'erlang': ErlangVariable,
    'binomial': BinomialVariable,
    'triangular': TriangularVariable
};

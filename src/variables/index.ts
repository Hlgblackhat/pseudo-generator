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
 * 0. Distribución Uniforme Continua (a, b)
 * Raúl Coss Bu, Cap. 4.1 - Método de la Transformada Inversa
 * X = a + (b - a)R
 */
export const UniformVariable: RandomVariableGenerator = {
    name: "Distribución Uniforme",
    description: "Distribución base donde todos los intervalos de igual longitud tienen la misma probabilidad.",
    method: "Transformada Inversa",
    theory: "Se basa en igualar la función de distribución acumulada $F(x) = \\frac{x-a}{b-a}$ a un número aleatorio $R$, resultando en $x = a + (b-a)R$. (Coss Bu, Cap. 4).",
    complexity: "O(n)",
    generate: (uniforms, params) => {
        const a = params.a ?? 0;
        const b = params.b ?? 1;
        return uniforms.map(u => a + (b - a) * u);
    }
};

/**
 * 1. Distribución Exponencial
 * Raúl Coss Bu, Cap. 4.1 - Método de la Transformada Inversa
 * X = -β * ln(R)
 */
export const ExponentialVariable: RandomVariableGenerator = {
    name: "Distribución Exponencial",
    description: "Modela tiempos entre llegadas o fallos. (Coss Bu, Cap. 4).",
    method: "Transformada Inversa",
    theory: "Dada la función de densidad $f(x) = \\frac{1}{\\beta}e^{-x/\\beta}$, su acumulada es $F(x) = 1 - e^{-x/\\beta}$. Al igualar $F(x) = R$ y despejar $x$, obtenemos $x = -\\beta \\ln(1-R)$. Dado que $1-R$ es también $U(0,1)$, se simplifica a $x = -\\beta \\ln(R)$.",
    complexity: "O(n)",
    generate: (uniforms, params) => {
        // En Coss Bu, lambda suele referirse a la tasa (1/beta) o beta directamente como media.
        // Usaremos params.lambda como tasa si existe, de lo contrario params.mean como beta.
        const beta = params.mean || (params.lambda ? 1 / params.lambda : 1);
        return uniforms.map(u => -beta * Math.log(u || 0.0001));
    }
};

/**
 * 2. Distribución de Poisson
 * Raúl Coss Bu, Cap. 4.4 - Procedimientos Especiales
 * Basado en la relación con la distribución exponencial.
 */
export const PoissonVariable: RandomVariableGenerator = {
    name: "Distribución de Poisson",
    description: "Modela el número de eventos en un intervalo fijo. (Coss Bu, Cap. 4).",
    method: "Multiplicación de Uniformes",
    theory: "Se basa en la propiedad de que si el tiempo entre eventos es exponencial, el número de eventos $X$ sigue una Poisson. El algoritmo consiste en multiplicar números aleatorios $R_i$ hasta que $\\prod R_i < e^{-\\lambda}$. El valor de $X$ es el número de productos realizados menos uno.",
    complexity: "O(n * λ)",
    generate: (uniforms, params) => {
        const lambda = params.lambda || params.mean || 1;
        const L = Math.exp(-lambda);
        const result: number[] = [];
        
        let p = 1.0;
        let k = 0;
        let uIndex = 0;

        while (uIndex < uniforms.length) {
            p *= (uniforms[uIndex++] || 0.0001);
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
 * Raúl Coss Bu, Cap. 4.4 - Método de Convolución
 * X = -(1/λ) * ln(Π R_i)
 */
export const ErlangVariable: RandomVariableGenerator = {
    name: "Distribución Erlang",
    description: "Suma de k variables exponenciales independientes. (Coss Bu, Cap. 4).",
    method: "Convolución",
    theory: "La distribución Erlang con parámetros $k$ y $\\lambda$ es la suma de $k$ variables exponenciales independientes con media $1/\\lambda$. La ecuación de generación es: $x = -\\frac{1}{\\lambda} \\ln(\\prod_{i=1}^{k} R_i)$.",
    complexity: "O(n * k)",
    generate: (uniforms, params) => {
        const k_param = params.k || 2;
        const lambda = params.lambda || (params.mean ? 1 / params.mean : 1);
        const result: number[] = [];
        
        for (let i = 0; i <= uniforms.length - k_param; i += k_param) {
            let prod = 1.0;
            for (let j = 0; j < k_param; j++) {
                prod *= (uniforms[i + j] || 0.0001);
            }
            result.push((-1 / lambda) * Math.log(prod));
        }
        return result;
    }
};

/**
 * 4. Distribución Binomial
 * Raúl Coss Bu, Cap. 4.4 - Método de Convolución
 * Suma de n ensayos de Bernoulli.
 */
export const BinomialVariable: RandomVariableGenerator = {
    name: "Distribución Binomial",
    description: "Número de éxitos en n ensayos independientes. (Coss Bu, Cap. 4).",
    method: "Convolución (Bernoulli)",
    theory: "Se generan $n$ variables de Bernoulli $X_i$ (donde $X_i=1$ si $R \\le p$, de lo contrario $0$). La variable binomial es $X = \\sum_{i=1}^{n} X_i$.",
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
 * 5. Distribución Triangular
 * Raúl Coss Bu, Cap. 4.1 - Método de la Transformada Inversa
 */
export const TriangularVariable: RandomVariableGenerator = {
    name: "Distribución Triangular",
    description: "Modela incertidumbre con límites a, b y moda c. (Coss Bu, Cap. 4).",
    method: "Transformada Inversa (Por tramos)",
    theory: "La función de distribución se divide en dos tramos. Si $R < \\frac{c-a}{b-a}$, entonces $x = a + \\sqrt{R(b-a)(c-a)}$. Si $R \\ge \\frac{c-a}{b-a}$, entonces $x = b - \\sqrt{(1-R)(b-a)(b-c)}$.",
    complexity: "O(n)",
    generate: (uniforms, params) => {
        const a = params.a ?? 0;
        const b = params.b ?? 10;
        const c = params.c ?? 5;
        
        const fc = (c - a) / (b - a);
        
        return uniforms.map(u => {
            if (u < fc) {
                return a + Math.sqrt(u * (b - a) * (c - a));
            } else {
                return b - Math.sqrt((1 - u) * (b - a) * (b - c));
            }
        });
    }
};

/**
 * 6. Distribución Normal (Coss Bu)
 * Raúl Coss Bu, Cap. 4.4 - Técnica de la Suma de 12 Números Pseudoaleatorios
 * Basado en el Teorema del Límite Central.
 */
export const NormalVariable: RandomVariableGenerator = {
    name: "Distribución Normal (Coss Bu)",
    description: "La campana de Gauss generada mediante el Teorema del Límite Central. (Coss Bu, Cap. 4).",
    method: "Técnica de Suma de 12",
    theory: "Aprovecha que la suma de 12 variables $U(0,1)$ tiene media 6 y varianza 1. Por el Teorema del Límite Central, $Z = (\\sum_{i=1}^{12} R_i) - 6$ se aproxima a una normal estándar $N(0,1)$. Luego $x = \\mu + \\sigma Z$.",
    complexity: "O(n * 12)",
    generate: (uniforms, params) => {
        const mean = params.mean ?? 0;
        const stdDev = params.stdDev ?? 1;
        const result: number[] = [];
        
        for (let i = 0; i <= uniforms.length - 12; i += 12) {
            let sum = 0;
            for (let j = 0; j < 12; j++) {
                sum += uniforms[i + j];
            }
            const z = sum - 6;
            result.push(z * stdDev + mean);
        }
        return result;
    }
};

/**
 * 7. Distribución Normal (Box-Muller)
 * Método computacional de alta precisión mediante transformación polar.
 */
export const NormalBoxMullerVariable: RandomVariableGenerator = {
    name: "Distribución Normal (Box-Muller)",
    description: "Generación precisa mediante transformación trigonométrica de pares uniformes.",
    method: "Algoritmo de Box-Muller",
    theory: "Transforma dos variables $U_1, U_2 \\sim U(0,1)$ en una variable Normal estándar mediante: $Z = \\sqrt{-2 \\ln U_1} \\cos(2\\pi U_2)$. Es más eficiente en consumo de números aleatorios que la suma de 12.",
    complexity: "O(n)",
    generate: (uniforms, params) => {
        const mean = params.mean ?? 0;
        const stdDev = params.stdDev ?? 1;
        const result: number[] = [];
        
        for (let i = 0; i < uniforms.length - 1; i += 2) {
            const u1 = uniforms[i] || 0.0001;
            const u2 = uniforms[i + 1];
            const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            result.push(z * stdDev + mean);
        }
        return result;
    }
};

export const availableVariables: Record<string, RandomVariableGenerator> = {
    'uniform': UniformVariable,
    'exponential': ExponentialVariable,
    'poisson': PoissonVariable,
    'erlang': ErlangVariable,
    'binomial': BinomialVariable,
    'triangular': TriangularVariable,
    'normal': NormalVariable,
    'normal-bm': NormalBoxMullerVariable
};


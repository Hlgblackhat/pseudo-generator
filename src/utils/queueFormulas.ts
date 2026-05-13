/**
 * Utilidades Matemáticas para Teoría de Colas (Notación de Kendall)
 * Basado en las fórmulas estándar de M/M/s
 */

export interface QueueResults {
    rho: number;   // Utilización del sistema
    p0: number;    // Probabilidad de sistema vacío
    l: number;     // Número promedio de clientes en el sistema
    lq: number;    // Número promedio de clientes en la cola
    w: number;     // Tiempo promedio de espera en el sistema
    wq: number;    // Tiempo promedio de espera en la cola
}

/**
 * Calcula los parámetros para un sistema M/M/s (Markoviano, Múltiples Servidores)
 */
export const calculateMMs = (lambda: number, mu: number, s: number): QueueResults | null => {
    if (mu <= 0 || lambda < 0 || s <= 0) return null;
    
    const rho = lambda / (s * mu);
    
    // Si la tasa de llegada es mayor o igual a la capacidad total, el sistema es inestable
    if (rho >= 1) return null; 

    // 1. Calcular P0 (Probabilidad de 0 clientes en el sistema)
    let sum = 0;
    const intensity = lambda / mu;
    
    for (let n = 0; n < s; n++) {
        sum += Math.pow(intensity, n) / factorial(n);
    }
    
    const p0 = 1 / (sum + (Math.pow(intensity, s) / (factorial(s) * (1 - rho))));

    // 2. Calcular Lq (Longitud promedio de la cola)
    const lq = (p0 * Math.pow(intensity, s) * rho) / (factorial(s) * Math.pow(1 - rho, 2));
    
    // 3. Usar Ley de Little para el resto
    const l = lq + intensity;
    const wq = lq / lambda;
    const w = wq + (1 / mu);

    return { rho, p0, l, lq, w, wq };
};

/**
 * Calcula los parámetros para un sistema M/M/1 (Un solo servidor)
 * Es un caso especial de M/M/s pero con fórmulas simplificadas
 */
export const calculateMM1 = (lambda: number, mu: number): QueueResults | null => {
    if (mu <= lambda) return null; // Sistema inestable

    const rho = lambda / mu;
    const p0 = 1 - rho;
    const l = lambda / (mu - lambda);
    const lq = Math.pow(lambda, 2) / (mu * (mu - lambda));
    const w = 1 / (mu - lambda);
    const wq = lambda / (mu * (mu - lambda));

    return { rho, p0, l, lq, w, wq };
};

const factorial = (n: number): number => {
    if (n <= 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
};

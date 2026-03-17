export interface TestResult {
    name: string; // Nombre formal de la prueba
    description: string; // Qué mide la prueba
    passed: boolean; // ¿Superó la prueba estadística?
    statistic: number; // El valor calculado ($\chi^2$, $D$, $Z$)
    criticalValue: number; // El valor umbral para rechazar la hipótesis nula
    alpha: number; // Nivel de significancia (usualmente 5% = 0.05)
    message: string; // Texto explicativo de la conclusión
    details?: string; // Información técnica adicional
}

export interface StatisticalTest {
    id: string; // Identificador único (ej. 'chi_square')
    name: string;
    description: string;
    run(data: number[], alpha?: number): TestResult;
}

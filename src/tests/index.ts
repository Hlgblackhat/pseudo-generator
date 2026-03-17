export * from './types';
export * from './chiSquare';
export * from './kolmogorovSmirnov';
export * from './runsTest';

import { ChiSquareTest } from './chiSquare';
import { KolmogorovSmirnovTest } from './kolmogorovSmirnov';
import { RunsTest } from './runsTest';
import type { StatisticalTest } from './types';

/**
 * Registro de todas las pruebas estadísticas disponibles en el sistema.
 */
export const availableTests: Record<string, StatisticalTest> = {
    chi_square: new ChiSquareTest(),
    ks: new KolmogorovSmirnovTest(),
    runs: new RunsTest()
};

/**
 * Ejecuta una lista de pruebas (por IDs) sobre una secuencia de datos.
 */
export const runSelectedTests = (testIds: string[], data: number[], alpha: number = 0.05) => {
    return testIds.map(id => {
        const test = availableTests[id];
        if (!test) throw new Error(`Statistical Test con ID '${id}' no se encontró.`);
        return test.run(data, alpha);
    });
};

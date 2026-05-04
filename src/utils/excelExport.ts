import * as xlsx from 'xlsx';

/**
 * Exporta los números del generador (números aleatorios) a Excel.
 * Columnas: # | Número Original (entero) | Normalizado [0,1]
 */
export function exportGeneratorToExcel(numbers: number[], methodName: string) {
    const maxRaw = Math.max(...numbers);

    const rows = numbers.map((n, i) => ({
        '#': i + 1,
        'Número Original': n,
        'Normalizado [0,1]': maxRaw > 0 ? parseFloat((n / maxRaw).toFixed(8)) : n,
    }));

    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Números Generados');

    // Ancho de columnas
    ws['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 20 }];

    const filename = `${methodName.replace(/[\s()]/g, '_')}_numeros.xlsx`;
    xlsx.writeFile(wb, filename);
}

/**
 * Exporta los resultados de la transformación de variables aleatorias a Excel.
 * Columnas: # | Uniforme U | Variable Aleatoria X
 */
export function exportVariablesToExcel(
    uniforms: number[],
    transformed: number[],
    distributionName: string
) {
    const rows = transformed.map((x, i) => ({
        '#': i + 1,
        'Uniforme U(0,1)': uniforms[i] !== undefined ? parseFloat(uniforms[i].toFixed(8)) : '',
        [`Variable X ~ ${distributionName}`]: parseFloat(x.toFixed(8)),
    }));

    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Variables Aleatorias');

    ws['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 28 }];

    const filename = `${distributionName.replace(/[\s()\/]/g, '_')}_variables.xlsx`;
    xlsx.writeFile(wb, filename);
}

/**
 * Exporta el análisis de frecuencias de una variable aleatoria a Excel.
 */
export function exportFrequenciesToExcel(
    intervals: any[],
    variableName: string
) {
    const rows = intervals.map((interval, i) => ({
        'Clase #': i + 1,
        'Límite Inferior': parseFloat(interval.min.toFixed(8)),
        'Límite Superior': parseFloat(interval.max.toFixed(8)),
        'Freq. Absoluta (fi)': interval.count,
        'Freq. Relativa (hi)': parseFloat(interval.relativeFrequency.toFixed(8)),
        'Freq. Porcentual (%)': parseFloat((interval.relativeFrequency * 100).toFixed(2)),
    }));

    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Tabla de Frecuencias');

    ws['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];

    const filename = `${variableName.replace(/[\s()\/]/g, '_')}_frecuencias.xlsx`;
    xlsx.writeFile(wb, filename);
}

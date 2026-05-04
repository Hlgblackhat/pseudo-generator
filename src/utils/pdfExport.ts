import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { TestResult } from '../tests';

interface PDFReportData {
    data: number[];
    results: TestResult[];
    stats: {
        mean: number;
        variance: number;
        min: number;
        max: number;
        n: number;
    };
    method: string;
    dataSource: string;
    alpha: number;
    chartElementId?: string;
}

const COLORS = {
    primary: [15, 23, 42],    // Slate-900
    secondary: [14, 165, 233], // Sky-500
    success: [22, 163, 74],   // Emerald-600
    successBg: [240, 253, 244], // Emerald-50
    error: [225, 29, 72],     // Rose-600
    errorBg: [255, 241, 242],   // Rose-50
    border: [226, 232, 240],  // Slate-200
    text: [100, 116, 139],    // Slate-500
    textDark: [30, 41, 59]    // Slate-800
};

export const generateReportPDF = async (reportData: PDFReportData) => {
    const { data, results, stats, chartElementId } = reportData;
    
    const doc = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // ── Header & Branding ─────────────────────────────────────────────────────
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
    doc.text('Pseudo', margin, 18);
    const titleWidth = doc.getTextWidth('Pseudo');
    doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.setFont('helvetica', 'bolditalic');
    doc.text('Gen', margin + titleWidth, 18);
    
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Pruebas Estadísticas', margin, 25);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: #${Date.now()} | Fecha: ${new Date().toLocaleString()}`, pageWidth - margin, 15, { align: 'right' });

    let y = 35;

    // ── Section: Summary Cards (Recreating UI Cards) ──────────────────────────
    const passCount = results.filter(r => r.passed).length;
    const score = (passCount / results.length) * 100;
    const isGood = score >= 80;
    const statusColor = isGood ? COLORS.success : COLORS.error;
    const statusBg = isGood ? COLORS.successBg : COLORS.errorBg;

    // Quality Card (Left)
    const cardW = 75;
    const cardH = 45;
    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(margin, y, cardW, cardH, 3, 3, 'FD');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text('PUNTAJE DE CALIDAD', margin + cardW/2, y + 10, { align: 'center' });
    
    doc.setFontSize(28);
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(`${score.toFixed(0)}`, margin + cardW/2 - 5, y + 25, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text('/100', margin + cardW/2 + 8, y + 25);
    
    // Label Pill
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin + cardW/2 - 15, y + 32, 30, 6, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(isGood ? 'EXCELENTE' : 'CRÍTICO', margin + cardW/2, y + 36.5, { align: 'center' });

    // Metrics Card (Right)
    const metricsW = pageWidth - margin * 2 - cardW - 8;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.roundedRect(margin + cardW + 8, y, metricsW, cardH, 3, 3, 'FD');
    
    doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.setLineWidth(1);
    doc.line(margin + cardW + 13, y + 8, margin + cardW + 13, y + 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
    doc.text('SOBRE ESTOS NÚMEROS', margin + cardW + 17, y + 12);

    // Metric Grid
    const gridY = y + 20;
    const colW = (metricsW - 20) / 4;
    const metrics = [
        { l: 'MEDIA', v: stats.mean.toFixed(6) },
        { l: 'VARIANZA', v: stats.variance.toFixed(6) },
        { l: 'MÍNIMO', v: stats.min.toFixed(6) },
        { l: 'MÁXIMO', v: stats.max.toFixed(6) }
    ];

    metrics.forEach((m, i) => {
        const x = margin + cardW + 18 + (i * colW);
        doc.setFontSize(6);
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.text(m.l, x, gridY);
        doc.setFontSize(11);
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        doc.text(m.v, x, gridY + 8);
    });

    y += cardH + 12;

    // ── Section: Test Details Table ───────────────────────────────────────────
    autoTable(doc, {
        startY: y,
        margin: { left: margin },
        headStyles: { fillColor: COLORS.primary as any, textColor: [255,255,255], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 3, lineColor: COLORS.border as any, lineWidth: 0.1 },
        columnStyles: { 
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { halign: 'center', fontStyle: 'bold' },
            5: { fontSize: 6.5, textColor: COLORS.text as any }
        },
        head: [['Prueba', 'Estado', 'Estadístico', 'Crítico', 'Alpha', 'Conclusión']],
        body: results.map(r => [
            r.name,
            r.passed ? 'PASÓ' : 'FALLÓ',
            r.statistic.toFixed(6),
            r.criticalValue.toFixed(6),
            r.alpha,
            r.message
        ]),
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 1) {
                data.cell.styles.textColor = data.cell.raw === 'PASÓ' ? COLORS.success as any : COLORS.error as any;
            }
        }
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // ── Section: Charts (The only part using html2canvas, but with extra safety) ──
    if (chartElementId) {
        const element = document.getElementById(chartElementId);
        if (element) {
            try {
                // Para los gráficos, intentaremos una captura limpia pero si falla no detendrá el PDF
                const canvas = await html2canvas(element, {
                    scale: 1.5,
                    useCORS: true,
                    logging: false,
                    // EL TRUCO: Quitamos el fondo para evitar conflictos de color complejos
                    backgroundColor: null,
                });
                
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - (margin * 2);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (y + imgHeight > pageHeight - 20) {
                    doc.addPage();
                    y = 20;
                }

                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
                doc.text('CÓMO SE VEN LOS DATOS', margin, y);
                doc.addImage(imgData, 'PNG', margin, y + 5, imgWidth, imgHeight);
            } catch (err) {
                console.warn('No se pudo capturar el gráfico, continuando sin él.', err);
                doc.setTextColor(COLORS.error[0], COLORS.error[1], COLORS.error[2]);
                doc.text('Nota: La visualización gráfica no pudo ser procesada por compatibilidad de navegador.', margin, y);
            }
        }
    }

    // ── Section: Raw Data Table (Appendix) ────────────────────────────────────
    doc.addPage();
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
    doc.text('ANEXO: TODOS LOS NÚMEROS GENERADOS', margin, 20);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(`Total de muestras: ${data.length}`, margin, 25);

    // Organizamos los datos en una tabla de 10 columnas para ahorrar espacio
    const columns = 10;
    const rows: string[][] = [];
    for (let i = 0; i < data.length; i += columns) {
        const row = data.slice(i, i + columns).map(n => n.toFixed(6));
        // Rellenar con vacíos si la última fila no está completa
        while (row.length < columns) row.push('');
        rows.push(row);
    }

    autoTable(doc, {
        startY: 30,
        margin: { left: margin },
        styles: { fontSize: 6.5, cellPadding: 1.5, halign: 'center' },
        headStyles: { fillColor: [241, 245, 249], textColor: COLORS.textDark as any, fontSize: 6 },
        head: [Array.from({ length: columns }, (_, i) => `Col ${i + 1}`)],
        body: rows,
        alternateRowStyles: { fillColor: [252, 253, 255] }
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.text(`PseudoGen - Proyecto U - Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    doc.save(`PseudoGen_Reporte_${Date.now()}.pdf`);
};

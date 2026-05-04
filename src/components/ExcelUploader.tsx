import type { FC } from 'react';
import { useRef, useState } from 'react';
import * as xlsx from 'xlsx';
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface ExcelUploaderProps {
    onNumbersExtracted: (numbers: number[]) => void;
}

const ExcelUploader: FC<ExcelUploaderProps> = ({ onNumbersExtracted }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('processing');
        setMessage('Procesando archivo...');

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = xlsx.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                
                // Convertir la hoja a un arreglo de arreglos
                const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
                
                // Extraer todos los números encontrados en todas las celdas
                const extractedNumbers: number[] = [];
                data.forEach((row: any) => {
                    if (Array.isArray(row)) {
                        row.forEach((cell: any) => {
                            if (typeof cell === 'number') {
                                extractedNumbers.push(cell);
                            } else if (typeof cell === 'string') {
                                const parsed = parseFloat(cell.replace(',', '.'));
                                if (!isNaN(parsed)) extractedNumbers.push(parsed);
                            }
                        });
                    }
                });

                if (extractedNumbers.length > 0) {
                    setStatus('success');
                    setMessage(`Se cargaron ${extractedNumbers.length} números.`);
                    onNumbersExtracted(extractedNumbers);
                } else {
                    setStatus('error');
                    setMessage('No se encontraron números válidos en el archivo Excel.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Hubo un error al leer el archivo. Asegúrate de que sea un Excel válido.');
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="w-full">
            <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-3 px-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                    status === 'success' ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/20 text-violet-700' : 
                    status === 'error' ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20 text-rose-700' :
                    'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
                {status === 'processing' ? <UploadCloud className="w-6 h-6 animate-bounce text-violet-600" /> : 
                 status === 'success' ? <CheckCircle2 className="w-6 h-6 text-violet-500" /> :
                 status === 'error' ? <AlertCircle className="w-6 h-6 text-rose-500" /> :
                 <FileSpreadsheet className="w-6 h-6" />}
                 
                <span className="text-[10px] font-bold uppercase tracking-widest text-center">
                    {status === 'idle' ? 'Subir Archivo Excel/CSV' : message}
                </span>
            </button>
        </div>
    );
};

export default ExcelUploader;

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ChevronLeft, 
  FileText, 
  Book, 
  Settings, 
  Zap, 
  ShieldAlert, 
  TestTube,
  Menu,
  X,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Estructura de navegación para la documentación
 */
const DOC_STRUCTURE = [
  {
    title: 'General',
    items: [
      { id: 'README', name: 'Inicio', path: 'README.md', icon: Book },
      { id: 'UI_UX_LAB', name: 'Manual UI/UX', path: 'UI_UX_LAB.md', icon: Zap },
      { id: 'COMPLIANCE', name: 'Cumplimiento', path: 'COMPLIANCE.md', icon: ShieldAlert },
      { id: 'steps', name: 'Bitácora', path: 'steps.md', icon: FileText },
    ]
  },
  {
    title: 'Métodos PRNG',
    items: [
      { id: 'mixed-congruential', name: 'Lineal Mixto', path: 'methods/mixed-congruential.md', icon: Settings },
      { id: 'multiplicative-congruential', name: 'Multiplicativo', path: 'methods/multiplicative-congruential.md', icon: Settings },
      { id: 'additive-congruential', name: 'Aditivo', path: 'methods/additive-congruential.md', icon: Settings },
      { id: 'middle-square', name: 'Cuadrados Medios', path: 'methods/middle-square.md', icon: Settings },
      { id: 'lfsr', name: 'LFSR (Bits)', path: 'methods/lfsr.md', icon: Cpu },
      { id: 'bbs', name: 'Blum Blum Shub', path: 'methods/bbs.md', icon: ShieldAlert },
      { id: 'lfg', name: 'Lagged Fibonacci', path: 'methods/lfg.md', icon: Zap },
    ]
  },
  {
    title: 'Validación',
    items: [
      { id: 'statistical-tests', name: 'Pruebas Estadísticas', path: 'tests/statistical-tests.md', icon: TestTube },
      { id: 'methodology', name: 'Metodología', path: 'tests/methodology.md', icon: FileText },
    ]
  }
];

// Helper to find document by ID
const findDocById = (id: string) => {
  for (const section of DOC_STRUCTURE) {
    const doc = section.items.find(item => item.id === id);
    if (doc) return doc;
  }
  return null;
};

const Documentation = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const currentDocId = docId || 'README';
  const currentDoc = findDocById(currentDocId);

  useEffect(() => {
    if (!currentDoc) {
      navigate('/doc/README');
      return;
    }

    setLoading(true);
    fetch(`/docs/${currentDoc.path}`)
      .then(res => {
        if (!res.ok) throw new Error('No se pudo cargar el documento');
        return res.text();
      })
      .then(text => setContent(text))
      .catch(err => setContent(`# Error 404\n\nNo se encontró el archivo: \`${currentDoc.path}\`\n\nDetalle: ${err.message}`))
      .finally(() => setLoading(false));
  }, [currentDocId, navigate, currentDoc]);

  // Filtrado de búsqueda
  const filteredStructure = searchQuery 
    ? DOC_STRUCTURE.map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.items.length > 0)
    : DOC_STRUCTURE;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-bg-dark overflow-hidden font-sans">
      {/* Sidebar Móvil Overlay */}
      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-72' : 'w-0 lg:w-0'} flex flex-col bg-white dark:bg-bg-card border-r border-slate-200 dark:border-border-subtle transition-all duration-300 z-40 relative group`}
      >
        <div className="p-6 border-b border-slate-200 dark:border-border-subtle flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Book className="text-brand-primary w-5 h-5 shrink-0" />
            <span className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm">Biblioteca Docs</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Buscador */}
        <div className="p-4 overflow-hidden">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-border-subtle rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-brand-primary transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {filteredStructure.map(section => (
            <div key={section.title} className="space-y-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-2 mb-2">{section.title}</h3>
              {section.items.map(item => (
                <Link
                  key={item.id}
                  to={`/doc/${item.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all group ${
                    currentDocId === item.id 
                    ? 'bg-black text-white dark:bg-brand-primary shadow-sm ring-1 ring-white/10' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon size={14} className={currentDocId === item.id ? 'text-white' : 'text-slate-400 group-hover:text-brand-primary'} />
                  {item.name}
                </Link>
              ))}
            </div>
          ))}
          {filteredStructure.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Sin resultados</span>
            </div>
          )}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-100 dark:border-border-subtle">
           <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-border-subtle"
           >
             <ChevronLeft size={14} /> Volver al Simulador
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header Content */}
        <header className="h-16 border-b border-slate-200 dark:border-border-subtle bg-white/50 dark:bg-bg-card/50 backdrop-blur-xl flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle text-slate-600 shadow-sm mr-2"
              >
                <Menu size={18} />
              </button>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                 <Link to="/" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-brand-primary transition-colors">Laboratorio</Link>
                 <span className="text-slate-300">/</span>
                 <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{currentDoc?.name || 'Cargando...'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end">
               <span className="text-[10px] font-black uppercase text-slate-400 leading-none mb-0.5">Versión v1.1.0</span>
               <span className="text-[9px] text-slate-400 italic">Documentación Académica</span>
             </div>
             <div className="w-8 h-8 rounded-lg bg-black dark:bg-brand-primary flex items-center justify-center text-white shadow-lg">
                <FileText size={16} />
             </div>
          </div>
        </header>

        {/* Renderizado de Markdown */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0b0c10] transition-colors relative">
          {/* Fondo decorativo */}
          <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-brand-primary/2 opacity-[0.03] blur-[100px] pointer-events-none" />
          
          <div className="max-w-4xl mx-auto px-6 py-12 md:px-12">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-brand-primary rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Indexando Conocimiento...</span>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={currentDocId}
                className="prose prose-slate dark:prose-invert prose-sm md:prose-base max-w-none
                  prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter
                  prose-h1:text-4xl prose-h1:mb-8 prose-h1:border-b prose-h1:pb-4 prose-h1:border-slate-100 dark:prose-h1:border-border-subtle
                  prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed
                  prose-a:text-brand-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-slate-900 dark:prose-strong:text-white
                  prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-brand-primary prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-slate-900 dark:prose-pre:bg-black prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/5
                  prose-img:rounded-2xl prose-img:shadow-2xl
                  prose-table:border prose-table:border-slate-100 dark:prose-table:border-border-subtle prose-table:rounded-xl
                  prose-th:bg-slate-50 dark:prose-th:bg-slate-800/50 prose-th:p-4
                  prose-td:p-4
                "
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </motion.div>
            )}

            {/* Navegación al final del documento */}
            {!loading && (
              <div className="mt-20 pt-10 border-t border-slate-100 dark:border-border-subtle flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cátedra</span>
                   <span className="text-xs font-black text-slate-600 dark:text-slate-300">Simulación Digital</span>
                 </div>
                 <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Institución</span>
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300">Universidad de Cartagena</span>
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Documentation;

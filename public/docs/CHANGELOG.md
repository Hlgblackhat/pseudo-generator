# Changelog

Todos los cambios relevantes de este proyecto quedan registrados acá.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y el versionado usa [Semver](https://semver.org/lang/es/).

---

## [v1.3.0] - 2025-05-05

### Agregado
- **Alineación con Raúl Coss Bu:** El módulo de variables aleatorias ha sido reescrito para seguir estrictamente el libro *"Simulación - Un Enfoque Práctico"* (Capítulo 4).
- **Distribución Uniforme (a, b):** Nueva distribución base para transformaciones lineales de rango.
- **Renderizado de Fórmulas Académicas:** Integración de `ReactMarkdown` con `rehypeKatex` en el Laboratorio de Variables para mostrar las ecuaciones exactas del libro en formato LaTeX.

### Cambiado
- **Distribución Normal:** Se reemplazó el algoritmo de Box-Muller por la **Técnica de la Suma de 12 Números Pseudoaleatorios**, el estándar académico propuesto por Coss Bu basado en el Teorema del Límite Central.
- **Estandarización de Nomenclatura:** Todos los nombres de distribuciones ahora siguen el formato *"Distribución [Nombre]"* para mayor profesionalismo y coherencia con la bibliografía.
- **Mejora de UI en Resumen Teórico:** Se eliminaron las restricciones de scroll y truncado en la tarjeta de teoría para facilitar la lectura completa de los algoritmos y sus justificaciones matemáticas.

---

## [v1.2.0] - 2025-05-04

### Agregado
- **Pruebas Rápidas (Quick Tests):** Panel en el Laboratorio con 7 botones (uno por cada motor) que precargan parámetros de ejemplo listos para generar de inmediato.
- **Deep links desde la documentación:** La tabla de ejemplos en `README.md` ahora tiene un botón "🚀 Cargar" por fila que navega al Laboratorio con todos los parámetros pre-inyectados (incluido `$N$`) a través de query strings en la URL (`?method=mixed&seed=42&a=21&c=3&m=100&count=100&auto=1`).
- **Soporte de `count` en la URL:** El parámetro `$N$` (cantidad a generar) ahora puede ser inyectado vía query string junto con el resto de la configuración del algoritmo.

### Corregido
- **Falso positivo en detección de ciclos (LFG / LFSR):** El detector de ciclos revisaba si un valor normalizado se había repetido, lo cual es incorrecto para generadores con estado multi-valor (LFG, LFSR). Con `m` pequeño, la paradoja del cumpleaños causaba detecciones falsas en las primeras ~50 iteraciones. Ahora se omite la detección por valor único para esos métodos.
- **Stale closure en inyección de parámetros desde URL:** El `useEffect` que leía los `searchParams` llamaba `onGenerate(...)` dentro de un updater de `setParams`, lo cual React StrictMode ejecuta dos veces. Se refactorizó usando un `useRef` (`pendingAutoRun`) + un segundo `useEffect` que dispara la generación una sola vez después de que el estado está aplicado.
- **`parseInt(value) || 0` destruía valores al editar:** Si el usuario borraba un campo numérico para escribir uno nuevo, el valor quedaba en `0` silenciosamente. Ahora `handleChange` solo actualiza el estado si el valor parseado es un número real (`!isNaN`).

### Cambiado
- Preset LFG: módulo actualizado de `m=1024` a `m=100000` para que los valores de salida se distribuyan mejor en `[0,1)` y la demo sea más representativa de "ciclos largos".
- Documentación de la tabla de pruebas rápidas: columna de valores ahora incluye el `$N$` sugerido para cada algoritmo.

---

## [v1.1.0] - 2025-05-03

### Agregado
- **StatisticalLab** como módulo independiente con ruta `/stats`.
- Criterios de calidad por motor con selección automática de prueba estadística y justificación académica.
- Exportación a Excel desde el Generador y desde el módulo de Variables.
- Uploader de Excel para importar datos externos al Laboratorio.
- Página de inicio (`Home`) como landing de la suite.
- `AppHeader` y `MainNavigation` como componentes compartidos entre vistas.
- Motor **Blum Blum Shub (BBS)** con aritmética `BigInt`.
- Motor **Lagged Fibonacci Generator (LFG)** con buffer circular.

### Corregido
- Distribuciones estadísticas en el módulo de Variables: triangular, beta, gamma y exponencial calculadas sin `Math.random`.
- Eliminación total de `Math.random` del código fuente.

---

## [v1.0.2] - 2025-05-02

### Corregido
- Scroll bloqueado en la tabla de resultados al generar más de 5000 números.
- Contraste de texto en modo claro para valores con muchos decimales.

---

## [v1.0.1] - 2025-05-01

### Corregido
- Validación Hull-Dobell: condición 3 (`4|m → 4|(a-1)`) no se evaluaba correctamente.
- Textos de la interfaz pasados a español.

---

## [v1.0.0] - 2025-04-30

### Lanzamiento inicial
- Generador Lineal Congruencial Mixto con validación Hull-Dobell.
- Detector de ciclos automático.
- Interfaz de 3 columnas: configuración, resultados, análisis.
- Documentación inicial en `docs/`.

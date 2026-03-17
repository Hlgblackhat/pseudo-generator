# Diseño de Interfaz: Laboratorio de Simulación v2.1

## 🏗️ Arquitectura de 3 Columnas
El simulador ha sido estructurado en un workspace de tres paneles fijos para maximizar la visibilidad de los datos y el análisis concurrente.

### 1. Panel de Parametrización (Izquierda - 20%)
- **Propósito:** Entrada de datos y control de flujo.
- **Componentes:** Selector de algoritmo y formulario dinámico de parámetros ($x_0, a, c, m, k, d$).
- **Dinamicidad:** La interfaz adapta los campos de entrada según el método seleccionado, bloqueando o liberando parámetros específicos (ej: $k$ para aditivo, $d$ para cuadrados medios).
- **Restricción Académica:** Se han removido los métodos de inicialización aleatoria para garantizar que el usuario tenga control total sobre la reproducibilidad.

### 2. Monitor de Secuencia (Centro - 60%)
- **Propósito:** Visualización masiva de resultados en tiempo real.
- **Capacidad:** Soporta muesreos de miles de instancias mediante un sistema de scroll independiente.
- **Código de Colores:**
  - **Verde Esmeralda:** Identifica la Semilla o primer valor generado.
  - **Rojo Neón:** Identifica el punto exacto donde la secuencia se repite (Ciclo detectado).
  - **Gris Slate:** Valores intermedios de la secuencia.

### 3. Analizador de Resultados (Derecha - 20%)
- **Propósito:** Diagnóstico matemático y estadísticas descriptivas.
- **Diagnóstico Hull-Dobell:** Predicción del periodo antes y durante la ejecución.
- **Métricas de Media ($\mu$):** Cálculo dinámico de la media aritmética para verificar la tendencia hacia 0.5 (Uniformidad).

---

## 🎨 Identidad Visual (Light Mode & Obsidian)
Se ha optado por un **Tema Claro** con acentos en **Negro Puro** para:
- Mejorar la legibilidad de números de precisión (6 decimales).
- Aportar una estética de "Paper Científico" moderna.
- Reducir la distracción visual durante sesiones de análisis prolongadas.

## ⚡ Rendimiento
El sistema utiliza **renderizado por lotes (Batch Rendering)** y truncamiento visual para permitir la generación de hasta 20,000 números sin degradar la respuesta del navegador a 60 FPS.

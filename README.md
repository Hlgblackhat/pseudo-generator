# PseudoGen v1.1.0: Laboratorio Analítico de PRNG

Bienvenido a **PseudoGen**, un laboratorio interactivo de alto rendimiento para la generación, visualización y validación de números pseudoaleatorios utilizando 7 métodos avanzados.

### 🎓 Contexto Académico
Este es un proyecto formal desarrollado dentro del programa de **Ingeniería de Sistemas** en la **Universidad de Cartagena**. Pertenece a la cátedra de **Simulación Digital**, enfocada en el estudio de modelos estocásticos y generación de variables aleatorias.

## 🗺️ Mapa de Documentación Técnica

### 1. Fundamentos Matemáticos por Método
- **[Método Lineal Congruencial (Mixto)](docs/methods/mixed-congruential.md)**
- **[Método Congruencial Multiplicativo](docs/methods/multiplicative-congruential.md)**
- **[Método Congruencial Aditivo](docs/methods/additive-congruential.md)**
- **[Método de Cuadrados Medios (Middle Square)](docs/methods/middle-square.md)**
- **[LFSR (Linear Feedback Shift Register)](docs/methods/lfsr.md)**
- **[Blum Blum Shub (BBS)](docs/methods/bbs.md)**
- **[Lagged Fibonacci Generator (LFG)](docs/methods/lfg.md)**

### 2. Guías de Implementación y Diseño
- **[Manual de Usuario e Interfaz (UI/UX)](docs/UI_UX_LAB.md):** Explicación del workspace de 3 columnas y el código de colores.
- **[Diagnóstico Estadístico](docs/tests/statistical-tests.md):** Detalle matemático de las 7 pruebas empíricas (Chi-Square, Poker, Medias, etc.).
- **[Metodología de Validación](docs/tests/methodology.md):** Cómo validamos la uniformidad y el periodo de las secuencias.
- **[Sistema de Auto-Corrección](docs/methods/auto-correction.md):** Documentación del motor de sugerencias inteligentes.

### 3. Aspectos Académicos
- **[Cumplimiento Académico](docs/COMPLIANCE.md):** Documento que certifica la NO utilización de `Math.random()`.
- **[Bitácora de Desarrollo](docs/steps.md):** Registro cronológico de la evolución del proyecto.

---

## 🚀 Guía Rápida de Evaluación
Para validar los resultados rápidamente en la aplicación, sugerimos los siguientes casos de prueba:

| Objetivo | Algoritmo | Parámetros Recomendados |
| :--- | :--- | :--- |
| **Periodo Completo** | Mixto | $x_0=42, a=21, c=3, m=100$ |
| **Alta Seguridad** | BBS | $p=499, q=503, seed=12345$ |
| **Simulación Científica** | LFG | $j=7, k=10, m=1024$ |
| **Degradación Visual** | Cuad. Medios | $x_0=12, d=2$ (Tiende a cero rápido) |
| **Hardware Emulation** | LFSR | Semilla=1 (Secuencia de bits de 16 bits) |

---

## 🛠️ Tecnologías Utilizadas
- **Core:** React 19 + TypeScript
- **Styling:** Vanilla CSS (Modern CSS) / Lucide Icons
- **Animations:** Framer Motion
- **Graphics:** Recharts (Visualización de Frecuencias y Dispersión 2D)
- **Build Tool:** Vite 8.0

**Nota para el Evaluador:** Todos los motores matemáticos se encuentran localizados en `src/engines/`. No se utilizan librerías externas para la lógica de generación.

---

## 👥 Colaboradores
| Perfil | Información |
| :--- | :--- |
| <img src="https://github.com/Hlgblackhat.png" width="60" style="border-radius: 50%"/> | **Haider López** <br/> [@Hlgblackhat](https://github.com/Hlgblackhat) <br/> Universidad de Cartagena |

---

© 2026 PseudoGen Project. Ingeniería de Sistemas.

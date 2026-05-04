# 🔬 PseudoGen
### Un proyecto para simular y analizar números pseudoaleatorios

¡Hola! Bienvenidos a **PseudoGen**. Esta es una herramienta que armamos para jugar y explorar cómo funcionan los generadores de números pseudoaleatorios (PRNG) y las variables aleatorias.

---

## 🏫 ¿Por qué hicimos esto?
Este proyecto nació como un trabajo para la materia de **Simulación Digital** en el programa de **Ingeniería de Sistemas** de la **Universidad de Cartagena**. 

La idea principal es entender cómo se genera la "aleatoriedad" en una computadora de verdad, sin hacer trampa usando cosas como `Math.random()`. Todo lo programamos desde cero con puras matemáticas para ver exactamente qué pasa por debajo de la mesa.

---

## 🗺️ Lo que vas a encontrar

### ⚡ Generadores de Números
Acá programamos varios de los algoritmos clásicos:
*   [**Lineal Mixto**](/doc/mixed-congruential): El viejo confiable para periodos largos.
*   [**Multiplicativo**](/doc/multiplicative-congruential) y [**Aditivo**](/doc/additive-congruential): Otras variaciones conocidas.
*   [**Cuadrados Medios**](/doc/middle-square): El método súper clásico de Von Neumann.
*   [**LFSR**](/doc/lfsr) y [**Lagged Fibonacci**](/doc/lfg): Métodos un poco más enredados usando bits y secuencias.
*   [**Blum Blum Shub**](/doc/bbs): Para darle un toque de criptografía y números primos.

### 🎲 Variables Aleatorias
También hacemos transformaciones para no quedarnos solo con números uniformes:
*   [**Generación de Variables**](/doc/random-variables): Usando cosas como Box-Muller para sacar una distribución Normal, Poisson, Exponencial, etc.

### 🧪 Pruebas
Para no creerle ciegamente al código, implementamos pruebas estadísticas:
*   [**Pruebas**](/doc/statistical-tests): Chi-cuadrado, Varianza, Poker, etc., para ver si los números realmente pasan por aleatorios y no tienen patrones raros.
*   [**Cómo funciona**](/doc/methodology): Qué significan los resultados de las pruebas.

---

## 🚀 Pruebas Rápidas
Si quieres ver el simulador en acción sin pensar mucho, mete estos valores en el panel:

| Para qué sirve | Qué método usar | Valores que le puedes poner | Probar |
| :--- | :--- | :--- | :--- |
| **Que funcione súper bien** | Mixto | $x_0=42, a=21, c=3, m=100, N=100$ | [🚀 Cargar](/laboratory?method=mixed&seed=42&a=21&c=3&m=100&count=100&auto=1) |
| **Pura criptografía** | BBS | $p=499, q=503, semilla=12345, N=50$ | [🚀 Cargar](/laboratory?method=bbs&seed=12345&p=499&q=503&count=50&auto=1) |
| **Ciclos largos** | LFG | $j=7, k=10, m=1024, N=200$ | [🚀 Cargar](/laboratory?method=lfg&seed=12345&j=7&k=10&m=1024&count=200&auto=1) |
| **Para ver cómo falla** | Cuad. Medios | $x_0=12, d=2, N=30$ | [🚀 Cargar](/laboratory?method=middle_square&seed=12&d=2&count=30&auto=1) |
| **Módulos potencia de 2** | Multiplicativo | $x_0=123, a=5, m=1024, N=100$ | [🚀 Cargar](/laboratory?method=multiplicative&seed=123&a=5&m=1024&count=100&auto=1) |
| **Uso de memoria** | Aditivo | $x_0=123, k=10, m=1024, N=100$ | [🚀 Cargar](/laboratory?method=additive&seed=123&k=10&m=1024&count=100&auto=1) |
| **Registros de bits** | LFSR | $semilla=46080, N=100$ | [🚀 Cargar](/laboratory?method=lfsr&seed=46080&count=100&auto=1) |

---

## 👥 ¿Quiénes lo hicimos?
Somos un par de estudiantes de Ingeniería de Sistemas quemándonos las pestañas:

*   **Haider López** ([@Hlgblackhat](https://github.com/Hlgblackhat)) - Universidad de Cartagena
*   **José Torres** ([@Josetorresdev](https://github.com/Josetorresdev)) - Universidad de Cartagena

---

© 2026 PseudoGen. Hecho para pasar la materia (y aprender un montón en el proceso).

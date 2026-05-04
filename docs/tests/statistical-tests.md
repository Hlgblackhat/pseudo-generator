# Pruebas Estadísticas de Validación

Este documento detalla la metodología y fundamentación matemática de las pruebas estadísticas integradas en el simulador para validar la calidad de los números pseudoaleatorios generados.

---

## ⚖️ 1. Prueba de Medias
**Objetivo:** Verificar si el valor esperado (promedio) de la muestra se acerca estadísticamente a $0.5$.

*   **Hipótesis:** 
    *   $H_0: \mu = 0.5$ (La media es la esperada)
    *   $H_1: \mu \neq 0.5$ (La media no es la esperada)
*   **Estadístico de Prueba:** 
    $$Z = \frac{\bar{x} - 0.5}{\sigma / \sqrt{n}} = (\bar{x} - 0.5) \sqrt{12n}$$
*   **Criterio de Aceptación:** Se acepta si $|Z| \leq Z_{\alpha/2}$ (donde $Z_{\alpha/2}$ es el valor crítico de la distribución normal estándar).

---

## 📉 2. Prueba de Varianza
**Objetivo:** Comprobar si la dispersión de los datos alrededor de su media teórica es consistente con una distribución uniforme.

*   **Hipótesis:**
    *   $H_0: \sigma^2 = \frac{1}{12} \approx 0.0833$
    *   $H_1: \sigma^2 \neq \frac{1}{12}$
*   **Estadístico de Prueba:** 
    $$\chi^2 = \frac{(n-1)s^2}{\sigma^2} = 12(n-1)s^2$$
*   **Criterio de Aceptación:** Se acepta si se encuentra dentro de los límites de la distribución Chi-Cuadrada:
    $$\chi^2_{1-\alpha/2, n-1} \leq \chi^2 \leq \chi^2_{\alpha/2, n-1}$$

---

## 📊 3. Prueba Chi-Cuadrada ($\chi^2$) - Uniformidad
**Objetivo:** Evaluar la uniformidad de la distribución dividiendo el intervalo $[0, 1)$ en sub-intervalos (clases o cubetas).

*   **Estadístico de Prueba:** 
    $$\chi^2 = \sum_{i=1}^{k} \frac{(O_i - E_i)^2}{E_i}$$
    Donde $O_i$ es la frecuencia observada y $E_i = n/k$ es la frecuencia esperada.
*   **Criterio de Aceptación:** Se acepta si $\chi^2 < \chi^2_{\alpha, k-1}$.

---

## 📏 4. Prueba Kolmogorov-Smirnov (K-S)
**Objetivo:** Medir la desviación máxima entre la distribución empírica acumulada y la distribución uniforme teórica.

*   **Estadístico de Prueba:** 
    $$D = \max_{1 \leq i \leq n} \{ |F(x_i) - S_n(x_i)| \}$$
*   **Criterio de Aceptación:** Se acepta si $D < D_{n, \alpha}$. Esta prueba es más potente que Chi-Cuadrada para muestras pequeñas.

---

## 🃏 5. Prueba de Poker
**Objetivo:** Evaluar la independencia analizando la frecuencia de ocurrencia de patrones de dígitos en grupos de 5.

*   **Categorías de Manos:** 
    1.  **D**: Todos los dígitos distintos.
    2.  **O**: Un par.
    3.  **T**: Dos pares.
    4.  **K**: Una tercia.
    5.  **FH**: Full House (Tercia y Par).
    6.  **P**: Poker (Cuatro iguales).
    7.  **Q**: Quintilla (Cinco iguales).
*   **Metodología**: Se aplica una prueba $\chi^2$ comparando las frecuencias observadas contra las probabilidades teóricas de cada mano.

---

## 📍 6. Prueba de Series (Plano 2D)
**Objetivo:** Verificar la independencia de los números en pares $(x_i, x_{i+1})$. Asegura que los números cubren el plano unitario uniformemente sin formar patrones o "nubes" lineales.

*   **Metodología:** Se divide el plano unitario en una cuadrícula de $k \times k$ sub-celdas y se aplica una prueba de uniformidad $\chi^2$ bidimensional.

---

## 🏃 7. Prueba de Rachas (Runs Test)
**Objetivo:** Evaluar si la secuencia de números aumenta y disminuye de manera aleatoria, detectando dependencias seriales.

*   **Metodología:** Se analiza la longitud de las rachas ascendentes y descendentes comparándolas con el número esperado de rachas para una secuencia verdaderamente aleatoria.

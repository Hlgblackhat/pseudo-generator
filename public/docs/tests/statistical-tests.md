# Pruebas Estadísticas del PRNG

Este documento detalla la metodología y fundamentación matemática de las pruebas estadísticas integradas en el simulador para validar la calidad de los números pseudoaleatorios generados.

## 1. Prueba de Medias
**Objetivo:** Verificar si el valor esperado (promedio) de la muestra se acerca estadísticamente a 0.5.
- **Hipótesis:** 
  - $H_0: \mu = 0.5$ (La media es la esperada)
  - $H_1: \mu \neq 0.5$ (La media no es la esperada)
- **Estadístico:** $Z = (\bar{x} - 0.5) \sqrt{12n}$.
- **Criterio:** Se acepta si $|Z| < Z_{\alpha/2}$ (típicamente 1.96 para $\alpha = 0.05$).

## 2. Prueba de Varianza
**Objetivo:** Comprobar si la dispersión de los datos alrededor de su media teórica es adecuada.
- **Hipótesis:**
  - $H_0: \sigma^2 = 1/12 \approx 0.0833$
  - $H_1: \sigma^2 \neq 1/12$
- **Estadístico:** $\chi^2 = \frac{(n-1)s^2}{\sigma^2} = 12(n-1)s^2$.
- **Criterio:** Se acepta si se encuentra dentro de los límites de la distribución Chi-Cuadrada $[\chi^2_{1-\alpha/2, n-1}, \chi^2_{\alpha/2, n-1}]$.

## 3. Prueba Chi-Cuadrada ($\chi^2$) - Uniformidad
**Objetivo:** Evaluar la uniformidad de la distribución dividiendo el intervalo $[0, 1)$ en sub-intervalos (cubetas).
- **Estadístico:** $\chi^2 = \sum \frac{(O_i - E_i)^2}{E_i}$.
- **Criterio:** Se acepta si $\chi^2 < \chi^2_{\alpha, k-1}$.

## 4. Prueba Kolmogorov-Smirnov (K-S) - Uniformidad
**Objetivo:** Medir la desviación máxima entre la distribución empírica (frecuencia acumulada observeda) y la distribución uniforme teórica.
- **Estadístico:** $D = \max|F(x) - S_n(x)|$.
- **Criterio:** Se acepta si $D < D_{n, \alpha}$. Es más sensible que Chi-Cuadrada para muestras pequeñas.

## 5. Prueba de Poker
**Objetivo:** Evaluar la independencia mirando combinaciones internas de 5 dígitos decimales como si fueran manos de Poker.
- **Categorías:** Todos distintos, un par, dos pares, tercia, full house, poker (4 iguales), quintilla.
- **Estadístico:** Chi-Cuadrada sobre las frecuencias observadas vs las probabilidades teóricas de cada mano.

## 6. Prueba de Series (Plano 2D)
**Objetivo:** Verificar la independencia de los números en pares $(x_i, x_{i+1})$. Asegura que cubren el plano unitario uniformemente sin formar patrones lineales o agrupamientos.
- **Metodología:** Divide el plano en una cuadrícula de $k \times k$ y aplica una prueba Chi-Cuadrada radial.

## 7. Prueba de Rachas (Runs Test)
**Objetivo:** Evaluar si la secuencia de números aumenta y disminuye de manera aleatoria (independencia).
- **Metodología:** Analiza la longitud de rachas por encima y por debajo de la media.

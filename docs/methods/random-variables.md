# Generación de Variables Aleatorias

Este módulo permite transformar números pseudoaleatorios distribuidos uniformemente $U(0,1)$ en variables que siguen distribuciones de probabilidad específicas, fundamentales para la simulación de procesos estocásticos.

---

## 📐 Métodos de Transformación

### 1. Método de la Transformada Inversa
Este método se basa en el teorema de que si $X$ es una variable aleatoria continua con función de distribución acumulada $F(x)$, entonces la variable $U = F(X)$ sigue una distribución uniforme $U(0,1)$. Por lo tanto:

$$X = F^{-1}(U)$$

#### Aplicaciones en este laboratorio:
*   **Distribución Exponencial**: 
    $$X = -\frac{1}{\lambda} \ln(1-U)$$
*   **Distribución Triangular**: Se calcula mediante la inversión por tramos de la función de densidad:
    $$X = \begin{cases} a + \sqrt{U(b-a)(c-a)} & \text{si } U < \frac{c-a}{b-a} \\ b - \sqrt{(1-U)(b-a)(b-c)} & \text{si } U \geq \frac{c-a}{b-a} \end{cases}$$

---

### 2. Algoritmo de Box-Muller (Distribución Normal)
Dado que la función de distribución acumulada de la Normal no tiene una inversa analítica sencilla, utilizamos la transformación de Box-Muller. Este método toma dos números independientes $U_1, U_2 \sim U(0,1)$ y genera dos variables normales estándar $Z_0, Z_1$:

$$Z_0 = \sqrt{-2 \ln U_1} \cos(2\pi U_2)$$
$$Z_1 = \sqrt{-2 \ln U_1} \sin(2\pi U_2)$$

Posteriormente se escala a la media $\mu$ y desviación $\sigma$ deseada: $X = \mu + Z\sigma$.

---

### 3. Método de Convolución y Aditivo
Consiste en obtener la variable deseada como suma de otras variables aleatorias más simples.

*   **Distribución Erlang**: Se obtiene sumando $k$ variables exponenciales independientes con tasa $\lambda$:
    $$X = -\frac{1}{\lambda} \ln\left(\prod_{i=1}^{k} U_i\right)$$
*   **Distribución Binomial**: Se modela como la suma de $n$ ensayos de Bernoulli con probabilidad $p$:
    $$X = \sum_{i=1}^{n} I_i, \quad \text{donde } I_i = 1 \text{ si } U_i \leq p$$

---

### 4. Algoritmo de Poisson (Knuth)
Para la generación de una variable de Poisson con media $\lambda$, se utiliza el método de multiplicación:

$$X = \min \left\{ k : \prod_{i=0}^{k} U_i < e^{-\lambda} \right\}$$

---

## 📊 Análisis de Eficiencia Computacional

| Distribución | Complejidad | Variables Uniformes Necesarias | Costo Relativo |
| :--- | :--- | :--- | :--- |
| **Normal** | $O(n)$ | 2 por cada 2 muestras | Bajo |
| **Exponencial** | $O(n)$ | 1 por muestra | Muy Bajo |
| **Poisson** | $O(n \cdot \lambda)$ | Variable (Promedio $\lambda$) | Medio/Alto |
| **Erlang** | $O(n \cdot k)$ | $k$ por muestra | Medio |
| **Binomial** | $O(n \cdot N)$ | $N$ por muestra | Alto |

---

## 🛠️ Validación en el Laboratorio
Para asegurar la calidad de las variables generadas, el sistema implementa:
1.  **Validación de Uniformidad**: Se verifica que los números de entrada $U(0,1)$ pasen las pruebas de frecuencia.
2.  **Análisis de Densidad**: Comparación visual entre el histograma empírico y la curva teórica (PDF).
3.  **Auditoría de Datos**: En la pestaña "Tabla de Datos", se puede observar la trazabilidad exacta de la transformación para cada número generado.

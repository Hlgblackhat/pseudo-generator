# Generación de Variables Aleatorias (Método Coss Bu)

Este módulo ha sido alineado rigurosamente con la metodología propuesta por **Raúl Coss Bu** en su libro *"Simulación - Un Enfoque Práctico" (Capítulo 4)*. Las transformaciones garantizan una base académica sólida para el modelado de sistemas.

---

## 📐 Métodos de Transformación

### 0. Distribución Uniforme (a, b)
Es el método base para todas las transformaciones. Permite llevar un número $R \sim U(0,1)$ a cualquier rango definido por un límite inferior $a$ y un superior $b$.

$$X = a + (b - a)R$$

### 1. Método de la Transformada Inversa
Se basa en igualar la función de distribución acumulada $F(x)$ a un número aleatorio $R$ y despejar $x$.

*   **Distribución Exponencial**: 
    $$X = -\beta \ln(R)$$
    donde $\beta$ es el tiempo promedio entre eventos.
*   **Distribución Triangular**: Inversión por tramos de la rampa de densidad:
    $$X = \begin{cases} a + \sqrt{R(b-a)(c-a)} & \text{si } R < \frac{c-a}{b-a} \\ b - \sqrt{(1-R)(b-a)(b-c)} & \text{si } R \geq \frac{c-a}{b-a} \end{cases}$$

---

### 2. Generación de la Distribución Normal
Dada la complejidad de invertir analíticamente la Normal, el sistema ofrece dos enfoques:

#### A. Técnica de la Suma de 12 (Sustento Académico)
Es el método propuesto por **Raúl Coss Bu**. Basada en el Teorema del Límite Central, aprovecha que la suma de 12 variables $U(0,1)$ tiene media 6 y varianza 1.

$$Z = \left(\sum_{i=1}^{12} R_i\right) - 6$$

#### B. Algoritmo de Box-Muller (Eficiencia Computacional)
Transforma dos números independientes $U_1, U_2 \sim U(0,1)$ en una variable normal estándar mediante una transformación polar:

$$Z = \sqrt{-2 \ln U_1} \cos(2\pi U_2)$$

**Comparativa:** Mientras que la suma de 12 es intuitiva y académica, Box-Muller es más precisa en las "colas" de la distribución y consume 6 veces menos números aleatorios.

---

### 3. Método de Convolución
Consiste en obtener la variable como suma de otras variables aleatorias independientes.

*   **Distribución Erlang**: Suma de $k$ variables exponenciales:
    $$X = -\frac{1}{\lambda} \ln\left(\prod_{i=1}^{k} R_i\right)$$
*   **Distribución Binomial**: Suma de $n$ ensayos de Bernoulli:
    $$X = \sum_{i=1}^{n} I_i, \quad \text{donde } I_i = 1 \text{ si } R_i \leq p$$

---

### 4. Distribución de Poisson
Implementada mediante el procedimiento de multiplicación para variables discretas:

$$X = \min \left\{ k : \prod_{i=0}^{k} R_i < e^{-\lambda} \right\}$$

---

## 📊 Análisis de Eficiencia y Consumo

| Distribución | Método | Consumo de $R_i$ | Complejidad |
| :--- | :--- | :--- | :--- |
| **Uniforme** | Transformada Inversa | 1 por muestra | $O(n)$ |
| **Exponencial** | Transformada Inversa | 1 por muestra | $O(n)$ |
| **Normal (Coss Bu)** | Suma de 12 | **12 por muestra** | $O(n \cdot 12)$ |
| **Normal (BM)** | Box-Muller | **2 por cada 2** | $O(n)$ |
| **Poisson** | Multiplicación | Variable (Promedio $\lambda$) | $O(n \cdot \lambda)$ |
| **Erlang** | Convolución | $k$ por muestra | $O(n \cdot k)$ |
| **Binomial** | Convolución | $n$ por muestra | $O(n \cdot n)$ |

---

## 🛠️ Validación Académica
Para asegurar la fidelidad con el texto de Coss Bu:
1.  **Sustento en LaTeX**: Todas las ecuaciones en la interfaz coinciden con las del Capítulo 4.
2.  **Auditoría de Consumo**: La tabla de resultados muestra cuántos números uniformes se "gastaron" para producir la muestra final (especialmente crítico en la Normal).
3.  **Visualización**: El histograma permite verificar empíricamente que la suma de 12 realmente converge a la campana de Gauss.

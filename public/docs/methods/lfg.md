# Lagged Fibonacci Generator (LFG)

## 📋 Introducción
El Generador Fibonacci con Retraso (LFG) es una mejora sobre el generador de Fibonacci estándar, diseñado para producir secuencias de números pseudoaleatorios con periodos mucho más largos y mejores propiedades de uniformidad. Es muy común en aplicaciones de alto rendimiento y simulación científica.

## 🧬 Lógica del Algoritmo
La relación de recurrencia básica es:
$x_n = (x_{n-j} \diamond x_{n-k}) \mod m$

Donde:
- $0 < j < k$.
- $\diamond$ representa una operación binaria (generalmente suma $+$, resta $-$, multiplicación $*$ o XOR $\oplus$).
- $m$ es el módulo.

Nuestra implementación utiliza la **variante aditiva**:
$x_n = (x_{n-j} + x_{n-k}) \mod m$

### 📦 Inicialización del Buffer
A diferencia de los LCG que solo requieren una semilla $x_0$, el LFG requiere un "relleno" inicial de $k$ valores. Para asegurar la calidad desde el primer número, nuestro sistema utiliza un **Generador Lineal Congruencial Mixto** para poblar el buffer inicial basado en la semilla proporcionada por el usuario.

## 🛠️ Parámetros y Recomendaciones
- **Retrasos (j, k):** Se recomiendan pares de valores que correspondan a polinomios primitivos para maximizar el periodo. Ejemplos comunes: $(7, 10)$, $(24, 55)$, $(37, 100)$.
- **Módulo (m):** Típicamente una potencia de 2 ($2^{31}$ o $2^{32}$).
- **Periodo:** Si $m = 2^M$, el periodo puede llegar a $(2^k - 1) \cdot 2^{M-1}$.

## ✅ Ventajas
1. **Periodos Inmensos:** Supera con facilidad a los generadores lineales simples.
2. **Eficiencia:** Una vez inicializado, solo requiere una suma y una operación de módulo (o bitwise mask).
3. **Baja Correlación:** Los retrasos "rompen" la linealidad inmediata de la secuencia.

## ⚠️ Consideraciones de Implementación
Para un funcionamiento óptimo en JavaScript, utilizamos el operador residuo `%` y aseguramos que el buffer sea circular para minimizar el uso de memoria y maximizar la velocidad de acceso.

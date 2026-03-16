# Algoritmo: Método Lineal Congruencial (Mixto)

## 📖 Fundamentación Matemática
El método lineal congruencial mixto (LGC) genera una secuencia de números mediante una relación recursiva lineal. Es el núcleo de este simulador debido a su reproducibilidad y facilidad de análisis estadístico.

### Ecuación General
$$x_{n+1} = (a \cdot x_n + c) \mod m$$

Donde los parámetros definidos por el usuario son:
- **Semilla ($x_0$):** Punto de partida de la secuencia.
- **Multiplicador ($a$):** Constante que escala el valor anterior.
- **Incremento ($c$):** Constante aditiva que rompe la linealidad simple.
- **Módulo ($m$):** Define el espacio de estados y el periodo máximo posible.

---

## 🚀 Teorema de Hull-Dobell (Análisis de Periodo)
El simulador incorpora un motor de validación en tiempo real que aplica el Teorema de Hull-Dobell para predecir si la configuración del usuario alcanzará un **Periodo Completo** ($T=m$).

### Condiciones de Periodo Máximo:
1. **Primalidad Relativa:** $mCD(c, m) = 1$ (c y m no tienen divisores comunes).
2. **Factores Primos:** $(a - 1)$ debe ser divisible por cada factor primo de $m$.
3. **Regla del 4:** Si $m$ es múltiplo de 4, $(a - 1)$ debe ser múltiplo de 4.

---

## 🛠️ Implementación Determinista
A diferencia de los entornos de desarrollo estándar, esta implementación **excluye totalmente el uso de la función nativa `Math.random()`**. 

### Ventajas de la Implementación Manual:
- **Reproducibilidad:** Dados los mismos parámetros, la secuencia siempre será idéntica, permitiendo auditorías y verificación manual.
- **Transparencia:** Cada bit de "aleatoriedad" es producto de la aritmética modular, no de un algoritmo oculto en el motor de JavaScript.
- **Normalización:** El sistema transforma el entero $x_n$ al rango $[0, 1)$ mediante la operación $r_n = x_n / m$, permitiendo su uso en simulaciones de probabilidad.
## 🛠️ Implementación
El motor utiliza una clase TypeScript que encapsula el estado y garantiza la normalización del resultado mediante la división por el módulo $m$.

```typescript
next(): number {
  this.x = (this.a * this.x + this.c) % this.m;
  return this.x / this.m;
}
```

## 🔍 Detección de Ciclos
El simulador monitorea cada número generado. Si un valor vuelve a ser igual a la **Semilla**, el sistema marca visualmente el **Punto de Colisión**. Esto permite al analista observar físicamente el agotamiento del periodo y el inicio del determinismo cíclico.

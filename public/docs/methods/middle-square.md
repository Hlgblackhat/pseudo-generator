# Método de Cuadrados Medios (Middle Square)

## 📖 Historia y Concepto
Propuesto por **John von Neumann** en 1946 para el proyecto Manhattan. Es uno de los métodos más curiosos y visualmente simples de entender, basado en la extracción de los dígitos centrales del cuadrado de un número.

### Algoritmo Paso a Paso
1.  Tomar una semilla $x_0$ de $d$ dígitos.
2.  Calcular el cuadrado de la semilla ($x_0^2$).
3.  Si el cuadrado tiene menos de $2d$ dígitos, rellenar con ceros a la izquierda.
4.  Extraer los $d$ dígitos centrales. Este será el nuevo valor $x_1$.

## 🚀 Limitaciones Técnicas
A diferencia de los métodos congruenciales, Cuadrados Medios es extremadamente sensible a la semilla inicial:
- **Puntos Fijos:** Puede quedar atrapado en un bucle corto (ej: si los dígitos centrales son `0000`, todos los valores siguientes serán 0).
- **Convergencia:** Muchas semillas tienden a converger a cero o a bucles de periodo muy corto rápidamente.

## 🛠️ Implementación en el Laboratorio
El simulador normaliza el resultado dividiendo el número extraído por $10^d$, produciendo un valor entre $[0, 1)$.

```typescript
next(): number {
  let squareStr = (this.x * this.x).toString();
  // Padding y extracción de dígitos centrales
  // ...
  this.x = parseInt(middle);
  return this.x / Math.pow(10, this.d);
}
```

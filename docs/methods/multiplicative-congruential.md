# Método Congruencial Multiplicativo

## 📖 Descripción Matemática
El método congruencial multiplicativo es una variante simplificada del lineal congruencial donde el incremento $c$ es igual a cero. Se basa exclusivamente en el producto de la semilla por un multiplicador constante bajo una operación de módulo.

### Ecuación de Recurrencia
$$x_{n+1} = (a \cdot x_n) \mod m$$

Donde:
- $x_0$ es la **semilla** ($x_0 > 0$ y no debe ser múltiplo de $m$).
- $a$ es el **multiplicador**.
- $m$ es el **módulo**.

## 🚀 Propiedades y Periodo
A diferencia del método mixto, el método multiplicativo nunca puede alcanzar un periodo de longitud $m$. El periodo máximo depende de la elección de $a$ y $m$. Por ejemplo, si $m$ es una potencia de 2, el periodo máximo es $m/4$ (con $a \equiv 3 \text{ o } 5 \mod 8$).

### Ventajas:
- **Eficiencia:** Requiere una operación aritmética menos (la suma) por cada iteración.
- **Simplicidad:** Ideal para sistemas con recursos limitados donde la velocidad es crítica.

## 🛠️ Implementación en el Simulador
En este simulador, si seleccionas el método multiplicativo, el campo de incremento ($c$) se bloquea o inicializa automáticamente en 0 para mantener la pureza del algoritmo.

```typescript
next(): number {
  this.x = (this.a * this.x) % this.m;
  return this.x / this.m;
}
```

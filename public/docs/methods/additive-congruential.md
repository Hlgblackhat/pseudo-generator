# Método Congruencial Aditivo

## 📖 Descripción Matemática
El método congruencial aditivo genera números pseudoaleatorios utilizando la suma de dos términos anteriores de la misma secuencia, similar a la lógica utilizada en la serie de Fibonacci.

### Ecuación de Recurrencia
$$x_i = (x_{i-1} + x_{i-k}) \mod m$$

Donde:
- $k$ es el **retraso** o orden del generador (determina la distancia del segundo operando).
- $m$ es el **módulo**.
- La secuencia requiere una "memoria" o semilla extendida de al menos $k$ valores iniciales.

## 🚀 Consideraciones Técnicas
Para que este generador funcione correctamente, los primeros $k$ valores deben ser generados previamente por otro método (usualmente un LCG simple). Una vez inicializada la "ventana" de valores, el algoritmo procede de forma aditiva.

### Características:
- **Periodos Largos:** Puede alcanzar periodos mucho mayores que $m$ si se seleccionan adecuadamente los parámetros.
- **Eficiencia:** Solo requiere una suma y un módulo, lo que lo hace muy rápido en hardware.

## 🛠️ Implementación
El simulador gestiona automáticamente la inicialización de los primeros valores basándose en la semilla inicial para que el usuario solo tenga que preocuparse por el parámetro $k$ y el módulo.

```typescript
next(): number {
  const n = this.history.length;
  const newVal = (this.history[n - 1] + this.history[n - this.k]) % this.m;
  this.history.push(newVal);
  return newVal / this.m;
}
```

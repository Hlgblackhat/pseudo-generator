# LFSR (Linear Feedback Shift Register)

## 📖 Descripción Técnica
El Registro de Desplazamiento con Retroalimentación Lineal (LFSR) es un método que opera a nivel de bits. Es la base de muchos generadores de hardware debido a su implementación simple con registros de desplazamiento y puertas XOR.

### Funcionamiento
En cada paso:
1. Se extrae el bit de salida (usualmente el bit menos significativo).
2. Se realiza una operación XOR entre varios bits del registro (determinados por una "máscara de taps").
3. El resultado del XOR se reinyecta en el otro extremo del registro tras el desplazamiento.

## 🚀 Propiedades
- **Pseudoaleatoriedad de bits:** Aunque el valor numérico total puede parecer caótico, el método es excelente para generar secuencias de bits individuales con buenas propiedades estadísticas.
- **Periodo:** Un LFSR de $n$ bits puede tener un periodo máximo de $2^n - 1$ (si la máscara de taps corresponde a un polinomio primitivo).

## 🛠️ Implementación
Esta implementación utiliza un registro de 16 bits con una máscara estándar para maximizar la difusión de bits.

```typescript
next(): number {
  const bit = this.state & 1;
  this.state >>= 1;
  if (bit === 1) {
    this.state ^= this.mask; // Aplicación de la máscara (Taps)
  }
  return this.state / Math.pow(2, this.bitLength);
}
```

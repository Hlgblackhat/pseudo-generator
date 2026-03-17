# Blum Blum Shub (BBS)

## 📋 Introducción
El algoritmo Blum Blum Shub (BBS) es un generador de números pseudoaleatorios criptográficamente seguro (CSPRNG) propuesto en 1986. A diferencia de otros métodos como los congruenciales, su seguridad reside en la dificultad computacional de factorizar números enteros grandes, específicamente el problema de la factorización de un número de Blum.

## 🧬 Lógica del Algoritmo
La relación de recurrencia es:
$x_{n+1} = x_n^2 \mod M$

Donde:
- $M = p \cdot q$ es el producto de dos números primos grandes distintos.
- $p$ y $q$ deben ser ambos congruentes con $3 \pmod 4$ (Primos de Blum).
- La semilla $x_0$ debe ser coprima con $M$ (es decir, $\text{mCD}(x_0, M) = 1$).
- El resultado final suele ser el bit menos significativo o un conjunto de bits de $x_n$. En nuestra plataforma, normalizamos el valor resultante para visualización.

## 🛠️ Requisitos de Seguridad
Para que el generador sea considerado seguro:
1. **Primos p y q:** Deben ser lo suficientemente grandes para que la factorización de $M$ sea inviable.
2. **Semilla:** Debe ser un valor secreto y aleatorio.
3. **Propiedad Circular:** El periodo de la secuencia depende de $\lambda(\lambda(M))$, donde $\lambda$ es la función de Carmichael.

## ✅ Ventajas
1. **Seguridad Criptográfica:** Es impredecible incluso si se conocen valores anteriores, bajo el supuesto de que la factorización es difícil.
2. **Fundamentación Teórica:** Existe una prueba de reducción de seguridad hacia un problema matemático difícil.
3. **Calidad Estadística:** Supera rigurosamente las pruebas de uniformidad y aleatoriedad.

## ⚠️ Limitaciones en el Navegador
Debido a que BBS requiere operaciones con números potencialmente muy grandes, nuestra implementación utiliza `BigInt` de JavaScript para manejar la precisión necesaria y evitar desbordamientos, garantizando la integridad matemática del algoritmo incluso con módulos elevados.

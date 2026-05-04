# Nuestras Reglas del Juego (Cero Trampas)

## 🛡️ De dónde salen los números
Hicimos este proyecto con una regla de oro: **Prohibido usar las funciones de azar que ya vienen hechas**. La idea era demostrar que podíamos generar nuestras propias secuencias "aleatorias" usando pura matemática.

### 🚫 Cero `Math.random()`
Si revisan el código fuente (`src/`), se van a dar cuenta de que:
1. **No hay ni un solo `Math.random()`**.
2. **No instalamos librerías externas** para que hagan el trabajo sucio de generar los números.
3. **Todo es predecible:** Si le metes los mismos números de entrada (semilla, etc.), siempre te va a dar exactamente el mismo resultado.

### ✅ ¿Cómo lo hicimos entonces?
- **Los algoritmos:** Programamos 7 métodos a mano (`MixedCongruential`, `Multiplicative`, `Additive`, `MiddleSquare`, `LFSR`, `BBS`, `LFG`).
- **La semilla inicial:** Los valores que aparecen por defecto son fijos, para que el profesor pueda probar y le dé el mismo resultado que a nosotros.
- **Entropía (Opcional):** Le pusimos un "Desplazamiento Temporal" que usa la hora del sistema (`Date.now()`) solo para cambiar el punto de partida si quieres probar, pero no es un generador random escondido.

### 🔍 Pueden revisar el código
Para que vean que no hay trampa, toda la magia matemática está en la carpeta `src/engines/`. Ahí están los 7 generadores puritos, sin ayudas externas.

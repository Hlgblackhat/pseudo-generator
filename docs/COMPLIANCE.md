# Documento de Cumplimiento Académico

## 🛡️ Declaración de Integridad Algorítmica
Este proyecto ha sido desarrollado bajo la premisa de **Exclusión de Funciones Nativas de Azar**. El objetivo es demostrar la capacidad de generar secuencias pseudoaleatorias utilizando exclusivamente lógica aritmética y modular propia.

### 🚫 Prohibición de `Math.random()`
Se ha verificado que en todo el código fuente del proyecto (`src/`):
1. **NO existen llamadas a `Math.random()`**.
2. **NO se utilizan librerías de terceros** para la generación de los números centrales de la simulación.
3. **Determinismo:** El sistema es 100% predecible y reproducible. Un insumo constante producirá siempre un resultado constante.

### ✅ Origen de los Datos
- **Motores Core:** Se han implementado 7 algoritmos desde cero (`MixedCongruential`, `Multiplicative`, `Additive`, `MiddleSquare`, `LFSR`, `BBS`, `LFG`).
- **Semilla Inicial:** Los valores por defecto son estáticos para garantizar que el evaluador pueda replicar los resultados.
- **Entropía (Opcional):** El "Desplazamiento Temporal" utiliza únicamente el timestamp del sistema (`Date.now()`) para variar el punto de entrada, lo cual representa una variable externa física y no un algoritmo random oculto.

### 🔍 Auditoría de Código
Para validar este cumplimiento, el evaluador puede revisar la carpeta `src/engines/`, donde reside la lógica matemática pura de los 7 generadores, libre de dependencias de azar externas.

# Cómo pensamos el diseño de la app

## 🏗️ Estructura de la pantalla
Decidimos dividir la pantalla en tres partes para que sea súper fácil ver los datos y analizarlos al mismo tiempo, sin tener que hacer scroll como locos.

### 1. Los controles (Izquierda - 20%)
- **¿Para qué sirve?** Para meter los datos.
- **¿Qué tiene?** El selector del algoritmo y los campos para poner los números ($x_0, a, c, m, k, d$).
- **La magia:** La interfaz cambia sola dependiendo del algoritmo que elijas. Te esconde los campos que no necesitas y te muestra solo los útiles (ej: $k$ para aditivo, $d$ para cuadrados medios).
- **Cero trampas:** Quitamos los botones de inicialización automática para que uno tenga el control total de qué números está metiendo.

### 2. La tabla de números (Centro - 60%)
- **¿Para qué sirve?** Para ver todos los números que van saliendo en tiempo real.
- **Capacidad:** Aguanta generar miles de números sin que la página se cuelgue.
- **Colores:**
  - **Verde Esmeralda:** Es la Semilla, el primer número de todos.
  - **Rojo:** Te marca el punto exacto donde los números empezaron a repetirse (¡el ciclo!).
  - **Gris:** Todos los números normales de en medio.

### 3. Los resultados (Derecha - 20%)
- **¿Para qué sirve?** Para ver la matemática y las estadísticas detrás de la magia.
- **Matemática:** Te avisa si estás cumpliendo la regla de Hull-Dobell antes de que le des a generar.
- **Estadísticas:** Te muestra datos en tiempo real, como la media, para ver si los números sí parecen uniformes o no.

---

## 🎨 Los colores
Elegimos un **Tema Claro** con detalles bien oscuros porque:
- Se lee mucho mejor cuando hay números con 6 decimales.
- Le da un aire de "proyecto universitario serio" pero moderno.
- No cansa la vista si te quedas horas probando algoritmos.

## ⚡ Rendimiento
Nos aseguramos de que el código renderice los números por lotes, así puedes generar unos 20,000 números sin que el navegador se muera en el intento.

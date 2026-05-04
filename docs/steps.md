# Cómo armamos todo esto (Paso a paso)

## Paso 1: Configurando todo
- Empezamos usando Vite con React y TypeScript.
- Le metimos `tailwindcss` (v4) para los estilos, `framer-motion` para algunas animaciones y `lucide-react` para los íconos.

## Paso 2: La matemática detrás de todo
- Lo primero que hicimos fue programar el `MixedCongruential.ts` (Lineal Mixto).
- Le pusimos una alerta para que nos avise si cumple con la regla de **Hull-Dobell**.
- **Detectando ciclos:** Hicimos que el código se dé cuenta solito cuando los números empiezan a repetirse.

## Paso 3: Acomodando la pantalla
- Decidimos partir la pantalla en **3 columnas** para que se vea la configuración, los números y los resultados al mismo tiempo.
- Arreglamos el scroll de la tabla para que no se trabara al generar miles de números (¡aguanta más de 5000!).

## Paso 4: Nada de trampas
- **Chao `Math.random()`**: Borramos cualquier cosa que generara azar automático.
- Pusimos números fijos de inicio para que todo se pueda probar y comprobar.

## Paso 5: Metiendo más algoritmos
- Le agregamos el resto de los métodos: Multiplicativo, Aditivo, Cuadrados Medios y LFSR.
- Hicimos que la interfaz sea inteligente: si eliges un método, te esconde los campos que no necesitas.

## Paso 6: Poniéndolo bonito
- Nos pasamos de un tema oscuro/morado a uno más limpio (Light).
- Mejoramos el contraste para que los números con muchos decimales se lean bien sin quemar los ojos.

## Paso 7: Escribiendo los documentos
- Armamos este espacio en `docs/` para que quede claro cómo hicimos todo.
- Dejamos las reglas claras en `COMPLIANCE.md`.

## Paso 8: Mejorando el código
- Pusimos todos los textos de la página y los comentarios del código en español.
- Limpiamos algunas variables y organizamos las cosas para que el código no se vea hecho un desastre.

## Paso 9: Los últimos toques
- Le metimos el motor `Blum Blum Shub` usando `BigInt` para los números gigantes.
- También pusimos el método `Lagged Fibonacci`.
- Entró José Torres a ayudar con la documentación y a terminar de afinar detalles para que quedara listo.

## Paso 10: Pruebas Rápidas y links inteligentes
- Armamos 4 botones de "Pruebas Rápidas" directo en el panel del generador: Mixto, BBS, LFG y Cuadrados Medios. Con un clic se precargan todos los parámetros (incluyendo el $N$).
- Los ejemplos de la documentación ahora tienen un link directo al Laboratorio que ya trae todo configurado (usa query strings en la URL con `auto=1` para que incluso genere solo).
- Corregimos un bug donde el detector de ciclos daba falsos positivos en LFG/LFSR — esos generadores tienen un buffer de k valores como estado, no uno solo, así que un valor repetido no significa ciclo real.
- También arreglamos un bug donde editar un campo numérico y borrarlo mandaba el valor a `0` sin avisar.

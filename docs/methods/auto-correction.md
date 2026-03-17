# Sistema Inteligente de Auto-Corrección ("Sugerencia Lab")

El simulador implementa un sistema predictivo de parámetros conocido en la interfaz como **"Sugerencia Lab"**. La función principal de este sistema es actuar como un **asesor matemático**, previniendo que el usuario genere secuencias sub-óptimas cuando el algoritmo lo permite.

El botón de **AUTO-CORREGIR** no aparece para todos los algoritmos. Su comportamiento está estrictamente ligado a la existencia de **teoremas predictivos** sobre la longitud del periodo máximo del generador.

A continuación, se detalla para qué casos aplica y las razones matemáticas subyacentes.

---

## 🟢 Métodos Predecibles (Aplica Auto-Corrección)

Para estos métodos, el simulador puede realizar un test inicial sobre los parámetros enviados ($x_0, a, c, m$) y determinar de antemano (sin generar un solo número) si el periodo va a ser el máximo posible. 

Si los parámetros fallan el test matemático, la interfaz despliega la advertencia y habilita la auto-corrección.

### 1. Generador Lineal Congruencial (Mixto)
- **Base Matemática:** Teorema de Hull-Dobell.
- **Funcionamiento:** Evalúa que:
  1. $c$ y $m$ sean primos relativos $\text{mCD}(c,m) = 1$.
  2. $(a - 1)$ sea múltiplo de todos los factores primos de $m$.
  3. Si $m$ es múltiplo de 4, $(a - 1)$ también debe serlo.
- **Sugerencia Automática:** El motor busca y devuelve un par aleatorio de multiplicador ($a$) e incremento ($c$) que satisfagan las 3 condiciones exactas para el módulo ($m$) proporcionado por el usuario.

### 2. Generador Congruencial Multiplicativo
- **Base Matemática:** Teoría de Números Pura (Módulo-Potencia).
- **Funcionamiento:** Sabe matemáticamente que el periodo nunca será $m$. Sin embargo, si el usuario ingresa un $m$ que es potencia de $2$ ($m = 2^n$), el periodo máximo posible es $m/4$.
  Las reglas exigen que:
  1. La semilla sea impar.
  2. El multiplicador $a \equiv 3 \pmod 8$ o $a \equiv 5 \pmod 8$.
- **Sugerencia Automática:** El sistema corrige la semilla (haciéndola impar) y busca un multiplicador $a$ válido bajo el módulo 8 para asegurar el periodo $m/4$.

---

## 🔴 Métodos Empíricos o Caóticos (No Aplica Auto-Corrección)

Para el resto de los algoritmos, **no existe una fórmula predictiva absoluta y sencilla** que determine su periodo óptimo a partir de sus valores iniciales, o bien, los valores ingresados son por naturaleza caóticos o de validación directa (no requieren "sugerencia de optimización"). El simulador asume que el usuario desea experimentar con la inestabilidad de estos métodos.

### 1. Cuadrados Medios (Von Neumann)
- **Razón:** Es un algoritmo inherentemente inestable. No existe un "teorema de periodo máximo". Dependiendo de la semilla, la secuencia a menudo colapsa estadísticamente hacia un cero (ej: `0000`) o entra en bucles repetitivos cortos (ej: `8100 ➔ 6100...).
- **Comportamiento:** Como no hay "parámetros perfectos" determinables a priori, el sistema no bloquea ni saca advertencias matemáticas restrictivas. Te permite simular para observar empíricamente el colapso.

### 2. Congruencial Aditivo
- **Razón:** La longitud del periodo de este método depende de una secuencia semilla precomputada y la interacción polinómica de los retrasos ($k$). La regla estricta es simplemente que el retraso debe ser $k \ge 2$. Mientras esa condición física se cumpla, el generador funcionará.
- **Comportamiento:** No hay un estado "sub-óptimo" que prevenir aritméticamente desde el formulario ($k=7$ y $k=55$ son populares, pero no leyes universales a forzar).

### 3. Registro de Desplazamiento Lineal (LFSR)
- **Razón:** Este método no requiere "corrección de parámetros" porque la optimización para lograr el periodo completo ($2^n - 1$) se basa en **Polinomios Primitivos**. Nuestra implementación en código (`src/engines/lfsr.ts`) ya utiliza internamente un polinomio primitivo fuerte codificado de forma estática (ej: $x^{16} + x^{14} + x^{13} + x^{11} + 1$).
- **Comportamiento:** La única forma de que este generador falle es si el usuario ingresa una semilla igual a cero (`seed = 0`). Dado que eso destruye el generador, no es una "advertencia amarilla" sujeta a auto-corrección, sino un bloqueo de "error rojo" directo.

---

## 🔄 Flujo UI/UX del Botón

Cuando el botón se habilita y el usuario hace clic en él:
1. `App.tsx` dispara un Evento Personalizado (`applyAutoCorrect`).
2. El formulario (`GeneratorForm.tsx`) capta el evento y actualiza visualmente los `inputs`.
3. El sistema lanza automáticamente la regeneración de la secuencia (`startGeneration()`) con la data sana, haciendo desaparecer instantáneamente la ventana amarilla y restaurando el estatus a "Óptimo".

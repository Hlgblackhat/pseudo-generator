# Pruebas de Uniformidad y Aleatoriedad

Este documento registra las metodologías de prueba aplicadas para validar los números generados por los diferentes algoritmos.

## 1. Prueba de Promedios (Media)
Se calcula la media aritmética de la muestra de números pseudoaleatorios $r_i$ en el rango $[0, 1)$.
- **Hipótesis:** La media debe aproximarse a $0.5$ para una distribución uniforme.
- **Implementación:** El simulador realiza este cálculo en tiempo real en el panel de **Lab Analytics**.

## 2. Detección de Ciclos (Prueba de Periodo)
Se monitorea la secuencia hasta encontrar el primer valor repetido.
- **Importancia:** Un periodo largo es esencial para evitar patrones predecibles.
- **Visualización:** El sistema resalta el inicio del bucle en rojo neón.

## 3. Próximas Implementaciones
- **Prueba de Frecuencia (Chi-Cuadrado):** Para comparar la distribución observada con la esperada.
- **Prueba de Poker:** Para analizar la independencia de los dígitos.
- **Diagramas de Dispersión:** Visualización 2D para detectar agrupamientos o patrones lineales.

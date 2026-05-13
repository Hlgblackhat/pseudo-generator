# Segundo Parcial - Simulación Digital.

Trabajas en un parque de diversiones y tienes que gestionar la atraccion denominada el "Cohete Espacial". Debes decidir si los visitantes forman una gran serpiente o multiples filas más cortas frente a las 4 plataformas identicas de embarque y si se debería pensar en comprar otra atración identica. La atracción no inicia su funcionamiento hasta que no se suban las 4 personas. Simula el proceso de embarque durante 2 horas para maximizar la cantidad de personas que logran subir al cohete teniendo en cuenta las siguientres condiciones:

**a. Llegada de visitantes (Poisson):** La atracción recibe 120 visitantes cada 40 minutos.

**b. Un cajero para la compra de boletas a 2 dolares (Uniforme)** cuyo tiempo de servicio está uniformemente distribuido entre 1 y 2 minutos.

**c. Tiempo de embarque/desembarque y en la atracción (Exponencial):** subir y bajar a un grupo en las plataformas toma 4 minutos en promedio.

**d. Paciencia en fila (Normal):** Un visitante está dispuesto a hacer fila por 20 minutos en promedio (desviación estándar de 4 minutos). si la espera es mayor, un 70% de ellos abandonan la fila (Binomial). Sin importar si ya compró la boleta, en tal caso se devuelven 3 dolares.

Entregue un Archivo en excel donde se muestre:


* Los numeros aleatorios y las variables aleatorias a utilizar en la simulación.

* Para cada configuracion: tiempo promedio de fila, porcentaje de visitantes que abandonan, numero total de visitantes atendidos y perdidas o ganancias. (2x30%)

* ¿Que recomendarías al parque? ¿Una cola o multiples colas?¿Invertir en otro cohete espacial? Argumenta con tus datos. **NO se aceptan respuestas a esta pregunta sin resolver COMPLETAMENTE la anterior** (30%)
# 🏨 Backlog Final Consolidado: Travel Hotel

### HU0: Gestión confiable de las reservas
**Story Point**: 5

**Como** administrador del sistema de reservas
**Quiero** que el sistema gestione la información de habitaciones y reservas de forma consistente
**Para** evitar que se produzcan conflictos cuando varios usuarios intentan reservar al mismo tiempo.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
      Scenario: Una habitación no puede ser reservada simultáneamente por dos usuarios
        Given existe una habitación "#203" disponible para las fechas "2026-05-10" al "2026-05-11"
        When el usuario "Carlos" inicia el proceso de reserva de la habitación "#203"
        And otro usuario "Laura" intenta reservar la misma habitación en las mismas fechas
        Then el sistema debe impedir la segunda reserva
        And mostrar que la habitación ya no está disponible
    ```

### HU1: Seeder de Inventario Inicial
**Story Point**: 2

**Como** equipo de desarrollo, **quiero** contar con una carga automática de hoteles y habitaciones, **para** realizar pruebas funcionales sin depender de ingresos manuales.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Carga exitosa de datos maestros
      Given el entorno de base de datos está vacío
      When se ejecuta el script de seeder
      Then las tablas de Hoteles y Habitaciones deben contener registros válidos para pruebas
    ```

---

### HU2: Consulta de Disponibilidad Consistente
**Story Point**: 3

**Como** viajero, **quiero** ver solo las habitaciones que no tienen reservas ni bloqueos activos, **para** tomar una decisión basada en la disponibilidad real del hotel.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Exclusión de habitaciones con bloqueo temporal (Hold)
      Given que la habitación "101" tiene un bloqueo activo (Hold)
      When el viajero busca disponibilidad para las mismas fechas
      Then el sistema no debe mostrar la habitación "101" en los resultados
    ```

---

### HU3: Bloqueo Atómico de Checkout (Hold)
**Story Point**: 8

**Como** viajero, **quiero** que la habitación se aparte exclusivamente para mí por 10 minutos al seleccionarla, **para** completar mis datos de pago sin riesgo de que alguien más la reserve.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Prevención de colisión de reserva (Race Condition)
      Given que la habitación "202" está disponible
      When dos usuarios intentan bloquear la habitación "202" simultáneamente
      Then el sistema confirma el bloqueo al primer usuario
      And rechaza la solicitud del segundo usuario con un mensaje de "Habitación no disponible"
    ```

### HU4: Persistencia del Timer de Reserva
**Story Point**: 3

**Como** viajero, **quiero** que el tiempo restante de mi bloqueo se mantenga si refresco la página, **para** no perder mi turno por un error del navegador.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Recuperación de estado de bloqueo
      Given que el viajero tiene un bloqueo activo con 5 minutos restantes
      When el viajero refresca la página de checkout
      Then el contador visual debe reanudarse mostrando los 5 minutos restantes del servidor
    ```

---

### HU5: Procesamiento de Pago Idempotente
**Story Point**: 5

**Como** viajero, **quiero** que mi pago se procese una sola vez ante reintentos de red, **para** evitar cargos duplicados en mi cuenta.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Reintento de pago con misma clave de transacción
      Given que un pago ya fue procesado con éxito para el Hold "ID-99"
      When el sistema recibe una solicitud idéntica con la misma clave de idempotencia
      Then el sistema debe retornar el éxito de la transacción anterior sin realizar un nuevo cobro
    ```

### HU6: Confirmación Definitiva de Reserva
**Story Point**: 3

**Como** viajero, **quiero** que mi reserva pase de "Bloqueada" a "Confirmada" tras el pago, **para** recibir mi garantía de estancia.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Transición de estado tras pago exitoso
      Given que existe un bloqueo (Hold) en estado "PENDING"
      When el procesador de pagos confirma la transacción como "SUCCESS"
      Then el sistema debe cambiar el estado de la reserva a "CONFIRMED"
      And el inventario debe quedar descontado permanentemente
    ```

---

### HU7: Liberación Proactiva por Fallo de Pago
**Story Point**: 2

**Como** sistema, **quiero** liberar la habitación de inmediato si el pago es rechazado, **para** que el hotel no pierda oportunidades de venta con otros clientes.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Pago declinado por el banco
      Given un bloqueo activo para la habitación "305"
      When el usuario intenta pagar y la pasarela retorna "DECLINED"
      Then el sistema debe marcar el bloqueo como "RELEASED" inmediatamente
      And la habitación "305" debe volver a estar disponible en el buscador
    ```

### HU8: Expiración Automática de Bloqueos (Worker)
**Story Point**: 3

**Como** administrador, **quiero** que el sistema libere automáticamente los bloqueos que superen los 10 minutos, **para** evitar que el inventario quede retenido por carritos abandonados.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Timeout de reserva alcanzado
      Given que un bloqueo (Hold) ha superado los 10 minutos de antigüedad sin pago
      When el proceso de limpieza (Worker) se ejecuta
      Then el estado del bloqueo debe cambiar a "EXPIRED"
      And la habitación asociada debe quedar libre para nuevas búsquedas
    ```

### HU9: Resolución de Carrera Pago-Expiración
**Story Point**: 5

**Como** sistema, **quiero** priorizar un pago exitoso que llega en el último segundo frente a la limpieza del worker, **para** no cancelar una venta legítima por milisegundos de desfase.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Pago confirmado en el segundo límite
      Given un bloqueo que expira en el tiempo T
      When un pago exitoso llega en el tiempo T + 100ms
      And el worker de limpieza aún no ha procesado ese registro
      Then el sistema debe permitir la confirmación de la reserva y anular la expiración
    ```

---

### HU10: Protección contra Bloqueos Masivos (Rate Limiting)
**Story Point**: 5 

**Como** sistema, **quiero** limitar el número de bloqueos por dirección IP, **para** prevenir ataques de bots que intenten dejar al hotel sin disponibilidad.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Límite de bloqueos excedido
      Given que un usuario ya tiene 3 bloqueos activos desde la misma IP
      When intenta realizar un cuarto bloqueo de habitación
      Then el sistema debe rechazar la solicitud con un error de "Límite excedido"
    ```

### HU11: Validación de Integridad de Fechas
**Story Point**: 3

**Como** sistema, **quiero** validar que las fechas de reserva sean coherentes, **para** evitar errores lógicos en el inventario.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Reserva con fecha de salida anterior a la entrada
      When el usuario intenta reservar con Check-in "2026-10-20" y Check-out "2026-10-18"
      Then el sistema debe rechazar la operación con un error de "Fechas inválidas"
    ```

---

### HU12: Acceso Seguro al Panel Administrativo
**Story Point**: 5

**Como** administrador del hotel,
**quiero** acceder al panel con mis credenciales,
**para** gestionar la operación del hotel de forma segura y exclusiva.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Ingreso exitoso al panel administrativo
      Given existe un administrador con credenciales vigentes
      When ingresa sus credenciales en el acceso al panel
      Then el sistema le permite entrar al panel administrativo
      And puede acceder a las funcionalidades propias de su rol

    Scenario: Bloqueo de acceso sin sesión válida
      Given un usuario no tiene una sesión administrativa válida
      When intenta acceder a una funcionalidad del panel
      Then el sistema rechaza el acceso

    Scenario: Continuidad de la sesión operativa
      Given un administrador inició sesión correctamente
      When utiliza el panel durante su jornada operativa
      Then el sistema mantiene disponible su acceso según la política definida por el negocio
    ```

* **Reglas de Negocio:**
    - Solo usuarios con rol administrador pueden acceder al panel.
    - La creación de administradores no está disponible para usuarios públicos.
    - El acceso administrativo debe contar con controles para limitar intentos fallidos repetitivos.

---

### HU13: Visibilidad Operativa del Negocio
**Story Point**: 3

**Como** administrador,
**quiero** ver un resumen claro del desempeño del hotel al ingresar al panel,
**para** tomar decisiones rápidas con base en la demanda, los ingresos y la recurrencia de clientes.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Consulta de métricas clave al ingresar al panel
      Given existen datos operativos en el sistema
      When el administrador ingresa al dashboard
      Then visualiza las 5 habitaciones con mayor cantidad de reservas confirmadas
      And visualiza el total de ventas confirmadas
      And visualiza los 5 clientes con mayor frecuencia de reserva

    Scenario: Presentación clara de la información operativa
      Given el administrador accede al dashboard
      When se cargan las métricas del negocio
      Then la información se presenta de forma clara y comprensible para la toma de decisiones
    ```

* **Reglas de Negocio:**
    - Las métricas se calculan únicamente con datos reales de la operación.
    - El desfase permitido de la información es de máximo 1 minuto en el MVP.
    - Las reservas contabilizadas para rankings e indicadores deben estar confirmadas.

---

### HU14: Gestión de Clientes
**Story Point**: 5

**Como** administrador,
**quiero** administrar el registro de clientes,
**para** mantener una base confiable de huéspedes y facilitar la gestión de reservas.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Registro de un nuevo cliente
      Given el administrador necesita crear un cliente
      When registra su información básica de contacto e identificación
      Then el sistema guarda el cliente en el registro centralizado

    Scenario: Consulta del listado de clientes
      Given existen clientes registrados
      When el administrador consulta el listado y aplica una búsqueda por nombre o email
      Then el sistema muestra resultados paginados acordes con la búsqueda

    Scenario: Actualización de información de cliente
      Given existe un cliente registrado
      When el administrador modifica sus datos
      Then el sistema actualiza la información del cliente

    Scenario: Solicitud de eliminación de cliente
      Given existe un cliente registrado
      When el administrador solicita eliminarlo
      Then el sistema procesa la solicitud según las restricciones del negocio
    ```

* **Reglas de Negocio:**
    - El email del cliente debe ser único en el sistema.
    - Si un cliente tiene reservas activas, el sistema debe advertir el impacto y exigir confirmación explícita antes de eliminarlo.
    - La información del cliente debe mantenerse centralizada y consistente para soportar la operación de reservas.

---

### HU15: Gestión de Habitaciones
**Story Point**: 5

**Como** administrador,
**quiero** administrar el catálogo de habitaciones,
**para** mantener actualizado el inventario comercial que se ofrece a los viajeros.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Registro de una nueva habitación
      Given el administrador necesita publicar una nueva habitación
      When registra la información comercial y operativa requerida
      Then el sistema incorpora la habitación al catálogo

    Scenario: Actualización de una habitación existente
      Given existe una habitación registrada
      When el administrador modifica sus datos
      Then el sistema actualiza la información de la habitación

    Scenario: Visualización de ubicación e imagen en la oferta
      Given existen habitaciones publicadas
      When un usuario consulta el listado administrativo o público
      Then el sistema muestra la ubicación de cada habitación
      And muestra la imagen asociada para apoyar la decisión de compra
    ```

* **Reglas de Negocio:**
    - Una habitación no puede eliminarse si tiene bloqueos vigentes o reservas confirmadas que dependan de ella.
    - La habitación debe contar con información suficiente para su publicación comercial, incluyendo ubicación y elementos visuales.
    - La oferta pública debe reflejar el inventario vigente administrado desde el panel.

---

### HU16: Cierre Manual de Reservas
**Story Point**: 3

**Como** administrador,
**quiero** consultar las reservas y marcar manualmente una estadía como terminada,
**para** reflejar el check-out real del huésped y liberar la habitación para nuevas ventas.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Consulta de reservas con filtros
      Given existen reservas registradas
      When el administrador consulta el módulo de reservas usando filtros por estado, rango de fechas o cliente
      Then el sistema muestra las reservas que coinciden con los criterios aplicados

    Scenario: Finalización manual de una reserva elegible
      Given existe una reserva elegible para finalizar
      When el administrador ejecuta la acción de cierre manual
      Then el sistema marca la estadía como terminada
      And la habitación vuelve a quedar disponible para nuevas ventas

    Scenario: Visualización de detalle suficiente para gestión
      Given el administrador consulta una reserva
      When el sistema muestra su información
      Then el detalle es suficiente para identificarla y gestionarla correctamente
    ```

* **Reglas de Negocio:**
    - Solo las reservas confirmadas pueden marcarse como terminadas.
    - Antes de finalizar una reserva, el sistema debe solicitar confirmación explícita.
    - La finalización manual es irreversible.
    - Debe registrarse quién realizó la acción y cuándo ocurrió.

---

### HU17: Verificación de Reservas en Recepción
**Story Point**: 3

**Como** administrador,
**quiero** verificar una reserva por código o mediante su QR,
**para** validar de forma rápida la reserva del huésped durante el check-in presencial.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Verificación por código manual
      Given el administrador está en la sección de verificación
      When ingresa un código de reserva válido
      Then el sistema muestra el detalle necesario para validar la reserva

    Scenario: Verificación mediante QR
      Given el administrador dispone del QR de una reserva
      When realiza la lectura del QR
      Then el sistema muestra el detalle necesario para validar la reserva

    Scenario: Disponibilidad de la sección de verificación
      Given el administrador accede al panel
      When navega a la opción de verificación de reservas
      Then encuentra una sección específica para realizar esta operación
    ```

* **Reglas de Negocio:**
    - La verificación debe permitir tanto ingreso manual como lectura mediante QR.
    - Si la reserva no existe, el sistema debe informar el error de forma clara.
    - La información mostrada debe ser suficiente para validar identidad y estado de la reserva en recepción.

---

### HU18: Búsqueda Relevante para el Viajero
**Story Point**: 3

**Como** viajero,
**quiero** filtrar las habitaciones disponibles por ubicación y presupuesto,
**para** encontrar más rápido opciones que sí se ajusten a mi viaje.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Filtrado por ubicación y presupuesto
      Given existen habitaciones disponibles para una búsqueda
      When el viajero aplica filtros por ciudad, país y precio máximo por noche
      Then el sistema muestra únicamente las opciones que cumplen la búsqueda aplicada

    Scenario: Combinación de filtros
      Given el viajero quiere refinar su búsqueda
      When combina varios filtros disponibles
      Then el sistema actualiza el listado con base en todos los filtros seleccionados

    Scenario: Búsqueda sin resultados
      Given no existen habitaciones que cumplan los filtros aplicados
      When el viajero consulta el listado
      Then el sistema informa claramente que no hay coincidencias
      And permite limpiar los filtros
    ```

* **Reglas de Negocio:**
    - Los filtros funcionan con lógica acumulativa.
    - Solo deben mostrarse habitaciones disponibles para el rango de fechas solicitado.
    - Nunca deben mostrarse habitaciones afectadas por bloqueos activos o reservas confirmadas en ese rango.

---

### HU19: Comprobante Digital de Reserva
**Story Point**: 2

**Como** viajero,
**quiero** recibir un comprobante visual con código y QR al finalizar mi compra,
**para** presentar mi reserva fácilmente al momento del check-in.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Visualización del comprobante al confirmar la reserva
      Given el viajero completó exitosamente su reserva
      When accede a la pantalla de confirmación
      Then el sistema muestra el código alfanumérico de la reserva
      And muestra un QR asociado a esa reserva

    Scenario: Descarga o impresión del comprobante
      Given el viajero está en la pantalla de confirmación
      When decide conservar su comprobante
      Then puede descargarlo o imprimirlo desde esa pantalla

    Scenario: Uso del QR en validación presencial
      Given el viajero presenta su comprobante en recepción
      When el personal verifica el QR
      Then el código puede utilizarse para validar la reserva
    ```

* **Reglas de Negocio:**
    - El QR debe corresponder al mismo código de reserva visible para el viajero.
    - El QR no debe incluir datos sensibles adicionales.
    - El comprobante debe ser legible por lectores estándar.

---

### HU20: Confirmación de Reserva por Correo
**Story Point**: 3

**Como** viajero,
**quiero** recibir un correo con el detalle de mi reserva,
**para** conservar un comprobante aunque ya no tenga abierta la aplicación o el navegador.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Envío de correo al confirmar la reserva
      Given una reserva quedó confirmada
      When finaliza el proceso de checkout
      Then el viajero recibe un correo en la dirección informada
      And el correo contiene el resumen principal de la reserva y su comprobante asociado

    Scenario: Confirmación sin retraso por envío de correo
      Given la reserva fue confirmada
      When el sistema inicia el proceso de notificación por correo
      Then la confirmación visible para el usuario no se retrasa
    ```

* **Reglas de Negocio:**
    - El correo debe incluir código de reserva, QR, habitación, fechas y monto total.
    - Si el envío falla, el sistema debe reintentar hasta 3 veces sin afectar la reserva.
    - El envío de confirmación debe ejecutarse una sola vez por reserva confirmada.
    - En el MVP se admite un proveedor de correo de desarrollo o pruebas.

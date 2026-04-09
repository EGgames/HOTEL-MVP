# 🏨 Backlog Final Consolidado: Travel Hotel

### HU0: Configuración del Ecosistema de Datos
**Story Point**: 5

**Como** equipo de ingeniería, **quiero** configurar un entorno de persistencia con transacciones ACID y CI/CD, **para** garantizar que el motor de reservas opere con consistencia y seguridad.

* **Criterios de Aceptación (Gherkin):**
    ```gherkin
    Scenario: Soporte de transacciones y bloqueos
      Given una base de datos PostgreSQL inicializada
      When el sistema ejecuta una consulta con bloqueo de fila (SELECT FOR UPDATE)
      Then la base de datos debe impedir que otra transacción modifique la misma fila hasta que la primera finalice
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

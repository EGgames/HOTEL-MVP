---
id: SPEC-002
status: IN_PROGRESS
feature: hotel-booking-mvp-holds-payments
created: 2026-03-26
updated: 2026-03-26
author: spec-generator
version: "2.0"
related-specs: []
---

# Spec: MVP Motor de Reservas de Hotel (Búsqueda, Hold de 10min, Pago Idempotente, Confirmación)

> **Estado:** `IN_PROGRESS`.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED
> **Alcance:** HU0, HU1, HU2, HU3, HU5, HU6, HU7, HU8, HU11 | Excluidas: HU4, HU9, HU10 | QA: sin alcance en esta ejecución
> **Stack Real (v2):** NestJS + PostgreSQL + TypeORM + class-validator + React 19 + Vite + CSS Modules

---

## 1. REQUERIMIENTOS

### Descripción

Este MVP implementa un motor de reservas de hotel centrado en la lógica crítica: consultar disponibilidad en tiempo real, bloquear una habitación específica por 10 minutos (hold), procesamiento de pago idempotente, confirmación de reserva con código único, liberación automática de bloqueos expirados, y liberación inmediata ante fallo de pago.

El sistema prioriza **consistencia de inventario** mediante bloqueo pesimista (SELECT ... FOR UPDATE equivalente en MongoDB con transacciones), expiración automática via worker background, e idempotencia en pagos para evitar duplicados. El frontend (React 19) expone un flujo lineal: búsqueda → selección → hold → check-out con contador regresivo → pago simulado → confirmación.

**Stack Real:** FastAPI + MongoDB + Motor async + Pydantic v2 + React 19 + Vite + CSS Modules + Firebase

### Requerimiento de Negocio

Fuente principal: `PRD.md`, `SUBTASKS.md`, `USER_STORIES.md`.

**Objetivos:**
- Reducir riesgo de sobreventa (double booking) a ~0 en flujo MVP mediante bloqueo pesimista.
- Proteger inventario durante pago (hold de 10 minutos) → incrementar conversión.
- Liberar automáticamente inventario bloqueado → evitar pérdida de ventas por carritos abandonados.
- Soportar reintentos de pago sin duplicar cobros (idempotencia).

**Usuarios:**
- **Viajero**: busca, selecciona habitación, bloquea por 10 min, paga y confirma reserva.
- **Administrador del hotel**: necesita liberación automática de holds abandonados (via worker).

**Fuera de alcance MVP:**
- Cancelaciones, cambios de fecha, reembolsos, policies de penalidad.
- Registro/login de usuarios (sin autenticación en MVP).
- Multidivisa, integración con pasarelas reales (solo simulador mock).
- Panel administrativo, reportes históricos, distribución por tipo de habitación.
- Rate limiting (HU10) y resolución de carrera pago-expiración (HU9).

---

### Historias de Usuario

#### HU0: Configuración del Ecosistema de Datos y Base de Datos
**Story Point:** 5

```
Como:        equipo de ingeniería
Quiero:      configurar un entorno persisten con transacciones atomicity y CI/CD
Para:        garantizar que el motor de reservas opera con consistencia y seguridad

Prioridad:   Crítica (P0)
Estimación:  5 SP
Dependencias: ninguna
Capa:        Backend / Infraestructura
```

#### Criterios de Aceptación — HU0

**Happy Path**
```gherkin
CRITERIO-0.1: Soporte de transacciones ACID en MongoDB
  Dado que:  la base de datos MongoDB está inicializada con session support
  Cuando:    el backend ejecuta una transacción multi-documento
  Entonces:  todos los cambios se confirman o revierten atómicamente (ACID)
  Y:         la base de datos impide sobrescrituras simultáneas mediante bloqueos optimistas/pessimistas
```

**Error Path**
```gherkin
CRITERIO-0.2: Detección de conflicto de transacción
  Dado que:  dos operaciones intentan actualizar el mismo documento simultáneamente
  Cuando:    la segunda transacción intenta confirmar
  Entonces:  MongoDB lanza `TransactionCommitFailed` o similar
  Y:         la aplicación maneja el error y reintenta o retorna 409 Conflict al cliente
```

---

#### HU1: Seeder de Inventario Inicial
**Story Point:** 2

```
Como:        equipo de desarrollo
Quiero:      contar con una carga automática de hoteles y habitaciones
Para:        realizar pruebas funcionales sin depender de ingresos manuales

Prioridad:   Alta (P1)
Estimación:  2 SP
Dependencias: HU0
Capa:        Backend / Scripts
```

#### Criterios de Aceptación — HU1

**Happy Path**
```gherkin
CRITERIO-1.1: Carga exitosa de datos maestros
  Dado que:  el entorno de base de datos está vacío
  Cuando:    se ejecuta el script de seeder (ej. `make seed`)
  Entonces:  la colección `hotels` contiene al menos 1 hotel con campos: name, city, country
  Y:         la colección `rooms` contiene al menos 10 habitaciones con: room_number, type, price_per_night, hotel_id
  Y:         todos los room_ids referencian hotel_ids existentes (integridad referencial)
```

**Error Path**
```gherkin
CRITERIO-1.2: Manejo de seeder duplicado
  Dado que:  el seeder ya fue ejecutado una vez
  Cuando:    se ejecuta el seeder nuevamente sin limpiar la BD
  Entonces:  el sistema idempotente reconoce duplicados por unique constraint (room_number + hotel_id)
  Y:         no inserta registros duplicados (o actualiza sin fallar)
```

---

#### HU2: Consulta de Disponibilidad Consistente
**Story Point:** 3

```
Como:        viajero
Quiero:      ver solo las habitaciones que no tienen reservas ni bloqueos activos
Para:        tomar una decisión basada en disponibilidad real del hotel

Prioridad:   Alta (P0)
Estimación:  3 SP
Dependencias: HU0, HU1
Capa:        Ambas (Backend API + Frontend UI)
```

#### Criterios de Aceptación — HU2

**Happy Path**
```gherkin
CRITERIO-2.1: Listar disponibilidad sin holds/reservas activas
  Dado que:  la habitación "101" NO tiene ningún documento en `holds` o `reservations` para 2026-04-01 a 2026-04-03
  Cuando:    el viajero realiza una búsqueda GET /api/v1/rooms/available?checkin=2026-04-01&checkout=2026-04-03
  Entonces:  la respuesta HTTP 200 incluye la habitación "101" con precio, tipo y disponibilidad=true
  Y:         el timestamp de respuesta es ISO 8601 UTC
```

**Error Path**
```gherkin
CRITERIO-2.2: Excluir habitaciones con hold activo
  Dado que:  la habitación "202" tiene un hold activo con expires_at > NOW() para el mismo rango
  Cuando:    el viajero busca disponibilidad para esas fechas
  Entonces:  la habitación "202" NO aparece en los resultados
  Y:         si el usuario intenta acceder directamente, retorna 409 Conflict o 410 Gone
```

**Edge Case**
```gherkin
CRITERIO-2.3: Solapamiento de fechas correctamente detectado
  Dado que:  existe una reserva confirmada 2026-04-02 a 2026-04-04
  Cuando:    el usuario busca 2026-03-31 a 2026-04-02
  Entonces:  la habitación se excluye (el rango de búsqueda se solapa con la reserva)
  Y:         búsqueda 2026-04-04 a 2026-04-06 SÍ incluye la habitación (check-out es justo la fecha de inicio de ocupación anterior)
```

---

#### HU3: Bloqueo Atómico de Checkout (Hold 10 minutos)
**Story Point:** 8

```
Como:        viajero
Quiero:      que la habitación se aparte exclusivamente para mí por 10 minutos al seleccionarla
Para:        completar mis datos de pago sin riesgo de que alguien más la reserve

Prioridad:   Crítica (P0)
Estimación:  8 SP
Dependencias: HU0, HU1, HU2
Capa:        Ambas
```

#### Criterios de Aceptación — HU3

**Happy Path**
```gherkin
CRITERIO-3.1: Creación exitosa de hold atómico
  Dado que:  la habitación "303" está disponible (sin holds ni reservas en range 2026-04-10 a 2026-04-12)
  Cuando:    el viajero realiza POST /api/v1/rooms/303/hold con { checkin: "2026-04-10", checkout: "2026-04-12" }
  Entonces:  HTTP 201 retorna { hold_id: "<uuid>", room_id: "303", status: "PENDING", expires_at: "<NOW + 10min ISO>", created_at: "<ISO>" }
  Y:         el documento en `holds` colección contiene: room_id, checkin, checkout, status, expires_at, created_at, updated_at
  Y:         el hold es visible inmediatamente en búsquedas posteriores (la anterior HU2 la excluye)
```

**Error Path**
```gherkin
CRITERIO-3.2: Prevención de colisión (Race Condition)
  Dado que:  dos usuarios simultáneamente intentan bloquear la misma habitación "404" para el mismo rango
  Cuando:    ambas solicitudes llegan al backend en < 100ms
  Entonces:  el backend confirma el hold al primer usuario con HTTP 201
  Y:         el segundo usuario recibe HTTP 409 Conflict con { detail: "Habitación no disponible (otro usuario la acaba de bloquear)" }
  Y:         MongoDB garantiza que solo UN hold PENDING existe para ese (room_id, checkin, checkout, expires_at) en ese tiempo
```

**Edge Case**
```gherkin
CRITERIO-3.3: Hold expira exactamente a los 10 minutos
  Dado que:  se creó un hold a las 14:00 UTC
  Cuando:    se consulta a las 14:10:00 UTC
  Entonces:  el hold aún es válido (status: PENDING, no marcado EXPIRED)
  Cuando:    se consulta a las 14:10:01 UTC
  Entonces:  el hold puede ser marcado EXPIRED por el worker o por validación en pago
```

---

#### HU5: Procesamiento de Pago Idempotente
**Story Point:** 5

```
Como:        viajero
Quiero:      que mi pago se procese una sola vez ante reintentos de red
Para:        evitar cargos duplicados en mi cuenta

Prioridad:   Alta (P0)
Estimación:  5 SP
Dependencias: HU0, HU3
Capa:        Backend
```

#### Criterios de Aceptación — HU5

**Happy Path**
```gherkin
CRITERIO-5.1: Pago único con clave de idempotencia
  Dado que:  existe un hold "h-123" sin pago previo
  Cuando:    el cliente envía POST /api/v1/payments con { hold_id: "h-123", idempotency_key: "key-uuid-001", amount: 150.00 }
  Entonces:  HTTP 200 retorna { payment_id: "<uuid>", status: "SUCCESS", amount: 150.00, created_at: "<ISO>" }
  Y:         se crea un documento en `payments` colección con status: "SUCCESS"
  Y:         el hold transiciona a status: "CONFIRMED"
```

**Error Path - Reintento exitoso**
```gherkin
CRITERIO-5.2: Reintento inmediato retorna respuesta en caché
  Dado que:  el pago anterior fue procesado exitosamente con idempotency_key: "key-uuid-001"
  Cuando:    el cliente reenvía la misma solicitud de pago con idempotency_key: "key-uuid-001"
  Entonces:  HTTP 200 retorna la respuesta anterior (sin ejecutar lógica de pago nuevamente)
  Y:         no se crea un segundo documento en `payments`
  Y:         el campo `idempotency_key` tiene un unique constraint en la colección `payments`
```

**Error Path - Pago declinado**
```gherkin
CRITERIO-5.3: Simulador retorna DECLINED
  Dado que:  el simulador de pago está configurado para retornar DECLINED
  Cuando:    el cliente envía POST /api/v1/payments con hold_id válido
  Entonces:  HTTP 402 Payment Required retorna { status: "DECLINED", detail: "Pago rechazado por el banco" }
  Y:         el `payments` documento se crea con status: "DECLINED"
  Y:         el hold transiciona a status: "RELEASED" (liberado)
  Y:         la habitación vuelve a estar disponible inmediatamente
```

---

#### HU6: Confirmación Definitiva de Reserva
**Story Point:** 3

```
Como:        viajero
Quiero:      que mi reserva pase de "Bloqueada" a "Confirmada" tras el pago
Para:        recibir mi garantía de estancia

Prioridad:   Alta (P0)
Estimación:  3 SP
Dependencias: HU0, HU3, HU5
Capa:        Backend
```

#### Criterios de Aceptación — HU6

**Happy Path**
```gherkin
CRITERIO-6.1: Transición de estado tras pago exitoso
  Dado que:  existe un hold "h-456" en status PENDING
  Cuando:    el pago procesa exitosamente (status: SUCCESS)
  Entonces:  el sistema crea un documento en colección `reservations` con:
    - reservation_code: "<8-char alphanumeric unique>"
    - room_id, checkin, checkout
    - status: "CONFIRMED"
    - payment_id, hold_id (referencias)
    - created_at, updated_at timestamps
  Y:         el hold transiciona a status: "CONFIRMED"
  Y:         la colección `holds` mantiene el registro (audit trail)
```

**Error Path**
```gherkin
CRITERIO-6.2: Intento de confirmación sin pago exitoso
  Dado que:  un hold "h-789" está en status PENDING sin pago
  Cuando:    pasan 10 minutos y el worker intenta expirar el hold
  Entonces:  el hold transiciona a status: "EXPIRED"
  Y:         no se crea ningún documento en `reservations`
  Y:         la habitación vuelve a estar disponible
```

---

#### HU7: Liberación Proactiva por Fallo de Pago
**Story Point:** 2

```
Como:        sistema
Quiero:      liberar la habitación de inmediato si el pago es rechazado
Para:        que el hotel no pierda oportunidades de venta con otros clientes

Prioridad:   Alta (P0)
Estimación:  2 SP
Dependencias: HU0, HU3, HU5
Capa:        Backend
```

#### Criterios de Aceptación — HU7

**Happy Path**
```gherkin
CRITERIO-7.1: Pago declinado libera hold inmediatamente
  Dado que:  existe un hold "h-999" para habitación "505" con status PENDING
  Cuando:    el simulador de pago retorna DECLINED
  Entonces:  HTTP 402 retorna { status: "DECLINED" }
  Y:         el hold transiciona a status: "RELEASED"
  Y:         en búsquedas posteriores, la habitación "505" aparece disponible nuevamente
  Y:         una consulta GET /api/v1/holds/h-999 retorna status: "RELEASED"
```

---

#### HU8: Expiración Automática de Bloqueos (Worker Background)
**Story Point:** 3

```
Como:        administrador
Quiero:      que el sistema libere automáticamente los bloqueos que superen los 10 minutos
Para:        evitar que el inventario quede retenido por carritos abandonados

Prioridad:   Alta (P0)
Estimación:  3 SP
Dependencias: HU0, HU3
Capa:        Backend / Background Task
```

#### Criterios de Aceptación — HU8

**Happy Path**
```gherkin
CRITERIO-8.1: Limpieza automática de holds expirados
  Dado que:  existen 5 holds con expires_at < NOW() y status: PENDING
  Cuando:    el worker de limpieza se ejecuta (p.ej. cada 5 minutos)
  Entonces:  el worker itera los holds expirados
  Y:         todos los holds expirados transicionan de status: "PENDING" a status: "EXPIRED"
  Y:         la busqueda de disponibilidad ya no incluye esas habitaciones en los holds expirados
  Y:         la operación es idempotente (ejecutar nuevamente no produce duplicados ni errores)
```

**Edge Case**
```gherkin
CRITERIO-8.2: Worker no expira holds confirmados
  Dado que:  existen holds con status: "CONFIRMED" (asociados a reservas pagadas)
  Cuando:    el worker de limpieza se ejecuta
  Entonces:  esos holds NO son modificados (siguen status: "CONFIRMED")
  Y:         solo los holds con status: "PENDING" y expires_at < NOW() son actualizados a "EXPIRED"
```

---

#### HU11: Validación de Integridad de Fechas
**Story Point:** 3

```
Como:        sistema
Quiero:      validar que las fechas de reserva sean coherentes
Para:        evitar errores lógicos en el inventario

Prioridad:   Media (P1)
Estimación:  3 SP
Dependencias: HU0, HU2
Capa:        Backend
```

#### Criterios de Aceptación — HU11

**Happy Path**
```gherkin
CRITERIO-11.1: Validación exitosa de fechas coherentes
  Dado que:  un cliente envía GET /api/v1/rooms/available?checkin=2026-04-20&checkout=2026-04-22
  Cuando:    la API valida que checkout > checkin y checkin >= today
  Entonces:  HTTP 200 retorna la lista de habitaciones disponibles
  Y:         todas las fechas en la respuesta son ISO 8601 UTC
```

**Error Path - Fechas inválidas**
```gherkin
CRITERIO-11.2: Rechazo de fecha de salida anterior a entrada
  Dado que:  cliente envía POST /api/v1/rooms/{id}/hold con checkin: "2026-04-20", checkout: "2026-04-18"
  Cuando:    la API valida checkout <= checkin
  Entonces:  HTTP 400 Bad Request retorna { detail: "checkout debe ser posterior a checkin" }
  Y:         no se crea ningún hold
```

**Error Path - Fecha en el pasado**
```gherkin
CRITERIO-11.3: Rechazo de check-in en el pasado
  Dado que:  cliente envía checkin: "2025-01-01" (fecha pasada)
  Cuando:    la API valida checkin >= today
  Entonces:  HTTP 400 Bad Request retorna { detail: "checkin debe ser hoy o posterior" }
```

---

## 2. DISEÑO

### Modelos de Datos (MongoDB Collections)

#### Colección: `hotels`
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `_id` | ObjectId | sí | auto-generado MongoDB | ID interno de BD |
| `id` | string (UUID) | sí | unique, 36 chars | ID único expuesto en API |
| `name` | string | sí | max 100 chars | Nombre del hotel |
| `city` | string | sí | max 50 chars | Ciudad |
| `country` | string | sí | max 50 chars | País |
| `address` | string | no | max 200 chars | Dirección completa |
| `latitude` | float | no | - | Coordenada geográfica |
| `longitude` | float | no | - | Coordenada geográfica |
| `created_at` | datetime (UTC) | sí | auto-generado | Timestamp creación |
| `updated_at` | datetime (UTC) | sí | auto-generado | Timestamp actualización |

**Índices:**
- `{id: 1}` — unique, búsqueda de hotel por ID
- `{city: 1}` — búsqueda por ciudad

---

#### Colección: `rooms`
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `_id` | ObjectId | sí | auto-generado MongoDB | ID interno de BD |
| `id` | string (UUID) | sí | unique, 36 chars | ID único expuesto en API |
| `room_number` | string | sí | e.g., "101", "202" | Número de habitación |
| `hotel_id` | string (UUID) | sí | FK a `hotels.id` | Referencia al hotel |
| `type` | string | sí | enum: SINGLE, DOUBLE, SUITE | Tipo de habitación |
| `price_per_night` | float | sí | > 0 | Precio en USD por noche |
| `capacity` | int | sí | 1-10 | Número de personas |
| `amenities` | array[string] | no | e.g., ["wifi", "ac"] | Servicios |
| `created_at` | datetime (UTC) | sí | auto-generado | Timestamp creación |
| `updated_at` | datetime (UTC) | sí | auto-generado | Timestamp actualización |

**Índices:**
- `{id: 1}` — unique
- `{hotel_id: 1}` — búsqueda de rooms por hotel
- `{room_number: 1, hotel_id: 1}` — unique, identificar room en el hotel

---

#### Colección: `holds`
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `_id` | ObjectId | sí | auto-generado MongoDB | ID interno de BD |
| `id` | string (UUID) | sí | unique, 36 chars | ID único del hold |
| `room_id` | string (UUID) | sí | FK a `rooms.id` | Referencia a habitación |
| `checkin` | date | sí | ISO 8601 | Fecha de entrada |
| `checkout` | date | sí | ISO 8601 | Fecha de salida |
| `status` | string | sí | enum: PENDING, CONFIRMED, RELEASED, EXPIRED | Estado actual |
| `expires_at` | datetime (UTC) | sí | = created_at + 10 min | Timestamp de expiración |
| `payment_id` | string (UUID) | no | FK a `payments.id` (si existe) | Referencia a pago (post-pago) |
| `reservation_id` | string (UUID) | no | FK a `reservations.id` (si existe) | Referencia a reserva (post-confirmación) |
| `created_at` | datetime (UTC) | sí | auto-generado | Timestamp creación |
| `updated_at` | datetime (UTC) | sí | auto-generado | Timestamp actualización |

**Índices:**
- `{id: 1}` — unique
- `{room_id: 1, checkin: 1, checkout: 1}` — compound, prevenir duplicados en período
- `{status: 1, expires_at: 1}` — búsqueda de holds expirados por worker
- `{expires_at: 1}` — TTL index opcional (auto-delete si MongoDB TTL index configurado)

**Constraints:**
- `checkout > checkin`
- `expires_at >= created_at`

---

#### Colección: `payments`
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `_id` | ObjectId | sí | auto-generado MongoDB | ID interno de BD |
| `id` | string (UUID) | sí | unique, 36 chars | ID único del pago |
| `hold_id` | string (UUID) | sí | FK a `holds.id` | Referencia al hold |
| `idempotency_key` | string | sí | unique, 36+ chars | Clave de idempotencia (UUID) |
| `amount` | float | sí | > 0 | Monto en USD |
| `currency` | string | sí | default: "USD" | Moneda |
| `status` | string | sí | enum: SUCCESS, DECLINED, PENDING | Resultado del pago |
| `simulator_response` | object | no | { status, message } | Respuesta del simulador mock |
| `created_at` | datetime (UTC) | sí | auto-generado | Timestamp creación |
| `updated_at` | datetime (UTC) | sí | auto-generado | Timestamp actualización |

**Índices:**
- `{id: 1}` — unique
- `{idempotency_key: 1}` — unique, idempotencia
- `{hold_id: 1}` — búsqueda de pagos por hold
- `{status: 1}` — reporte de pagos por estado

---

#### Colección: `reservations`
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `_id` | ObjectId | sí | auto-generado MongoDB | ID interno de BD |
| `id` | string (UUID) | sí | unique, 36 chars | ID único de reserva |
| `reservation_code` | string | sí | unique, 8 chars alphanumeric | Código para el usuario |
| `room_id` | string (UUID) | sí | FK a `rooms.id` | Referencia a habitación |
| `hold_id` | string (UUID) | sí | FK a `holds.id` | Referencia al hold confirmado |
| `payment_id` | string (UUID) | sí | FK a `payments.id` | Referencia al pago exitoso |
| `checkin` | date | sí | ISO 8601 | Fecha entrada |
| `checkout` | date | sí | ISO 8601 | Fecha salida |
| `status` | string | sí | enum: CONFIRMED, CANCELLED | Estado reserva |
| `created_at` | datetime (UTC) | sí | auto-generado | Timestamp creación |
| `updated_at` | datetime (UTC) | sí | auto-generado | Timestamp actualización |

**Índices:**
- `{id: 1}` — unique
- `{reservation_code: 1}` — unique, búsqueda por código
- `{room_id: 1, checkin: 1, checkout: 1}` — compound, verificar conflictos

---

### API Endpoints v1

#### GET /api/v1/rooms/available
- **Descripción**: Lista habitaciones disponibles para un rango de fechas (sin holds ni reservas activos)
- **Auth requerida**: no
- **Query Parameters**:
  - `checkin` (required): ISO 8601 date, e.g., `2026-04-10`
  - `checkout` (required): ISO 8601 date, e.g., `2026-04-12`
  - `hotel_id` (optional): filtra por hotel; si omitido, lista todas
- **Request Body**: ninguno
- **Response 200**:
  ```json
  [
    {
      "id": "<uuid>",
      "room_number": "101",
      "hotel_id": "<uuid>",
      "type": "DOUBLE",
      "price_per_night": 150.00,
      "capacity": 2,
      "amenities": ["wifi", "ac"],
      "created_at": "2026-03-20T10:00:00Z",
      "updated_at": "2026-03-20T10:00:00Z"
    }
    ...
  ]
  ```
- **Response 400**: `{ "detail": "checkin o checkout inválidos o checkout <= checkin" }`
- **Response 400**: `{ "detail": "checkin debe ser hoy o posterior" }`

---

#### POST /api/v1/rooms/{room_id}/hold
- **Descripción**: Crea un hold de 10 minutos sobre una habitación (OPERACIÓN ATÓMICA)
- **Auth requerida**: no
- **Path Parameter**: `room_id` (UUID)
- **Request Body**:
  ```json
  {
    "checkin": "2026-04-10",
    "checkout": "2026-04-12"
  }
  ```
- **Response 201**:
  ```json
  {
    "id": "<uuid>",
    "room_id": "<uuid>",
    "checkin": "2026-04-10",
    "checkout": "2026-04-12",
    "status": "PENDING",
    "expires_at": "2026-03-26T14:10:00Z",
    "created_at": "2026-03-26T14:00:00Z",
    "updated_at": "2026-03-26T14:00:00Z"
  }
  ```
- **Response 400**: fechas inválidas o coherencia
- **Response 409**: habitación ya tiene hold/reserva activo para ese rango
- **Response 404**: `room_id` no encontrado

---

#### GET /api/v1/holds/{hold_id}
- **Descripción**: Obtiene estado actual de un hold (incluye remaining_seconds para timer)
- **Auth requerida**: no
- **Path Parameter**: `hold_id` (UUID)
- **Response 200**:
  ```json
  {
    "id": "<uuid>",
    "room_id": "<uuid>",
    "checkin": "2026-04-10",
    "checkout": "2026-04-12",
    "status": "PENDING",
    "expires_at": "2026-03-26T14:10:00Z",
    "remaining_seconds": 300,
    "created_at": "2026-03-26T14:00:00Z"
  }
  ```
- **Response 404**: hold no encontrado

---

#### POST /api/v1/payments
- **Descripción**: Procesa pago simulado e idempotente; controla transición hold → confirmado
- **Auth requerida**: no
- **Request Body**:
  ```json
  {
    "hold_id": "<uuid>",
    "amount": 300.00,
    "idempotency_key": "<uuid>"
  }
  ```
- **Request Headers**: (futuro: `X-Idempotency-Key` en header)
- **Response 200** (SUCCESS):
  ```json
  {
    "id": "<uuid>",
    "hold_id": "<uuid>",
    "status": "SUCCESS",
    "amount": 300.00,
    "currency": "USD",
    "created_at": "2026-03-26T14:05:00Z"
  }
  ```
- **Response 200** (cached/idempotent):
  ```json
  {
    "id": "<uuid>",
    "hold_id": "<uuid>",
    "status": "SUCCESS",
    "amount": 300.00,
    "currency": "USD",
    "created_at": "2026-03-26T14:05:00Z",
    "_cached": true
  }
  ```
- **Response 402** (DECLINED):
  ```json
  {
    "id": "<uuid>",
    "hold_id": "<uuid>",
    "status": "DECLINED",
    "detail": "Pago rechazado por el banco"
  }
  ```
- **Response 404**: hold_id no encontrado o hold ya expirado
- **Response 400**: validación de monto o parámetros

**Efectos secundarios:**
- SUCCESS: hold transiciona a `CONFIRMED`, se crea documento en `reservations` con código único
- DECLINED: hold transiciona a `RELEASED`
- Idempotencia: si `idempotency_key` ya existe y status=SUCCESS, retorna respuesta anterior sin reejecutar

---

#### GET /api/v1/reservations/{reservation_id}
- **Descripción**: Obtiene detalles de una reserva confirmada
- **Auth requerida**: no
- **Path Parameter**: `reservation_id` (UUID)
- **Response 200**:
  ```json
  {
    "id": "<uuid>",
    "reservation_code": "ABC12345",
    "room_id": "<uuid>",
    "room_number": "101",
    "hotel_id": "<uuid>",
    "checkin": "2026-04-10",
    "checkout": "2026-04-12",
    "status": "CONFIRMED",
    "price_per_night": 150.00,
    "nights": 2,
    "total_amount": 300.00,
    "created_at": "2026-03-26T14:05:00Z"
  }
  ```
- **Response 404**: reserva no encontrada

---

#### GET /api/v1/reservations?reservation_code={code}
- **Descripción**: Busca reserva por código único (alternativa a por ID)
- **Auth requerida**: no
- **Query Parameter**: `reservation_code` (8-char alphanumeric)
- **Response 200**: mismo formato que arriba
- **Response 404**: código no encontrado

---

### Diseño Frontend

#### Componentes nuevos

| Componente | Archivo | Props | Descripción |
|------------|---------|-------|-------------|
| `SearchBar` | `components/SearchBar.jsx` | `onSearch` (callback) | Input de fechas (DatePicker + DatePicker) + botón Buscar |
| `RoomCard` | `components/RoomCard.jsx` | `room` (object), `onSelect` (callback) | Tarjeta de habitación (photo, type, price, amenities, botón Seleccionar) |
| `RoomList` | `components/RoomList.jsx` | `rooms` (array), `isLoading` (bool), `onSelectRoom` | Lista de RoomCard con estado de carga |
| `CheckoutForm` | `components/CheckoutForm.jsx` | `hold` (object), `onPaymentSubmit` (callback) | Form con datos básicos + contador de tiempo restante + botón Pagar |
| `Timer` | `components/Timer.jsx` | `expiresAt` (ISO datetime), `onExpired` (callback) | Contador regresivo, sincronizado con servidor |
| `PaymentSummary` | `components/PaymentSummary.jsx` | `reservation` (object), `room` (object) | Resumen de reserva confirmada con código único |

#### Páginas nuevas

| Página | Archivo | Ruta | Props | Descripción |
|--------|---------|------|-------|-------------|
| `SearchPage` | `pages/SearchPage.jsx` + `.module.css` | `/` | `—` | Landing con SearchBar + RoomList |
| `CheckoutPage` | `pages/CheckoutPage.jsx` + `.module.css` | `/checkout/:holdId` | `holdId` (URL param) | CheckoutForm + Timer + resumen de habitación |
| `ConfirmationPage` | `pages/ConfirmationPage.jsx` + `.module.css` | `/confirmation/:reservationCode` | `reservationCode` (URL param) | PaymentSummary con código y detalles |

#### Hooks nuevos

| Hook | Archivo | Descripción |
|------|---------|-------------|
| `useAvailableRooms` | `hooks/useAvailableRooms.js` | Fetches `GET /api/v1/rooms/available?checkin=...&checkout=...` |
| `useRoomHold` | `hooks/useRoomHold.js` | Crea hold via `POST /api/v1/rooms/{id}/hold` |
| `useHoldState` | `hooks/useHoldState.js` | Fetches estado del hold via `GET /api/v1/holds/{holdId}` + calcula remaining_seconds |
| `usePayment` | `hooks/usePayment.js` | Procesa pago via `POST /api/v1/payments` + maneja idempotencia (UUID generation) |
| `useReservation` | `hooks/useReservation.js` | Fetches `GET /api/v1/reservations/{id}` |

#### Services nuevos

| Service | Archivo | Métodos |
|---------|---------|---------|
| `roomService` | `services/roomService.js` | `getAvailableRooms(checkin, checkout, hotelId)`, `getRoomById(id)` |
| `holdService` | `services/holdService.js` | `createHold(roomId, checkin, checkout)`, `getHoldState(holdId)` |
| `paymentService` | `services/paymentService.js` | `processPayment(holdId, amount, idempotencyKey)` |
| `reservationService` | `services/reservationService.js` | `getReservation(reservationId)`, `getReservationByCode(code)` |

#### Flujo de navegación (React Router v6)

```
/ (SearchPage)
  ↓ onSelectRoom
/checkout/:holdId (CheckoutPage)
  ↓ onPaymentSubmit
/confirmation/:reservationCode (ConfirmationPage)
```

#### UI/UX Consideraciones

- **SearchBar**: DatePicker con fechas >= hoy, checkout > checkin
- **RoomCard**: muestra disponibilidad en tiempo real, click →  crea hold y navega
- **Timer**: sincroniza con servidor cada 5 seg (no confiar solo en reloj del cliente)
- **CheckoutForm**: botón "Pagar" deshabilitado si timer <= 0
- **ConfirmationPage**: muestra código único (copiar al clipboard), opción de imprimir

---

## 3. LISTA DE TAREAS

### Backend (FastAPI + MongoDB + Motor async)

#### Infraestructura y Base de Datos
- [ ] Crear conexión MongoDB async via Motor en `backend/app/config/database.py`
- [ ] Configurar sesiones y transacciones ACID en MongoDB
- [ ] Definir modelos Pydantic v2 en `backend/app/models/`:
  - [ ] `HotelModel` (request/response/document)
  - [ ] `RoomModel` (request/response/document)
  - [ ] `HoldModel` (request/response/document)
  - [ ] `PaymentModel` (request/response/document)
  - [ ] `ReservationModel` (request/response/document)

#### Colecciones MongoDB y Índices
- [ ] Crear colección `hotels` con índices: unique `id`, index `city`
- [ ] Crear colección `rooms` con índices: unique `id`, compound `(hotel_id, room_number)`
- [ ] Crear colección `holds` con índices: unique `id`, compound `(room_id, checkin, checkout)`, `(status, expires_at)`
- [ ] Crear colección `payments` con índices: unique `id`, unique `idempotency_key`, index `hold_id`
- [ ] Crear colección `reservations` con índices: unique `id`, unique `reservation_code`, compound `(room_id, checkin, checkout)`

#### Repositorios (Capa de Acceso a Datos)
- [ ] `backend/app/repositories/hotel_repository.py` — find, insert, update
- [ ] `backend/app/repositories/room_repository.py` — find, insert, find_available (query compleja de solapamiento)
- [ ] `backend/app/repositories/hold_repository.py` — find, insert, update_status, find_expired, find_by_room_and_range
- [ ] `backend/app/repositories/payment_repository.py` — find, insert, find_by_idempotency_key
- [ ] `backend/app/repositories/reservation_repository.py` — find, insert, find_by_code

#### Servicios (Lógica de Negocio)
- [ ] `backend/app/services/room_service.py`:
  - [ ] `get_available_rooms(checkin, checkout, hotel_id=None)` — lógica de solapamiento
- [ ] `backend/app/services/hold_service.py`:
  - [ ] `create_hold_atomic(room_id, checkin, checkout)` — transacción + bloqueo de fila equivalente
  - [ ] `get_hold_with_remaining(hold_id)` — calcula remaining_seconds
  - [ ] `mark_expired(hold_ids)` — batch update para worker
  - [ ] Manejo de ValueError si habitación no disponible → 409
- [ ] `backend/app/services/payment_service.py`:
  - [ ] `process_payment_idempotent(hold_id, amount, idempotency_key)` — verificar idempotencia, llamar simulador, transicionar hold, crear reservación
  - [ ] `call_payment_simulator()` — mock que retorna SUCCESS o DECLINED
- [ ] `backend/app/services/reservation_service.py`:
  - [ ] `create_reservation_from_payment(hold_id, payment_id)` — generar código único, crear documento

#### Routers (Endpoints HTTP)
- [ ] `backend/app/routes/rooms_router.py`:
  - [ ] `GET /api/v1/rooms/available` con validación de parámetros
  - [ ] Retorna lista o 400/404
- [ ] `backend/app/routes/holds_router.py`:
  - [ ] `POST /api/v1/rooms/{room_id}/hold` — validar fechas, llamar service, manejo de 409
  - [ ] `GET /api/v1/holds/{hold_id}` — retorna estado + remaining_seconds
- [ ] `backend/app/routes/payments_router.py`:
  - [ ] `POST /api/v1/payments` — procesar pago idempotente, transicionar hold, retornar contrato
  - [ ] Manejo de 402, 404, 400
- [ ] `backend/app/routes/reservations_router.py`:
  - [ ] `GET /api/v1/reservations/{reservation_id}`
  - [ ] `GET /api/v1/reservations?reservation_code={code}`

#### Worker Background Task
- [ ] Crear `backend/app/workers/hold_expiration_worker.py`:
  - [ ] Tarea que cada 5 minutos ejecuta: `SELECT * FROM holds WHERE expires_at < NOW() AND status = 'PENDING'`
  - [ ] Transiciona cada hold a status = 'EXPIRED'
  - [ ] Logging de cantidad actualizada
  - [ ] Manejo de errores y reintentos

#### Seeder
- [ ] Crear `backend/scripts/seed_data.py`:
  - [ ] Insert en `hotels`: 2-3 hoteles realistas
  - [ ] Insert en `rooms`: 10-15 habitaciones con variedades de tipo y precio
  - [ ] Script ejecutable via `make seed` o `python scripts/seed_data.py`

#### Validación e Integridad
- [ ] Validador Pydantic: `checkout > checkin`
- [ ] Validador Pydantic: `checkin >= today`
- [ ] Validador MongoDB: unique constraints en holds (room_id, checkin, checkout) — se evalúa en lógica de transacción

#### Tests Unitarios
- [ ] `backend/tests/test_room_service.py` — lógica de solapamiento
- [ ] `backend/tests/test_hold_service.py` — creación atómica, manejo de conflicto
- [ ] `backend/tests/test_payment_service.py` — idempotencia, transición de estados
- [ ] `backend/tests/test_hold_repository.py` — queries complejas
- [ ] Cobertura mínima: 70% de lógica crítica

#### Tests de Integración
- [ ] `backend/tests/integration/test_race_condition.py` — dos threads intentan crear hold simultáneamente (debe fallar uno)
- [ ] `backend/tests/integration/test_end_to_end.py` — flujo completo: buscar → hold → pago SUCCESS → verificar reserva
- [ ] `backend/tests/integration/test_payment_failure.py` — flujo: hold → pago DECLINED → verificar hold RELEASED
- [ ] `backend/tests/integration/test_idempotency.py` — dos pagos con mismo idempotency_key retornan resultado idéntico

---

### Frontend (React 19 + Vite + CSS Modules)

#### Estructura de Componentes
- [ ] Crear `frontend/src/components/SearchBar.jsx` + `.module.css`:
  - [ ] Dos DatePickers para checkin/checkout
  - [ ] Validación: checkout > checkin, checkin >= today
  - [ ] Botón "Buscar"
- [ ] Crear `frontend/src/components/RoomCard.jsx` + `.module.css`:
  - [ ] Muestra room_number, type, price_per_night, amenities
  - [ ] Botón "Seleccionar" — onClick → crea hold → navega a checkout
  - [ ] Loading state
- [ ] Crear `frontend/src/components/RoomList.jsx` + `.module.css`:
  - [ ] Itera array de rooms, renderiza RoomCard
  - [ ] Spinner si isLoading = true
  - [ ] Mensaje "No hay disponibilidad" si rooms.length === 0
- [ ] Crear `frontend/src/components/CheckoutForm.jsx` + `.module.css`:
  - [ ] Muestra datos de hold (room_number, checkin, checkout, total_price)
  - [ ] Timer component
  - [ ] Botón "Pagar" deshabilitado si tiempo <= 0
  - [ ] Loading state durante pago
- [ ] Crear `frontend/src/components/Timer.jsx` + `.module.css`:
  - [ ] Countdown desde expiresAt
  - [ ] Sincroniza con servidor cada 5 seg (GET /api/v1/holds/{holdId})
  - [ ] Callback onExpired cuando llega a 0
- [ ] Crear `frontend/src/components/PaymentSummary.jsx` + `.module.css`:
  - [ ] Muestra reservation_code (copiar al clipboard)
  - [ ] Room details, dates, total_price
  - [ ] Botón "Volver al inicio"

#### Páginas
- [ ] Crear `frontend/src/pages/SearchPage.jsx` + `.module.css`:
  - [ ] Hook useAvailableRooms (initial state vacío)
  - [ ] SearchBar → dispara búsqueda
  - [ ] RoomList con resultados
  - [ ] Manejo de errores (mostrar toast)
- [ ] Crear `frontend/src/pages/CheckoutPage.jsx` + `.module.css`:
  - [ ] URL param: `/:holdId`
  - [ ] Hook useHoldState — fetches hold cada 5 seg
  - [ ] CheckoutForm
  - [ ] Si hold expirado o no encontrado, redirige a SearchPage
- [ ] Crear `frontend/src/pages/ConfirmationPage.jsx` + `.module.css`:
  - [ ] URL param: `/:reservationCode`
  - [ ] Hook useReservation — fetches reserva
  - [ ] PaymentSummary
  - [ ] Si reservation no existe, redirige a SearchPage

#### Hooks
- [ ] Crear `frontend/src/hooks/useAvailableRooms.js`:
  - [ ] async function que llama roomService.getAvailableRooms()
  - [ ] Retorna: { rooms, isLoading, error }
- [ ] Crear `frontend/src/hooks/useRoomHold.js`:
  - [ ] async function que llama holdService.createHold()
  - [ ] Retorna: { hold, isLoading, error }
  - [ ] En success, navega a `/checkout/{holdId}`
- [ ] Crear `frontend/src/hooks/useHoldState.js`:
  - [ ] Fetches GET /api/v1/holds/{holdId} periódicamente
  - [ ] Calcula remaining_seconds = (expires_at - NOW)
  - [ ] Retorna: { hold, remaining_seconds, isExpired, isLoading }
- [ ] Crear `frontend/src/hooks/usePayment.js`:
  - [ ] Genera UUID para idempotency_key
  - [ ] Llama paymentService.processPayment()
  - [ ] En success, navega a `/confirmation/{reservationCode}`
  - [ ] En error (402 DECLINED), muestra error y redirige a SearchPage
  - [ ] Retorna: { isLoading, error }
- [ ] Crear `frontend/src/hooks/useReservation.js`:
  - [ ] Fetches GET /api/v1/reservations/{id} o por code
  - [ ] Retorna: { reservation, isLoading, error }

#### Services (Llamadas HTTP)
- [ ] Crear `frontend/src/services/roomService.js`:
  - [ ] `getAvailableRooms(checkin, checkout, hotelId)` — GET /api/v1/rooms/available
  - [ ] Manejo de errores HTTP
- [ ] Crear `frontend/src/services/holdService.js`:
  - [ ] `createHold(roomId, checkin, checkout)` — POST /api/v1/rooms/{roomId}/hold
  - [ ] `getHoldState(holdId)` — GET /api/v1/holds/{holdId}
- [ ] Crear `frontend/src/services/paymentService.js`:
  - [ ] `processPayment(holdId, amount, idempotencyKey)` — POST /api/v1/payments
  - [ ] Manejo de idempotency (reutilizar key si reintento)
- [ ] Crear `frontend/src/services/reservationService.js`:
  - [ ] `getReservation(reservationId)` — GET /api/v1/reservations/{id}
  - [ ] `getReservationByCode(code)` — GET /api/v1/reservations?reservation_code={code}

#### Rutas (React Router v6)
- [ ] Actualizar `frontend/src/App.jsx`:
  - [ ] Route `/` → SearchPage
  - [ ] Route `/checkout/:holdId` → CheckoutPage
  - [ ] Route `/confirmation/:reservationCode` → ConfirmationPage
  - [ ] Fallback 404 → SearchPage

#### Estilos CSS Modules
- [ ] Asegurar que CADA componente y página tiene su `.module.css`
- [ ] Aplicar dark mode support (variables CSS o clases condicionales)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Usar colores y tipografía consistentes con el proyecto

#### Tests Unitarios
- [ ] `frontend/src/__tests__/SearchBar.test.jsx` — DatePicker validation, button click
- [ ] `frontend/src/__tests__/RoomCard.test.jsx` — render, button click triggers callback
- [ ] `frontend/src/__tests__/Timer.test.jsx` — countdown, sync con servidor
- [ ] `frontend/src/__tests__/useAvailableRooms.test.js` — fetch success/error
- [ ] `frontend/src/__tests__/usePayment.test.js` — idempotency, UUID generation
- [ ] Cobertura mínima: 70%

#### Tests E2E (opcional para esta ejecución)
- [ ] Scenario: Búsqueda → Selección → Hold → Pago → Confirmación
- [ ] Scenario: Pago rechazado + reintentar búsqueda
- [ ] Scenario: Timer llega a 0 + botón deshabilitado
- [ ] (Para QA en fase posterior)

---

### Tests Compartidos (Backend + Frontend integración)

#### Tests de Integración API (Backend)
- [ ] `backend/tests/integration/test_available_rooms_concurrent.py`:
  - [ ] Simula 10 clientes buscando al mismo tiempo (sin errores)
  - [ ] Valida que respuesta es consistente
- [ ] `backend/tests/integration/test_hold_creation_race.py`:
  - [ ] Dos threads crean hold para misma habitación/rango
  - [ ] Primero obtiene 201, segundo obtiene 409
- [ ] `backend/tests/integration/test_hold_expiration.py`:
  - [ ] Reduce `expires_at` a 10 seg para pruebas
  - [ ] Ejecuta worker
  - [ ] Valida hold transiciona a EXPIRED
- [ ] `backend/tests/integration/test_payment_idempotency.py`:
  - [ ] Dos requests con mismo idempotency_key
  - [ ] Ambas devuelven SUCCESS, pero solo un payment en BD
- [ ] `backend/tests/integration/test_end_to_end.py`:
  - [ ] Flujo completo: rooms/available → hold → payments → reservations
  - [ ] Valida estado de hold y reserva en BD

#### Tests de Integración E2E (Frontend)
- [ ] `frontend/src/__tests__/e2e/searchable-flow.test.jsx`:
  - [ ] (Opcional, puede ser Cypress/Playwright en fase posterior)

---

### Documentación

- [ ] README actualizado con:
  - [ ] Stack real (FastAPI, MongoDB, Motor, React)
  - [ ] Instrucciones de instalación, seeding data
  - [ ] Ejemplos de endpoints
  - [ ] Guía de desarrollo
  
- [ ] Comentarios en código:
  - [ ] Secciones críticas (atómicidad, idempotencia)
  - [ ] Queries complejas (solapamiento de fechas)
  - [ ] Definición de constantes (10 minutos, códigos HTTP)

---

## 4. PREGUNTAS PENDIENTES Y BLOQUEOS

### Preguntas aclaración

1. **¿Autenticación en MVP?** Spec asume NINGUNA autenticación (público). ¿Debe protegerse algún endpoint (ej. con Firebase UID)?
2. **¿Simulador de pago:** ¿Configuración global (siempre SUCCESS o DECLINED) o por request?
3. **¿Tarifas dinámicas?** Spec asume `price_per_night` fija por habitación. ¿Existen tarifas por temporada o promotions?
4. **¿Zona horaria**: Todos los timestamps se almacenan en UTC. ¿Frontend debe convertir a zona del hotel?
5. **¿Notificaciones?** ¿Confirmación por email, SMS o solo en UI? → Excluido MVP.

### Bloqueos detectados

1. ⚠️ **HU4 (Timer Persistencia) EXCLUIDA** — Spec no cubre; se requeriría `localStorage` + sincronización más frecuente con servidor.
2. ⚠️ **HU9 (Race Pago-Expiración) EXCLUIDA** — Complejidad mayor: requiere bloqueo pessimista en worker durante pago. Dejar para fase posterior con análisis de riesgos.
3. ⚠️ **HU10 (Rate Limiting) EXCLUIDA** — Requiere `slowapi` + Redis (o similar). No incluido en MVP.
4. ⚠️ **QA Explícitamente fuera** — SPEC no incluye GHERKIN de QA ni test plans.

### Stack Real Confirmado

```
Backend:    FastAPI 0.104+, Python 3.12, Motor (async MongoDB), Pydantic v2
Database:   MongoDB (único), sin PostgreSQL/SQLAlchemy
Frontend:   React 19, Vite, CSS Modules, React Router v6, Axios
Utilities:  Firebase SDK (opcional en MVP), UUID para IDs
```

---

## 5. REFERENCIAS Y ARCHIVOS FUENTE

- **PRD.md** — Visión y objetivos generales del MVP.
- **USER_STORIES.md** — Definiciones de HU0-HU11 con Gherkin.
- **SUBTASKS.md** — Desglose de tareas técnicas.
- **.github/instructions/backend.instructions.md** — Convenciones FastAPI + MongoDB.
- **.github/instructions/frontend.instructions.md** — Convenciones React + Vite + CSS Modules.
- **.github/instructions/tests.instructions.md** — Frameworks de test (pytest backend, Vitest frontend).


---
id: SPEC-012
status: APPROVED
feature: admin-panel
created: 2026-04-08
updated: 2026-04-08
author: spec-generator
version: "1.0"
related-specs: []
---

# Spec: Panel de Administración

> **Estado:** `APPROVED` — aprobado por el usuario para iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Panel de administración completo que permite a un usuario con rol Administrador gestionar el sistema hotelero. Incluye autenticación propia (login/password), dashboard con métricas de negocio (ganancias, habitaciones populares, clientes frecuentes), CRUD de reservas, CRUD de clientes y CRUD de habitaciones. Toda la funcionalidad admin está protegida por un guard de autenticación JWT.

### Requerimiento de Negocio
El administrador necesita:
1. Login independiente con email/password (no Firebase, autenticación local con JWT)
2. Dashboard con estadísticas: ganancias totales, habitaciones más populares (top 5 + desglose), clientes más frecuentes (top 5 + desglose)
3. CRUD completo de reservas (ver, crear, eliminar)
4. CRUD de clientes (ver listado, ver detalle, crear, editar, eliminar) — solo visible por admin
5. CRUD de habitaciones (ver, crear, editar, eliminar) — solo visible por admin
6. Persistencia de mejores clientes por email o id
7. Campo de ubicación (piso/ala) en habitaciones para identificar su posición física
8. Envío de correo electrónico con los datos completos de la reserva al crearla
9. URL de imagen por habitación para visualizar en el card del buscador y en el admin
10. Filtro de ciudad en el buscador público de disponibilidad
11. Filtro de presupuesto (rango de precio por noche) en el buscador público
12. Página pública para consultar una reserva ingresando el código de reserva

### Historias de Usuario

#### HU-ADM-01: Login de Administrador

```
Como:        Administrador
Quiero:      autenticarme con email y contraseña en un endpoint dedicado
Para:        acceder de forma segura al panel de administración

Prioridad:   Alta
Estimación:  M
Dependencias: Ninguna
Capa:        Ambas
```

#### Criterios de Aceptación — HU-ADM-01

**Happy Path**
```gherkin
CRITERIO-1.1: Login exitoso
  Dado que:  existe un Administrador con email "admin@hotel.com" y password válido
  Cuando:    envía POST /api/v1/admin/auth/login con credenciales correctas
  Entonces:  recibe 200 con { access_token, admin: { id, email, name } }
```

**Error Path**
```gherkin
CRITERIO-1.2: Credenciales inválidas
  Dado que:  el Administrador envía un password incorrecto
  Cuando:    envía POST /api/v1/admin/auth/login
  Entonces:  recibe 401 con { message: "Credenciales inválidas" }
```

```gherkin
CRITERIO-1.3: Email no registrado
  Dado que:  no existe un admin con el email proporcionado
  Cuando:    envía POST /api/v1/admin/auth/login
  Entonces:  recibe 401 con { message: "Credenciales inválidas" }
```

---

#### HU-ADM-02: Dashboard de Estadísticas

```
Como:        Administrador autenticado
Quiero:      ver un dashboard con métricas de negocio
Para:        tomar decisiones informadas sobre la operación del hotel

Prioridad:   Alta
Estimación:  L
Dependencias: HU-ADM-01
Capa:        Ambas
```

#### Criterios de Aceptación — HU-ADM-02

**Happy Path**
```gherkin
CRITERIO-2.1: Dashboard carga métricas completas
  Dado que:  el Administrador está autenticado
  Cuando:    accede a GET /api/v1/admin/dashboard
  Entonces:  recibe 200 con:
    - total_revenue (ganancias totales de reservas CONFIRMED)
    - total_reservations (cantidad de reservas confirmadas)
    - top_rooms (top 5 habitaciones más reservadas con count + room_number + hotel_name)
    - top_customers (top 5 clientes con más reservas, por email, con count + total_spent)
    - all_rooms_stats (desglose completo de habitaciones con reservas)
    - all_customers_stats (desglose completo de clientes con reservas)
```

**Error Path**
```gherkin
CRITERIO-2.2: Acceso sin token
  Dado que:  no se envía header Authorization
  Cuando:    accede a GET /api/v1/admin/dashboard
  Entonces:  recibe 401 con { message: "Token no proporcionado" }
```

---

#### HU-ADM-03: CRUD de Reservas (Admin)

```
Como:        Administrador autenticado
Quiero:      ver, crear y eliminar reservas desde el panel
Para:        gestionar manualmente las reservas del hotel

Prioridad:   Alta
Estimación:  L
Dependencias: HU-ADM-01
Capa:        Ambas
```

#### Criterios de Aceptación — HU-ADM-03

**Happy Path**
```gherkin
CRITERIO-3.1: Listar todas las reservas
  Dado que:  el Administrador está autenticado
  Cuando:    accede a GET /api/v1/admin/reservations
  Entonces:  recibe 200 con array de reservas con room_number, hotel_name, fechas, status, customer_email, total_amount

CRITERIO-3.2: Crear reserva manualmente
  Dado que:  el Administrador quiere crear una reserva sin flujo de hold/pago
  Cuando:    envía POST /api/v1/admin/reservations con { room_id, checkin, checkout, customer_email, customer_name }
  Entonces:  recibe 201 con la reserva creada con status CONFIRMED y reservation_code generado

CRITERIO-3.3: Eliminar reserva
  Dado que:  existe una reserva con id "X"
  Cuando:    envía DELETE /api/v1/admin/reservations/:id
  Entonces:  recibe 200 con { message: "Reserva cancelada" } y el status pasa a CANCELLED
```

**Error Path**
```gherkin
CRITERIO-3.4: Crear reserva con habitación no disponible
  Dado que:  la habitación ya tiene reserva CONFIRMED para las mismas fechas
  Cuando:    envía POST /api/v1/admin/reservations
  Entonces:  recibe 409 con { message: "Habitación no disponible para las fechas seleccionadas" }

CRITERIO-3.5: Eliminar reserva inexistente
  Dado que:  no existe reserva con id "X"
  Cuando:    envía DELETE /api/v1/admin/reservations/:id
  Entonces:  recibe 404 con { message: "Reserva no encontrada" }
```

---

#### HU-ADM-04: CRUD de Clientes

```
Como:        Administrador autenticado
Quiero:      gestionar los clientes del hotel (ver, crear, editar, eliminar)
Para:        mantener un registro de los huéspedes y sus datos

Prioridad:   Alta
Estimación:  M
Dependencias: HU-ADM-01
Capa:        Ambas
```

#### Criterios de Aceptación — HU-ADM-04

**Happy Path**
```gherkin
CRITERIO-4.1: Listar clientes
  Dado que:  el Administrador está autenticado
  Cuando:    accede a GET /api/v1/admin/customers
  Entonces:  recibe 200 con array de clientes con id, email, name, phone, total_reservations, total_spent

CRITERIO-4.2: Crear cliente
  Dado que:  el Administrador envía datos válidos
  Cuando:    envía POST /api/v1/admin/customers con { email, name, phone? }
  Entonces:  recibe 201 con el cliente creado

CRITERIO-4.3: Actualizar cliente
  Dado que:  existe un cliente con id "X"
  Cuando:    envía PATCH /api/v1/admin/customers/:id con { name, phone }
  Entonces:  recibe 200 con el cliente actualizado

CRITERIO-4.4: Eliminar cliente
  Dado que:  existe un cliente con id "X"
  Cuando:    envía DELETE /api/v1/admin/customers/:id
  Entonces:  recibe 204
```

**Error Path**
```gherkin
CRITERIO-4.5: Email duplicado
  Dado que:  ya existe un cliente con email "juan@mail.com"
  Cuando:    envía POST /api/v1/admin/customers con el mismo email
  Entonces:  recibe 409 con { message: "Ya existe un cliente con ese email" }

CRITERIO-4.6: Cliente no encontrado
  Dado que:  no existe cliente con id "X"
  Cuando:    envía GET /api/v1/admin/customers/:id
  Entonces:  recibe 404 con { message: "Cliente no encontrado" }
```

---

#### HU-ADM-05: CRUD de Habitaciones (Admin)

```
Como:        Administrador autenticado
Quiero:      gestionar las habitaciones (ver, crear, editar, eliminar)
Para:        administrar el inventario de habitaciones del hotel

Prioridad:   Alta
Estimación:  M
Dependencias: HU-ADM-01
Capa:        Ambas
```

#### Criterios de Aceptación — HU-ADM-05

**Happy Path**
```gherkin
CRITERIO-5.1: Listar habitaciones
  Dado que:  el Administrador está autenticado
  Cuando:    accede a GET /api/v1/admin/rooms
  Entonces:  recibe 200 con array de habitaciones con id, room_number, hotel_name, type, price_per_night, capacity, amenities

CRITERIO-5.2: Crear habitación
  Dado que:  el Administrador envía datos válidos
  Cuando:    envía POST /api/v1/admin/rooms con { room_number, hotel_id, type, price_per_night, capacity, amenities[] }
  Entonces:  recibe 201 con la habitación creada

CRITERIO-5.3: Actualizar habitación
  Dado que:  existe una habitación con id "X"
  Cuando:    envía PATCH /api/v1/admin/rooms/:id con campos a actualizar
  Entonces:  recibe 200 con la habitación actualizada

CRITERIO-5.4: Eliminar habitación
  Dado que:  existe una habitación con id "X" sin reservas activas
  Cuando:    envía DELETE /api/v1/admin/rooms/:id
  Entonces:  recibe 204
```

**Error Path**
```gherkin
CRITERIO-5.5: Room number duplicado en mismo hotel
  Dado que:  ya existe room "101" en hotel "Y"
  Cuando:    envía POST /api/v1/admin/rooms con room_number "101" y hotel_id "Y"
  Entonces:  recibe 409 con { message: "Ya existe una habitación con ese número en este hotel" }

CRITERIO-5.6: Eliminar habitación con reservas activas
  Dado que:  la habitación tiene reservas CONFIRMED futuras
  Cuando:    envía DELETE /api/v1/admin/rooms/:id
  Entonces:  recibe 409 con { message: "No se puede eliminar una habitación con reservas activas" }
```

#### HU-ADM-06: Ubicación e Imagen de Habitación

```
Como:        Administrador autenticado
Quiero:      asignar ubicación (piso/ala) y una URL de imagen a cada habitación
Para:        identificar visualmente la habitación y su posición en el hotel

Prioridad:   Media
Estimación:  S
Dependencias: HU-ADM-05
Capa:        Ambas
```

#### Criterios de Aceptación — HU-ADM-06

**Happy Path**
```gherkin
CRITERIO-6.1: Crear habitación con ubicación e imagen
  Dado que:  el Administrador envía datos válidos incluyendo floor, wing e image_url
  Cuando:    envía POST /api/v1/admin/rooms con { ..., floor: 3, wing: "Norte", image_url: "https://..." }
  Entonces:  recibe 201 con la habitación creada incluyendo floor, wing e image_url

CRITERIO-6.2: Imagen se muestra en card de búsqueda
  Dado que:  la habitación tiene image_url definida
  Cuando:    el viajero busca disponibilidad
  Entonces:  el RoomCard muestra la imagen de la habitación
```

---

#### HU-ADM-07: Email de Confirmación de Reserva

```
Como:        Administrador
Quiero:      que al crear una reserva se envíe un correo al cliente con todos los datos
Para:        que el huésped tenga constancia de su reserva

Prioridad:   Media
Estimación:  M
Dependencias: HU-ADM-03
Capa:        Backend
```

#### Criterios de Aceptación — HU-ADM-07

**Happy Path**
```gherkin
CRITERIO-7.1: Email enviado al crear reserva desde admin
  Dado que:  el Administrador crea una reserva con customer_email válido
  Cuando:    la reserva se crea exitosamente
  Entonces:  se envía un email a customer_email con: reservation_code, hotel_name, room_number, checkin, checkout, total_amount

CRITERIO-7.2: Email enviado al confirmar reserva desde flujo público
  Dado que:  un viajero completa el pago exitosamente y proporcionó email
  Cuando:    la reserva se confirma (status CONFIRMED)
  Entonces:  se envía un email con los datos de la reserva
```

**Edge Case**
```gherkin
CRITERIO-7.3: Reserva se crea aunque falle el envío de email
  Dado que:  el servicio de email falla (SMTP down)
  Cuando:    se intenta enviar el email de confirmación
  Entonces:  la reserva se mantiene CONFIRMED y el error de email se loguea sin afectar al usuario
```

---

#### HU-ADM-08: Filtro de Ciudad en Buscador

```
Como:        Viajero
Quiero:      filtrar habitaciones por ciudad
Para:        encontrar habitaciones solo en la ciudad que me interesa

Prioridad:   Media
Estimación:  S
Dependencias: Ninguna (extiende endpoint existente GET /api/v1/rooms/available)
Capa:        Ambas
```

#### Criterios de Aceptación — HU-ADM-08

**Happy Path**
```gherkin
CRITERIO-8.1: Filtrar por ciudad
  Dado que:  existen habitaciones en "Buenos Aires" y "Mar del Plata"
  Cuando:    el viajero busca con city=Buenos Aires
  Entonces:  solo se muestran habitaciones de hoteles en Buenos Aires

CRITERIO-8.2: Sin filtro de ciudad muestra todas
  Dado que:  no se envía el parámetro city
  Cuando:    el viajero busca disponibilidad
  Entonces:  se muestran habitaciones de todas las ciudades
```

---

#### HU-ADM-09: Filtro de Presupuesto en Buscador

```
Como:        Viajero
Quiero:      filtrar habitaciones por rango de precio por noche
Para:        ver solo las habitaciones que se ajustan a mi presupuesto

Prioridad:   Media
Estimación:  S
Dependencias: Ninguna (extiende endpoint existente GET /api/v1/rooms/available)
Capa:        Ambas
```

#### Criterios de Aceptación — HU-ADM-09

**Happy Path**
```gherkin
CRITERIO-9.1: Filtrar por precio mínimo y máximo
  Dado que:  existen habitaciones con precios $80, $150, $350 y $500 por noche
  Cuando:    el viajero busca con min_price=100 y max_price=400
  Entonces:  solo se muestran habitaciones con price_per_night entre 100 y 400 ($150 y $350)

CRITERIO-9.2: Solo precio mínimo
  Dado que:  el viajero solo envía min_price=200
  Cuando:    busca disponibilidad
  Entonces:  se muestran habitaciones con price_per_night >= 200

CRITERIO-9.3: Solo precio máximo
  Dado que:  el viajero solo envía max_price=200
  Cuando:    busca disponibilidad
  Entonces:  se muestran habitaciones con price_per_night <= 200

CRITERIO-9.4: Sin filtro de precio muestra todas
  Dado que:  no se envían min_price ni max_price
  Cuando:    el viajero busca disponibilidad
  Entonces:  se muestran habitaciones de todos los precios
```

**Error Path**
```gherkin
CRITERIO-9.5: Precio mínimo mayor que máximo
  Dado que:  el viajero envía min_price=500 y max_price=100
  Cuando:    busca disponibilidad
  Entonces:  recibe 400 con { message: "min_price no puede ser mayor que max_price" }
```

---

#### HU-ADM-10: Consulta Pública de Reserva por Código

```
Como:        Viajero
Quiero:      ingresar mi código de reserva y ver todos los datos de mi reserva
Para:        corroborar que mi reserva está confirmada y revisar los detalles

Prioridad:   Alta
Estimación:  S
Dependencias: Ninguna (usa endpoint existente GET /api/v1/reservations?reservation_code=X)
Capa:        Frontend (endpoint ya existe)
```

#### Criterios de Aceptación — HU-ADM-10

**Happy Path**
```gherkin
CRITERIO-10.1: Consulta exitosa por código
  Dado que:  existe una reserva con código "ABC12345"
  Cuando:    el viajero ingresa "ABC12345" en la página /my-reservation
  Entonces:  se muestra: reservation_code, hotel_name, room_number, tipo, checkin, checkout, noches, precio por noche, total, status
```

**Error Path**
```gherkin
CRITERIO-10.2: Código no encontrado
  Dado que:  no existe reserva con código "XXXX0000"
  Cuando:    el viajero ingresa "XXXX0000"
  Entonces:  se muestra mensaje "No se encontró una reserva con ese código"

CRITERIO-10.3: Código vacío
  Dado que:  el viajero no ingresa código
  Cuando:    presiona el botón de buscar
  Entonces:  se muestra validación "Ingresá un código de reserva"
```

### Reglas de Negocio
1. Solo un usuario con rol `admin` puede acceder a los endpoints `/api/v1/admin/**`.
2. El password del admin se almacena hasheado con bcrypt (min 10 salt rounds).
3. El JWT tiene expiración de 8 horas.
4. El email del admin es único.
5. El email del cliente es único y es la clave de persistencia para métricas de "mejores clientes".
6. Las reservas creadas por admin no requieren flujo de hold/pago — se crean directamente como CONFIRMED.
7. Eliminar una reserva = cambiar status a CANCELLED (soft delete).
8. Eliminar un cliente es hard delete solo si no tiene reservas activas.
9. Las estadísticas del dashboard se calculan sobre reservas con status CONFIRMED.
10. El top de clientes y habitaciones se ordena por cantidad de reservas descendente.
11. Los campos `floor` (smallint), `wing` (varchar 50) e `image_url` (varchar 500) de Room son opcionales.
12. El email de confirmación se envía de forma async (fire-and-forget) para no bloquear la respuesta HTTP.
13. El filtro `city` en el endpoint de disponibilidad filtra por la ciudad del hotel vinculado a la habitación.
14. Si `image_url` está vacío, el frontend muestra un placeholder genérico.
15. Los filtros `min_price` y `max_price` son opcionales, de tipo numérico positivo, y filtran por `price_per_night` de la habitación.
16. Si se envían ambos, `min_price` debe ser <= `max_price`.
17. La consulta pública de reserva por código no requiere autenticación (es pública).
18. La página de consulta de reserva es accesible desde un enlace en la barra de navegación o en la página de confirmación.

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas
| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `Admin` | tabla `admins` | **nueva** | Usuario administrador con login local |
| `Customer` | tabla `customers` | **nueva** | Registro de clientes/huéspedes |
| `Reservation` | tabla `reservations` | **modificada** | Agrega `customer_email`, `customer_name` |
| `Room` | tabla `rooms` | **modificada** | Agrega `floor`, `wing`, `image_url` |

#### Campos: `Admin`
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `id` | uuid | sí | auto-generado (PK) | Identificador único |
| `email` | varchar(100) | sí | unique, formato email | Email del admin |
| `password_hash` | varchar(255) | sí | bcrypt hash | Password hasheado |
| `name` | varchar(100) | sí | max 100 chars | Nombre del admin |
| `created_at` | timestamptz | sí | auto-generado | Timestamp creación |
| `updated_at` | timestamptz | sí | auto-generado | Timestamp actualización |

#### Campos: `Customer`
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `id` | uuid | sí | auto-generado (PK) | Identificador único |
| `email` | varchar(100) | sí | unique, formato email | Email del cliente |
| `name` | varchar(100) | sí | max 100 chars | Nombre completo |
| `phone` | varchar(20) | no | formato teléfono | Teléfono de contacto |
| `created_at` | timestamptz | sí | auto-generado | Timestamp creación |
| `updated_at` | timestamptz | sí | auto-generado | Timestamp actualización |

#### Campos nuevos: `Room` (entidad existente)
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `floor` | smallint | no | 0-200 | Número de piso de la habitación |
| `wing` | varchar(50) | no | max 50 chars | Ala o sector del hotel (ej: "Norte", "Sur") |
| `image_url` | varchar(500) | no | URL válida, max 500 chars | URL de imagen de la habitación |

#### Campos modificados: `Reservation`
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `customer_email` | varchar(100) | no | formato email | Email del cliente que reservó |
| `customer_name` | varchar(100) | no | max 100 chars | Nombre del cliente |

#### Índices / Constraints
- `admins`: UNIQUE en `email`
- `customers`: UNIQUE en `email`
- `reservations`: INDEX en `customer_email` (para queries de dashboard)
- `rooms`: INDEX en `hotel_id` (ya existe, para JOIN con hotels para filtro de ciudad)

### API Endpoints

> Todos los endpoints bajo `/api/v1/admin/**` requieren header `Authorization: Bearer <jwt_token>` excepto `/auth/login`.

#### POST /api/v1/admin/auth/login
- **Descripción**: Autentica al administrador
- **Auth requerida**: no
- **Request Body**:
  ```json
  { "email": "admin@hotel.com", "password": "string" }
  ```
- **Response 200**:
  ```json
  { "access_token": "jwt_string", "admin": { "id": "uuid", "email": "string", "name": "string" } }
  ```
- **Response 401**: credenciales inválidas

#### GET /api/v1/admin/dashboard
- **Descripción**: Métricas y estadísticas de negocio
- **Auth requerida**: sí (JWT)
- **Response 200**:
  ```json
  {
    "total_revenue": 12500.00,
    "total_reservations": 45,
    "top_rooms": [
      { "room_id": "uuid", "room_number": "201", "hotel_name": "Hotel Grand BA", "reservation_count": 12, "revenue": 3600.00 }
    ],
    "top_customers": [
      { "email": "juan@mail.com", "name": "Juan Pérez", "reservation_count": 5, "total_spent": 2500.00 }
    ],
    "all_rooms_stats": [ ... ],
    "all_customers_stats": [ ... ]
  }
  ```

#### GET /api/v1/admin/reservations
- **Descripción**: Lista todas las reservas
- **Auth requerida**: sí
- **Query params opcionales**: `status`, `from_date`, `to_date`
- **Response 200**: array de reservas con datos enriquecidos

#### POST /api/v1/admin/reservations
- **Descripción**: Crea reserva manual (sin hold/pago)
- **Auth requerida**: sí
- **Request Body**:
  ```json
  { "room_id": "uuid", "checkin": "YYYY-MM-DD", "checkout": "YYYY-MM-DD", "customer_email": "string", "customer_name": "string" }
  ```
- **Response 201**: reserva creada
- **Response 409**: habitación no disponible

#### DELETE /api/v1/admin/reservations/:id
- **Descripción**: Cancela una reserva (soft delete → status CANCELLED)
- **Auth requerida**: sí
- **Response 200**: `{ "message": "Reserva cancelada" }`
- **Response 404**: reserva no encontrada

#### GET /api/v1/admin/customers
- **Descripción**: Lista todos los clientes
- **Auth requerida**: sí
- **Response 200**: array de clientes con métricas

#### GET /api/v1/admin/customers/:id
- **Descripción**: Detalle de un cliente
- **Auth requerida**: sí
- **Response 200**: cliente con historial de reservas
- **Response 404**: cliente no encontrado

#### POST /api/v1/admin/customers
- **Descripción**: Crea un cliente
- **Auth requerida**: sí
- **Request Body**:
  ```json
  { "email": "string", "name": "string", "phone": "string (opcional)" }
  ```
- **Response 201**: cliente creado
- **Response 409**: email duplicado

#### PATCH /api/v1/admin/customers/:id
- **Descripción**: Actualiza un cliente
- **Auth requerida**: sí
- **Request Body**: campos opcionales
- **Response 200**: cliente actualizado
- **Response 404**: no encontrado

#### DELETE /api/v1/admin/customers/:id
- **Descripción**: Elimina un cliente
- **Auth requerida**: sí
- **Response 204**: eliminado
- **Response 404**: no encontrado
- **Response 409**: tiene reservas activas

#### GET /api/v1/admin/rooms
- **Descripción**: Lista todas las habitaciones
- **Auth requerida**: sí
- **Response 200**: array de habitaciones con hotel_name

#### POST /api/v1/admin/rooms
- **Descripción**: Crea una habitación
- **Auth requerida**: sí
- **Request Body**:
  ```json
  { "room_number": "string", "hotel_id": "uuid", "type": "SINGLE|DOUBLE|SUITE", "price_per_night": 100.00, "capacity": 2, "amenities": ["wifi", "ac"], "floor": 3, "wing": "Norte", "image_url": "https://..." }
  ```
- **Response 201**: habitación creada
- **Response 409**: room_number duplicado en hotel

#### PATCH /api/v1/admin/rooms/:id
- **Descripción**: Actualiza una habitación
- **Auth requerida**: sí
- **Request Body**: campos opcionales
- **Response 200**: habitación actualizada
- **Response 404**: no encontrada

#### DELETE /api/v1/admin/rooms/:id
- **Descripción**: Elimina una habitación
- **Auth requerida**: sí
- **Response 204**: eliminada
- **Response 404**: no encontrada
- **Response 409**: tiene reservas activas

### Diseño Frontend

#### Componentes nuevos
| Componente | Archivo | Props principales | Descripción |
|------------|---------|------------------|-------------|
| `AdminLogin` | `components/AdminLogin/AdminLogin` | `onLoginSuccess` | Formulario email/password |
| `AdminSidebar` | `components/AdminSidebar/AdminSidebar` | `activePage, onNavigate` | Navegación lateral del panel |
| `StatsCard` | `components/StatsCard/StatsCard` | `title, value, icon` | Tarjeta de métrica individual |
| `DataTable` | `components/DataTable/DataTable` | `columns, data, onEdit, onDelete` | Tabla reutilizable con acciones |
| `AdminFormModal` | `components/AdminFormModal/AdminFormModal` | `fields, isOpen, onSubmit, onClose` | Modal genérico de formulario |
| `TopChart` | `components/TopChart/TopChart` | `data, title, valueKey` | Visualización top 5 (barras) |

#### Páginas nuevas
| Página | Archivo | Ruta | Protegida |
|--------|---------|------|-----------|
| `AdminLoginPage` | `pages/AdminLoginPage` | `/admin/login` | no |
| `AdminDashboardPage` | `pages/AdminDashboardPage` | `/admin/dashboard` | sí (JWT) |
| `AdminReservationsPage` | `pages/AdminReservationsPage` | `/admin/reservations` | sí (JWT) |
| `AdminCustomersPage` | `pages/AdminCustomersPage` | `/admin/customers` | sí (JWT) |
| `AdminRoomsPage` | `pages/AdminRoomsPage` | `/admin/rooms` | sí (JWT) |
| `MyReservationPage` | `pages/MyReservationPage` | `/my-reservation` | no (pública) |

#### Hooks y State
| Hook | Archivo | Retorna | Descripción |
|------|---------|---------|-------------|
| `useAdminAuth` | `hooks/useAdminAuth` | `{ token, admin, login, logout, isAuthenticated }` | Estado de sesión admin |
| `useAdminDashboard` | `hooks/useAdminDashboard` | `{ stats, loading, error, refresh }` | Métricas del dashboard |
| `useAdminReservations` | `hooks/useAdminReservations` | `{ reservations, loading, create, remove, refresh }` | CRUD reservas |
| `useAdminCustomers` | `hooks/useAdminCustomers` | `{ customers, loading, create, update, remove, refresh }` | CRUD clientes |
| `useAdminRooms` | `hooks/useAdminRooms` | `{ rooms, loading, create, update, remove, refresh }` | CRUD habitaciones |
| `useReservationLookup` | `hooks/useReservationLookup` | `{ reservation, loading, error, lookup }` | Consulta reserva por código |

#### Services (llamadas API)
| Función | Archivo | Endpoint |
|---------|---------|---------|
| `adminLogin(email, password)` | `services/adminService` | `POST /api/v1/admin/auth/login` |
| `getDashboard(token)` | `services/adminService` | `GET /api/v1/admin/dashboard` |
| `getReservations(token, filters?)` | `services/adminService` | `GET /api/v1/admin/reservations` |
| `createReservation(data, token)` | `services/adminService` | `POST /api/v1/admin/reservations` |
| `deleteReservation(id, token)` | `services/adminService` | `DELETE /api/v1/admin/reservations/:id` |
| `getCustomers(token)` | `services/adminService` | `GET /api/v1/admin/customers` |
| `getCustomer(id, token)` | `services/adminService` | `GET /api/v1/admin/customers/:id` |
| `createCustomer(data, token)` | `services/adminService` | `POST /api/v1/admin/customers` |
| `updateCustomer(id, data, token)` | `services/adminService` | `PATCH /api/v1/admin/customers/:id` |
| `deleteCustomer(id, token)` | `services/adminService` | `DELETE /api/v1/admin/customers/:id` |
| `getRooms(token)` | `services/adminService` | `GET /api/v1/admin/rooms` |
| `createRoom(data, token)` | `services/adminService` | `POST /api/v1/admin/rooms` |
| `updateRoom(id, data, token)` | `services/adminService` | `PATCH /api/v1/admin/rooms/:id` |
| `deleteRoom(id, token)` | `services/adminService` | `DELETE /api/v1/admin/rooms/:id` |
| `lookupReservation(code)` | `services/reservationService` | `GET /api/v1/reservations?reservation_code=X` |

### Arquitectura y Dependencias
- **Paquete nuevo backend**: `bcrypt` (hash passwords), `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` (autenticación JWT), `@nestjs-modules/mailer` + `nodemailer` (envío de emails)
- **Guard nuevo**: `AdminJwtGuard` — valida JWT en todos los endpoints admin excepto login
- **Módulo nuevo**: `AdminModule` — contiene auth, dashboard, CRUD reservas/clientes/habitaciones
- **Impacto en app.module.ts**: registrar `AdminModule`
- **Impacto en frontend/App.jsx**: agregar rutas `/admin/*` con `AdminProtectedRoute`
- **Impacto en endpoint existente**: `GET /api/v1/rooms/available` — agregar query param opcional `city` (string)
- **Impacto en componente existente**: `RoomCard` — mostrar `image_url` si existe, placeholder si no
- **Impacto en componente existente**: `SearchBar` — agregar select de ciudad
- **Servicio nuevo backend**: `MailService` — envío de emails con template de confirmación de reserva

### Notas de Implementación
1. El admin seed debe crearse en `backend/src/database/seeds/seed.ts` con email `admin@hotel.com` y password `admin123` (solo para desarrollo).
2. El JWT secret se toma de env var `JWT_SECRET` con fallback `hotel-admin-secret-dev`.
3. Las reservas creadas por admin llevan `hold_id: null` y `payment_id: null` porque no pasan por el flujo de hold/pago.
4. El campo `customer_email` en Reservation es nullable para no romper las reservas existentes creadas por el flujo normal.
5. El dashboard calcula revenue como `SUM(price_per_night * nights)` desde reservas CONFIRMED.
6. `AdminProtectedRoute` en frontend verifica que exista token JWT en localStorage antes de renderizar.
7. Los campos `floor`, `wing` e `image_url` de Room son nullable — las habitaciones existentes del seeder no se rompen.
8. El email se envía vía SMTP configurable con env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
9. En desarrollo, se puede usar MailHog o similar como servidor SMTP local (puerto 1025).
10. El filtro de ciudad se agrega al `AvailabilityQueryDto` como `city?: string` y filtra haciendo JOIN con la tabla `hotels`.
11. El seeder actualizado debe incluir `image_url` de ejemplo en las habitaciones existentes.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.

### Backend

#### Entidades y Modelos
- [ ] Crear entidad `Admin` en `modules/admin/entities/admin.entity.ts`
- [ ] Crear entidad `Customer` en `modules/admin/entities/customer.entity.ts`
- [ ] Agregar campos `customer_email`, `customer_name` a entidad `Reservation`
- [ ] Agregar campos `floor`, `wing`, `image_url` a entidad `Room`

#### DTOs
- [ ] Crear `LoginDto` — email, password
- [ ] Crear `CreateAdminReservationDto` — room_id, checkin, checkout, customer_email, customer_name
- [ ] Crear `CreateCustomerDto` — email, name, phone?
- [ ] Crear `UpdateCustomerDto` — name?, phone?
- [ ] Crear `CreateRoomDto` — room_number, hotel_id, type, price_per_night, capacity, amenities, floor?, wing?, image_url?
- [ ] Crear `UpdateRoomDto` — campos opcionales
- [ ] Agregar `city?: string`, `min_price?: number`, `max_price?: number` al `AvailabilityQueryDto` existente
- [ ] Agregar validación custom: min_price <= max_price cuando ambos están presentes

#### Auth
- [ ] Instalar `bcrypt`, `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`
- [ ] Implementar `AdminAuthService` — login, validateToken
- [ ] Implementar `JwtStrategy` (passport)
- [ ] Implementar `AdminJwtGuard`

#### Servicios
- [ ] Implementar `AdminDashboardService` — getStats()
- [ ] Implementar `AdminReservationsService` — list, create, cancel
- [ ] Implementar `AdminCustomersService` — CRUD completo
- [ ] Implementar `AdminRoomsService` — CRUD completo
- [ ] Implementar `MailService` — sendReservationConfirmation()
- [ ] Modificar `RoomsService.getAvailableRooms()` — agregar filtro por city (JOIN hotels) y por rango de precio (min_price/max_price)

#### Controladores
- [ ] Implementar `AdminAuthController` — POST /login
- [ ] Implementar `AdminDashboardController` — GET /dashboard
- [ ] Implementar `AdminReservationsController` — GET, POST, DELETE
- [ ] Implementar `AdminCustomersController` — GET, POST, PATCH, DELETE
- [ ] Implementar `AdminRoomsController` — GET, POST, PATCH, DELETE

#### Módulo y Wiring
- [ ] Crear `AdminModule` con todos los providers, controllers, imports
- [ ] Registrar `AdminModule` en `AppModule`
- [ ] Agregar admin seed en `seed.ts`
- [ ] Agregar `JWT_SECRET` al `docker-compose.yml`
- [ ] Agregar vars SMTP al `docker-compose.yml` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)
- [ ] (Opcional) Agregar servicio MailHog al `docker-compose.yml` para dev

#### Tests Backend
- [ ] `test_admin_login_success` — happy path login
- [ ] `test_admin_login_invalid_password` — credenciales inválidas
- [ ] `test_admin_dashboard_returns_stats` — métricas
- [ ] `test_admin_create_reservation_success` — crear reserva manual
- [ ] `test_admin_create_reservation_conflict` — habitación ocupada
- [ ] `test_admin_delete_reservation_success` — cancelar reserva
- [ ] `test_admin_crud_customers` — CRUD clientes
- [ ] `test_admin_crud_rooms` — CRUD habitaciones
- [ ] `test_admin_endpoints_require_jwt` — guard funciona
- [ ] `test_mail_service_sends_confirmation` — email se envía (mock SMTP)
- [ ] `test_availability_filter_by_city` — filtro ciudad funciona
- [ ] `test_availability_filter_by_price_range` — filtro presupuesto funciona
- [ ] `test_availability_filter_min_gt_max_returns_400` — validación min > max
- [ ] `test_room_with_floor_wing_image` — campos nuevos de Room persisten

### Frontend

#### Implementación
- [ ] Crear `services/adminService.js` — todas las llamadas API
- [ ] Crear `hooks/useAdminAuth.js` — login, logout, token en localStorage
- [ ] Crear `hooks/useAdminDashboard.js`
- [ ] Crear `hooks/useAdminReservations.js`
- [ ] Crear `hooks/useAdminCustomers.js`
- [ ] Crear `hooks/useAdminRooms.js`
- [ ] Crear componente `AdminLogin`
- [ ] Crear componente `AdminSidebar`
- [ ] Crear componente `StatsCard`
- [ ] Crear componente `DataTable`
- [ ] Crear componente `AdminFormModal`
- [ ] Crear componente `TopChart`
- [ ] Crear componente `AdminProtectedRoute`
- [ ] Crear página `AdminLoginPage`
- [ ] Crear página `AdminDashboardPage`
- [ ] Crear página `AdminReservationsPage`
- [ ] Crear página `AdminCustomersPage`
- [ ] Crear página `AdminRoomsPage`
- [ ] Registrar rutas admin en `App.jsx`
- [ ] Crear página `MyReservationPage` — formulario con input de código + card de resultado
- [ ] Crear `hooks/useReservationLookup.js` — llama a reservationService.lookupReservation()
- [ ] Agregar función `lookupReservation(code)` en `services/reservationService.js`
- [ ] Registrar ruta `/my-reservation` en `App.jsx`
- [ ] Agregar link a "Consultar reserva" en navegación o ConfirmationPage
- [ ] Modificar `SearchBar` — agregar select de ciudad y inputs de precio mín/máx
- [ ] Modificar `RoomCard` — mostrar imagen (image_url o placeholder)
- [ ] Modificar `useAvailableRooms` — pasar parámetros city, min_price, max_price
- [ ] Modificar `roomService.getAvailableRooms()` — aceptar params city, min_price, max_price

#### Tests Frontend
- [ ] `test_admin_login_form` — renderiza y envía
- [ ] `test_admin_dashboard_loads` — muestra métricas
- [ ] `test_admin_reservations_crud` — lista, crea, elimina
- [ ] `test_admin_customers_crud` — CRUD completo
- [ ] `test_admin_rooms_crud` — CRUD completo
- [ ] `test_admin_protected_route_redirects` — sin token redirige a login
- [ ] `test_room_card_shows_image` — muestra imagen o placeholder
- [ ] `test_search_bar_city_filter` — select de ciudad filtra resultados
- [ ] `test_search_bar_price_filter` — inputs de precio filtran resultados
- [ ] `test_my_reservation_page_lookup_success` — muestra datos de reserva
- [ ] `test_my_reservation_page_not_found` — muestra error si código no existe
- [ ] `test_my_reservation_page_empty_code` — validación código vacío

### QA
- [ ] Verificar login admin con credenciales válidas e inválidas
- [ ] Verificar que endpoints admin retornan 401 sin JWT
- [ ] Verificar dashboard con datos reales
- [ ] Verificar CRUD reservas end-to-end
- [ ] Verificar CRUD clientes end-to-end
- [ ] Verificar CRUD habitaciones end-to-end
- [ ] Verificar que las métricas de top clientes persisten por email
- [ ] Verificar consulta pública de reserva por código (happy path + not found)

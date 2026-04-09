# Hotel Booking Backend — NestJS + PostgreSQL

Motor de reservas MVP con bloqueo pesimista, pago idempotente y expiración automática de holds.

## Stack

- **Framework:** NestJS 10 (TypeScript)
- **Base de datos:** PostgreSQL 15 + TypeORM
- **Worker:** @nestjs/schedule (cron cada 5 min)
- **Validación:** class-validator + class-transformer

## Setup rápido (< 5 min)

### 1. Pre-requisitos
- Node.js 20+
- Docker + Docker Compose

### 2. Variables de entorno
```bash
cp .env.example .env
```

### 3. Levantar PostgreSQL
```bash
# Desde la raíz del proyecto
docker compose up postgres -d
```

### 4. Instalar dependencias
```bash
npm install
```

### 5. Poblar datos de prueba (HU1)
```bash
npm run seed
```

### 6. Iniciar el servidor
```bash
# Desarrollo con hot-reload
npm run start:dev

# Producción
npm run build && npm run start:prod
```

La API estará disponible en: `http://localhost:3000`

## Endpoints disponibles

| Método | Ruta | Descripción | HU |
|--------|------|-------------|-----|
| `GET` | `/api/v1/rooms/available?checkin=&checkout=` | Listar habitaciones disponibles | HU2 |
| `POST` | `/api/v1/rooms/:room_id/hold` | Crear hold atómico de 10 minutos | HU3 |
| `GET` | `/api/v1/holds/:hold_id` | Estado del hold + segundos restantes | HU4 |
| `POST` | `/api/v1/payments` | Procesar pago idempotente | HU5, HU6, HU7 |
| `GET` | `/api/v1/reservations/:id` | Obtener reserva por ID | HU6 |
| `GET` | `/api/v1/reservations?reservation_code=` | Obtener reserva por código | HU6 |

## Arquitectura

```
src/
├── app.module.ts           # Módulo raíz
├── main.ts                 # Entry point (puerto, pipes, CORS)
├── config/
│   └── database.config.ts  # Configuración TypeORM/PostgreSQL
├── common/
│   ├── filters/            # HttpExceptionFilter global
│   └── utils/              # generateReservationCode
└── modules/
    ├── hotels/             # Entidad Hotel (para seeder)
    ├── rooms/              # GET available + POST hold (HU2, HU3, HU11)
    ├── holds/              # GET hold estado (HU4)
    ├── payments/           # POST pago idempotente (HU5, HU6, HU7)
    ├── reservations/       # GET reserva (HU6)
    └── workers/            # Cron de expiración (HU8)
```

## Flujo de negocio

```
[Buscar disponibilidad]
GET /rooms/available?checkin=2026-04-10&checkout=2026-04-12
→ Excluye rooms con PENDING holds (no expirados) y CONFIRMED reservations en el rango

[Crear hold atómico]
POST /rooms/:id/hold
→ SELECT FOR UPDATE sobre la room → verifica conflictos → INSERT hold con expires_at = NOW() + 10min
→ HTTP 409 si ya hay hold activo

[Pagar (idempotente)]
POST /payments { hold_id, amount, idempotency_key }
→ Si ya existe el idempotency_key → retorna respuesta cacheada
→ Si simulador retorna SUCCESS → hold: CONFIRMED + crea reservation con código único
→ Si simulador retorna DECLINED → hold: RELEASED → HTTP 402

[Worker automático — cada 5 minutos]
UPDATE holds SET status='EXPIRED' WHERE status='PENDING' AND expires_at < NOW()
```

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3000` | Puerto del servidor HTTP |
| `DB_HOST` | `localhost` | Host PostgreSQL |
| `DB_PORT` | `5432` | Puerto PostgreSQL |
| `DB_USER` | `hotel_user` | Usuario DB |
| `DB_PASSWORD` | `hotel_pass` | Contraseña DB |
| `DB_NAME` | `hotel_booking` | Nombre de la base de datos |
| `HOLD_DURATION_MINUTES` | `10` | Duración del bloqueo (minutos) |
| `PAYMENT_SIMULATOR_DECLINE_RATE` | `0.2` | Tasa de rechazo del simulador (0.0–1.0) |

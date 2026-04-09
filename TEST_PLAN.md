# Plan de Pruebas (Test Plan) — Hotel Booking MVP

## 1. Introducción
Este documento define la estrategia, el alcance y el enfoque de pruebas para el MVP del Motor de Reservas de Hotel. El objetivo principal es garantizar la consistencia del inventario, la seguridad en los pagos y la correcta liberación de recursos expirados.

- **Feature**: `hotel-booking-mvp-holds-payments`
- **Spec de Referencia**: [.github/specs/hotel-booking-mvp-holds-payments.spec.md](.github/specs/hotel-booking-mvp-holds-payments.spec.md)
- **Estado**: Fase de Calidad Aumentada (QA)

## 2. Alcance de las Pruebas
Se validarán las Historias de Usuario (HU) críticas para la operación del negocio:
- **HU0**: Configuración de Ecosistema y Transacciones (ACID).
- **HU1**: Carga de Inventario (Seeders e Idempotencia).
- **HU2**: Consulta de Disponibilidad (Exclusión de holds/reservas).
- **HU3**: Bloqueo Atómico (Hold de 10 min y Race Conditions).
- **HU5**: Pago Idempotente (Claves de idempotencia y reintentos).
- **HU6**: Confirmación de Reserva (Generación de código único).
- **HU7**: Liberación Proactiva (Fallo de pago libera hold).
- **HU8**: Expiración Automática (Worker de limpieza).
- **HU11**: Integridad de Fechas (Validaciones de negocio).

### Fuera de Alcance
- Autenticación de usuarios (Firebase Auth en este MVP).
- Reglas de cancelación o reembolsos.
- Panel administrativo o reportes históricos.

## 3. Estrategia de Pruebas (Enfoque ASDD)
El proyecto sigue el flujo **ASDD (Agent Spec Software Development)**, priorizando pruebas automatizadas y validación de riesgos.

### 3.1. Niveles de Prueba
- **Unitarias (Backend/Frontend)**: Cobertura ≥ 80% en lógica de negocio (NestJS Jest / React Vitest).
- **Integración**: Flujos de base de datos (PostgreSQL/TypeORM) y contratos de API.
- **E2E / Aceptación**: Escenarios Gherkin validados manualmente o con automatización liviana.

### 3.2. Tipos de Pruebas
- **Pruebas Funcionales**: Validar criterios de aceptación (Happy/Error paths).
- **Pruebas de Concurrencia**: Validar bloqueos pesimistas para evitar double-booking.
- **Pruebas de Resiliencia**: Validar comportamiento del worker ante fallos y reintentos de pago.

## 4. Matriz de Riesgos (Regla ASD)
*Nota: Ver detalle extendido en `docs/output/qa/risk-matrix.md`*

| ID | Riesgo | Nivel (Regla ASD) | Mitigación |
|----|--------|-------------------|------------|
| R1 | Double Booking (Sobreventa) | **ALTO (A)** | Bloqueo pesimista en DB + Transacciones ACID. |
| R2 | Fallo en Idempotencia de Pago | **ALTO (A)** | Claves de idempotencia únicas en colección `payments`. |
| R3 | Inventario retenido por Holds expirados | **MEDIO (S)** | Worker de limpieza cada 5 minutos + validación en checkout. |
| R4 | Inconsistencia en fechas de reserva | **MEDIO (S)** | Validaciones en capa DTO y Logic Service. |

## 5. Criterios de Entrada y Salida
### 5.1. Entrada (DoR)
- Especificación técnica aprobada (`APPROVED`).
- Implementación de Backend y Frontend completada.
- Pruebas unitarias pasando al 100%.

### 5.2. Salida (DoD)
- 100% de escenarios críticos (Nivel ALTO) pasando.
- Matriz de riesgos actualizada y socializada.
- Documentación de Gherkin cases generada y validada.

## 6. Herramientas y Ambiente
- **Frameworks**: Jest (BE), Vitest (FE).
- **Lenguaje**: TypeScript / JavaScript.
- **Asistencia**: GitHub Copilot (Code), Gemini (Análisis de Riesgos/Gherkin).
- **Base de Datos**: PostgreSQL (Ambiente de pruebas local/CI).

## 7. Plan de Ejecución
1. **Fase 1**: Ejecución de Unidad Técnica (Completada).
2. **Fase 2**: Identificación de Riesgos y Casos Gherkin (QA Agent).
3. **Fase 3**: Ejecución de Pruebas Funcionales Aumentadas.
4. **Fase 4**: Cierre de Feature y actualización de Spec a `IMPLEMENTED`.

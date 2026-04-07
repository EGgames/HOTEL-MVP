# Branch Protection Setup — Shift Left CI

Guía para configurar GitHub Branch Protection Rules que bloqueen fusiones si
el workflow de CI falla. Esto complementa el pipeline de Shift Left.

---

## 1. Activar Required Status Checks

Ve a: **GitHub → Settings → Branches → Add rule**

Configura la misma regla para `main` y `dev`:

### Branch name pattern
```
main
```
```
dev
```

### Checks requeridos (marcar todos)

| Status Check | Job en el workflow |
|---|---|
| `Quality Gate` | `quality-gate` (job resumen, bloquea todo) |
| `[ Gate 0 ] Secret Scan` | `secret-scan` |
| `[ Gate 1a ] Lint — Backend (TypeScript)` | `lint-backend` |
| `[ Gate 1b ] Lint — Frontend (React)` | `lint-frontend` |
| `[ Gate 1c ] SAST — CodeQL (JS / TS)` | `sast` |
| `[ Gate 2a ] Tests — Backend (Jest)` | `test-backend` |
| `[ Gate 2b ] Tests — Frontend (Vitest)` | `test-frontend` |

> **Recomendación mínima:** solo agregar `Quality Gate` como required check.
> Es el job resumen que falla si cualquier otro job falla, reduciendo la
> cantidad de checks a configurar.

---

## 2. Opciones recomendadas de la rule

```
[x] Require a pull request before merging
    [x] Require approvals: 1
    [x] Dismiss stale pull request approvals when new commits are pushed

[x] Require status checks to pass before merging
    [x] Require branches to be up to date before merging
    Status checks:
      - Quality Gate   <-- el más importante

[x] Require conversation resolution before merging

[x] Do not allow bypassing the above settings
    (marcar para que aplique también a admins)
```

---

## 3. Secrets requeridos en el repositorio

Agrega estos secrets en **Settings → Secrets and variables → Actions**:

| Secret | Descripción | Obligatorio |
|---|---|---|
| `GITLEAKS_LICENSE` | Licencia Gitleaks para repos privados de organizaciones | Solo en orgs con repos privados |

> Para repos públicos o personales, `GITLEAKS_LICENSE` **no es necesario**.

---

## 4. CodeQL — Code Scanning Alerts

Los resultados del análisis SAST aparecen en:
**Security → Code scanning alerts**

Para bloquear PRs con alertas CodeQL de severidad alta:
1. Ve a **Settings → Code security and analysis**
2. Activa **Code scanning** → **Set up** → GitHub Actions
3. En Branch protection, agrega el check: `CodeQL / CodeQL — javascript-typescript`

---

## 5. Flujo visual del pipeline

```
push/PR → main|dev
        │
        ▼
[ Gate 0 ] Secret Scan (Gitleaks)
        │
        ├──────────────────────────┬───────────────────────────┐
        ▼                          ▼                           ▼
[ Gate 1a ]              [ Gate 1b ]                  [ Gate 1c ]
Lint Backend             Lint Frontend                SAST CodeQL
(ESLint TS)              (ESLint React)               (JS/TS)
        │                          │
        ▼                          ▼
[ Gate 2a ]              [ Gate 2b ]
Tests Backend            Tests Frontend
(Jest + cov)             (Vitest + cov)
        │                          │
        └──────────────────────────┘
                     │
                     ▼
              Quality Gate
          (Required Status Check)
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
      PASSED                 FAILED
   (merge ok)           (merge bloqueado)
```

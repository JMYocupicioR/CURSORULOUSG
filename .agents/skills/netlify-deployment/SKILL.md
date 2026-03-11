---
name: Netlify Deployment
description: Configuración y despliegue de CursoUSG en Netlify con Next.js 16, variables de entorno, y troubleshooting de builds.
---

# Netlify Deployment

## Configuración

**Archivo**: `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## Plugin de Next.js

El plugin `@netlify/plugin-nextjs` (v5.9.4) adapta Next.js App Router para Netlify:
- Convierte Server Components a Netlify Functions
- Maneja ISR (Incremental Static Regeneration)
- Soporta middleware de Edge
- Configura redirects y headers automáticamente

## Variables de Entorno Requeridas

| Variable | Servicio | Notas |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | URL pública del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Clave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | 🔒 Solo server-side |
| `MUX_TOKEN_ID` | Mux | Token de API |
| `MUX_TOKEN_SECRET` | Mux | 🔒 Secreto de API |
| `MUX_WEBHOOK_SECRET` | Mux | 🔒 Secreto de webhook |
| `STRIPE_SECRET_KEY` | Stripe | 🔒 Clave secreta |
| `STRIPE_PRICE_ID` | Stripe | ID del precio |
| `STRIPE_WEBHOOK_SECRET` | Stripe | 🔒 Secreto de webhook |
| `NEXT_PUBLIC_APP_URL` | App | URL base de producción |

> ⚠️ Las variables con 🔒 NO deben tener prefijo `NEXT_PUBLIC_` ya que contienen secretos.

## Node.js Version

Archivo `.nvmrc` especifica la versión de Node:
```
v20
```

Asegurar que Netlify use Node 20+ en la configuración del sitio.

## Build Command

```bash
npm run build  →  next build
```

## Troubleshooting Común

### 1. Error de TypeScript en Build
Revisar `typescript-errors.txt` y `ts-error.txt` en la raíz del proyecto para errores previos documentados.

### 2. Cache de Netlify
Si hay problemas de deploy, limpiar cache:
- Netlify Dashboard → Site → Deploys → Trigger deploy → Clear cache and deploy site

### 3. Middleware y Edge
El middleware en `src/middleware.ts` se ejecuta en Edge Runtime. Si hay dependencias incompatibles con Edge, moverlas a Server Actions.

### 4. Variables de Entorno No Reconocidas
Las variables `NEXT_PUBLIC_*` se embeben en build time. Si cambias una:
1. Actualizar en Netlify Dashboard → Site → Environment Variables
2. Trigger nuevo deploy (el cambio NO aplica en deploys existentes)

## Estructura de Build Output

```
.next/
├── cache/
├── server/           → Funciones serverless en Netlify
├── static/           → Assets estáticos
└── BUILD_ID
```

## Scripts de Utilidad

El proyecto incluye scripts auxiliares:
- `scripts/check-db.js` — verificación de conexión a DB
- `fix_migrations.py` — corrección de migraciones

## Archivos de Referencia
- `netlify.toml` — configuración de Netlify
- `.nvmrc` — versión de Node.js
- `next.config.ts` — configuración de Next.js
- `package.json` — scripts de build
- `build.log`, `build2.log`, `build_output.txt` — logs de builds anteriores

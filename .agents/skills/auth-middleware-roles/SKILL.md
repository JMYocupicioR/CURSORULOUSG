---
name: Authentication & Middleware Roles
description: Middleware de Next.js con Supabase SSR para protección de rutas por roles, manejo de cookies, y flujo de registro con estado pendiente.
---

# Authentication & Middleware Roles

## Middleware Principal

**Archivo**: `src/middleware.ts`

El middleware intercepta TODAS las rutas (excepto archivos estáticos) y aplica lógica de autenticación + autorización.

## Flujo de Autenticación Supabase SSR

```typescript
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name) { return request.cookies.get(name)?.value },
      set(name, value, options) {
        // Actualizar tanto la request como la response
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value, ...options })
      },
      remove(name, options) {
        // Mismo patrón pero con value vacío
      }
    }
  }
)
```

> ⚠️ El patrón de `set/remove` requiere reconstruir el `NextResponse.next()` cada vez que se modifica una cookie. Esto es una particularidad de Supabase SSR.

## Reglas de Redireccionamiento

| Condición | Ruta Accesada | Redirige A |
|-----------|---------------|------------|
| Autenticado | `/login`, `/register` | `/dashboard` |
| No autenticado | Ruta protegida | `/login` |
| Admin | `/dashboard` | `/admin` |
| No admin | `/admin` | `/dashboard` |
| Inactivo (no admin) | Ruta de contenido | `/pending` |

### Rutas Protegidas
```typescript
const protectedRoutes = ['/dashboard', '/admin', '/perfil', '/aprendiz']
```

### Rutas de Contenido Estudiantil
```typescript
const studentContentRoutes = [
  '/dashboard', '/courses', '/lessons', '/microlearning',
  '/community', '/progress', '/certificates', '/profile'
]
```

## Verificación de Rol

El middleware hace una query a `profiles` en cada request protegida:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role, is_active')
  .eq('id', user.id)
  .single()

const isAdmin = profile?.role === 'admin'
const isActive = profile?.is_active === true
```

> ⚠️ Consideración de rendimiento: esta query se ejecuta en CADA request. Considerar caching o JWT custom claims como optimización futura.

## Matcher

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

Excluye: archivos estáticos, imágenes, favicon.

## Flujo de Registro

```
1. /register → crear cuenta en Supabase Auth
2. Trigger de DB crea profile con is_active: false
3. Redirect a /pending → pantalla de espera
4. Admin aprueba → is_active: true
5. Próximo login → middleware permite acceso a /dashboard
```

## Clientes de Supabase

| Archivo | Tipo | Uso |
|---------|------|-----|
| `src/lib/supabase/server.ts` | SSR Client | Server Components, Server Actions |
| `src/lib/supabase/admin.ts` | Service Role | Operaciones admin (bypass RLS) |
| `src/middleware.ts` | SSR Client (inline) | Middleware |

## Páginas de Auth
- `/login` — inicio de sesión
- `/register` — registro de nuevo usuario
- `/forgot-password` — recuperación de contraseña
- `/pending` — pantalla de espera para aprobación
- `/auth/callback` — callback de Supabase Auth (magic links, OAuth)

## Archivos de Referencia
- `src/middleware.ts` — middleware principal
- `src/lib/supabase/server.ts` — cliente SSR
- `src/lib/supabase/admin.ts` — cliente service role
- `src/app/login/` — página de login
- `src/app/register/` — página de registro
- `src/app/pending/PendingClient.tsx` — pantalla de espera

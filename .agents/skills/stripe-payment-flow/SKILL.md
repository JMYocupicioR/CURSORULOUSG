---
name: Stripe Payment Flow
description: Flujo de pagos con Stripe para CursoUSG. Cubre la creación de checkout sessions, manejo de URLs de retorno, promo codes, y patrón de redirect desde server action.
---

# Stripe Payment Flow

## Configuración

```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
})
```

### Variables de Entorno Requeridas
| Variable | Descripción |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_PRICE_ID` | ID del precio del producto |
| `NEXT_PUBLIC_APP_URL` | URL base de la app (para callbacks) |

## Crear Checkout Session

```typescript
export async function createCheckoutSession(formData: FormData) {
  const email = formData.get('email')?.toString()
  const priceId = process.env.STRIPE_PRICE_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',                           // Pago único (no subscription)
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email || undefined,
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout?canceled=true`,
    metadata: { source: 'landing_page' },
    billing_address_collection: 'required',    // Compliance LATAM
    allow_promotion_codes: true,               // Códigos de descuento
    payment_intent_data: {
      description: 'Diplomado en Rehabilitación Intervencionista...',
    },
  })

  return { url: session.url }  // ← Client handles redirect
}
```

## Patrón de Redirect

> ⚠️ Los Server Actions de Next.js no pueden hacer `redirect()` directamente en un formulario con Stripe. El patrón es:
1. Server Action retorna `{ url: session.url }`
2. El componente cliente llama `window.location.href = result.url`

## URLs de Retorno

| Escenario | URL |
|-----------|-----|
| Pago exitoso | `/checkout/success?session_id=cs_xxx` |
| Pago cancelado | `/checkout?canceled=true` |

## Webhook de Stripe

El webhook en `src/app/api/webhooks/` procesa eventos como:
- `checkout.session.completed` — activar acceso del estudiante
- `payment_intent.succeeded` — registrar pago en tabla `payments`

## Tabla `payments`

Campos clave:
- `amount` — monto pagado
- `status` — `"paid"` | `"pending"`
- `created_at` — fecha del pago

El admin dashboard usa esta tabla para:
- Calcular ingresos del mes: `payments.filter(status === 'paid').reduce(sum, amount)`
- Contar facturas pendientes: `payments.filter(status === 'pending').length`

## Archivos de Referencia
- `src/app/actions/stripe.ts` — server action de checkout
- `src/app/checkout/` — páginas de checkout y success
- `src/app/api/webhooks/` — webhook handler
- `src/app/admin/page.tsx` — dashboard con KPI de ingresos

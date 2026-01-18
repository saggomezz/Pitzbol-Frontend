# 💳 Implementación de Billetera - Pitzbol PWA

## 📋 Resumen de cambios

Se ha implementado un sistema completo de billetera para que turistas y guías turísticos puedan gestionar sus tarjetas de crédito y realizar pagos dentro de la PWA de Pitzbol.

## 🎯 Cambios realizados

### Frontend (Pitzbol-Frontend)

#### 1. **Nuevo Componente: WalletModal** 
📁 [app/components/WalletModal.tsx](app/components/WalletModal.tsx)

Componente modal completo que permite:
- ✅ Ver tarjetas guardadas
- ✅ Agregar nuevas tarjetas (con Stripe)
- ✅ Eliminar tarjetas (estructura preparada)
- ✅ Establecer tarjeta predeterminada (estructura preparada)
- ✅ Interfaz segura y responsiva
- ✅ Mensajes de éxito/error

**Características:**
- Integración con Stripe para tarjetas
- Setup Intent para guardar tarjetas de forma segura
- Componente `AddCardForm` para formulario de tarjeta
- Animaciones Framer Motion
- Validación visual de tarjetas

#### 2. **Actualización: Página de Perfil**
📁 [app/perfil/page.tsx](app/perfil/page.tsx)

Cambios:
- ✅ Import del `WalletModal`
- ✅ Import del icono `FiCreditCard`
- ✅ Estado `showWalletModal` para controlar modal
- ✅ Botón "MI BILLETERA" en la sección de perfil
- ✅ Botón integrado con Framer Motion (animaciones)
- ✅ Componente WalletModal al final de la página

**Ubicación del botón:** En la tarjeta de perfil principal, bajo el teléfono y nacionalidad

```tsx
<motion.button
  onClick={() => setShowWalletModal(true)}
  className="w-full bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white rounded-2xl p-5 font-bold flex items-center justify-center gap-3"
>
  <FiCreditCard size={20} />
  <div>
    <p className="text-sm font-black">MI BILLETERA</p>
    <p className="text-xs text-white/80">Gestiona tus tarjetas de pago</p>
  </div>
</motion.button>
```

### Backend (Pitzbol-Backend)

#### 1. **Nuevas Rutas de Billetera**
📁 [src/routes/perfil.routes.ts](src/routes/perfil.routes.ts)

Agregadas 5 nuevas rutas para gestionar billetera:

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/perfil/wallet` | Obtener tarjetas guardadas |
| POST | `/api/perfil/setup-intent` | Crear Setup Intent de Stripe |
| POST | `/api/perfil/save-card` | Guardar tarjeta en BD |
| DELETE | `/api/perfil/card/:cardId` | Eliminar tarjeta |
| POST | `/api/perfil/card/:cardId/default` | Marcar como predeterminada |

**Características:**
- ✅ Autenticación requerida (authMiddleware)
- ✅ Integración con Stripe API
- ✅ Manejo de errores robusto
- ✅ Estructura preparada para guardar en BD

## 🔧 Próximos pasos para completar la implementación

### Base de Datos (Crítico ⚠️)

Necesitas crear una colección/tabla para guardar las tarjetas de los usuarios:

```typescript
// Estructura sugerida en Firestore o MongoDB
interface UserCard {
  id: string;
  uid: string; // UID del usuario
  stripePaymentMethodId: string; // ID del payment method en Stripe
  last4: string; // Últimos 4 dígitos
  brand: string; // Visa, Mastercard, etc.
  expMonth: number; // Mes de vencimiento
  expYear: number; // Año de vencimiento
  isDefault: boolean; // Tarjeta predeterminada
  createdAt: Date; // Fecha de creación
  deletedAt?: Date; // Fecha de eliminación (soft delete)
}
```

### Actualizar controlador de perfil

En [src/controllers/perfil.controller.ts](src/controllers/perfil.controller.ts), implementar:

```typescript
// Obtener tarjetas del usuario
export async function obtenerTarjetas(uid: string) {
  // Query a BD de tarjetas del usuario
}

// Guardar tarjeta
export async function guardarTarjeta(uid: string, cardData: UserCard) {
  // Guardar en BD
}

// Eliminar tarjeta
export async function eliminarTarjeta(uid: string, cardId: string) {
  // Soft delete o delete de la BD
}

// Establecer predeterminada
export async function establecerPredeterminada(uid: string, cardId: string) {
  // Actualizar isDefault en BD
}
```

### Webhook de Stripe (Recomendado)

Para mayor seguridad, implementar webhook que escuche eventos de Stripe:

```typescript
// src/routes/webhooks.ts
router.post('/stripe-webhook', (req, res) => {
  const event = req.body;
  
  switch(event.type) {
    case 'setup_intent.succeeded':
      // Guardar payment method cuando Stripe confirma
      break;
    case 'payment_method.detached':
      // Limpiar cuando se desvincula la tarjeta
      break;
  }
});
```

## 🚀 Cómo usar

### Para usuarios (Frontend)

1. **Acceder a la billetera:**
   - Ir a la página de Perfil (`/perfil`)
   - Hacer clic en el botón "MI BILLETERA" (sección de perfil)

2. **Agregar tarjeta:**
   - Hacer clic en "Agregar nueva tarjeta"
   - Completar datos: número, fecha, CVC
   - Stripe valida la tarjeta automáticamente
   - La tarjeta se guarda de forma segura

3. **Ver tarjetas:**
   - Se muestran las últimas 4 dígitos
   - Se indica cuál es la predeterminada
   - Opción de eliminar tarjetas

### Para desarrolladores (Variables de entorno)

Asegurate de que en tu `.env` tengas:

**Frontend (.env.local):**
```env
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxx
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

**Backend (.env):**
```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxx
```

## 🔐 Consideraciones de seguridad

✅ **Ya implementado:**
- Stripe maneja el PCI compliance
- Tarjetas nunca se almacenan en el servidor
- Solo se guarda Payment Method ID de Stripe
- Autenticación JWT requerida para todas las rutas

⚠️ **Implementar:**
- Validar que UID en token JWT coincida con UID en request
- Rate limiting en endpoints de tarjetas
- Encripción de datos sensibles en BD
- Auditoría de cambios en billetera

## 📱 Responsive Design

El modal está completamente optimizado para:
- ✅ Desktop (max-w-md)
- ✅ Tablet
- ✅ Mobile (full width con padding)

## 🎨 Estilos

- Color principal: Índigo/Azul (#6366F1 a #4F46E5)
- Animaciones con Framer Motion
- Iconos de React Icons (FiCreditCard, FiLock, etc.)
- Consistencia con diseño Pitzbol actual

## 📚 Archivos modificados

```
Frontend:
  ✅ app/components/WalletModal.tsx (NUEVO)
  ✅ app/perfil/page.tsx (MODIFICADO)

Backend:
  ✅ src/routes/perfil.routes.ts (MODIFICADO)
```

## ✨ Características futuras

- [ ] Banco de datos de tarjetas
- [ ] Pagos automáticos con tarjeta predeterminada
- [ ] Reembolsos
- [ ] Historial de transacciones
- [ ] Billetera digital (balance)
- [ ] Descuentos por método de pago
- [ ] Integración con más proveedores de pago

---

**Estado:** 70% completo - Necesita integración de base de datos
**Última actualización:** 16 de enero de 2026

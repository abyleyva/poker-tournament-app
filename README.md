# Torneo de Póquer — Administrador de Torneos de Texas Hold'em

Aplicación web para administrar un torneo de póquer de principio a fin:

- **Niveles de ciegas**: ciega chica, ciega grande, ante (opcional), duración y descansos intermedios.
- **Jugadores**: agrégalos y cada uno recibe un link de invitación único para ver su stack y la tabla de posiciones desde su propio celular.
- **Reloj en vivo**: pantalla grande (modo TV) que muestra el nivel actual, cuenta regresiva y el siguiente nivel. Se actualiza sola, sin que nadie tenga que darle "refresh".
- **Control de entradas**: moneda, costo de entrada (buy-in), fichas iniciales, recompra (rebuy) y add-on, con límite opcional de recompras.
- **Premios**: define cuántos lugares pagan y qué porcentaje de la bolsa recibe cada uno; el monto se calcula solo según las entradas, recompras y add-ons registrados.

Está construida con Next.js (App Router), TypeScript, Tailwind CSS, y Drizzle ORM sobre PostgreSQL. No usa websockets: cada pantalla se actualiza sola cada 2–3 segundos, y el servidor es la única fuente de verdad para el reloj (aunque nadie tenga la pantalla abierta durante un rato, al volver a consultarla el nivel se pone al día solo).

## Cómo funciona sin necesidad de "cuentas" o login

No hay sistema de usuarios/contraseñas. En su lugar, cada torneo genera tres tipos de link:

1. **Link de administrador** (`/tournaments/[id]/admin?admin=TOKEN`): controla el reloj, agrega jugadores, registra recompras, elimina jugadores, etc. **No lo compartas** — quien lo tenga puede controlar el torneo.
2. **Link de pantalla** (`/tournaments/[id]/display`): pantalla pública de solo lectura pensada para proyectar en una TV o pantalla grande.
3. **Link de jugador** (`/join/TOKEN`): uno distinto por cada jugador invitado. Ahí ve su stack, su posición y puede pedir una recompra (el organizador lo ve reflejado en su panel).

El navegador del organizador recuerda los torneos que ha creado (en `localStorage`) para que aparezcan en la página de inicio, pero el link de administrador funciona desde cualquier dispositivo/navegador.

## Correr el proyecto en tu computadora

```bash
npm install
cp .env.example .env   # y edita DATABASE_URL para que apunte a tu Postgres
npm run db:migrate      # crea las tablas
npm run dev              # http://localhost:3000
```

Necesitas una base de datos PostgreSQL a la que puedas conectarte (local o en la nube). Si no tienes Postgres instalado localmente, la forma más rápida es crear una gratis en Supabase (ver abajo) y usar esa misma cadena de conexión para desarrollo.

## Publicarla gratis (Vercel + Supabase)

Esto permite que los jugadores entren desde su propio celular a cualquier hora, no solo mientras tu computadora esté prendida.

### 1. Crea la base de datos en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta gratis.
2. Crea un proyecto nuevo (elige una contraseña para la base de datos y guárdala).
3. Ve a **Project Settings → Database → Connection string** y copia la cadena en modo **Transaction pooler** (puerto 6543), que es la recomendada para funciones serverless como las de Vercel. Se ve algo así:
   ```
   postgres://postgres.xxxxxxxx:TU-PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres
   ```

### 2. Sube el proyecto a GitHub

```bash
git init
git add .
git commit -m "Torneo de póquer"
```

Crea un repositorio en GitHub y sigue las instrucciones para subir (`git remote add origin ...` y `git push`).

### 3. Despliega en Vercel

1. Entra a [vercel.com](https://vercel.com), crea una cuenta gratis (puedes usar tu cuenta de GitHub) e importa el repositorio.
2. En **Environment Variables**, agrega:
   - `DATABASE_URL` = la cadena de conexión de Supabase del paso 1.
3. Dale a **Deploy**.

### 4. Crea las tablas en la base de datos de producción

Desde tu computadora, con `DATABASE_URL` apuntando a Supabase (puedes ponerla temporalmente en tu `.env` local o exportarla en la terminal):

```bash
DATABASE_URL="postgres://...supabase..." npm run db:migrate
```

Esto aplica las migraciones SQL que están en la carpeta `drizzle/`. Solo necesitas hacerlo una vez (y de nuevo cada vez que cambies el esquema en `src/db/schema.ts` y generes una migración nueva con `npm run db:generate`).

Listo — la URL que te dio Vercel (algo como `https://tu-proyecto.vercel.app`) ya es tu aplicación en vivo. Crea un torneo desde ahí y comparte los links de pantalla/jugador con quien quieras.

### Alternativas

- En vez de Supabase puedes usar cualquier Postgres administrado (Neon, Railway, Render, RDS, etc.) — solo cambia `DATABASE_URL`.
- En vez de Vercel puedes usar cualquier hosting que soporte Next.js (Railway, Render, un VPS con `npm run build && npm run start`, etc.).

## Estructura del proyecto

```
src/
  db/                 esquema de la base de datos (Drizzle) y cliente de conexión
  lib/
    tournament-logic.ts   matemática pura: avance del reloj, bolsa de premios, formato de moneda/tiempo
    tournament-service.ts capa de datos: crear/leer/actualizar torneos, jugadores, control del reloj
    view.ts                da forma a la respuesta pública vs. de administrador
    i18n.tsx                diccionario español/inglés y el selector de idioma
  app/
    page.tsx                       inicio (lista de tus torneos en este navegador)
    tournaments/new/                asistente para crear un torneo
    tournaments/[id]/admin/         panel de control del organizador
    tournaments/[id]/display/       pantalla pública tipo "reloj de torneo"
    join/[token]/                    vista del jugador invitado
    api/                             endpoints (crear torneo, control del reloj, jugadores, etc.)
drizzle/               migraciones SQL generadas a partir del esquema
```

## Posibles mejoras futuras

- Editar la estructura de niveles de ciegas después de creado el torneo (hoy solo se pueden editar antes de iniciar, desde la base de datos directamente).
- Enviar el link de invitación por correo automáticamente (requeriría configurar un servicio como Resend o SendGrid).
- Historial de torneos pasados y estadísticas acumuladas por jugador.

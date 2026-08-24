# Lote a Lote

Marketplace de terrenos a cuotas (Paraguay, con Argentina/Brasil/Uruguay habilitados).
Backend real en Node.js + Express + PostgreSQL, con cuentas de usuario, login y un
usuario administrador.

## Qué incluye

- Registro / login por email y contraseña (contraseñas hasheadas con bcrypt, sesión
  en cookie httpOnly firmada).
- Un usuario administrador que se crea solo al arrancar el servidor, a partir de las
  variables de entorno `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- Publicar lotes (título, país, zona, precio en USD o guaraníes, teléfono, descripción,
  hasta 2 fotos comprimidas), marcar como vendido, eliminar.
- Ofertar, contraofertar, aceptar, rechazar o retirar una oferta — con negociación
  turno por turno, igual que en la maqueta que probamos antes.
- Panel de administración (`/` → pestaña "Admin"): estadísticas, lista de usuarios,
  y puede eliminar cualquier lote (no solo los propios).

## Correrlo en tu máquina

Necesitás Node 18+ y una base PostgreSQL (local o remota).

```bash
npm install
cp .env.example .env    # editá DATABASE_URL, ADMIN_EMAIL y ADMIN_PASSWORD
npm start
```

El servidor migra la base de datos solo al arrancar (crea las tablas si no existen y
crea/confirma el usuario administrador). Abrí `http://localhost:3000`.

## Subirlo a GitHub

```bash
cd lote-a-lote
git init
git add .
git commit -m "Lote a Lote: marketplace con login y admin"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/lote-a-lote.git
git push -u origin main
```

(Creá el repo vacío en GitHub primero, en https://github.com/new — no hace falta
tildar "Add a README", ya lo tenés acá.)

## Desplegarlo en Render

Este proyecto trae un `render.yaml` (Blueprint) que crea junto el servicio web y la
base de datos Postgres:

1. En Render: **New → Blueprint**, elegí el repo que acabás de subir.
2. Render va a detectar `render.yaml` y proponerte crear:
   - una base de datos Postgres (`lote-a-lote-db`, plan free)
   - un servicio web (`lote-a-lote`, plan free) conectado a esa base
3. Antes de confirmar, te va a pedir los dos valores marcados `sync: false`:
   - `ADMIN_EMAIL`: el email con el que vas a entrar como administrador
   - `ADMIN_PASSWORD`: una contraseña segura (podés cambiarla después iniciando
     sesión y, más adelante, agregando una pantalla de "cambiar contraseña" si la
     necesitás — hoy no está incluida)
4. Confirmá. El primer deploy corre `npm install` y `npm start`, que de paso migra la
   base y crea tu usuario administrador.
5. Cuando termine, Render te da una URL tipo `https://lote-a-lote.onrender.com` —
   abrila y probá que ande antes de conectar el dominio.

**Nota sobre el plan free de Render:** el servicio web gratis se "duerme" tras un
rato sin tráfico (la primera visita después de dormido tarda unos segundos en
responder) y la base Postgres gratis tiene un límite de tiempo de vida (Render la
avisa por mail antes de que expire). Para un sitio en producción real, conviene
pasar el servicio web y la base a un plan pago cuando el proyecto lo justifique.

## Conectar terrenos.fermadi.com.py

1. En el servicio web dentro de Render: **Settings → Custom Domains → Add Custom
   Domain**, ingresá `terrenos.fermadi.com.py`.
2. Render te va a mostrar un registro para agregar en tu proveedor de DNS. Normalmente
   es un **CNAME**:

   | Tipo  | Nombre     | Valor                        |
   |-------|------------|-------------------------------|
   | CNAME | terrenos   | lote-a-lote.onrender.com     |

   (el valor exacto te lo confirma Render en esa pantalla — puede variar).
3. Entrá al panel de DNS de `fermadi.com.py` (donde tengas contratado el dominio) y
   agregá ese registro CNAME.
4. Los DNS pueden tardar de minutos a un par de horas en propagarse. Render emite el
   certificado HTTPS automáticamente apenas detecta el dominio apuntando bien.

## Variables de entorno

Ver `.env.example`. En Render, `DATABASE_URL` y `JWT_SECRET` ya quedan resueltas
automáticamente por el Blueprint; solo tenés que completar `ADMIN_EMAIL` y
`ADMIN_PASSWORD` la primera vez.

## Estructura del proyecto

```
src/
  server.js       — arma la app Express, sirve el frontend y las rutas /api
  db.js           — pool de conexión a Postgres
  auth.js         — cookies de sesión (JWT), middlewares requireAuth/requireAdmin
  routes/
    auth.js       — registro, login, logout, /me
    listings.js   — CRUD de lotes
    offers.js     — ofertas, contraofertas, aceptar/rechazar/retirar
    admin.js      — estadísticas y listado de usuarios (solo admin)
scripts/
  schema.sql      — esquema de la base (se aplica solo, es idempotente)
  migrate.js      — aplica el esquema y siembra el usuario administrador
public/
  index.html      — frontend (mismo diseño que la maqueta)
  app.js          — lógica de cliente: llama a la API en vez de guardar localmente
render.yaml        — Blueprint de Render (web service + Postgres)
```

## Lo que falta si esto crece

Es un MVP funcional pensado para lanzar ya. Cosas típicas que se agregan después,
en la medida que haga falta: recuperar contraseña por email, verificación de email,
subida de fotos a un storage externo en vez de guardarlas como base64 en la base
(hoy funciona bien para pocas fotos livianas, pero no escala indefinidamente),
paginación en Explorar cuando haya muchos lotes, y notificaciones cuando alguien te
hace una oferta.

# Base de datos FastLedger

La app incluye dos capas:

- `FastLedgerAuth`: registro, inicio de sesion y verificacion de correo con Supabase Auth.
- `FastLedgerDB`: registro de usuarios verificados y consultas anteriores.

## Modo actual

Si no existe configuracion remota, FastLedger guarda consultas en `localStorage` del navegador. El registro e inicio de sesion quedan bloqueados para no aceptar correos ficticios sin verificacion real.

## Modo Supabase

Para usar una base de datos real y verificacion de correo, copia `src/config.example.js` como `config.js` y llena:

```js
window.FASTLEDGER_SUPABASE = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU_ANON_KEY"
};
```

Luego enlaza `config.js` antes de `src/auth.js` y `src/database.js` en `index.html`.

```html
<script src="config.js"></script>
<script src="src/auth.js"></script>
<script src="src/database.js"></script>
```

## Supabase Auth

En Supabase:

1. Abre `Authentication` > `Providers` > `Email`.
2. Activa `Confirm email`.
3. Configura `Site URL` con:

```text
https://pablinvb.github.io/FASTLEDGER/
```

4. En `Redirect URLs`, agrega:

```text
https://pablinvb.github.io/FASTLEDGER/
```

Con esto, el registro envia un correo de verificacion. El usuario no puede iniciar sesion hasta confirmar el enlace.

## Tablas recomendadas

```sql
create table users (
  id text primary key,
  name text not null,
  email text not null,
  email_verified boolean default true,
  created_at timestamptz not null,
  last_seen_at timestamptz not null
);

create table consultations (
  id text primary key,
  user_email text not null,
  user_name text not null,
  role text not null,
  message text not null,
  quote jsonb,
  created_at timestamptz not null
);
```

## Nota de seguridad

Nunca guardes contrasenas directamente en tablas. Usa Supabase Auth, Firebase Auth u otro proveedor de autenticacion.

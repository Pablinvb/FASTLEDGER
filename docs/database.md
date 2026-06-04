# Base de datos FastLedger

La app incluye una capa `FastLedgerDB` para registrar usuarios y consultas.

## Modo actual

Si no existe configuracion remota, FastLedger guarda datos en `localStorage` del navegador. Esto sirve para pruebas, pero no comparte datos entre dispositivos ni usuarios.

## Modo Supabase

Para usar una base de datos real, crea un archivo `config.js` antes de `src/database.js` con:

```js
window.FASTLEDGER_SUPABASE = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU_ANON_KEY"
};
```

Luego enlaza `config.js` antes de `src/database.js` en `index.html`.

## Tablas recomendadas

```sql
create table users (
  id text primary key,
  name text not null,
  email text not null,
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

El prototipo no debe guardar contrasenas directamente en tablas. Para produccion usa Supabase Auth, Firebase Auth u otro proveedor de autenticacion.

# Farmacia Ocampo

Sistema de gestion para farmacia construido con Next.js, TypeScript, Tailwind CSS y Supabase.

## Funcionalidades

- Login con Supabase Auth.
- Registro de productos con precio, costo, tipo, unidad, presentacion, ubicacion, descripcion, dosis, stock inicial y stock minimo.
- Codigos automaticos autoincrementales: productos `FO-MED-000001`, ventas `FO-VTA-2026-000001` y movimientos `FO-MOV-2026-000001`.
- Consulta de medicamentos por nombre, codigo, tipo, descripcion o dosis.
- Catalogos de unidades, presentaciones y tipos de producto.
- Alertas de inventario cuando el stock llega al minimo configurado.
- Registro de ventas con detalle de productos y descuento automatico de inventario.
- Entradas, salidas y ajustes de inventario.
- Reportes de ventas diarios, semanales y mensuales.

## Configuracion local

1. Instala dependencias:

```bash
npm install
```

2. Configura `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

3. En Supabase, abre SQL Editor y ejecuta el archivo `supabase-schema.sql`.

4. Activa el proveedor Email en Supabase Auth y crea el primer usuario desde Auth > Users, o permite registro por email.

5. Ejecuta el proyecto:

```bash
npm run dev
```

## Despliegue en Vercel

1. Sube el proyecto a GitHub.
2. Importa el repositorio en Vercel.
3. Agrega las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Despliega.
5. En Supabase Auth > URL Configuration, agrega la URL de Vercel en Site URL y Redirect URLs.

## Base de datos

El esquema esta en `supabase-schema.sql`. Incluye tablas, politicas RLS para usuarios autenticados y funciones RPC:

- `register_sale`: registra venta, detalle y salida de inventario en una transaccion.
- `register_inventory_movement`: registra entrada, salida o ajuste y actualiza stock.

La aplicacion espera que ese SQL este aplicado antes de usar productos, ventas o inventario.

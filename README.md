# claseGC — Trabaja mejor, no más

App de la clase de IA en Gran Ciudad Nuevo Polanco. Los asistentes escanean un QR,
contestan una encuesta de 90 segundos, y con esas respuestas se arma la clase en vivo.

## Las tres URL

| Para quién | Ruta | Qué hace |
|---|---|---|
| Asistentes (QR) | `/s/polanco` | Entrada, encuesta, espera y cuaderno de ejercicios |
| Tú (proyector) | `/host/polanco?pin=gc2309` | Números de la sala, tareas, y el prompt de Gamma |
| — | `/` | Redirige a `/s/polanco` |

El QR del flyer debe apuntar a `https://TU-DOMINIO/s/polanco`.

## Variables de entorno

Las dos públicas ya están puestas en Vercel. La tercera la pones tú:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_KEY` — llave publicable,
  va al navegador a propósito. La base está protegida con RLS.
- `ANTHROPIC_API_KEY` — **secreta**. Solo se usa en el servidor, en `/api/generar`.
  Si no la pones, el botón "Escribir la clase" falla con aviso claro y puedes usar
  "Copiar datos" para pegarlos en Claude a mano.

## Cómo corre la clase

1. Abres `/host/polanco?pin=gc2309` en la laptop conectada al proyector.
2. La gente escanea, contesta, y el tablero se actualiza cada 2.5 segundos.
3. Cuando ya no entra nadie: **Cerrar sala**.
4. **Escribir la clase** — Claude lee todas las tareas y devuelve el prompt de
   Gamma más los 3 ejercicios.
5. Copias el prompt, lo pegas en Gamma, y mientras genera presionas
   **Publicar a los celulares**: a cada quien le aparece su cuaderno.

## Seguridad

Ningún secreto vive en el navegador. La base no expone el PIN de host, y nadie
puede leer las respuestas de los demás: todo pasa por funciones `security definer`
en Postgres. Cambiar el PIN:

```sql
update sesiones set host_pin = 'otro' where codigo = 'polanco';
```

## Una sala nueva para otra clase

```sql
insert into sesiones (codigo, titulo, estado, host_pin)
values ('marzo', 'Trabaja mejor, no más', 'recibiendo', 'un-pin');
```

Y la URL pasa a ser `/s/marzo` y `/host/marzo?pin=un-pin`.

## Local

```bash
npm install
cp .env.example .env.local   # agrega tu ANTHROPIC_API_KEY
npm run dev
```

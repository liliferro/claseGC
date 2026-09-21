# claseGC — Trabaja mejor, no más

App de la clase de IA en Gran Ciudad Nuevo Polanco. Los asistentes escanean un QR,
contestan una encuesta de 3–4 minutos, y con esas respuestas se arma la clase en vivo.

## Las tres URL

| Para quién | Ruta | Qué hace |
|---|---|---|
| Asistentes (QR) | `/s/polanco` | Entrada, encuesta, espera y cuaderno de ejercicios |
| Tú (proyector) | `/host/polanco` | Números de la sala, tareas, y el prompt de Gamma |
| — | `/` | Redirige a `/s/polanco` |

El QR del flyer debe apuntar a `https://TU-DOMINIO/s/polanco`.

## Variables de entorno

Las dos públicas ya están puestas en Vercel. La tercera la pones tú:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_KEY` — llave publicable,
  va al navegador a propósito. La base utiliza RLS y funciones RPC; revisar sus permisos antes de abrir nuevas salas.
- `ANTHROPIC_API_KEY` — **secreta**. Solo se usa en el servidor, en `/api/generar`.
  Si no la pones, el botón "Generar mi clase" falla con aviso claro y puedes usar
  "Copiar instrucciones y respuestas" para pegarlos en Claude a mano.

## Cómo corre la clase

1. Abres `/host/polanco` en la laptop conectada al proyector.
2. La gente escanea, contesta, y el tablero se actualiza cada 5 segundos.
3. Cuando ya no entra nadie: **Cerrar sala**.
4. **Generar mi clase** — Claude lee todas las tareas y devuelve el prompt de
   Gamma más dos ejercicios principales y uno de reserva.
5. Copias el prompt, lo pegas en Gamma, y mientras genera presionas
   **Publicar 2 ejercicios en los teléfonos**: a cada quien le aparece su cuaderno.

## Seguridad

La clave de Anthropic se usa solo en el servidor. El PIN del dashboard se conserva en sessionStorage durante la sesión y se valida mediante RPC. Las políticas RLS y permisos de las funciones deben revisarse al abrir nuevas salas. Las versiones generadas se recuperan en el mismo navegador mediante localStorage; guardar en la base no sincroniza automáticamente otros dispositivos. Cambiar el PIN:

```sql
update sesiones set host_pin = 'otro' where codigo = 'polanco';
```

## Una sala nueva para otra clase

```sql
insert into sesiones (codigo, titulo, estado, host_pin)
values ('marzo', 'Trabaja mejor, no más', 'recibiendo', 'un-pin');
```

Y la URL pasa a ser `/s/marzo` y `/host/marzo` (ingresa el PIN en el formulario).

## Local

```bash
npm install
cp .env.example .env.local   # agrega tu ANTHROPIC_API_KEY
npm run dev
```

## Dashboard v2
Panorama y necesidades en vivo; dos ejercicios principales y uno de reserva; prompt Gamma editable, descargable y guardado. La generación valida el PIN con Supabase y obtiene los datos en el servidor. Los casos individuales se ocultan en modo proyección. El PIN inicial expuesto debe rotarse: quitarlo del README no lo revoca.

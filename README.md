# Trabaja mejor, no más · Mood

Workshop de Liliana Ferro en Gran Ciudad Nuevo Polanco.

- `/s/polanco`: entrada por nombre/alias y actividad; nueve preguntas; ejercicios publicados.
- `/host/polanco`: acceso con PIN, siete escenas de la sala, necesidades, tres prácticas y prompt Gamma.

## Encuesta participativa v3

Termómetro, tiempo semanal, confesión, origen, destino, superpoder, freno, herramienta y cierre opcional. La confesión incluye permiso de proyección; herramienta distingue dispositivo. Los borradores v3 se recuperan en el mismo navegador. Quienes respondieron una versión anterior pueden completar la nueva al volver a entrar, conservando su registro.

El dashboard consulta cada cinco segundos. Muestra termómetro, herramientas, intervalo de horas y nube de deseos autorizados, confesiones consentidas, rutas de trabajo, votos y frenos. Los intervalos antiguos quedan fuera de la nueva suma. Las horas representan dedicación declarada, nunca ahorro garantizado.

La selección de ejercicios maximiza cobertura con tres capacidades distintas; exige al menos dos ejercicios alineados al podio de votos cuando existe una combinación viable. Si faltan patrones, lo informa y solicita prácticas complementarias. Los empates de votos se ordenan alfabéticamente. La IA debe respetar los patrones y casos seleccionados. Cada práctica dura nueve minutos y funciona con texto, sin integraciones. El prompt Gamma contiene 15 tarjetas y la dirección visual de Mood.

## Ejecución

Configura `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY` y `ANTHROPIC_API_KEY` en el servidor. Las dos primeras son públicas; la última nunca se envía al navegador. La API valida el PIN por RPC y carga las respuestas desde Supabase.

```sh
npm ci
cp .env.example .env.local
npm run dev
node --test tests/clase.test.mjs
npm run build
```

La base existente usa RPC y RLS. Revisar sus permisos antes de crear otras salas. El PIN inicial expuesto históricamente debe rotarse; quitarlo del README no lo revoca. El PIN de facilitación permanece en sessionStorage; las versiones de clase en localStorage. Guardar una versión en la base no sincroniza automáticamente otros navegadores.

No se borran las respuestas ni los ejercicios antiguos al actualizar el código. Publicar ejercicios utiliza la RPC existente; si hay entregas asociadas, la base puede rechazar su reemplazo. La facilitadora debe revisar los contenidos generados antes de proyectarlos o publicarlos.

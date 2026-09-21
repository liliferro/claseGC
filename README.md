# Trabaja mejor, no más · Mood

Workshop de Liliana Ferro en Gran Ciudad Nuevo Polanco.

- `/s/polanco`: entrada por nombre/alias y actividad; nueve preguntas; ejercicios publicados.
- `/host/polanco`: acceso con PIN, siete escenas de la sala, necesidades, tres prácticas y prompt Gamma.

## Encuesta participativa v3

Termómetro, tiempo semanal, confesión, origen, destino, superpoder, freno, herramienta y cierre opcional. La confesión incluye permiso de proyección; herramienta distingue dispositivo. Los borradores v3 se recuperan en el mismo navegador. Quienes respondieron una versión anterior pueden completar la nueva al volver a entrar, conservando su registro.

El dashboard consulta cada cinco segundos. Muestra termómetro, herramientas, intervalo de horas y nube de deseos autorizados, confesiones consentidas, rutas de trabajo, votos y frenos. Los intervalos antiguos quedan fuera de la nueva suma. Las horas representan dedicación declarada, nunca ahorro garantizado.

La selección de ejercicios maximiza cobertura con tres capacidades distintas; exige al menos dos ejercicios alineados al podio de votos cuando existe una combinación viable. Si faltan patrones, lo informa y solicita prácticas complementarias. Los empates de votos se ordenan alfabéticamente. El generador integrado respeta los patrones y casos seleccionados. Cada práctica dura nueve minutos y funciona con texto, sin integraciones. El documento Gamma v4 contiene 26 tarjetas Markdown, diez de fundamentos y tres por ejercicio. Cada ejercicio añade dos loops distintos, comprobación y demo de tres minutos; el dashboard conserva la preparación para casa. La hora se reparte 15 + 5 + 36 + 4. El prompt maestro con las respuestas también se puede copiar para generación manual.

Los documentos generados validan referencias de casos, diversidad, protagonistas únicos, estructura y límite de 40 palabras por tarjeta (prompts aparte). Las demos identifican pasos manuales y preparación previa. Estas comprobaciones de estructura no prueban que una integración externa esté configurada. Las fuentes oficiales de funciones se incluyen en el material para la facilitadora. Las versiones v3 de la clase permanecen en su clave anterior; generar una nueva produce v4.

## Ejecución

Configura `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY` en el servidor. La generación integrada no requiere claves ni saldo de una API de IA. Ambas son claves de configuración pública. La API valida el PIN por RPC y carga las respuestas desde Supabase.

```sh
npm ci
cp .env.example .env.local
npm run dev
node --test tests/clase.test.mjs
npm run build
```

La base existente usa RPC y RLS. Revisar sus permisos antes de crear otras salas. El PIN inicial expuesto históricamente debe rotarse; quitarlo del README no lo revoca. El PIN de facilitación permanece en sessionStorage; las versiones de clase en localStorage. Guardar una versión en la base no sincroniza automáticamente otros navegadores.

No se borran las respuestas ni los ejercicios antiguos al actualizar el código. Publicar ejercicios utiliza la RPC existente; si hay entregas asociadas, la base puede rechazar su reemplazo. La facilitadora debe revisar los contenidos generados antes de proyectarlos o publicarlos.

## Generación integrada

El botón Generar mi clase usa recetas editoriales y soluciones verificadas, seleccionadas por las rutas, votos y freno del grupo. No llama a un modelo. El texto libre activa variantes concretas (recibos, presupuestos, horarios); no promete comprensión semántica general. Si no existe un patrón, el ejercicio se marca complementario. El prompt maestro permite una personalización adicional en cualquier IA elegida por la facilitadora. La generación integrada conserva las 26 tarjetas, loops y pasos de las demos.

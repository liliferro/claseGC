export const runtime = 'nodejs';
export const maxDuration = 60;

const INSTRUCCION = `Eres la co-diseñadora de un taller presencial de IA de 60 minutos para vecinos de un edificio en Ciudad de México. No son técnicos. Todos harán los ejercicios DESDE EL CELULAR, con cuentas gratuitas de ChatGPT, Claude o Gemini. Hay 30 a 50 personas y una sola proyección. Nadie trae laptop.

Te paso las respuestas reales de una encuesta que contestaron al entrar. Tu trabajo:

1) Agrupa las tareas repetitivas en patrones. Ignora las que solo le sirven a una persona.
2) Elige EXACTAMENTE 3 ejercicios que cumplan las cuatro condiciones: (a) cada uno resuelve un patrón distinto, (b) cada uno usa una capacidad diferente de la IA (por ejemplo: instrucción personalizada o proyecto guardado; análisis de un documento o imagen que la persona sube; redacción con contexto y tono propio; extracción de datos de un texto pegado), (c) se completa en 9 minutos desde un celular sin instalar nada y sin conectar cuentas, (d) le sirve a la mayor cantidad posible de gente en la sala.
3) Para cada ejercicio escribe el prompt EXACTO que los asistentes copiarán, con corchetes donde cada quien llena lo suyo.

Regla dura: nada que requiera plan de pago, conectores, integraciones, automatizaciones programadas ni salir del chat. Si un patrón fuerte solo se resuelve así, no lo conviertas en ejercicio: menciónalo como demostración que hará la instructora en pantalla.

Responde en español de México, cálido y directo, sin tecnicismos sin traducir.

FORMATO DE TU RESPUESTA — exactamente dos partes:

PARTE 1: el prompt completo, listo para pegar en Gamma, que generará la presentación de la clase. Escríbelo en segunda persona dirigido a Gamma. Debe pedir: una portada con el nombre del taller; una lámina con el retrato de esta sala usando los números reales que te doy; una lámina por cada uno de los 3 ejercicios con el prompt exacto en bloque de código; una lámina de cierre con los 3 hábitos que esta sala específica debería adoptar. Pide tono cálido, español de México, poco texto por lámina, tipografía grande legible en proyector. Escribe esta parte como texto corrido, sin encabezados de sección.

PARTE 2: después del prompt, un bloque json delimitado con tres acentos graves y la palabra json, con esta forma exacta:
{"ejercicios":[{"titulo":"","aQuienSirve":"","capacidad":"","pasos":["","",""],"prompt":""}],"demo":""}
El arreglo lleva 3 objetos. "pasos" lleva 3 pasos cortos. "demo" es una frase con la automatización que hará la instructora en pantalla.`;

function datosComoTexto(r) {
  const L = [];
  L.push('Personas que contestaron: ' + r.personas);
  L.push('Horas perdidas por semana, sumando a todos: ' + r.horas);
  L.push('Usan IA todos los días: ' + r.diario + '. Nunca la han usado: ' + r.nunca + '.');
  L.push('Herramientas: ' + (r.herramientas || []).map((h) => h.k + ' (' + h.n + ')').join(', '));
  L.push('Dónde vive su información: ' + (r.donde || []).map((h) => h.k + ' (' + h.n + ')').join(', '));
  L.push('Qué los frena: ' + (r.frenos || []).map((h) => h.k + ' (' + h.n + ')').join(', '));
  L.push('');
  L.push('TAREAS REPETITIVAS QUE ESCRIBIERON:');
  (r.tareas || []).forEach((t, i) => {
    L.push((i + 1) + '. [' + (t.oficio || 'sin dato') + '] ' + t.tarea + (t.horas ? ' — ' + t.horas : ''));
  });
  return L.join('\n');
}

export async function POST(req) {
  const llave = process.env.ANTHROPIC_API_KEY;
  if (!llave) {
    return Response.json(
      { error: 'falta ANTHROPIC_API_KEY en Vercel' },
      { status: 503 }
    );
  }

  let resumen;
  try {
    ({ resumen } = await req.json());
  } catch (e) {
    return Response.json({ error: 'cuerpo inválido' }, { status: 400 });
  }
  if (!resumen || !resumen.tareas || !resumen.tareas.length) {
    return Response.json({ error: 'todavía no hay respuestas' }, { status: 400 });
  }

  let crudo = '';
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': llave,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: INSTRUCCION + '\n\n=== RESPUESTAS DE LA SALA ===\n' + datosComoTexto(resumen)
        }]
      })
    });
    if (!r.ok) {
      const t = await r.text();
      return Response.json({ error: 'la API respondió ' + r.status + ': ' + t.slice(0, 200) }, { status: 502 });
    }
    const j = await r.json();
    crudo = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  } catch (e) {
    return Response.json({ error: 'no se pudo llamar a la API' }, { status: 502 });
  }

  const prompt = crudo.split('```')[0].trim();
  let ejercicios = [];
  const m = crudo.match(/```json([\s\S]*?)```/);
  if (m) {
    try { ejercicios = JSON.parse(m[1].trim()).ejercicios || []; } catch (e) {}
  }

  return Response.json({ prompt, ejercicios });
}

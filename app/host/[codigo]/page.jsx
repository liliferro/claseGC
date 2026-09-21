'use client';

import { useCallback, useEffect, useState } from 'react';
import { sb } from '../../../lib/supabase';
import { HORAS_VALOR } from '../../../lib/preguntas';

export default function Host({ params }) {
  const codigo = params.codigo;
  const [pin, setPin] = useState('');
  const [autorizado, setAutorizado] = useState(false);
  const [datos, setDatos] = useState(null);
  const [vista, setVista] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [ejercicios, setEjercicios] = useState([]);
  const [generando, setGenerando] = useState(false);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    const guardado = typeof window !== 'undefined' ? localStorage.getItem('pin:' + codigo) : null;
    const dLaUrl = new URLSearchParams(window.location.search).get('pin');
    const p = dLaUrl || guardado;
    if (p) { setPin(p); probar(p); }
  }, [codigo]); // eslint-disable-line react-hooks/exhaustive-deps

  const traer = useCallback(async (p) => {
    const { data, error } = await sb.rpc('resumen_sala', { p_codigo: codigo, p_pin: p });
    if (error) return null;
    return data;
  }, [codigo]);

  async function probar(p) {
    const d = await traer(p);
    if (!d) { setAviso('Ese PIN no abre esta sala.'); return; }
    localStorage.setItem('pin:' + codigo, p);
    setAutorizado(true); setDatos(d); setAviso('');
  }

  // Refresca mientras la gente contesta.
  useEffect(() => {
    if (!autorizado) return;
    const t = setInterval(async () => {
      const d = await traer(pin);
      if (d) setDatos(d);
    }, 2500);
    return () => clearInterval(t);
  }, [autorizado, pin, traer]);

  if (!autorizado) {
    return (
      <div className="movil">
        <div className="centro" style={{ width: '100%' }}>
          <h2>Tablero</h2>
          <input className="campo" placeholder="PIN de host" value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && probar(pin)} />
          {aviso ? <div className="mal">{aviso}</div> : null}
          <button className="btn" onClick={() => probar(pin)}>Abrir</button>
        </div>
      </div>
    );
  }

  const r = resumir(datos);

  async function cerrar() {
    await sb.rpc('cambiar_estado', { p_codigo: codigo, p_pin: pin, p_estado: 'cerrada' });
    const d = await traer(pin); if (d) setDatos(d);
  }

  async function generar() {
    setGenerando(true); setAviso(''); setPrompt('');
    try {
      const res = await fetch('/api/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumen: r })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'falló');
      setPrompt(j.prompt || '');
      setEjercicios(j.ejercicios || []);
      await sb.rpc('guardar_prompt', { p_codigo: codigo, p_pin: pin, p_prompt: j.prompt || '' });
    } catch (e) {
      setAviso('No se pudo generar: ' + e.message + '. Usa "Copiar datos" y pégalos en Claude.');
    }
    setGenerando(false);
  }

  async function publicar() {
    if (!ejercicios.length) { setAviso('Todavía no hay ejercicios que publicar.'); return; }
    const { error } = await sb.rpc('publicar_ejercicios', {
      p_codigo: codigo, p_pin: pin, p_ejercicios: ejercicios
    });
    setAviso(error ? 'No se publicó: ' + error.message : 'Publicado. Ya les apareció en el celular.');
    const d = await traer(pin); if (d) setDatos(d);
  }

  function copiarDatos() {
    navigator.clipboard.writeText(textoParaClaude(r)).then(
      () => setAviso('Datos copiados.'),
      () => setAviso('No dejó copiar. Selecciona a mano.')
    );
  }

  const maxH = r.herramientas.length ? r.herramientas[0].n : 1;

  return (
    <div className="escena">
      <div className={'vista' + (vista === 0 ? ' on' : '')}>
        <div className="centrado">
          <h1>Así llegó esta sala</h1>
          <div className="cifras">
            <div className="cifra"><div className="n">{r.personas}</div><div className="t">personas contestaron al entrar</div></div>
            <div className="cifra"><div className="n" style={{ color: 'var(--acento)' }}>{r.diario}</div><div className="t">usan IA todos los días</div></div>
            <div className="cifra"><div className="n" style={{ color: 'var(--tenue)' }}>{r.nunca}</div><div className="t">nunca la han abierto</div></div>
          </div>
          <div className="barras">
            {r.herramientas.map((h) => (
              <div className="barra" key={h.k}>
                <div>{h.k}</div>
                <div className="pista"><div className="llena" style={{ width: (h.n / maxH) * 100 + '%' }} /></div>
                <div className="v">{h.n}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={'vista' + (vista === 1 ? ' on' : '')}>
        <div className="centrado" style={{ textAlign: 'center' }}>
          <div className="gigante">{r.horas}</div>
          <p style={{ fontSize: 'clamp(1.05rem,2.2vw,1.9rem)', maxWidth: '24ch', margin: '1em auto 0', fontWeight: 500 }}>
            horas a la semana que esta sala gasta en cosas que se repiten
          </p>
          <p className="tenue" style={{ marginTop: '1.2em' }}>
            Son cerca de {Math.round((r.horas * 48) / 8)} días de trabajo al año entre todos los que estamos aquí.
          </p>
        </div>
      </div>

      <div className={'vista' + (vista === 2 ? ' on' : '')}>
        <div style={{ width: '100%' }}>
          <h2>Esto fue lo que escribieron</h2>
          <div className="tarjetas">
            {r.tareas.slice(0, 21).map((t, i) => (
              <div className="tarjeta" key={i}>
                <div>{t.tarea}</div>
                {t.oficio ? <div className="quien">{t.nombre} · {t.oficio}</div> : <div className="quien">{t.nombre}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={'vista' + (vista === 3 ? ' on' : '')}>
        <h2 style={{ margin: 0 }}>{prompt ? 'La clase de hoy, escrita por ustedes' : 'Vamos a escribir la clase'}</h2>
        <div className="caja">
          <div className="cab">
            <span>Prompt para Gamma</span>
            <span>{generando ? 'escribiendo…' : null}</span>
          </div>
          <pre>{prompt || 'Presiona "Escribir la clase" y Claude lee las ' + r.tareas.length + ' tareas de la sala.'}</pre>
        </div>
        {aviso ? <div className="mal">{aviso}</div> : null}
      </div>

      <div className="barraHost">
        <button className="btn fantasma" onClick={() => setVista(Math.max(0, vista - 1))}>←</button>
        <button className="btn fantasma" onClick={() => setVista(Math.min(3, vista + 1))}>→</button>
        <button className="btn fantasma" onClick={cerrar}>Cerrar sala</button>
        <button className="btn fantasma" onClick={copiarDatos}>Copiar datos</button>
        <button className="btn fantasma" onClick={generar} disabled={generando}>Escribir la clase</button>
        <button className="btn fantasma" onClick={publicar}>Publicar a los celulares</button>
      </div>
    </div>
  );
}

/* ---------- cálculo ---------- */

function resumir(datos) {
  const vacio = { personas: 0, diario: 0, nunca: 0, horas: 0, herramientas: [], donde: [], frenos: [], tareas: [] };
  if (!datos) return vacio;

  const porAsistente = {};
  (datos.asistentes || []).forEach((a) => { porAsistente[a.id] = { ...a, resp: {} }; });
  (datos.respuestas || []).forEach((r) => {
    if (porAsistente[r.asistente_id]) porAsistente[r.asistente_id].resp[r.pregunta] = r.valor;
  });
  const gente = Object.values(porAsistente);

  const cuenta = (campo) => {
    const m = {};
    gente.forEach((p) => {
      const v = p.resp[campo];
      (Array.isArray(v) ? v : v ? [v] : []).forEach((x) => { m[x] = (m[x] || 0) + 1; });
    });
    return Object.keys(m).map((k) => ({ k, n: m[k] })).sort((a, b) => b.n - a.n);
  };

  return {
    personas: gente.length,
    diario: gente.filter((p) => p.resp.nivel === 'Todos los días').length,
    nunca: gente.filter((p) => p.resp.nivel === 'Nunca').length,
    horas: Math.round(gente.reduce((a, p) => a + (HORAS_VALOR[p.resp.horas] || 0), 0)),
    herramientas: cuenta('cuales').slice(0, 6),
    donde: cuenta('donde').slice(0, 6),
    frenos: cuenta('freno').slice(0, 4),
    tareas: gente.filter((p) => p.resp.tarea)
      .map((p) => ({ nombre: p.nombre, oficio: p.oficio, tarea: p.resp.tarea, horas: p.resp.horas }))
  };
}

function textoParaClaude(r) {
  const L = [];
  L.push('Personas que contestaron: ' + r.personas);
  L.push('Horas perdidas por semana, sumando a todos: ' + r.horas);
  L.push('Usan IA todos los días: ' + r.diario + '. Nunca la han usado: ' + r.nunca + '.');
  L.push('Herramientas: ' + r.herramientas.map((h) => h.k + ' (' + h.n + ')').join(', '));
  L.push('Dónde vive su información: ' + r.donde.map((h) => h.k + ' (' + h.n + ')').join(', '));
  L.push('Qué los frena: ' + r.frenos.map((h) => h.k + ' (' + h.n + ')').join(', '));
  L.push('');
  L.push('TAREAS REPETITIVAS QUE ESCRIBIERON:');
  r.tareas.forEach((t, i) => {
    L.push((i + 1) + '. [' + (t.oficio || 'sin dato') + '] ' + t.tarea + (t.horas ? ' — ' + t.horas : ''));
  });
  return L.join('\n');
}


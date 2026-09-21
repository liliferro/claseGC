'use client';
import {MoodBrand} from '../../../lib/brand';

import { useCallback, useEffect, useState } from 'react';
import { sb } from '../../../lib/supabase';
import { PREGUNTAS } from '../../../lib/preguntas';

export default function Sala({ params }) {
  const codigo = params.codigo;
  const llave = 'asistente:' + codigo;

  const [fase, setFase] = useState('cargando');   // entrada | encuesta | espera | cuaderno
  const [yo, setYo] = useState(null);             // { asistente_id, nombre }
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState({});
  const [ejercicios, setEjercicios] = useState([]);
  const [sesionId, setSesionId] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [paso, fase]);

  // Si ya entró antes (recargó, se le trabó el celular), lo recuperamos.
  useEffect(() => {
    let guardado = null;
    try { guardado = JSON.parse(localStorage.getItem(llave) || 'null'); } catch (e) {}
    if (guardado && guardado.asistente_id) {
      setYo(guardado);
      setValores(guardado.version===3 ? (guardado.valores || {}) : {});
      setSesionId(guardado.sesion_id || null);
      setFase(guardado.version===3 && guardado.termino ? 'espera' : 'encuesta');
      setPaso(guardado.version===3 ? Math.min(guardado.paso || 0, PREGUNTAS.length - 1) : 0);
    } else {
      setFase('entrada');
    }
  }, [llave]);

  const recuerda = useCallback((datos) => {
    try { localStorage.setItem(llave, JSON.stringify({...datos,version:3})); } catch (e) {}
  }, [llave]);

  async function entrar(nombre, oficio) {
    setError(''); setGuardando(true);
    const { data, error: err } = await sb.rpc('entrar_sala', {
      p_codigo: codigo, p_nombre: nombre, p_oficio: oficio
    });
    setGuardando(false);
    if (err) {
      setError(err.message.includes('cerrada')
        ? 'La sala ya cerró. Avísale a Liliana y te agrega a mano.'
        : 'No pude entrar. Revisa tu conexión y vuelve a intentar.');
      return;
    }
    const nuevo = { asistente_id: data.asistente_id, nombre, sesion_id: data.sesion_id, paso: 0, termino: false };
    setYo(nuevo); setSesionId(data.sesion_id); recuerda(nuevo); setFase('encuesta');
  }

  async function responder(pregunta, valor) {
    setGuardando(true);
    const { error: err } = await sb.rpc('responder', {
      p_asistente_id: yo.asistente_id, p_pregunta: pregunta, p_valor: valor
    });
    setGuardando(false);
    if (err) { setError('No se guardó esa respuesta. Intenta de nuevo.'); return false; }
    setError('');
    return true;
  }

  async function avanzar() {
    const p = PREGUNTAS[paso];
    const v = valores[p.id] ?? '';
    if(p.id==='tarea' && !await responder('permiso',valores.permiso==='Solo para preparar la clase'?'Solo para preparar la clase':'De forma anónima'))return;
    if(p.id==='herramienta' && !await responder('dispositivo',valores.dispositivo))return;
    const ok = await responder(p.id, v);
    if (!ok) return;
    const siguiente = paso + 1;
    if (siguiente >= PREGUNTAS.length) {
      if(!await responder('finalizada_v3',true))return;
      recuerda({ ...yo, valores, paso: siguiente, termino: true });
      setFase('espera');
    } else {
      recuerda({ ...yo, valores, paso: siguiente, termino: false });
      setPaso(siguiente);
    }
  }

  // En espera: preguntamos cada 3 segundos si ya publicó los ejercicios.
  useEffect(() => {
    if (fase !== 'espera') return;
    let vivo = true;
    async function mirar() {
      const { data } = await sb.rpc('conteo_sala', { p_codigo: codigo });
      if (!vivo || !data) return;
      if (data.estado === 'publicada') {
        const { data: sala } = await sb.from('sesiones').select('id').eq('codigo', codigo).maybeSingle();
        const id = sesionId || sala?.id;
        if (!id) return;
        const { data: ejs } = await sb.from('ejercicios').select('*').eq('sesion_id', id).order('orden');
        if (vivo && ejs) { setEjercicios(ejs); setFase('cuaderno'); }
      }
    }
    mirar();
    const t = setInterval(mirar, 3000);
    return () => { vivo = false; clearInterval(t); };
  }, [fase, codigo, sesionId]);

  if (fase === 'cargando') return <div className="movil" />;
  if (fase === 'entrada') return <Entrada onEntrar={entrar} error={error} ocupado={guardando} />;

  if (fase === 'encuesta') {
    const p = PREGUNTAS[paso];
    return (
      <Encuesta
        pregunta={p}
        indice={paso}
        total={PREGUNTAS.length}
        valor={valores[p.id]}
        extras={valores}
        onExtra={(k,v)=>{const next={...valores,[k]:v};setValores(next);recuerda({...yo,valores:next,paso,termino:false});}}
        onCambio={(v) => { const next={...valores,[p.id]:v}; setValores(next); recuerda({...yo,valores:next,paso,termino:false}); }}
        onVolver={() => {setPaso(paso-1); recuerda({...yo,valores,paso:paso-1,termino:false});}}
        onAvanzar={avanzar}
        error={error}
        ocupado={guardando}
      />
    );
  }

  if (fase === 'espera') {
    return (
      <div className="movil"><MoodBrand/>
        <div className="centro espera">
          <h2>Listo{yo?.nombre ? ', ' + yo.nombre.split(' ')[0] : ''}. Tu voto ya cuenta.</h2>
          <p className="tenue">Voltea a la pantalla grande: tus respuestas ya forman parte de los números. Cuando Liliana publique los ejercicios, aparecerán aquí. Si respondiste antes del taller, vuelve a este enlace desde el mismo teléfono.</p>
          <div style={{ marginTop: 28 }}>
            <span className="punto" /><span className="punto" /><span className="punto" />
          </div>
        </div>
      </div>
    );
  }

  return <Cuaderno ejercicios={ejercicios} asistenteId={yo.asistente_id} />;
}

/* ---------- pantallas ---------- */

function Entrada({ onEntrar, error, ocupado }) {
  const [nombre, setNombre] = useState('');
  const [oficio, setOficio] = useState('');
  return (
    <div className="movil">
      <MoodBrand/>
      <div className="entry-card">
        <span className="eyebrow">GRAN CIUDAD · NUEVO POLANCO</span>
        <h1>Trabaja mejor, no más</h1>
        <p className="tenue">
          Cuéntanos qué haces y qué tarea te gustaría simplificar. Tus respuestas darán forma a los ejercicios de esta clase.
        </p>
        <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
          <input className="campo" aria-label="Tu nombre o alias" placeholder="Tu nombre o alias" maxLength={80} value={nombre}
            onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" />
          <input className="campo" aria-label="Tu trabajo en tres palabras" placeholder="Tu trabajo en tres palabras: mamá, abogada, maratonista" maxLength={160} value={oficio}
            onChange={(e) => setOficio(e.target.value)} />
        </div>
        {error ? <div className="mal">{error}</div> : null}
        <button className="btn" disabled={!nombre.trim() || !oficio.trim() || ocupado}
          onClick={() => onEntrar(nombre, oficio)}>
          {ocupado ? 'Entrando…' : 'Construir mi clase →'}
        </button>
        <p className="tenue" style={{fontSize:'.8rem',textAlign:'center',marginTop:20}}>9 preguntas · Unos 2–3 minutos · Tu voto construye la clase</p>
      </div>
    </div>
  );
}

function Encuesta({ pregunta, indice, total, valor, extras, onExtra, onCambio, onAvanzar, onVolver, error, ocupado }) {
  const esTexto = pregunta.tipo === 'texto';
  const varias = pregunta.tipo === 'varias';
  const marcadas = Array.isArray(valor) ? valor : [];

  const respondida = esTexto
    ? (!pregunta.obligatoria || String(valor || '').trim().length > 2)
    : varias ? marcadas.length > 0 : Boolean(valor);

  const listo=respondida && (pregunta.id!=='herramienta'||Boolean(extras.dispositivo));
  function alternar(op) {
    if (!varias) { onCambio(op); return; }
    const none=['Ninguna','No la uso'];
    onCambio(marcadas.includes(op)?marcadas.filter(x=>x!==op):none.includes(op)?[op]:[...marcadas.filter(x=>!none.includes(x)),op]);
  }

  return (
    <div className="movil"><MoodBrand/>
      <div aria-live="polite" className="survey-celebration">{indice===3?'Esa era la difícil. Lo demás es tap, tap.':indice===6?'Acabas de votar la clase de hoy.':''}</div>
      <div className="eyebrow" style={{marginBottom:16}}>TU PUNTO DE PARTIDA · {indice+1} / {total}</div>
      <div className="progreso"><i style={{ width: ((indice) / total) * 100 + '%' }} /></div>
      <h2>{pregunta.texto}</h2>
      {pregunta.ayuda ? <p className="tenue" style={{ marginTop: -4 }}>{pregunta.ayuda}</p> : null}

      {esTexto ? (
        <textarea className="campo" style={{ marginTop: 18 }} aria-label={pregunta.texto} maxLength={2500} value={valor || ''}
          onChange={(e) => onCambio(e.target.value)}
          placeholder={pregunta.placeholder} />
      ) : (
        <div className="opciones">
          {pregunta.opciones.map((op) => {
            const activa = varias ? marcadas.includes(op) : valor === op;
            return (
              <button key={op} className="opcion" aria-pressed={activa}
                onClick={() => alternar(op)}>{op}</button>
            );
          })}
        </div>
      )}

      {pregunta.id==='tarea'&&<p className="tenue">Las respuestas compartidas en pantalla aparecerán sin nombre ni firma.</p>}
      {pregunta.id==='herramienta'&&<fieldset className="survey-extra"><legend>¿Desde dónde vas a practicar?</legend>{['Celular','Laptop o tablet'].map(op=><button type="button" className="opcion" key={op} aria-pressed={extras.dispositivo===op} onClick={()=>onExtra('dispositivo',op)}>{op}</button>)}</fieldset>}
      {error ? <div className="mal">{error}</div> : null}
      <button className="btn" disabled={!listo || ocupado} onClick={onAvanzar}>
        {ocupado ? 'Guardando…' : indice + 1 === total ? (String(valor||'').trim()?'Sumar mi respuesta y terminar':'Omitir y terminar') : 'Siguiente →'}
      </button>
      {indice>0&&<button className="btn fantasma" style={{marginTop:12}} disabled={ocupado} onClick={onVolver}>← Anterior</button>}
      <p className="tenue" style={{ textAlign: 'center', fontSize: '.85rem', marginTop: 16 }}>
        {indice + 1} de {total}
      </p>
    </div>
  );
}

function Cuaderno({ ejercicios, asistenteId }) {
  return (
    <div className="movil"><MoodBrand/>
      <h2>Tus ejercicios</h2>
      <p className="tenue" style={{ marginTop: -4 }}>
        Copia el prompt, pégalo en la IA que uses y guarda aquí lo que te salga para llevártelo.
      </p>
      <div style={{ marginTop: 22 }}>
        {ejercicios.map((e, i) => (
          <Ejercicio key={e.id} ejercicio={e} indice={i} asistenteId={asistenteId} />
        ))}
      </div>
    </div>
  );
}

function Ejercicio({ ejercicio, indice, asistenteId }) {
  const [copiado, setCopiado] = useState(false);
  const [resultado, setResultado] = useState('');
  const [estado, setEstado] = useState('');

  async function copiar() {
    try {
      await navigator.clipboard.writeText(ejercicio.prompt);
      setCopiado(true); setTimeout(() => setCopiado(false), 1800);
    } catch (e) {
      setEstado('Tu navegador no dejó copiar. Selecciona el texto a mano.');
    }
  }

  async function guardar() {
    setEstado('Guardando…');
    const { error } = await sb.rpc('guardar_entrega', {
      p_asistente_id: asistenteId, p_ejercicio_id: ejercicio.id, p_resultado: resultado
    });
    setEstado(error ? 'No se guardó. Intenta otra vez.' : 'Guardado');
  }

  const pasos = Array.isArray(ejercicio.pasos) ? ejercicio.pasos : [];

  return (
    <div className="ej">
      <div className="num">Ejercicio {indice + 1}</div>
      <h3>{ejercicio.titulo}</h3>
      {ejercicio.a_quien_sirve ? <p className="tenue" style={{ fontSize: '.88rem', margin: 0 }}>{ejercicio.a_quien_sirve}</p> : null}
      {pasos.length ? <ol>{pasos.map((p, i) => <li key={i}>{p}</li>)}</ol> : null}
      <div className="prompt">{ejercicio.prompt}</div>
      <button className="btn fantasma" style={{ marginTop: 12 }} onClick={copiar}>
        {copiado ? 'Copiado' : 'Copiar el prompt'}
      </button>
      <textarea className="campo" style={{ marginTop: 12, minHeight: 90 }}
        placeholder="Pega aquí lo que te respondió, para llevártelo"
        value={resultado} onChange={(e) => setResultado(e.target.value)} />
      <button className="btn fantasma" style={{ marginTop: 10 }}
        disabled={!resultado.trim()} onClick={guardar}>Guardar lo mío</button>
      {estado ? <p className="tenue" style={{ fontSize: '.82rem' }}>{estado}</p> : null}
    </div>
  );
}

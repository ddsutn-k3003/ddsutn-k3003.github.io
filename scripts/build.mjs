// Genera el sitio estático en dist/.
//   npm run build                       -> sitio para GitHub Pages
//   npm run single                      -> un solo archivo HTML (vista previa), en dist-single/
//   CLASES_BASE=https://.../clases/     -> dónde está publicado el repo de clases (por defecto /clases/)
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCronograma } from './cronograma.mjs'
import { COLORES, NOMBRES_EXPRESIONES, NOMBRES_FORMAS, faviconSvg, svgEstatico } from '../src/mascota.js'
import { hoyISO, proximas, renderProximas } from '../src/shared.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const single = process.argv.includes('--single')
const clasesBase = (process.env.CLASES_BASE ?? (single ? 'https://ddsutn-k3003.github.io/clases/' : '/clases/')).replace(/\/?$/, '/')
const out = join(ROOT, single ? 'dist-single' : 'dist')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')
const json = (p) => JSON.parse(read(p))
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const curso = json('data/curso.json')
const roadmap = json('data/roadmap.json')
const apuntes = json('data/apuntes.json')
const links = json('data/links.json')
const clases = json('data/classes.json').classes
const cron = parseCronograma(read('data/cronograma.csv'))
const hoy = hoyISO()

/* ---------- Fuentes ---------- */
const FUENTES = [
  ['fraunces', 'Fraunces', 'fraunces-latin-wght-normal.woff2'],
  ['inter', 'Inter', 'inter-latin-wght-normal.woff2'],
  ['jetbrains-mono', 'JetBrains Mono', 'jetbrains-mono-latin-wght-normal.woff2'],
  ['caveat', 'Caveat', 'caveat-latin-wght-normal.woff2'],
]
const fuentePath = (pkg, file) => join(ROOT, 'node_modules', '@fontsource-variable', pkg, 'files', file)
function fontFaces() {
  return FUENTES.map(([pkg, family, file]) => {
    const src = single
      ? `data:font/woff2;base64,${readFileSync(fuentePath(pkg, file)).toString('base64')}`
      : `fonts/${file}`
    return `@font-face{font-family:'${family}';font-style:normal;font-weight:200 900;font-display:swap;src:url('${src}') format('woff2')}`
  }).join('\n')
}

/* ---------- Piezas ---------- */
const iconoCandado = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'

function documento(d, i) {
  const boton = d.url
    ? `<a class="btn ${i === 0 ? 'btn-p' : 'btn-s'}" href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.accion)} <span class="arr">→</span></a>`
    : `<span class="btn" aria-disabled="true">Link a definir</span>`
  return `<article class="doc rv${i === 0 ? ' principal' : ''}">
  <p class="tag">${d.nota ? iconoCandado : ''}${esc(d.etiqueta)}</p>
  <h3>${esc(d.titulo)}</h3>
  <p>${esc(d.desc)}</p>
  ${d.nota ? `<p class="nota">${esc(d.nota)}</p>` : ''}
  ${boton}
</article>`
}

function bloque(b, i) {
  const stops = b.temas
    .map((t) => {
      const chip = t.clase
        ? `<a class="chip" href="#clase-${esc(t.clase)}">${esc(t.clase)} · Ver clase</a>`
        : '<span class="chip off">Próximamente</span>'
      return `<li class="stop"><span class="ts">${t.ts.join(' · ')}</span><span class="tt">${esc(t.titulo)}</span>${chip}</li>`
    })
    .join('')
  return `<div class="blk rv" id="bloque-${esc(b.id)}">
  <div class="blk-h"><p class="blk-n" aria-hidden="true">${String(i).padStart(2, '0')}</p><h3>${esc(b.titulo)}</h3>${b.evalua ? `<span class="eval">${esc(b.evalua)}</span>` : ''}</div>
  <ol class="stops">${stops}</ol>
</div>`
}

function tarjetaClase(num) {
  const grupo = clases.filter((c) => c.num === num)
  const base = grupo.find((c) => !c.variantOf) ?? grupo[0]
  const variantes = grupo.filter((c) => c !== base)
  const url = (p) => `${clasesBase}${p}`
  const chip = (txt, p) => `<a class="chip" href="${esc(url(p))}">${esc(txt)}</a>`
  const filas = []
  filas.push(
    `<div class="fila"><dt>Diapositivas</dt><dd>${
      variantes.length
        ? chip('Versión actual', base.slides) + variantes.map((v) => chip('Versión nueva', v.slides)).join('')
        : chip('Abrir', base.slides)
    }</dd></div>`,
  )
  if (base.apunte) filas.push(`<div class="fila"><dt>Apunte</dt><dd>${chip('PDF', base.apunte)}</dd></div>`)
  const pdfs = grupo.filter((c) => c.pdf)
  if (pdfs.length) {
    filas.push(
      `<div class="fila"><dt>Diapositivas en PDF</dt><dd>${pdfs
        .map((c) => chip(c.variantOf ? 'Versión nueva' : variantes.length ? 'Versión actual' : 'PDF', c.pdf))
        .join('')}</dd></div>`,
    )
  }
  return `<article class="card rv" id="clase-${esc(num)}"><span class="num">${esc(num)}</span><h3>${esc(base.title)}</h3><dl>${filas.join('')}</dl></article>`
}

function apunte(a) {
  return `<a class="apunte rv" href="${esc(a.url)}" target="_blank" rel="noopener">
  <div><span class="tag">${esc(a.bloque)} · ${esc(a.formato)}</span><h3>${esc(a.titulo)}</h3><p>${esc(a.desc)}</p>${a.version ? `<p class="ver">${esc(a.version)}</p>` : ''}</div>
  <span class="go">Abrir <span class="arr">↗</span></span>
</a>`
}

function enlace(l) {
  return l.url
    ? `<li><a class="lnk" href="${esc(l.url)}" target="_blank" rel="noopener"><b>${esc(l.t)}</b><span>${esc(l.d)}</span><i>↗</i></a></li>`
    : `<li><div class="lnk off"><b>${esc(l.t)}</b><span>${esc(l.d)}</span><i>a definir</i></div></li>`
}

const secHead = (k, titulo, lede) =>
  `<p class="k">&gt; ${k}</p><h2 class="h2">${titulo}</h2>${lede ? `<p class="lede">${lede}</p>` : ''}`

const numClases = [...new Set(clases.map((c) => c.num))].sort()
const cronUrl = curso.documentos[0].url

/* ---------- Páginas ---------- */
// Tres páginas: inicio (cronograma, documentos y links), roadmap y clases, y apuntes.
// En la vista previa de un solo archivo las tres conviven y se alternan con el hash.
const PAGINAS = [
  { id: 'inicio', href: '/', t: 'Inicio' },
  { id: 'roadmap', href: '/roadmap/', t: 'Roadmap y clases' },
  { id: 'apuntes', href: '/apuntes/', t: 'Apuntes' },
  { id: 'links', href: '/#links', t: 'Links' },
]
const hrefDe = (p) => (single ? `#${p.id}` : p.href)

const cabecera = (actual) => `<header class="top"><div class="wrap">
  <a class="brand" href="${single ? '#inicio' : '/'}" aria-label="Inicio"><b>DDSI</b><span>k3003</span></a>
  <nav class="nav" aria-label="Secciones">${PAGINAS.map((p) => `<a href="${hrefDe(p)}" aria-current="${p.id === actual ? 'page' : 'false'}">${p.t}</a>`).join('')}</nav>
</div></header>`

const encabezadoPagina = (k, titulo, lede) =>
  `<section class="pagehead"><div class="wrap"><p class="k">&gt; ${k}<span class="cur"></span></p><h1 class="h1s">${titulo}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}</div></section>`

const tarjetaPagina = (p, titulo, desc, cta) =>
  `<a class="doc rv" href="${hrefDe(p)}"><p class="tag">Sección del sitio</p><h3>${titulo}</h3><p>${desc}</p><span class="btn btn-s">${cta} <span class="arr">→</span></span></a>`

const paginaInicio = () => `<main id="main-inicio">
<section class="hero"><div class="wrap">
  <div>
    <p class="sig">&gt; ddsi --curso k3003<span class="cur"></span></p>
    <h1>${esc(curso.nombre)}</h1>
    <p class="sub">Todo el material del curso en un solo lugar: cronograma, clases, apuntes y recursos para estudiar.</p>
    <p class="meta">${esc(curso.codigo)} · ${esc(curso.turno)} · ${esc(curso.facultad)}</p>
    <div class="cta">
      <a class="btn btn-p" href="${esc(cronUrl)}" target="_blank" rel="noopener">Abrir el cronograma <span class="arr">↗</span></a>
      <a class="btn btn-s" href="${hrefDe(PAGINAS[1])}">Ver roadmap y clases</a>
    </div>
  </div>
  <aside class="prox" aria-label="Próximas fechas">
    <div class="prox-h"><b>&gt; lo que viene</b><a href="${esc(cronUrl)}" target="_blank" rel="noopener">Cronograma completo ↗</a></div>
    <ol id="prox-lista">${renderProximas(proximas(cron.dias, hoy, 4), hoy)}</ol>
  </aside>
</div></section>

<section class="sec" id="documentos"><div class="wrap">
  ${secHead('documentos', 'Documentos principales')}
  <div class="sec-body docs">${curso.documentos.map(documento).join('')}</div>
</div></section>

<section class="sec band" id="material"><div class="wrap">
  ${secHead('material', 'Para estudiar')}
  <div class="sec-body docs">
    ${tarjetaPagina(PAGINAS[1], 'Roadmap y clases', 'Los temas del curso por bloque, con las diapositivas y el apunte de cada clase.', 'Ver el roadmap')}
    ${tarjetaPagina(PAGINAS[2], 'Apuntes teóricos', 'Documentos de la cátedra para estudiar cada tema con calma.', 'Ver los apuntes')}
  </div>
</div></section>

<section class="sec" id="links"><div class="wrap">
  ${secHead('links', 'Links de utilidad')}
  <div class="sec-body grupos">${links.grupos.map((g) => `<div class="grupo rv"><h3>${esc(g.titulo)}</h3><ul>${g.links.map(enlace).join('')}</ul></div>`).join('')}</div>
</div></section>
</main>`

const paginaRoadmap = () => `<main id="main-roadmap">
${encabezadoPagina('roadmap', 'Roadmap y clases', 'Los temas del curso agrupados por bloque y, más abajo, las clases ya disponibles.')}
<section class="sec" id="roadmap" style="padding-top:0"><div class="wrap">
  <div class="road">${roadmap.bloques.map((b, i) => bloque(b, i + 1)).join('')}</div>
  <p class="road-nota">${esc(roadmap.nota)}</p>
</div></section>
<section class="sec band" id="clases"><div class="wrap">
  ${secHead('clases', 'Clases', 'Diapositivas y apunte de cada clase, en el orden en que se dictan.')}
  <div class="sec-body cards">
    ${numClases.map(tarjetaClase).join('')}
    <article class="card fantasma rv"><span class="num">Próximamente</span><p>Las demás clases se suman a medida que se pasan a este formato.</p></article>
  </div>
  <p class="mas"><a href="${esc(clasesBase)}">Ver el índice completo de clases →</a></p>
</div></section>
</main>`

const paginaApuntes = () => `<main id="main-apuntes">
${encabezadoPagina('apuntes', 'Apuntes teóricos', 'Documentos de la cátedra para estudiar cada tema con calma.')}
<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="apuntes">${apuntes.apuntes.map(apunte).join('')}</div>
  <p class="nota-sec">${esc(apuntes.nota)}</p>
</div></section>
</main>`

const miniatura = (opts) => svgEstatico({ ...opts, clase: 'm-mini' })
const paginaMascota = () => `<main id="main-mascota">
${encabezadoPagina('mascota', 'Mascota (borrador)', 'Probá formas, expresiones y animaciones para elegir el estilo. Esta página no está en el menú.')}
<section class="sec" style="padding-top:0"><div class="wrap lab">
  <div class="lab-prev">
    <div class="lab-stage" id="lab-stage"><div class="m-trail">${'<i></i>'.repeat(6)}</div><div class="m-demo" id="mascota-demo">${svgEstatico()}</div></div>
    <div class="lab-acciones">
      ${[['cargando', 'Cargando'], ['aviso', 'Aviso'], ['listo', 'Listo'], ['girar', 'Girar'], ['saltar', 'Saltar'], ['cometa', 'Cometa'], ['dormir', 'Dormir']].map(([a, t]) => `<button type="button" class="btn btn-s" data-accion="${a}">${t}</button>`).join('')}
    </div>
  </div>
  <div class="lab-panel">
    <h3>Forma</h3>
    <div class="lab-opts">${Object.entries(NOMBRES_FORMAS).map(([k, t]) => `<button type="button" class="opt" data-forma="${k}" aria-pressed="false">${miniatura({ forma: k })}<span>${t}</span></button>`).join('')}</div>
    <h3>Expresión</h3>
    <div class="lab-opts">${Object.entries(NOMBRES_EXPRESIONES).map(([k, t]) => `<button type="button" class="opt" data-expr="${k}" aria-pressed="false">${miniatura({ expresion: k })}<span>${t}</span></button>`).join('')}</div>
    <h3>Color</h3>
    <div class="lab-colores">${Object.entries(COLORES).map(([k, hex]) => `<button type="button" class="sw" data-color="${k}" data-hex="${hex}" aria-pressed="false" aria-label="${k}" style="background:${hex}"></button>`).join('')}</div>
  </div>
</div></section>
</main>`

const pie = () => `<footer class="foot"><div class="wrap">
  <div>
    <p class="sig">&gt; ddsi --exit 0<span class="cur"></span></p>
    <h2>Cátedra de Diseño de Sistemas de Información</h2>
    <p>${esc(curso.facultad)} · Curso ${esc(curso.codigo)} · ${esc(curso.turno)}</p>
  </div>
  <ul class="team">${curso.equipo.map((p) => `<li>${esc(p.nombre)} <span>${esc(p.rol)}</span></li>`).join('')}</ul>
  <div class="foot-end">
    <span>Actualizado el ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
    <span><a href="https://github.com/ddsutn-k3003">GitHub de la cátedra</a>${mascota.activa ? `<span class="solo-desktop"> · <button class="link-btn" type="button" data-mascota-toggle>Ocultar mascota</button> · <a href="${single ? '#mascota' : '/mascota/'}">Mascota (borrador)</a></span>` : ''}</span>
  </div>
</div></footer>`

/* La mascota se puede apagar con "activa": false en data/curso.json. */
const mascota = curso.mascota ?? { activa: true }
const bloqueMascota = () =>
  mascota.activa
    ? `<div class="mascota" id="mascota" aria-hidden="true"><div class="m-bubble der"></div>${svgEstatico()}</div><div class="m-trails" aria-hidden="true">${'<i></i>'.repeat(6)}</div>`
    : ''

const datosCalendario = `<script type="application/json" id="datos-calendario">${JSON.stringify(cron.dias)}</script>`

const CSS = `${fontFaces()}\n${read('src/styles.css')}`
const JS = `${read('src/shared.js').replace(/^export /gm, '')}\n${read('src/mascota.js').replace(/^export /gm, '')}\n${read('src/main.js')}`
const TITULO = 'Diseño de Sistemas de Información · K3003'
const DESC = 'Página del curso K3003 de Diseño de Sistemas de Información (UTN FRBA): cronograma, roadmap, clases, apuntes y links.'

const pagina = (cuerpo, { css, js, titulo = TITULO, base = '' }) => `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(DESC)}">
<link rel="icon" href="${base}/favicon.svg" type="image/svg+xml">
${css}
</head><body>${cuerpo}${js}</body></html>`

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

if (single) {
  // Fragmento para publicarlo como página (sin doctype ni head: los agrega la plataforma).
  const cuerpo = `${cabecera('inicio')}
<div class="pg" data-pg="inicio">${paginaInicio()}</div>
<div class="pg" data-pg="roadmap" hidden>${paginaRoadmap()}</div>
<div class="pg" data-pg="apuntes" hidden>${paginaApuntes()}</div>
<div class="pg" data-pg="mascota" hidden>${paginaMascota()}</div>
${pie()}${bloqueMascota()}${datosCalendario}`
  const alternar = `(function(){function localStorageOff(){try{return localStorage.getItem('mascota')==='off'}catch(e){return false}}var nav=document.querySelectorAll('.nav a, .brand, a[href^="#"]');function ir(h){var id=(h||'').replace('#','')||'inicio';var pg=id==='links'?'inicio':id;var ok=false;document.querySelectorAll('.pg').forEach(function(d){var on=d.getAttribute('data-pg')===pg;d.hidden=!on;if(on)ok=true});if(!ok)return;document.querySelectorAll('.nav a').forEach(function(a){a.setAttribute('aria-current',a.getAttribute('href')==='#'+id?'page':'false')});var fl=document.getElementById('mascota');if(fl&&!localStorageOff())fl.hidden=(pg==='mascota');if(id==='links'){var el=document.getElementById('links');if(el)el.scrollIntoView()}else window.scrollTo(0,0)}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;e.preventDefault();ir(a.getAttribute('href'))});ir(location.hash)})()`
  const frag = `<title>DDSI K3003</title>\n<style>${CSS}\nbody{margin:0}</style>\n${cuerpo}\n<script>${JS}</script>\n<script>${alternar}</script>`
  writeFileSync(join(out, 'index.html'), frag)
} else {
  mkdirSync(join(out, 'fonts'), { recursive: true })
  for (const [pkg, , file] of FUENTES) copyFileSync(fuentePath(pkg, file), join(out, 'fonts', file))
    writeFileSync(join(out, 'styles.css'), CSS)
  writeFileSync(join(out, 'main.js'), JS)
  writeFileSync(join(out, 'favicon.svg'), faviconSvg())
  writeFileSync(join(out, '.nojekyll'), '')
  const css = '<link rel="stylesheet" href="/styles.css">'
  const js = '<script src="/main.js" defer></script>'
  const armar = (actual, main, dir, titulo, conMascota = true) => {
    const html = pagina(`${cabecera(actual)}${main}${pie()}${conMascota ? bloqueMascota() : ''}${datosCalendario}`, { css, js, titulo })
    const destino = join(out, dir)
    mkdirSync(destino, { recursive: true })
    writeFileSync(join(destino, 'index.html'), html)
  }
  armar('inicio', paginaInicio(), '', TITULO)
  armar('roadmap', paginaRoadmap(), 'roadmap', `Roadmap y clases · ${TITULO}`)
  armar('apuntes', paginaApuntes(), 'apuntes', `Apuntes teóricos · ${TITULO}`)
  armar('mascota', paginaMascota(), 'mascota', `Mascota (borrador) · ${TITULO}`, false)
  const cuatrocientosCuatro = `${cabecera('')}
<main class="wrap centro" style="padding-block:72px;text-align:center">
  <p class="sig">&gt; error 404<span class="cur"></span></p>
  <h1 style="font-size:clamp(34px,5vw,54px)">Esta página no existe</h1>
  <p class="sub" style="margin-inline:auto">Puede que el link esté mal o que el contenido haya cambiado de lugar.</p>
  <p style="margin-top:28px"><a class="btn btn-p" href="/">Volver al inicio <span class="arr">→</span></a></p>
</main>`
  writeFileSync(join(out, '404.html'), pagina(cuatrocientosCuatro, { css, js: '', titulo: 'Página no encontrada · DDSI K3003' }))
}
console.log(`Listo: ${out} (${cron.dias.length} fechas del cronograma, ${numClases.length} clase/s)`)

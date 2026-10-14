// Mascota: una mancha animada con ojos. Se deforma entre formas (guijarro, círculo, cuadrado, cápsula)
// y símbolos (puntos de carga, signo de exclamación, tilde). Dibujo y animación propios, sin librerías.
// Este archivo lo usan el build (para el SVG inicial) y el navegador (se concatena sin los "export").

const K = 0.5523 // constante de Bézier para un círculo

/* Un cuerpo son tres sub-formas (cada una un camino cerrado de 4 curvas). En una mancha las tres se
   superponen; en los símbolos se separan (puntos, barra y punto, dos trazos del tilde). */
const SUB = (cx, cy, rx, ry, rot = 0, k = K, w = [1, 1, 1, 1], op = 1) => [cx, cy, rx, ry, rot, k, w[0], w[1], w[2], w[3], op]

export const FORMAS = {
  guijarro: SUB(50, 52, 35, 31, -8, 0.6, [1, 0.94, 1.04, 1.02]),
  circulo: SUB(50, 50, 33, 33, 0, K),
  cuadrado: SUB(50, 50, 33, 31, 0, 0.8),
  capsula: SUB(50, 52, 40, 26, 0, 0.72),
}

const trio = (s) => [...s, ...s, ...s]
const PUNTOS = [SUB(24, 50, 6.5, 6.5, 0, K, [1, 1, 1, 1], 0.45), SUB(50, 50, 8.5, 8.5, 0, K, [1, 1, 1, 1], 0.75), SUB(77, 50, 11, 11, 0, K, [1, 1, 1, 1], 1)].flat()
const ADMIRACION = [SUB(50, 34, 8, 24, 0, 0.7, [1, 1, 0.78, 1.04]), SUB(50, 81, 7.5, 7.5), SUB(50, 81, 7.5, 7.5)].flat()
const TILDE = [SUB(31, 61, 6.5, 13, -45, 0.75), SUB(58, 50, 6.5, 26, 45, 0.75), SUB(58, 50, 6.5, 26, 45, 0.75)].flat()

/* Ojos: [ancho, alto, cx, cy, giro] del izquierdo, ídem del derecho, opacidad. */
export const OJOS = {
  atenta: [7, 17, 39, 48, 0, 7, 17, 61, 48, 0, 1],
  feliz: [10, 5, 38, 47, -18, 10, 5, 62, 47, 18, 1],
  sorprendida: [10, 10, 38, 48, 0, 10, 10, 62, 48, 0, 1],
  dormida: [10, 2.6, 39, 52, 0, 10, 2.6, 61, 52, 0, 1],
  guino: [7, 17, 39, 48, 0, 10, 2.6, 61, 50, 0, 1],
  curiosa: [7, 17, 39, 48, 0, 7, 12, 61, 50, 0, 1],
  oculta: [7, 17, 39, 48, 0, 7, 17, 61, 48, 0, 0],
}

export const NOMBRES_FORMAS = { guijarro: 'Guijarro', circulo: 'Círculo', cuadrado: 'Cuadrado', capsula: 'Cápsula' }
export const NOMBRES_EXPRESIONES = { atenta: 'Atenta', feliz: 'Feliz', sorprendida: 'Sorprendida', dormida: 'Dormida', guino: 'Guiño', curiosa: 'Curiosa' }
export const COLORES = { rojo: '#b4182d', bordo: '#6d1327', tinta: '#1b1b1d', rosa: '#e58a98' }

export function cuerpoDe(estado, forma) {
  if (estado === 'puntos') return PUNTOS
  if (estado === 'admiracion') return ADMIRACION
  if (estado === 'tilde') return TILDE
  return trio(FORMAS[forma] ?? FORMAS.guijarro)
}

export function vectorDe(estado, forma, expresion) {
  return [...cuerpoDe(estado, forma), ...(estado === 'mancha' ? OJOS[expresion] ?? OJOS.atenta : OJOS.oculta)]
}

/* Un camino cerrado de 4 curvas Bézier a partir de los parámetros de una sub-forma. */
export function camino(p) {
  const [cx, cy, rx, ry, rot, k, w0, w1, w2, w3] = p
  const w = [w0, w1, w2, w3]
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]]
  const a = (rot * Math.PI) / 180
  const co = Math.cos(a)
  const si = Math.sin(a)
  const giro = (x, y) => [cx + (x - cx) * co - (y - cy) * si, cy + (x - cx) * si + (y - cy) * co]
  const ancla = []
  const sale = []
  const entra = []
  for (let i = 0; i < 4; i++) {
    const [dx, dy] = dirs[i]
    const ax = cx + dx * rx * w[i]
    const ay = cy + dy * ry * w[i]
    const tx = -dy
    const ty = dx
    const largo = k * (i % 2 === 0 ? rx : ry) * w[i]
    ancla.push(giro(ax, ay))
    sale.push(giro(ax + tx * largo, ay + ty * largo))
    entra.push(giro(ax - tx * largo, ay - ty * largo))
  }
  const f = (n) => Math.round(n * 100) / 100
  const q = (p2) => `${f(p2[0])} ${f(p2[1])}`
  let d = `M${q(ancla[0])}`
  for (let i = 0; i < 4; i++) d += `C${q(sale[i])} ${q(entra[(i + 1) % 4])} ${q(ancla[(i + 1) % 4])}`
  return d + 'Z'
}

export const caminosDe = (v) => [0, 1, 2].map((i) => camino(v.slice(i * 11, i * 11 + 11)))
export const opacidadesDe = (v) => [0, 1, 2].map((i) => v[i * 11 + 10])

/* Ojos como rectángulos redondeados: x, y, ancho, alto, radio, giro, centro. */
export function ojosDe(v, mirar = { x: 0, y: 0 }) {
  const o = v.slice(33)
  const un = (b) => {
    const [w, h, cx0, cy0, rot] = o.slice(b, b + 5)
    const cx = cx0 + mirar.x * 3.2
    const cy = cy0 + mirar.y * 2
    return { x: cx - w / 2, y: cy - h / 2, w, h, r: Math.min(w, h) / 2, rot, cx, cy }
  }
  return { izq: un(0), der: un(5), op: o[10] }
}

/* SVG estático (para el HTML inicial, las miniaturas y el favicon). */
export function svgEstatico({ estado = 'mancha', forma = 'guijarro', expresion = 'atenta', color = COLORES.rojo, clase = 'm-svg', ojo = '#fbe9eb' } = {}) {
  const v = vectorDe(estado, forma, expresion)
  const d = caminosDe(v)
  const op = opacidadesDe(v)
  const e = ojosDe(v)
  const rect = (r) => `<rect class="m-e" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.r}" transform="rotate(${r.rot} ${r.cx} ${r.cy})" fill="${ojo}" opacity="${e.op}"/>`
  return `<svg class="${clase}" viewBox="0 0 100 100" aria-hidden="true" focusable="false" style="--m-color:${color}"><g class="m-all">${d.map((x, i) => `<path class="m-b" d="${x}" fill="${color}" fill-opacity="${op[i]}"/>`).join('')}<g class="m-eyes">${rect(e.izq)}${rect(e.der)}</g></g></svg>`
}

export const faviconSvg = () => svgEstatico({ clase: '' }).replace('<svg class=""', '<svg xmlns="http://www.w3.org/2000/svg"')

/* ---------- Animación (solo navegador) ---------- */
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const rebote = (t) => {
  const c1 = 1.9
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export class Mascota {
  constructor(svg, { forma = 'guijarro', expresion = 'atenta', reducir = false } = {}) {
    this.svg = svg
    this.cuerpos = Array.prototype.slice.call(svg.querySelectorAll('.m-b'))
    this.ojos = Array.prototype.slice.call(svg.querySelectorAll('.m-e'))
    this.todo = svg.querySelector('.m-all')
    this.parp = svg.querySelector('.m-eyes')
    this.forma = forma
    this.expresion = expresion
    this.estado = 'mancha'
    this.reducir = reducir
    this.mirada = { x: 0, y: 0 }
    this.onda = null
    this.vec = vectorDe('mancha', forma, expresion)
    this.dibujar()
  }

  dibujar() {
    let v = this.vec
    if (this.onda !== null && this.estado === 'puntos') {
      v = v.slice()
      for (let i = 0; i < 3; i++) {
        const f = 1 + 0.3 * Math.sin(this.onda * 0.008 - i * 1.15)
        v[i * 11 + 2] *= f
        v[i * 11 + 3] *= f
      }
    }
    const d = caminosDe(v)
    const op = opacidadesDe(v)
    this.cuerpos.forEach((p, i) => {
      p.setAttribute('d', d[i])
      p.setAttribute('fill-opacity', op[i])
    })
    const e = ojosDe(v, this.mirada)
    ;[e.izq, e.der].forEach((r, i) => {
      const el = this.ojos[i]
      el.setAttribute('x', r.x)
      el.setAttribute('y', r.y)
      el.setAttribute('width', r.w)
      el.setAttribute('height', r.h)
      el.setAttribute('rx', r.r)
      el.setAttribute('transform', 'rotate(' + r.rot + ' ' + r.cx + ' ' + r.cy + ')')
      el.setAttribute('opacity', e.op)
    })
  }

  /* Lleva el dibujo hasta el vector indicado. */
  mover(destino, ms, ease) {
    this.cancelar()
    if (this.reducir || ms <= 0) {
      this.vec = destino.slice()
      this.dibujar()
      return Promise.resolve()
    }
    const desde = this.vec.slice()
    const ini = performance.now()
    const f = ease || suave
    return new Promise((ok) => {
      const paso = (ahora) => {
        const t = Math.min(1, (ahora - ini) / ms)
        const e = f(t)
        this.vec = desde.map((x, i) => x + (destino[i] - x) * e)
        this.dibujar()
        if (t < 1) this.raf = requestAnimationFrame(paso)
        else { this.raf = 0; ok() }
      }
      this.raf = requestAnimationFrame(paso)
    })
  }

  cancelar() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  irA(estado, ms = 480) {
    this.pararOnda()
    this.estado = estado
    const p = this.mover(vectorDe(estado, this.forma, this.expresion), ms, rebote)
    if (estado === 'puntos' && !this.reducir) p.then(() => this.iniciarOnda())
    return p
  }

  iniciarOnda() {
    if (this.estado !== 'puntos') return
    const paso = (ahora) => {
      this.onda = ahora
      this.dibujar()
      this.ondaRaf = requestAnimationFrame(paso)
    }
    this.ondaRaf = requestAnimationFrame(paso)
  }

  pararOnda() {
    if (this.ondaRaf) cancelAnimationFrame(this.ondaRaf)
    this.ondaRaf = 0
    this.onda = null
  }

  ponerForma(f) {
    this.forma = f
    if (this.estado === 'mancha') return this.mover(vectorDe('mancha', f, this.expresion), 420, rebote)
    return Promise.resolve()
  }

  ponerExpresion(e) {
    this.expresion = e
    if (this.estado === 'mancha') return this.mover(vectorDe('mancha', this.forma, e), 240)
    return Promise.resolve()
  }

  mirar(x, y) {
    this.mirada = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) }
    if (!this.raf) this.dibujar()
  }

  parpadear() {
    if (this.reducir || this.estado !== 'mancha' || !this.parp.animate) return
    this.parp.style.transformOrigin = '50px 48px'
    this.parp.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.1)' }, { transform: 'scaleY(1)' }], { duration: 170 })
  }

  girar() {
    if (this.reducir || !this.todo.animate) return
    this.todo.style.transformOrigin = '50px 50px'
    this.todo.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 700, easing: 'cubic-bezier(.5,0,.2,1)' })
  }

  saltar(veces = 1) {
    if (this.reducir || !this.todo.animate) return
    this.todo.style.transformOrigin = '50px 92px'
    this.todo.animate(
      [
        { transform: 'translateY(0) scale(1.14,.84)' },
        { transform: 'translateY(-26px) scale(.92,1.1)', offset: 0.5 },
        { transform: 'translateY(0) scale(1.14,.84)' },
      ],
      { duration: 440, iterations: veces, easing: 'ease-in-out' },
    )
  }

  /* Secuencias con nombre. Devuelven una promesa para encadenar. */
  espera(ms) { return new Promise((ok) => setTimeout(ok, ms)) }

  async cargando(ms = 1800) { await this.irA('puntos'); await this.espera(ms); return this.irA('mancha') }
  async aviso(ms = 1500) { await this.irA('admiracion'); this.saltar(); await this.espera(ms); return this.irA('mancha') }
  async listo(ms = 1100) { await this.irA('tilde'); await this.espera(ms); return this.irA('mancha') }
}

/* Comportamiento de la portada: "lo que viene" con la fecha de hoy y la mascota. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var datos = []

  /* Lo que viene: se recalcula con la fecha de hoy del navegador. */
  try {
    datos = JSON.parse(document.getElementById('datos-calendario').textContent)
    var hoy = hoyISO()
    var cont = document.getElementById('prox-lista')
    if (cont) cont.innerHTML = renderProximas(proximas(datos, hoy, 4), hoy, datos[0] && datos[0].fecha)
  } catch (e) {}

  var $ = function (s, r) { return (r || document).querySelector(s) }
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)) }
  var ESPERA = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms) }) }

  /* Cometa: la mascota recorre el borde de un rectángulo dejando una estela. */
  function cometa(m, o) {
    var t0 = Math.atan2((o.y0 - o.cy) / o.b, (o.x0 - o.cx) / o.a)
    var dur = o.dur || 3200
    var hist = []
    var ini = null
    var sg = function (x) { return x < 0 ? -1 : 1 }
    var pt = function (t) {
      var c = Math.cos(t)
      var s = Math.sin(t)
      return [o.cx + o.a * sg(c) * Math.pow(Math.abs(c), 1 / 3), o.cy + o.b * sg(s) * Math.pow(Math.abs(s), 1 / 3)]
    }
    m.ponerExpresion('feliz')
    return new Promise(function (ok) {
      function frame(ahora) {
        if (ini === null) ini = ahora
        var p = Math.min(1, (ahora - ini) / dur)
        var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
        var t = t0 + e * Math.PI * 2
        var q = pt(t)
        var n = pt(t + 0.04)
        var mezcla = Math.min(1, p / 0.1)
        var x = o.x0 + (q[0] - o.x0) * mezcla
        var y = o.y0 + (q[1] - o.y0) * mezcla
        var ang = (Math.atan2(n[1] - q[1], n[0] - q[0]) * 180) / Math.PI
        o.mover(x, y)
        m.todo.style.transformOrigin = '50px 50px'
        m.todo.style.transform = 'rotate(' + ang.toFixed(1) + 'deg) scale(1.5,.78)'
        hist.push([x, y])
        if (hist.length > 60) hist.shift()
        o.estela.forEach(function (el, i) {
          var h = hist[hist.length - 1 - (i + 1) * 4] || hist[0]
          var k = 1 - (i + 1) / (o.estela.length + 1)
          el.style.transform = 'translate(' + (h[0] + o.mitad) + 'px,' + (h[1] + o.mitad) + 'px) scale(' + k.toFixed(2) + ')'
          el.style.opacity = p < 1 ? (0.55 * k).toFixed(2) : 0
        })
        if (p < 1) requestAnimationFrame(frame)
        else {
          m.todo.style.transform = ''
          o.estela.forEach(function (el) { el.style.opacity = 0 })
          m.ponerExpresion('atenta')
          ok()
        }
      }
      requestAnimationFrame(frame)
    })
  }

  /* ---------- Laboratorio (página /mascota/) ---------- */
  var demo = $('#mascota-demo')
  if (demo) {
    var md = new Mascota($('svg', demo), { reducir: reduce })
    var forma = 'guijarro'
    var expr = 'atenta'
    function marcar(attr, val) {
      $$('[' + attr + ']').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute(attr) === val ? 'true' : 'false') })
    }
    marcar('data-forma', forma)
    marcar('data-expr', expr)
    marcar('data-color', 'rojo')
    var acciones = {
      cargando: function () { return md.cargando(2200) },
      aviso: function () { return md.aviso() },
      listo: function () { return md.listo() },
      girar: function () { md.girar(); return Promise.resolve() },
      saltar: function () { md.saltar(2); return Promise.resolve() },
      dormir: function () { md.ponerExpresion('dormida'); marcar('data-expr', 'dormida'); return Promise.resolve() },
      cometa: function () {
        var caja = $('.lab-stage').getBoundingClientRect()
        var r = demo.getBoundingClientRect()
        var mitad = r.width / 2
        var estela = $$('.m-trail i', $('.lab-stage'))
        return cometa(md, {
          cx: 0, cy: 0, a: caja.width / 2 - mitad - 24, b: caja.height / 2 - mitad - 24,
          x0: 0, y0: 0, mitad: 0, estela: estela, dur: 3400,
          mover: function (x, y) { demo.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)' },
        }).then(function () { demo.style.transform = '' })
      },
    }
    $$('[data-accion]').forEach(function (b) { b.addEventListener('click', function () { var f = acciones[b.getAttribute('data-accion')]; if (f) f() }) })
    $$('[data-forma]').forEach(function (b) { b.addEventListener('click', function () { forma = b.getAttribute('data-forma'); md.ponerForma(forma); marcar('data-forma', forma) }) })
    $$('[data-expr]').forEach(function (b) { b.addEventListener('click', function () { expr = b.getAttribute('data-expr'); md.ponerExpresion(expr); marcar('data-expr', expr) }) })
    $$('[data-color]').forEach(function (b) {
      b.addEventListener('click', function () {
        demo.style.setProperty('--m-color', b.getAttribute('data-hex'))
        $$('.m-b', demo).forEach(function (p) { p.setAttribute('fill', b.getAttribute('data-hex')) })
        marcar('data-color', b.getAttribute('data-color'))
      })
    })
    setInterval(function () { md.parpadear() }, 4200)
    document.addEventListener('pointermove', function (e) {
      var r = demo.getBoundingClientRect()
      md.mirar((e.clientX - (r.left + r.width / 2)) / 300, (e.clientY - (r.top + r.height / 2)) / 300)
    }, { passive: true })
    demo.addEventListener('click', function () { md.girar() })
  }

  /* ---------- Mascota flotante ---------- */
  var el = document.getElementById('mascota')
  if (!el) return
  var svg = $('svg', el)
  var burbuja = $('.m-bubble', el)
  var estela = $$('.m-trail i')
  var m = new Mascota(svg, { reducir: reduce })
  var TAM = el.offsetWidth || 52
  var pos = { x: 0, y: 0, rincon: 'der' }
  var s = { dormida: false, ocupada: false, ultima: Date.now(), tBurbuja: null, ultimaCometa: Date.now() }

  var guardado = null
  try { guardado = localStorage.getItem('mascota') } catch (e) {}
  var botones = $$('[data-mascota-toggle]')
  function pintarBoton() { botones.forEach(function (b) { b.textContent = el.hidden ? 'Mostrar mascota' : 'Ocultar mascota' }) }
  if (guardado === 'off') el.hidden = true
  pintarBoton()
  botones.forEach(function (b) {
    b.addEventListener('click', function () {
      el.hidden = !el.hidden
      try { localStorage.setItem('mascota', el.hidden ? 'off' : 'on') } catch (e) {}
      pintarBoton()
    })
  })

  var TIPS = [
    'Si algo no cierra, preguntá.',
    'Primero el diseño, después el código.',
    'Cuando dudes, dibujalo.',
    'Compilar no es estar bien diseñado.',
    'Releé el enunciado antes de empezar.',
    'Un diagrama claro vale más que uno completo.',
    'Mirá el cronograma: a veces hay parcialito.',
  ]

  function decir(texto, ms) {
    if (el.hidden || !burbuja) return
    burbuja.className = 'm-bubble ' + (pos.rincon === 'izq' ? 'izq' : 'der')
    burbuja.textContent = texto
    void burbuja.offsetWidth
    burbuja.classList.add('on')
    clearTimeout(s.tBurbuja)
    s.tBurbuja = setTimeout(function () { burbuja.classList.remove('on') }, ms || 4200)
  }

  function libre() { return (window.innerWidth - 1120) / 2 }
  function hayLugar() { return libre() >= TAM + 36 && !reduce }
  function xRincon(r) { return r === 'izq' ? 16 : window.innerWidth - TAM - 16 }
  function yBase() { return window.innerHeight - TAM - 8 }
  function colocar(x, y, ms) {
    pos.x = x; pos.y = y
    el.style.transition = ms ? 'transform ' + ms + 'ms linear' : 'none'
    el.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)'
  }
  function ocupar(f) {
    if (s.ocupada || s.dormida || el.hidden || document.hidden) return Promise.resolve()
    s.ocupada = true
    return Promise.resolve(f()).then(function () { s.ocupada = false }, function () { s.ocupada = false })
  }

  var acciones2 = {
    mirar: function () {
      var d = Math.random() < 0.5 ? -1 : 1
      m.mirar(d, 0)
      return ESPERA(1200).then(function () { m.mirar(0, 0) })
    },
    pensar: function () { return m.cargando(1700) },
    aviso: function () { decir(TIPS[Math.floor(Math.random() * TIPS.length)], 4200); return m.aviso(1700) },
    girar: function () { m.girar(); return ESPERA(750) },
    saltar: function () { m.saltar(2); return ESPERA(900) },
    pasear: function () {
      if (!hayLugar()) return acciones2.saltar()
      var nuevo = pos.rincon === 'izq' ? 'der' : 'izq'
      var destino = xRincon(nuevo)
      var n = Math.max(2, Math.round(Math.abs(destino - pos.x) / 140))
      var ms = n * 440
      m.saltar(n)
      colocar(destino, pos.y, ms)
      pos.rincon = nuevo
      return ESPERA(ms + 40)
    },
    cometa: function () {
      if (reduce || window.innerWidth < 900) return acciones2.girar()
      var W = window.innerWidth
      var H = window.innerHeight
      var mitad = TAM / 2
      s.ultimaCometa = Date.now()
      var x0 = pos.x
      var y0 = pos.y
      el.style.transition = 'none'
      return cometa(m, {
        cx: W / 2 - mitad, cy: H / 2 - mitad, a: W / 2 - mitad - 14, b: H / 2 - mitad - 8,
        x0: x0, y0: y0, mitad: mitad, estela: estela, dur: 3600,
        mover: function (x, y) { el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)' },
      }).then(function () { colocar(x0, y0, 0) })
    },
  }

  function elegir() {
    var r = Math.random()
    if (!reduce && Date.now() - s.ultimaCometa > 70000 && r < 0.12) return 'cometa'
    if (r < 0.3) return 'mirar'
    if (r < 0.46) return 'pensar'
    if (r < 0.6) return 'aviso'
    if (r < 0.72) return 'girar'
    if (r < 0.82) return 'saltar'
    return 'pasear'
  }

  function ciclo() {
    setTimeout(function () {
      if (Date.now() - s.ultima > 60000 && !s.dormida && !reduce) {
        s.dormida = true
        m.ponerExpresion('dormida')
      } else if (!s.dormida) ocupar(acciones2[elegir()])
      ciclo()
    }, 6500 + Math.random() * 6500)
  }

  function despertar() {
    s.ultima = Date.now()
    if (s.dormida) {
      s.dormida = false
      m.ponerExpresion('sorprendida')
      setTimeout(function () { m.ponerExpresion('atenta') }, 900)
    }
  }
  ;['pointerdown', 'keydown', 'scroll'].forEach(function (t) { window.addEventListener(t, despertar, { passive: true }) })

  var raf = 0
  window.addEventListener('pointermove', function (e) {
    despertar()
    if (reduce || raf || s.ocupada) return
    raf = requestAnimationFrame(function () {
      raf = 0
      m.mirar((e.clientX - (pos.x + TAM / 2)) / 450, (e.clientY - (pos.y + TAM / 2)) / 450)
    })
  }, { passive: true })

  svg.addEventListener('click', function () {
    despertar()
    if (s.ocupada) return
    s.ocupada = true
    m.girar()
    decir(TIPS[Math.floor(Math.random() * TIPS.length)], 4200)
    m.listo(900).then(function () { s.ocupada = false })
  })

  window.addEventListener('resize', function () {
    if (!hayLugar()) pos.rincon = 'der'
    colocar(xRincon(pos.rincon), yBase(), 0)
  })

  /* Arranque: aparece como puntos de carga, se vuelve mancha y, si hoy hay algo en el cronograma, avisa. */
  colocar(xRincon('der'), yBase(), 0)
  m.irA('puntos', 0)
  var anuncios = { clase: 'Hoy hay clase.', preparcial: 'Hoy hay pre-parcial.', parcial: 'Hoy hay parcial.', recuperatorio: 'Hoy hay recuperatorio.', tpa: 'Hoy es entrega del TPA.' }
  setTimeout(function () {
    var hoyDia = datos.filter(function (d) { return d.fecha === hoyISO() })[0]
    var hay = hoyDia && anuncios[hoyDia.tipo]
    if (hay && !reduce) {
      s.ocupada = true
      m.irA('admiracion', 420).then(function () { decir(hay, 5000); m.saltar(); return ESPERA(1800) }).then(function () { return m.irA('mancha') }).then(function () { s.ocupada = false })
    } else m.irA('mancha', reduce ? 0 : 520)
  }, reduce ? 0 : 1100)
  if (!reduce) { ciclo(); setInterval(function () { if (!s.ocupada && !s.dormida) m.parpadear() }, 4300) }
})()

/* Páginas de TPA y parciales: estado de las entregas, pestañas, filtros, autocorrección y tarjetas. */
;(function () {
  var $ = function (s, r) { return (r || document).querySelector(s) }
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)) }
  document.documentElement.classList.add('js')

  /* Entregas del TPA: pasada, próxima o de hoy, según la fecha del navegador. */
  var hoy = hoyISO()
  var marcada = false
  $$('.ent').forEach(function (el) {
    var f = el.getAttribute('data-fecha')
    el.classList.remove('pasada', 'proxima', 'hoy')
    if (f < hoy) el.classList.add('pasada')
    else if (f === hoy) { el.classList.add('hoy'); marcada = true }
    else if (!marcada) { el.classList.add('proxima'); marcada = true }
  })

  /* Pestañas de parciales (con link directo en el sitio de varias páginas: #segundo). */
  var tabs = $$('.tab')
  if (tabs.length) {
    var multi = !document.querySelector('.pg')
    var abrir = function (id, guardar) {
      tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-tab') === id)) })
      $$('.pp').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== id })
      if (guardar && multi && history.replaceState) history.replaceState(null, '', '#' + id)
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { abrir(t.getAttribute('data-tab'), true) }) })
    var ini = multi ? location.hash.replace('#', '') : ''
    abrir(tabs.some(function (t) { return t.getAttribute('data-tab') === ini }) ? ini : tabs[0].getAttribute('data-tab'), false)
  }

  /* Filtros por etiqueta (errores y tarjetas). */
  $$('.filtros').forEach(function (f) {
    f.hidden = false
    var items = $$(f.getAttribute('data-filtros') === 'err' ? '.er' : '.tj', f.parentNode)
    $$('.fl', f).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.fl', f).forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)) })
        var tag = b.getAttribute('data-tag')
        items.forEach(function (it) { it.hidden = !!tag && it.getAttribute('data-tag') !== tag })
      })
    })
  })

  /* Tarjetas: dar vuelta. */
  $$('.tj').forEach(function (t) {
    t.addEventListener('click', function () { t.setAttribute('aria-expanded', String(t.getAttribute('aria-expanded') !== 'true')) })
  })

  /* Autocorrección: se mezclan las opciones y se corrige al elegir. */
  $$('.quiz').forEach(function (quiz) {
    var preguntas = $$('.q', quiz)
    var punto = $('.quiz-pt', quiz)
    var reset = $('.quiz-reset', quiz)
    preguntas.forEach(function (q) {
      var cont = $('.q-ops', q)
      var ops = $$('.qo', cont)
      for (var i = ops.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); cont.insertBefore(ops[j], ops[i]); ops = $$('.qo', cont) }
      $$('.qo', q).forEach(function (b) {
        b.addEventListener('click', function () {
          if (q.classList.contains('respondida')) return
          q.classList.add('respondida')
          var acerto = b.hasAttribute('data-correcta')
          $$('.qo', q).forEach(function (o) { o.disabled = true; if (o.hasAttribute('data-correcta')) o.classList.add('ok') })
          if (!acerto) b.classList.add('mal')
          q.setAttribute('data-acerto', acerto ? '1' : '0')
          actualizar()
        })
      })
    })
    function actualizar() {
      var hechas = preguntas.filter(function (q) { return q.classList.contains('respondida') })
      var buenas = hechas.filter(function (q) { return q.getAttribute('data-acerto') === '1' })
      punto.textContent = 'Respondidas ' + hechas.length + ' de ' + preguntas.length + ' · Correctas ' + buenas.length
      reset.hidden = hechas.length === 0
    }
    reset.addEventListener('click', function () {
      preguntas.forEach(function (q) {
        q.classList.remove('respondida')
        q.removeAttribute('data-acerto')
        $$('.qo', q).forEach(function (o) { o.disabled = false; o.classList.remove('ok', 'mal') })
      })
      actualizar()
    })
  })
})()

/* Comportamiento de la portada: sección activa, "lo que viene" con la fecha de hoy y Compi. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* Lo que viene: se recalcula con la fecha de hoy del navegador. */
  try {
    var dias = JSON.parse(document.getElementById('datos-calendario').textContent)
    var hoy = hoyISO()
    var cont = document.getElementById('prox-lista')
    if (cont) cont.innerHTML = renderProximas(proximas(dias, hoy, 4), hoy)
  } catch (e) {}

  /* Sección activa en la barra superior. */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a'))
  var secciones = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')) })
    .filter(Boolean)
  var actual = null
  function marcar(id) {
    links.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false') })
    if (id !== actual) { actual = id; document.dispatchEvent(new CustomEvent('seccion', { detail: id })) }
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) { if (e.isIntersecting) marcar(e.target.id) })
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    secciones.forEach(function (s) { io.observe(s) })
  }

  /* Compi */
  var el = document.getElementById('compi')
  if (!el) return
  var svg = el.querySelector('svg')
  var burbuja = el.querySelector('.compi-bubble')
  var guardado = null
  try { guardado = localStorage.getItem('compi') } catch (e) {}
  var botones = document.querySelectorAll('[data-compi-toggle]')
  function pintarBoton() {
    botones.forEach(function (b) { b.textContent = el.classList.contains('oculto') ? 'Mostrar a Compi' : 'Ocultar a Compi' })
  }
  if (guardado === 'off') el.classList.add('oculto')
  pintarBoton()
  botones.forEach(function (b) {
    b.addEventListener('click', function () {
      var off = el.classList.toggle('oculto')
      try { localStorage.setItem('compi', off ? 'off' : 'on') } catch (e) {}
      pintarBoton()
    })
  })

  var W = 72
  var estado = { x: null, quieto: false, durmiendo: false, ultimaAccion: Date.now() }
  var temporizador = null
  var tBurbuja = null

  function mood(m) { el.setAttribute('data-mood', m) }
  function pulso(clase, ms) {
    el.classList.remove(clase)
    void el.offsetWidth
    el.classList.add(clase)
    setTimeout(function () { el.classList.remove(clase) }, ms)
  }

  var TIPS = [
    'Si algo no cierra, preguntá. Para eso estamos.',
    'Primero pensá el diseño, después escribí el código.',
    'Cuando dudes, dibujalo.',
    'Compilar no es lo mismo que estar bien diseñado.',
    'Releé el enunciado antes de empezar. Dos veces.',
    'Un diagrama claro vale más que uno completo.',
    'Revisá el cronograma: a veces hay parcialito.',
  ]
  var POR_SECCION = {
    documentos: ['Empezá por acá: el cronograma tiene las fechas.', 'wink'],
    roadmap: ['Este es el mapa de la materia. Andá de a un tema.', 'code'],
    clases: ['Las diapositivas se recorren con las flechas.', 'happy'],
    apuntes: ['Los apuntes son para estudiar con calma.', 'code'],
    links: ['Si falta algún link útil, avisanos.', 'wink'],
  }
  var vistas = {}

  function decir(texto, m, ms) {
    if (el.classList.contains('oculto') || !burbuja) return
    var izq = estado.x !== null ? estado.x + W / 2 < window.innerWidth / 2 : false
    burbuja.className = 'compi-bubble ' + (izq ? 'izq' : 'der')
    burbuja.textContent = texto
    void burbuja.offsetWidth
    burbuja.classList.add('on')
    if (m) mood(m)
    clearTimeout(tBurbuja)
    tBurbuja = setTimeout(function () {
      burbuja.classList.remove('on')
      mood('neutral')
    }, ms || 4600)
  }

  /* Espacio libre a los costados del contenido: ahí es donde Compi puede pasear sin tapar texto. */
  function bordes() {
    var w = window.innerWidth
    var libre = (w - 1120) / 2
    if (libre < 100 || reduce) return null
    return {
      izq: [10, libre - W - 14],
      der: [w - libre + 14, w - W - 10],
    }
  }

  function posicionar(x, ms) {
    estado.x = x
    el.style.transition = ms ? 'transform ' + ms + 'ms cubic-bezier(.45,.05,.55,.95)' : 'none'
    el.style.transform = 'translateX(' + Math.round(x) + 'px)'
  }

  function iniciar() {
    el.style.left = '0'
    el.style.right = 'auto'
    var b = bordes()
    posicionar(b ? b.der[1] : window.innerWidth - W - 12, 0)
  }

  function pasear() {
    var b = bordes()
    if (!b || estado.durmiendo || document.hidden || el.classList.contains('oculto')) return
    var dest
    var r = Math.random()
    var lado = r < 0.42 ? 'izq' : r < 0.84 ? 'der' : Math.random() < 0.5 ? 'izq' : 'der'
    var rango = b[lado]
    // En las esquinas con más frecuencia que en el medio del margen.
    dest = Math.random() < 0.6 ? (lado === 'izq' ? rango[0] : rango[1]) : rango[0] + Math.random() * (rango[1] - rango[0])
    var dist = Math.abs(dest - estado.x)
    if (dist < 24) return
    var ms = Math.max(700, (dist / 170) * 1000)
    el.style.setProperty('--lean', dest > estado.x ? '4deg' : '-4deg')
    el.style.setProperty('--lx', dest > estado.x ? '3px' : '-3px')
    el.classList.add('rueda')
    posicionar(dest, ms)
    setTimeout(function () {
      el.classList.remove('rueda')
      el.style.setProperty('--lean', '0deg')
      el.style.setProperty('--lx', '0px')
    }, ms + 60)
  }

  function accion() {
    if (document.hidden || el.classList.contains('oculto')) return
    var ocioso = Date.now() - estado.ultimaAccion
    if (ocioso > 50000 && !estado.durmiendo && !reduce) {
      estado.durmiendo = true
      mood('sleepy')
      return
    }
    if (estado.durmiendo) return
    var r = Math.random()
    if (r < 0.5) pasear()
    else if (r < 0.7 && !reduce) pulso('saluda', 1600)
    else if (r < 0.85 && !reduce) pulso('salta', 650)
    else { mood('wink'); setTimeout(function () { mood('neutral') }, 1100) }
  }

  function ciclo() {
    temporizador = setTimeout(function () { accion(); ciclo() }, 7000 + Math.random() * 9000)
  }

  function despertar() {
    estado.ultimaAccion = Date.now()
    if (estado.durmiendo) {
      estado.durmiendo = false
      mood('wow')
      setTimeout(function () { mood('neutral') }, 900)
    }
  }
  ;['pointerdown', 'keydown', 'scroll'].forEach(function (t) { window.addEventListener(t, despertar, { passive: true }) })

  /* Los ojos siguen al mouse (solo horizontal y apenas). */
  var raf = 0
  window.addEventListener('pointermove', function (e) {
    despertar()
    if (reduce || el.classList.contains('rueda') || raf) return
    raf = requestAnimationFrame(function () {
      raf = 0
      var cx = (estado.x || 0) + W / 2
      var d = Math.max(-1, Math.min(1, (e.clientX - cx) / 400))
      var dy = Math.max(-1, Math.min(1, (e.clientY - (window.innerHeight - 70)) / 500))
      el.style.setProperty('--lx', (d * 3.2).toFixed(1) + 'px')
      el.style.setProperty('--ly', (dy * 2).toFixed(1) + 'px')
    })
  }, { passive: true })

  svg.addEventListener('click', function () {
    despertar()
    if (!reduce) pulso('salta', 650)
    decir(TIPS[Math.floor(Math.random() * TIPS.length)], 'happy')
  })
  svg.addEventListener('mouseenter', function () { if (!reduce && !estado.durmiendo) pulso('saluda', 1600) })

  /* Un comentario al entrar a cada sección, una sola vez y sin apurarse. */
  var espera = null
  document.addEventListener('seccion', function (e) {
    var d = POR_SECCION[e.detail]
    clearTimeout(espera)
    if (!d || vistas[e.detail] || reduce) return
    espera = setTimeout(function () {
      if (actual !== e.detail) return
      vistas[e.detail] = true
      decir(d[0], d[1])
    }, 1100)
  })

  window.addEventListener('resize', function () {
    var b = bordes()
    posicionar(b ? Math.min(Math.max(estado.x || 0, b.izq[0]), b.der[1]) : window.innerWidth - W - 12, 0)
  })
  iniciar()
  if (!reduce) ciclo()
})()

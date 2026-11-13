import { buildWhatsAppUrl } from "./whatsapp.js";
export function initializeSeydan(root, page) {
  const controller = new AbortController();
  const globalOn = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: controller.signal });
  const CONFIG = Object.freeze({
    nombre: "Seydan",
    telefono: "+57 313 431 3385",
    telefonoLink: "+573134313385",
    email: "hola@seydan.co",
    direccion: "Calle 3, El Rosal, Rubio Estado Táchira, Venezuela",
    horario: "Lunes a sábado · 9:00 a 18:00",
    moneda: "COP",
    locale: "es-CO",
    abonoPct: 0.3,
    maxDiasReserva: 90,
    storageKey: "seydan.reservas.v1",
    ordenKey: "seydan.ultima-orden.v1",
  });

  /* ------------------------------------------------------------------------
     2. Datos mock (mismo shape que devolvería una API)
     ------------------------------------------------------------------------ */
  const CATEGORIAS = [
    { id: "planchado", nombre: "Planchado" },
    { id: "ondas", nombre: "Ondas" },
    { id: "canekalon", nombre: "Canekalon" },
    { id: "tinte", nombre: "Tinte" },
    { id: "alisados", nombre: "Alisados" },
    { id: "ninas", nombre: "Niñas" },
  ];

  const SERVICIOS = [
    {
      id: "planchado-lujo",
      nombre: "Planchado de lujo",
      categoria: "planchado",
      descripcion:
        "Liso espejo con protección térmica, puntas selladas y acabado con brillo. Incluye diagnóstico rápido del cabello.",
      precio: 45000,
      duracion: 60,
      color: "#7FD1B9",
      imagen: "assets/img/servicios/planchado.svg",
      etiquetas: ["liso", "brillo", "plancha", "proteccion termica"],
      destacado: true,
      paraNinas: false,
    },
    {
      id: "ondas-glam",
      nombre: "Ondas glam",
      categoria: "ondas",
      descripcion:
        "Ondas suaves y definidas con fijación ligera para que duren todo el día. Ideal para eventos, fotos y celebraciones.",
      precio: 40000,
      duracion: 60,
      color: "#9FE3CF",
      imagen: "assets/img/servicios/ondas.svg",
      etiquetas: ["ondas", "rizador", "eventos", "fiesta"],
      destacado: false,
      paraNinas: false,
    },
    {
      id: "trenzas-canekalon",
      nombre: "Servicios con canekalon",
      categoria: "canekalon",
      descripcion:
        "Servicios con extensiones canekalon: protección, volumen y estilo de larga duración. Elegimos el tono contigo.",
      precio: 70000,
      duracion: 120,
      color: "#6BAF9A",
      imagen: "assets/img/servicios/canekalon.svg",
      etiquetas: ["trenzas", "canekalon", "extensiones", "proteccion"],
      destacado: false,
      paraNinas: false,
    },
    {
      id: "tinte-tratamiento",
      nombre: "Tinte + tratamiento",
      categoria: "tinte",
      descripcion:
        "Color a medida con diagnóstico previo y tratamiento de hidratación profunda. Protegemos el tono y la fibra capilar.",
      precio: 90000,
      duracion: 120,
      color: "#5FBBA1",
      imagen: "assets/img/servicios/tinte.svg",
      etiquetas: ["color", "tinte", "hidratacion", "cobertura de canas"],
      destacado: true,
      paraNinas: false,
    },
    {
      id: "alisado-permanente",
      nombre: "Alisado permanente",
      categoria: "alisados",
      descripcion:
        "Alisado progresivo sin formol con acabado natural. Reduce el frizz y facilita el peinado diario por semanas.",
      precio: 120000,
      duracion: 150,
      color: "#3F8F76",
      imagen: "assets/img/servicios/alisado.svg",
      etiquetas: ["alisado", "sin formol", "frizz", "keratina"],
      destacado: true,
      paraNinas: false,
    },
    {
      id: "peinado-ninas",
      nombre: "Trenzas y ligas para niñas",
      categoria: "ninas",
      descripcion:
        "Peinados cómodos y coloridos para las más pequeñas, con ligas suaves y productos apropiados para su edad.",
      precio: 25000,
      duracion: 45,
      color: "#E5C97A",
      imagen: "assets/img/servicios/ninas.svg",
      etiquetas: ["niñas", "trenzas", "ligas", "colegio", "infantil"],
      destacado: false,
      paraNinas: true,
    },
    
  ];

  const HORARIOS = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
  ];

  /* ------------------------------------------------------------------------
     3. Utilidades
     ------------------------------------------------------------------------ */
  const $ = (selector, scope = root) => scope.querySelector(selector);
  const $$ = (selector, scope = root) => Array.from(scope.querySelectorAll(selector));

  const formatoMoneda = new Intl.NumberFormat(CONFIG.locale, {
    style: "currency",
    currency: CONFIG.moneda,
    maximumFractionDigits: 0,
  });

  const precioCOP = (valor) => formatoMoneda.format(Number(valor) || 0);

  const normalizar = (valor) =>
    String(valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const escapar = (valor) =>
    String(valor ?? "").replace(
      /[&<>"']/g,
      (caracter) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[caracter],
    );

  const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

  const isoLocal = (fecha = new Date()) => {
    const desfase = fecha.getTimezoneOffset();
    return new Date(fecha.getTime() - desfase * 60000).toISOString().slice(0, 10);
  };

  const sumarDias = (fecha, dias) => {
    const copia = new Date(fecha);
    copia.setDate(copia.getDate() + dias);
    return copia;
  };

  const formatearFecha = (iso) => {
    if (!iso) return "Sin fecha";
    const fecha = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(fecha.getTime())) return iso;
    return capitalizar(
      new Intl.DateTimeFormat(CONFIG.locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(fecha),
    );
  };

  const formatearFechaCorta = (iso) => {
    if (!iso) return "";
    const fecha = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(fecha.getTime())) return iso;
    return new Intl.DateTimeFormat(CONFIG.locale, {
      day: "numeric",
      month: "short",
    }).format(fecha);
  };

  const crearId = (prefijo = "res") =>
    `${prefijo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  const debounce = (fn, espera = 180) => {
    let temporizador;
    return (...args) => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => fn(...args), espera);
    };
  };

  const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

  const icono = {
    reloj:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    calendario:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    basura:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/></svg>',
    check:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
    buscar:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    cerrar:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    ubicacion:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    telefono:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>',
    correo:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>',
    etiqueta:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="8" cy="8" r="1.5"/></svg>',
    deposito:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="17" cy="15" r="1.5"/></svg>',
  };

  /* ------------------------------------------------------------------------
     5. Estado y arranque
     ------------------------------------------------------------------------ */
  const estado = {
    filtros: { busqueda: "", categoria: "todas", orden: "recomendados" },
    reservas: [],
  };

  /* ------------------------------------------------------------------------
     6. Layout compartido: navegación móvil, año, contador, toast
     ------------------------------------------------------------------------ */
  function iniciarLayout() {
    const header = $("[data-header]");
    if (header) {
      const alDesplazar = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
      alDesplazar();
      globalOn(window, "scroll", alDesplazar, { passive: true });
    }

    const toggle = $("[data-nav-toggle]");
    const nav = $("#nav-principal");
    if (toggle && nav) {
      const etiqueta = $(".sr-only", toggle);
      const cerrarNav = (devolverFoco = false) => {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        if (etiqueta) etiqueta.textContent = "Abrir menú";
        if (devolverFoco) toggle.focus();
      };

      toggle.addEventListener("click", () => {
        const abierto = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!abierto));
        nav.classList.toggle("is-open", !abierto);
        if (etiqueta) etiqueta.textContent = abierto ? "Abrir menú" : "Cerrar menú";
      });

      nav.addEventListener("click", (event) => {
        if (event.target.closest("a") && window.matchMedia("(max-width: 900px)").matches) {
          cerrarNav();
        }
      });

      globalOn(document, "keydown", (event) => {
        if (event.key === "Escape" && nav.classList.contains("is-open")) {
          cerrarNav(true);
        }
      });

      globalOn(window, "resize", () => {
        if (window.innerWidth > 900) cerrarNav();
      });
    }

    globalOn(document, "click", (event) => {
      const disparador = event.target.closest("[data-detalle-servicio]");
      if (disparador) abrirModalServicio(disparador.dataset.detalleServicio);
    });
  }

  function actualizarAnio() {
    $$("[data-year]").forEach((nodo) => {
      nodo.textContent = String(new Date().getFullYear());
    });
  }

  let temporizadorToast = null;

  function mostrarToast(mensaje, opciones = {}) {
    const toast = $("[data-toast]");
    if (!toast) return;

    clearTimeout(temporizadorToast);
    toast.replaceChildren();

    const texto = document.createElement("span");
    texto.textContent = mensaje;
    toast.append(texto);

    if (opciones.accion && typeof opciones.alAccionar === "function") {
      const accion = document.createElement("button");
      accion.type = "button";
      accion.className = "toast__action";
      accion.textContent = opciones.accion;
      accion.addEventListener(
        "click",
        () => {
          opciones.alAccionar();
          ocultarToast();
        },
        { once: true },
      );
      toast.append(accion);
    }

    const cerrar = document.createElement("button");
    cerrar.type = "button";
    cerrar.className = "toast__close";
    cerrar.setAttribute("aria-label", "Cerrar notificación");
    cerrar.innerHTML = "&times;";
    cerrar.addEventListener("click", ocultarToast);
    toast.append(cerrar);

    toast.classList.add("is-visible");
    temporizadorToast = setTimeout(ocultarToast, opciones.duracion ?? 5200);
  }

  function ocultarToast() {
    const toast = $("[data-toast]");
    if (toast) toast.classList.remove("is-visible");
  }

  /* ------------------------------------------------------------------------
     7. Home
     ------------------------------------------------------------------------ */
  function iniciarHome() {
    const contenedor = $("[data-servicios-destacados]");
    if (!contenedor) return;
    contenedor.innerHTML = SERVICIOS.slice(0, 3).map(tarjetaServicio).join("");
    contenedor.setAttribute("aria-busy", "false");
  }

  /* ------------------------------------------------------------------------
     8. Servicios: tarjetas, filtros y buscador
     ------------------------------------------------------------------------ */
  function categoriaNombre(idCategoria) {
    const categoria = CATEGORIAS.find((item) => item.id === idCategoria);
    return categoria ? categoria.nombre : "Servicio";
  }

  function tarjetaServicio(servicio) {
    const favorito = servicio.destacado
      ? '<span class="badge badge--gold service-card__fav">Favorito</span>'
      : "";
    const paraNinas = servicio.paraNinas ? "<li>Ideal para niñas</li>" : "";

    return `
      <article class="service-card service-card--${servicio.categoria}">
        <div class="service-card__media">
          <img src="${servicio.imagen}" alt="Ilustración de ${escapar(servicio.nombre)}" width="640" height="420" loading="lazy" decoding="async">
          <span class="badge service-card__badge">${escapar(categoriaNombre(servicio.categoria))}</span>
          ${favorito}
        </div>
        <div class="service-card__body">
          <h3 class="service-card__title">${escapar(servicio.nombre)}</h3>
          <p class="service-card__desc">${escapar(servicio.descripcion)}</p>
          <ul class="service-card__meta" aria-label="Detalles del servicio">
            <li>${icono.reloj} ${servicio.duracion} min</li>
            ${paraNinas}
          </ul>
          <div class="service-card__footer">
            <p class="price">
              <span class="price__value">${precioCOP(servicio.precio)}</span>
              <span class="price__currency">${CONFIG.moneda}</span>
            </p>
            <button class="btn btn--soft btn--sm" type="button" data-detalle-servicio="${servicio.id}" aria-label="Ver detalle de ${escapar(servicio.nombre)}">
              Ver detalle
            </button>
          </div>
        </div>
      </article>`;
  }

  function renderizarFiltros() {
    const contenedor = $("[data-filtros]");
    if (!contenedor) return;

    contenedor.innerHTML = [{ id: "todas", nombre: "Todas" }, ...CATEGORIAS]
      .map(
        (categoria) => `
        <button class="chip" type="button" data-filtro="${categoria.id}"
          aria-pressed="${categoria.id === estado.filtros.categoria ? "true" : "false"}">
          ${escapar(categoria.nombre)}
        </button>`,
      )
      .join("");
  }

  function filtrarServicios({ busqueda, categoria, orden } = estado.filtros) {
    const termino = normalizar(busqueda);
    const palabras = termino ? termino.split(/\s+/).filter(Boolean) : [];

    const filtrados = SERVICIOS.filter((servicio) => {
      if (categoria !== "todas" && servicio.categoria !== categoria) return false;
      if (!palabras.length) return true;

      const texto = normalizar(
        [
          servicio.nombre,
          servicio.descripcion,
          categoriaNombre(servicio.categoria),
          ...servicio.etiquetas,
        ].join(" "),
      );
      return palabras.every((palabra) => texto.includes(palabra));
    });

    const ordenadores = {
      recomendados: (a, b) => Number(b.destacado) - Number(a.destacado),
      "precio-asc": (a, b) => a.precio - b.precio,
      "precio-desc": (a, b) => b.precio - a.precio,
      duracion: (a, b) => a.duracion - b.duracion,
    };

    return [...filtrados].sort(ordenadores[orden] || ordenadores.recomendados);
  }

  function renderizarServicios() {
    const grid = $("[data-grid-servicios]");
    if (!grid) return;

    const lista = filtrarServicios(estado.filtros);
    grid.innerHTML = lista.map(tarjetaServicio).join("");
    grid.hidden = lista.length === 0;

    const vacio = $("[data-servicios-vacio]");
    if (vacio) vacio.hidden = lista.length > 0;

    const contador = $("[data-contador-servicios]");
    if (contador) {
      contador.textContent = `${lista.length} ${lista.length === 1 ? "servicio" : "servicios"} ${
        lista.length === 1 ? "encontrado" : "encontrados"
      }`;
    }
  }

  function iniciarServicios() {
    try {
      if (!Array.isArray(SERVICIOS) || SERVICIOS.length === 0) {
        throw new Error("No hay servicios disponibles");
      }
      renderizarFiltros();
      leerFiltrosURL();
      conectarFiltros();
      renderizarServicios();
    } catch (error) {
      console.error("[Seydan]", error);
      const grid = $("[data-grid-servicios]");
      const errorBox = $("[data-servicios-error]");
      if (grid) grid.hidden = true;
      if (errorBox) errorBox.hidden = false;
      const estadoVacio = $("[data-servicios-vacio]");
      if (estadoVacio) estadoVacio.hidden = true;
    }
  }

  function leerFiltrosURL() {
    const parametros = new URLSearchParams(window.location.search);
    const categoria = parametros.get("categoria");
    const busqueda = parametros.get("busqueda");

    if (categoria && (categoria === "todas" || CATEGORIAS.some((item) => item.id === categoria))) {
      estado.filtros.categoria = categoria;
      $$("[data-filtro]").forEach((boton) => {
        boton.setAttribute("aria-pressed", String(boton.dataset.filtro === categoria));
      });
    }

    if (busqueda) {
      estado.filtros.busqueda = busqueda;
      const input = $("[data-busqueda]");
      const limpiar = $("[data-limpiar-busqueda]");
      if (input) input.value = busqueda;
      if (limpiar) limpiar.hidden = false;
    }
  }

  function conectarFiltros() {
    const buscador = $("[data-busqueda]");
    const limpiar = $("[data-limpiar-busqueda]");
    const selectorOrden = $("[data-orden]");
    const chips = $("[data-filtros]");

    const alBuscar = debounce(() => {
      if (!buscador) return;
      estado.filtros.busqueda = buscador.value;
      if (limpiar) limpiar.hidden = buscador.value.trim() === "";
      renderizarServicios();
    }, 160);

    buscador?.addEventListener("input", alBuscar);

    limpiar?.addEventListener("click", () => {
      if (!buscador) return;
      buscador.value = "";
      estado.filtros.busqueda = "";
      limpiar.hidden = true;
      buscador.focus();
      renderizarServicios();
    });

    chips?.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-filtro]");
      if (!chip) return;
      estado.filtros.categoria = chip.dataset.filtro;
      $$("[data-filtro]", chips).forEach((boton) => {
        boton.setAttribute("aria-pressed", String(boton === chip));
      });
      renderizarServicios();
    });

    selectorOrden?.addEventListener("change", () => {
      estado.filtros.orden = selectorOrden.value;
      renderizarServicios();
    });

    const reiniciar = () => {
      estado.filtros = { busqueda: "", categoria: "todas", orden: "recomendados" };
      if (buscador) buscador.value = "";
      if (limpiar) limpiar.hidden = true;
      if (selectorOrden) selectorOrden.value = "recomendados";
      $$("[data-filtro]").forEach((boton) => {
        boton.setAttribute("aria-pressed", String(boton.dataset.filtro === "todas"));
      });
      renderizarServicios();
    };

    $$("[data-reset-filtros]").forEach((boton) => boton.addEventListener("click", reiniciar));
  }

  /* ------------------------------------------------------------------------
     9. Modal accesible de servicio (dialog nativo + cierre por backdrop)
     ------------------------------------------------------------------------ */
  function crearModal() {
    let dialog = $("#modal-servicio");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "modal-servicio";
    dialog.className = "modal";
    dialog.setAttribute("aria-labelledby", "modal-titulo");
    dialog.innerHTML = `
      <div class="modal__panel">
        <button class="modal__close" type="button" data-cerrar-modal aria-label="Cerrar detalle del servicio">&times;</button>
        <div class="modal__media">
          <img data-modal-img src="" alt="" width="640" height="640">
        </div>
        <div class="modal__body">
          <p class="eyebrow" data-modal-categoria></p>
          <h2 class="modal__title" id="modal-titulo" data-modal-titulo></h2>
          <p class="modal__desc" data-modal-desc></p>
          <ul class="modal__meta">
            <li>${icono.reloj} <span data-modal-duracion></span></li>
            <li>${icono.etiqueta} <span data-modal-etiquetas></span></li>
          </ul>
          <p class="modal__price"><span data-modal-precio></span> <small>${CONFIG.moneda}</small></p>
          <div class="modal__actions">
            <a class="btn btn--primary" data-modal-reservar href="reservaciones.html#reservar">Reservar este servicio</a>
            <button class="btn btn--ghost" type="button" data-cerrar-modal>Cerrar</button>
          </div>
        </div>
      </div>`;

    root.append(dialog);

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog || event.target.closest("[data-cerrar-modal]")) {
        dialog.close();
      }
    });

    dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-abierto");
    });

    return dialog;
  }

  function abrirModalServicio(id) {
    const servicio = SERVICIOS.find((item) => item.id === id);
    if (!servicio) return;

    const dialog = crearModal();
    const imagen = $("[data-modal-img]", dialog);
    imagen.src = servicio.imagen;
    imagen.alt = `Ilustración de ${servicio.nombre}`;
    $("[data-modal-categoria]", dialog).textContent = categoriaNombre(servicio.categoria);
    $("[data-modal-titulo]", dialog).textContent = servicio.nombre;
    $("[data-modal-desc]", dialog).textContent = servicio.descripcion;
    $("[data-modal-duracion]", dialog).textContent = `${servicio.duracion} minutos`;
    $("[data-modal-etiquetas]", dialog).textContent = servicio.etiquetas.slice(0, 3).join(" · ");
    $("[data-modal-precio]", dialog).textContent = precioCOP(servicio.precio);
    $("[data-modal-reservar]", dialog).href = `reservaciones.html?servicio=${encodeURIComponent(
      servicio.id,
    )}#reservar`;

    document.body.classList.add("modal-abierto");
    dialog.showModal();
  }

  /* ------------------------------------------------------------------------
     12. Validación accesible compartida
     ------------------------------------------------------------------------ */
  function setError(campo, mensaje) {
    if (!campo) return;
    const idsDescritos = (campo.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter(Boolean);
    const cajas = idsDescritos
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const caja = cajas.find((nodo) => nodo.classList.contains("field__error")) || cajas[0];

    if (mensaje) {
      campo.setAttribute("aria-invalid", "true");
      if (caja) caja.textContent = mensaje;
    } else {
      campo.removeAttribute("aria-invalid");
      if (caja) caja.textContent = "";
    }
  }

  function limpiarErrores(form) {
    $$("[aria-invalid]", form).forEach((campo) => setError(campo, ""));
    $$(".field__error", form).forEach((caja) => {
      caja.textContent = "";
    });
  }

  function mostrarErrores(errores) {
    errores.forEach(([campo, mensaje]) => setError(campo, mensaje));
    const primero = errores[0]?.[0];
    if (primero) {
      primero.focus();
      primero.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
    }
    mostrarToast("Revisa los campos marcados en el formulario.");
  }

  function poblarServicios() {
    const select = $("#servicio");
    if (!select) return;
    select.innerHTML =
      '<option value="">Selecciona un servicio</option>' +
      SERVICIOS.map(
        (servicio) =>
          `<option value="${servicio.id}">${escapar(servicio.nombre)} — ${precioCOP(
            servicio.precio,
          )}</option>`,
      ).join("");
  }

  function precargarServicioDesdeURL() {
    const select = $("#servicio");
    if (!select) return;
    const id = new URLSearchParams(window.location.search).get("servicio");
    if (id && SERVICIOS.some((servicio) => servicio.id === id)) {
      select.value = id;
    }
  }

  function poblarHorarios() {
    const select = $("#hora");
    if (!select) return;
    select.innerHTML =
      '<option value="">Elige una hora</option>' +
      HORARIOS.map((hora) => `<option value="${hora}">${hora}</option>`).join("");
  }

  function configurarFecha() {
    const fecha = $("#fecha");
    if (!fecha) return;
    fecha.min = isoLocal();
    fecha.max = isoLocal(sumarDias(new Date(), CONFIG.maxDiasReserva));
  }

  function validarReserva(datos, form) {
    const errores = [];
    const valor = (campo) => String(datos.get(campo) ?? "").trim();

    const nombre = form.elements.nombre;
    const telefono = form.elements.telefono;
    const email = form.elements.email;
    const servicio = form.elements.servicio;
    const fecha = form.elements.fecha;
    const hora = form.elements.hora;
    const acepto = form.elements.acepto;

    const nombreValor = valor("nombre");
    if (nombreValor.length < 3) {
      errores.push([nombre, "Escribe tu nombre completo (mínimo 3 caracteres)."]);
    }

    const telefonoValor = valor("telefono");
    const digitos = telefonoValor.replace(/\D/g, "");
    if (!/^[+()\d\s-]+$/.test(telefonoValor) || digitos.length < 7 || digitos.length > 15) {
      errores.push([telefono, "Escribe un teléfono válido de 7 a 15 dígitos."]);
    }

    const emailValor = valor("email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailValor)) {
      errores.push([email, "Escribe un correo válido, por ejemplo nombre@correo.com."]);
    }

    const servicioValor = valor("servicio");
    if (!SERVICIOS.some((item) => item.id === servicioValor)) {
      errores.push([servicio, "Selecciona el servicio que quieres reservar."]);
    }

    const fechaValor = valor("fecha");
    const hoy = isoLocal();
    const maximo = isoLocal(sumarDias(new Date(), CONFIG.maxDiasReserva));

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaValor)) {
      errores.push([fecha, "Elige una fecha para tu cita."]);
    } else if (fechaValor < hoy) {
      errores.push([fecha, "La fecha no puede estar en el pasado."]);
    } else if (fechaValor > maximo) {
      errores.push([fecha, `Solo reservamos con ${CONFIG.maxDiasReserva} días de anticipación.`]);
    } else if (new Date(`${fechaValor}T12:00:00`).getDay() === 0) {
      errores.push([fecha, "Los domingos no atendemos. Elige de lunes a sábado."]);
    }

    if (!HORARIOS.includes(valor("hora"))) {
      errores.push([hora, "Elige una hora disponible."]);
    }

    if (!acepto.checked) {
      errores.push([acepto, "Confirma que aceptas la política de reservas."]);
    }

    return errores;
  }


  function openBooking(id) {
    const detail = root.querySelector('#modal-servicio');
    if (detail?.open) detail.close();
    let dialog = root.querySelector('#modal-reserva');
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.id = 'modal-reserva'; dialog.className = 'booking-modal'; dialog.setAttribute('aria-labelledby','reservar-titulo');
      dialog.innerHTML = "<form class=\"form\" id=\"form-reserva\" novalidate>\n          <div class=\"booking-modal__heading\">\n<button class=\"modal__close\" type=\"button\" data-close-booking aria-label=\"Cerrar reserva\">&times;</button>\n<p class=\"eyebrow\">Cotización por WhatsApp</p>\n            <h2 class=\"section__title\" id=\"reservar-titulo\">Datos de tu reserva</h2>\n            <p class=\"lead\" style=\"font-size: .95rem;\">Los campos marcados con * son obligatorios. Usamos tus datos solo para gestionar la cita.</p>\n          </div>\n\n          <div class=\"form__grid\">\n            <div class=\"field\">\n              <label for=\"nombre\">Nombre completo *</label>\n              <input id=\"nombre\" name=\"nombre\" type=\"text\" autocomplete=\"name\" placeholder=\"Ej. Laura Martínez\" required aria-describedby=\"err-nombre\">\n              <p class=\"field__error\" id=\"err-nombre\"></p>\n            </div>\n\n            <div class=\"field\">\n              <label for=\"telefono\">Teléfono *</label>\n              <input id=\"telefono\" name=\"telefono\" type=\"tel\" autocomplete=\"tel\" inputmode=\"tel\" placeholder=\"Ej. 300 123 4567\" required aria-describedby=\"err-telefono\">\n              <p class=\"field__error\" id=\"err-telefono\"></p>\n            </div>\n\n            <div class=\"field field--full\">\n              <label for=\"email\">Correo electrónico *</label>\n              <input id=\"email\" name=\"email\" type=\"email\" autocomplete=\"email\" placeholder=\"Ej. laura@correo.com\" required aria-describedby=\"err-email\">\n              <p class=\"field__error\" id=\"err-email\"></p>\n            </div>\n\n            <div class=\"field field--full\">\n              <label for=\"servicio\">Servicio *</label>\n              <select id=\"servicio\" name=\"servicio\" required aria-describedby=\"err-servicio\">\n                <option value=\"\">Selecciona un servicio</option>\n              </select>\n              <p class=\"field__error\" id=\"err-servicio\"></p>\n            </div>\n\n            <div class=\"field\">\n              <label for=\"fecha\">Fecha *</label>\n              <input id=\"fecha\" name=\"fecha\" type=\"date\" required aria-describedby=\"err-fecha fecha-ayuda\">\n              <p class=\"field__hint\" id=\"fecha-ayuda\">De lunes a sábado, hasta 90 días de anticipación.</p>\n              <p class=\"field__error\" id=\"err-fecha\"></p>\n            </div>\n\n            <div class=\"field\">\n              <label for=\"hora\">Hora *</label>\n              <select id=\"hora\" name=\"hora\" required aria-describedby=\"err-hora\">\n                <option value=\"\">Elige una hora</option>\n              </select>\n              <p class=\"field__error\" id=\"err-hora\"></p>\n            </div>\n\n            <div class=\"field field--full\">\n              <label for=\"notas\">Notas (opcional)</label>\n              <textarea id=\"notas\" name=\"notas\" rows=\"3\" placeholder=\"Cuéntanos si tienes alguna preferencia, alergia o referencia.\" aria-describedby=\"err-notas\"></textarea>\n              <p class=\"field__error\" id=\"err-notas\"></p>\n            </div>\n          </div>\n\n          <div class=\"form__check\">\n            <label class=\"check\" for=\"acepto\">\n              <input id=\"acepto\" name=\"acepto\" type=\"checkbox\" required aria-describedby=\"err-acepto\">\n              <span>Acepto la política de reservas: llegar 10 minutos antes y avisar con al menos 24 horas de anticipación si necesito cancelar.</span>\n            </label>\n            <p class=\"field__error\" id=\"err-acepto\"></p>\n          </div>\n\n          <div class=\"notice\" role=\"note\"><strong>Aviso de precios:</strong> Los precios están sujetos a cambios y pueden no estar totalmente actualizados. Confirma el valor final con el salón antes de reservar.</div>\n<div class=\"form__actions\">\n            <button class=\"btn btn--primary btn--lg\" type=\"submit\">Enviar cotización por WhatsApp</button>\n            <p class=\"form__note\">La disponibilidad y el precio final se confirman con el salón.</p>\n          </div>\n        </form>";
      root.append(dialog);
      dialog.addEventListener('click', event => { if (event.target === dialog || event.target.closest('[data-close-booking]')) dialog.close(); });
      dialog.addEventListener('close', () => document.body.classList.remove('modal-abierto'));
      const form = dialog.querySelector('form');
      poblarServicios(); poblarHorarios();
      form.addEventListener('input', event => { if (event.target.getAttribute('aria-invalid') === 'true') setError(event.target, ''); });
      form.addEventListener('submit', event => {
        event.preventDefault(); limpiarErrores(form);
        const data = new FormData(form), errors = validarReserva(data, form);
        if (errors.length) { mostrarErrores(errors); return; }
        const service = SERVICIOS.find(s => s.id === data.get('servicio'));
        if (!service) return;
        const url = buildWhatsAppUrl(Object.fromEntries(data), service);
        const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.click();
      });
    }
    configurarFecha();
    if (id && SERVICIOS.some(s => s.id === id)) dialog.querySelector('#servicio').value = id;
    document.body.classList.add('modal-abierto'); dialog.showModal();
  }
  globalOn(root, 'click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.includes('reservaciones.html') || href === '#reservar') {
      event.preventDefault(); const id = new URL(link.href, window.location.href).searchParams.get('servicio'); openBooking(id);
    }
  });

  iniciarLayout(); actualizarAnio();
  if (window.location.hash === "#reservar") openBooking(new URLSearchParams(window.location.search).get("servicio"));
  if (page === 'home') iniciarHome();
  if (page === 'servicios') iniciarServicios();
  return () => { controller.abort(); clearTimeout(temporizadorToast); document.body.classList.remove('modal-abierto'); root.querySelectorAll('dialog').forEach(d => d.remove()); };
}
initializeSeydan(document.body, document.body.dataset.page);

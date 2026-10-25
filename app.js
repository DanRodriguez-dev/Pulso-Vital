(function () {
  "use strict";

  /* ====== Catálogo ======
     Los precios son referenciales (RD$). Cada opción puede sumar un monto ("add"). */
  var PRODUCTS = [
    {
      id: "svb",
      name: "Curso de Soporte Vital Básico (RCP y DEA)",
      image: "images/curso-rcp.svg",
      alt: "Maniquí de práctica de RCP con las manos de un instructor sobre el pecho",
      description:
        "Formación práctica en reconocimiento del paro cardíaco, compresiones de calidad, ventilación y uso del desfibrilador externo automático (DEA), con maniquíes y escenarios simulados. Dirigido a la comunidad general y a personal no sanitario. Al finalizar recibes tu certificado de participación.",
      base: 1500,
      unit: "por persona (según grupo)",
      options: [
        { key: "Modalidad", choices: [["Presencial", 0], ["Semipresencial", 0]] },
        { key: "Horario", choices: [["Mañana", 0], ["Tarde", 0], ["Sábado", 0]] },
        { key: "Participantes", choices: [["Individual", 0], ["Grupo de 5", 5500], ["Grupo de 10", 10000]] },
        { key: "Certificado", choices: [["Digital", 0], ["Impreso", 300]] }
      ]
    },
    {
      id: "botiquin",
      name: "Botiquín de primeros auxilios",
      image: "images/botiquin.svg",
      alt: "Botiquín rojo con cruz blanca y asa de transporte",
      description:
        "Botiquín armado según el riesgo de cada espacio, con material para heridas, quemaduras e inmovilización básica, además de una guía rápida de uso en español. Listo para colocar en casa, en la oficina o en el vehículo.",
      base: 1500,
      unit: "por unidad",
      options: [
        { key: "Tamaño", choices: [["Personal", 0], ["Hogar", 1200], ["Empresa", 3500]] },
        { key: "Estuche", choices: [["Bolso de tela", 0], ["Caja rígida", 400]] },
        { key: "Entrega", choices: [["Retiro en sede", 0], ["Envío en 24 h", 350], ["Envío en 48 h", 200]] }
      ]
    },
    {
      id: "taller",
      name: "Taller de primeros auxilios para empresas",
      image: "images/taller-empresas.svg",
      alt: "Grupo de personas alrededor de un instructor practicando un vendaje",
      description:
        "Capacitación en atención inicial de heridas, hemorragias, atragantamiento, quemaduras y traslado seguro. El contenido se adapta a los riesgos de cada puesto de trabajo para que tu equipo sepa qué hacer mientras llega la ayuda profesional.",
      base: 12000,
      unit: "por taller",
      options: [
        { key: "Duración", choices: [["4 horas", 0], ["8 horas", 9000]] },
        { key: "Lugar", choices: [["En nuestra sede", 0], ["En la empresa", 1500]] },
        { key: "Participantes", choices: [["Hasta 10", 0], ["Hasta 20", 8000], ["Hasta 30", 15000]] }
      ]
    },
    {
      id: "riesgo",
      name: "Plan de gestión de riesgo y simulacro de evacuación",
      image: "images/plan-riesgo.svg",
      alt: "Plano de un edificio con rutas de evacuación señaladas con flechas",
      description:
        "Evaluación de amenazas, diseño de rutas de evacuación, organización de brigadas internas y ejecución de un simulacro, con un informe final de mejoras. Ideal para escuelas, oficinas e industrias que quieren estar preparadas antes de que ocurra la emergencia.",
      base: 25000,
      unit: "por institución",
      options: [
        { key: "Tipo de institución", choices: [["Escuela", 0], ["Oficina", 0], ["Industria", 10000]] },
        { key: "Alcance", choices: [["Solo plan", 0], ["Plan + simulacro", 15000]] },
        { key: "Tiempo de entrega", choices: [["15 días", 0], ["7 días", 5000]] }
      ]
    },
    {
      id: "cobertura",
      name: "Cobertura médica para eventos",
      image: "images/cobertura-eventos.svg",
      alt: "Ambulancia con luces de emergencia estacionada junto a un evento",
      description:
        "Personal de emergencias con equipo de soporte vital presente en conciertos, actividades deportivas, ferias y eventos corporativos. Tú disfrutas del evento con la tranquilidad de contar con atención inmediata si algo ocurre.",
      base: 8000,
      unit: "por evento",
      options: [
        { key: "Duración", choices: [["4 horas", 0], ["8 horas", 7000], ["12 horas", 13000]] },
        { key: "Personal", choices: [["1 paramédico", 0], ["Equipo completo", 12000]] },
        { key: "Unidad", choices: [["Sin ambulancia", 0], ["Con ambulancia", 10000]] }
      ]
    }
  ];

  var STORAGE_KEY = "pulsovital_cart_v1";

  /* ====== Utilidades ====== */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function money(n) { return "RD$ " + Number(n).toLocaleString("es-DO"); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function find(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }

  var cart = load();

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* sin almacenamiento */ }
  }

  var toastTimer;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ====== Productos ====== */
  function priceFor(product, selections) {
    var total = product.base;
    product.options.forEach(function (opt, i) {
      total += opt.choices[selections[i]][1];
    });
    return total;
  }

  function renderProducts() {
    var grid = $("#productGrid");
    grid.innerHTML = PRODUCTS.map(function (p) {
      var opts = p.options.map(function (opt, i) {
        var id = p.id + "-opt-" + i;
        var items = opt.choices.map(function (c, j) {
          var extra = c[1] > 0 ? " (+" + money(c[1]) + ")" : "";
          return '<option value="' + j + '">' + esc(c[0]) + esc(extra) + "</option>";
        }).join("");
        return '<label for="' + id + '">' + esc(opt.key) +
          '<select id="' + id + '" data-product="' + p.id + '" data-index="' + i + '">' + items + "</select></label>";
      }).join("");

      return '<article class="product" data-id="' + p.id + '">' +
        '<img src="' + p.image + '" alt="' + esc(p.alt) + '" loading="lazy" width="600" height="450">' +
        '<div class="product-body">' +
          "<h3>" + esc(p.name) + "</h3>" +
          "<p>" + esc(p.description) + "</p>" +
          '<div class="options">' + opts + "</div>" +
          '<div class="buy-row">' +
            '<div class="price"><span class="price-val">' + money(p.base) + "</span><small>" + esc(p.unit) + "</small></div>" +
            '<button class="btn btn-primary add-btn" data-product="' + p.id + '">Agregar al carrito</button>' +
          "</div>" +
        "</div></article>";
    }).join("");
  }

  function readSelections(card, product) {
    return product.options.map(function (_, i) {
      return parseInt($('select[data-index="' + i + '"]', card).value, 10);
    });
  }

  function updateCardPrice(card) {
    var p = find(card.dataset.id);
    $(".price-val", card).textContent = money(priceFor(p, readSelections(card, p)));
  }

  $("#productGrid").addEventListener("change", function (e) {
    if (e.target.tagName === "SELECT") updateCardPrice(e.target.closest(".product"));
  });

  $("#productGrid").addEventListener("click", function (e) {
    var btn = e.target.closest(".add-btn");
    if (!btn) return;
    var card = btn.closest(".product");
    var p = find(btn.dataset.product);
    var sel = readSelections(card, p);
    addToCart(p, sel);
    toast("Agregado: " + p.name);
  });

  /* ====== Carrito ====== */
  function lineKey(p, sel) { return p.id + ":" + sel.join("-"); }

  function addToCart(p, sel) {
    var key = lineKey(p, sel);
    var existing = cart.filter(function (l) { return l.key === key; })[0];
    if (existing) existing.qty += 1;
    else cart.push({ key: key, id: p.id, sel: sel, qty: 1 });
    save();
    renderCart();
  }

  function describeLine(line) {
    var p = find(line.id);
    return p.options.map(function (opt, i) {
      return opt.key + ": " + opt.choices[line.sel[i]][0];
    }).join(" · ");
  }
  function unitPrice(line) { return priceFor(find(line.id), line.sel); }
  function cartTotal() {
    return cart.reduce(function (s, l) { return s + unitPrice(l) * l.qty; }, 0);
  }

  function renderCart() {
    var count = cart.reduce(function (s, l) { return s + l.qty; }, 0);
    $("#cartCount").textContent = count;
    $("#cartTotal").textContent = money(cartTotal());

    var box = $("#cartItems");
    if (!cart.length) {
      box.innerHTML = '<p class="empty">Tu carrito está vacío.<br>Agrega un servicio para comenzar.</p>';
    } else {
      box.innerHTML = cart.map(function (l) {
        var p = find(l.id);
        return '<div class="cart-item" data-key="' + l.key + '">' +
          '<img src="' + p.image + '" alt="">' +
          "<div><h4>" + esc(p.name) + '</h4><p class="opts">' + esc(describeLine(l)) + "</p>" +
            '<div class="qty"><button data-act="dec" aria-label="Disminuir cantidad">−</button><span>' + l.qty +
            '</span><button data-act="inc" aria-label="Aumentar cantidad">+</button></div>' +
            '<br><button class="remove" data-act="rm">Quitar</button></div>' +
          '<div class="line">' + money(unitPrice(l) * l.qty) + "</div></div>";
      }).join("");
    }
    $("#checkoutBtn").disabled = !cart.length;
    $("#checkoutBtn").style.opacity = cart.length ? "1" : ".5";
  }

  $("#cartItems").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-act]");
    if (!btn) return;
    var key = btn.closest(".cart-item").dataset.key;
    var line = cart.filter(function (l) { return l.key === key; })[0];
    if (!line) return;
    if (btn.dataset.act === "inc") line.qty += 1;
    if (btn.dataset.act === "dec") line.qty = Math.max(1, line.qty - 1);
    if (btn.dataset.act === "rm") cart = cart.filter(function (l) { return l.key !== key; });
    save();
    renderCart();
  });

  $("#clearCart").addEventListener("click", function () {
    cart = [];
    save();
    renderCart();
  });

  function openCart() {
    $("#cartDrawer").classList.add("open");
    $("#cartDrawer").setAttribute("aria-hidden", "false");
    $("#overlay").hidden = false;
  }
  function closeCart() {
    $("#cartDrawer").classList.remove("open");
    $("#cartDrawer").setAttribute("aria-hidden", "true");
    $("#overlay").hidden = true;
  }
  $("#openCart").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);

  /* ====== Checkout ====== */
  function summaryHTML() {
    var rows = cart.map(function (l) {
      var p = find(l.id);
      return '<div class="row"><div>' + l.qty + " × " + esc(p.name) + "<small>" + esc(describeLine(l)) +
        "</small></div><div>" + money(unitPrice(l) * l.qty) + "</div></div>";
    }).join("");
    return rows + '<div class="row total"><span>Total</span><span>' + money(cartTotal()) + "</span></div>";
  }

  function openCheckout() {
    if (!cart.length) return;
    closeCart();
    $("#checkoutStep").hidden = false;
    $("#confirmStep").hidden = true;
    $("#checkoutError").textContent = "";
    $("#checkoutSummary").innerHTML = summaryHTML();
    $("#checkoutModal").hidden = false;
  }
  function closeCheckout() { $("#checkoutModal").hidden = true; }

  $("#checkoutBtn").addEventListener("click", openCheckout);
  $("#closeCheckout").addEventListener("click", closeCheckout);
  $("#checkoutModal").addEventListener("click", function (e) {
    if (e.target === this) closeCheckout();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeCart(); closeCheckout(); }
  });

  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  $("#checkoutForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var nombre = f.nombre.value.trim();
    var tel = f.telefono.value.trim();
    var correo = f.correo.value.trim();
    var err = $("#checkoutError");

    if (nombre.length < 3) { err.textContent = "Escribe tu nombre completo."; f.nombre.focus(); return; }
    if (tel.replace(/\D/g, "").length < 10) { err.textContent = "Escribe un teléfono válido (10 dígitos)."; f.telefono.focus(); return; }
    if (!validEmail(correo)) { err.textContent = "Escribe un correo electrónico válido."; f.correo.focus(); return; }
    err.textContent = "";

    var number = "PV-" + String(Date.now()).slice(-6);
    var order = {
      number: number,
      date: new Date().toISOString(),
      customer: { nombre: nombre, telefono: tel, correo: correo, direccion: f.direccion.value.trim() },
      pago: f.pago.value,
      notas: f.notas.value.trim(),
      items: cart.map(function (l) {
        return { name: find(l.id).name, options: describeLine(l), qty: l.qty, unit: unitPrice(l) };
      }),
      total: cartTotal()
    };

    try {
      var orders = JSON.parse(localStorage.getItem("pulsovital_orders") || "[]");
      orders.push(order);
      localStorage.setItem("pulsovital_orders", JSON.stringify(orders));
    } catch (x) { /* sin almacenamiento */ }

    $("#orderNumber").textContent = number;
    $("#confirmSummary").innerHTML = summaryHTML();
    $("#checkoutStep").hidden = true;
    $("#confirmStep").hidden = false;

    cart = [];
    save();
    renderCart();
    f.reset();
  });

  $("#newOrder").addEventListener("click", function () {
    closeCheckout();
    window.location.hash = "#productos";
  });

  /* ====== Formulario de contacto ====== */
  $("#contactForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, note = $("#contactNote");
    note.classList.remove("error");
    if (f.nombre.value.trim().length < 2 || !validEmail(f.correo.value.trim()) || f.mensaje.value.trim().length < 5) {
      note.classList.add("error");
      note.textContent = "Completa nombre, un correo válido y tu mensaje.";
      return;
    }
    var body = "Nombre: " + f.nombre.value.trim() + "\nCorreo: " + f.correo.value.trim() + "\n\n" + f.mensaje.value.trim();
    window.location.href = "mailto:redro0604@gmail.com?subject=" + encodeURIComponent("Consulta desde la tienda Pulso Vital") +
      "&body=" + encodeURIComponent(body);
    note.textContent = "Se abrirá tu aplicación de correo para enviar el mensaje.";
    f.reset();
  });

  /* ====== Inicio ====== */
  renderProducts();
  renderCart();
})();

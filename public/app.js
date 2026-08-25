(function () {
  "use strict";

  /* ---------------- API helper ---------------- */
  async function api(method, path, body) {
    const res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    let data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }
    if (!res.ok) {
      const err = new Error((data && data.message) || 'Ocurrió un error inesperado.');
      err.code = data && data.error;
      throw err;
    }
    return data;
  }

  /* ---------------- Utilities ---------------- */
  var numFmt = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 });
  function money(n, currency) {
    var v = numFmt.format(Math.max(0, Math.round(n || 0)));
    return (currency === 'PYG' ? 'Gs. ' : 'USD ') + v;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function timeAgo(ts) {
    var diff = Math.max(0, Date.now() - new Date(ts).getTime());
    var m = Math.floor(diff / 60000);
    if (m < 1) return 'recién';
    if (m < 60) return 'hace ' + m + ' min';
    var h = Math.floor(m / 60);
    if (h < 24) return 'hace ' + h + ' h';
    var d = Math.floor(h / 24);
    if (d < 30) return 'hace ' + d + ' d';
    return new Date(ts).toLocaleDateString('es-PY');
  }
  function starIcon() {
    return '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7-5.4-4.7 7.1-.6L12 2.5Z"/></svg>';
  }
  function pinIcon() {
    return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="vertical-align:-1px"><path d="M12 21s7-6.4 7-12a7 7 0 1 0-14 0c0 5.6 7 12 7 12Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9" r="2.4" stroke="currentColor" stroke-width="1.8"/></svg>';
  }
  function phoneIcon() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6.5 3h3l1.5 4.5-2 1.7a12 12 0 0 0 5.8 5.8l1.7-2 4.5 1.5v3c0 1-.9 1.8-1.9 1.7C10.8 18.9 5.1 13.2 4.8 5.9 4.7 4.9 5.5 4 6.5 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }
  function checkIcon() {
    return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  var ZONES = ["Asunción", "Concepción", "Belén", "Horqueta", "Loreto", "San Carlos", "San Lázaro", "Yvy Ya'ú", "Azotey", "Sgto. José Félix López", "San Alfredo", "Paso Barreto", "San Pedro del Ykuamandiyu", "Antequera", "Choré", "General Elizardo Aquino", "Itacurubí del Rosario", "Lima", "Nueva Germania", "San Estanislao", "San Pablo", "Tacuatí", "Unión", "25 de Diciembre", "Villa del Rosario", "General Resquín", "Yataity del Norte", "Guajayví", "Capiibary", "Santa Rosa del Aguaray", "Yryvu Cuá", "Liberación", "Caacupé", "Altos", "Arroyos y Esteros", "Atyra", "Caraguatay", "Emboscada", "Eusebio Ayala", "Isla Pucú", "Itacurubí de la Cordillera", "Juan de Mena", "Loma Grande", "Mbocayaty del Yhaguy", "Nueva Colombia", "Piribebuy", "Primero de Marzo", "San Bernardino", "Santa Elena", "Tobatí", "Valenzuela", "San José Obrero", "Villarrica", "Borja", "Mauricio José Troche", "Coronel Martínez", "Félix Pérez Cardozo", "General Eugenio A. Garay", "Colonia Independencia", "Itapé", "Iturbe", "José Fassardi", "Mbocayaty", "Natalicio Talavera", "Ñumi", "San Salvador", "Yataity", "Dr. Bottrell", "Paso Yobaí", "Tebicuary", "Coronel Oviedo", "Caaguazú", "Carayao", "Cecilio Báez", "Santa Rosa del Mbutuy", "Dr. Juan Manuel Frutos", "Repatriación", "Nueva Londres", "San Joaquín", "San José de los Arroyos", "Yhú", "J Eulogio Estigarribia", "R.I. 3 Corrales", "Raúl Arsenio Oviedo", "José Domingo Ocampos", "Mcal. Francisco Solano López", "La Pastora", "3 de Febrero", "Simón Bolívar", "Vaquería", "Tembiapora", "Nueva Toledo", "Caazapá", "Abaí", "Buena Vista", "Moisés Bertoni", "General Higinio Morínigo", "Maciel", "San Juan Nepomuceno", "Tavai", "Fulgencio Yegros", "Yutí", "3 de Mayo", "Encarnación", "Bella Vista", "Cambyreta", "Capitán Meza", "Capitán Miranda", "Nueva Alborada", "Carmen del Paraná", "Coronel Bogado", "Carlos Antonio López", "Natalio", "Fram", "General Artigas", "General Delgado", "Hohenau", "Jesús", "Leandro Oviedo", "Obligado", "Mayor Otaño", "San Cosme y Damián", "San Pedro del Paraná", "San Rafael del Paraná", "Trinidad", "Edelira", "Tomás Romero Pereira", "Alto Vera", "La Paz", "Yatytay", "San Juan del Paraná", "Pirapo", "Itapúa Poty", "San Juan Bautista", "Ayolas", "San Ignacio", "San Miguel", "San Patricio", "Santa María", "Santa Rosa", "Santiago", "Villa Florida", "Yabebyry", "Paraguarí", "Acahay", "Caapucú", "General Bernardino Caballero", "Carapeguá", "Escobar", "La Colmena", "Mbuyapey", "Pirayú", "Quiindy", "Quyquyho", "San Roque González", "Sapucaí", "Tebicuary-mí", "Yaguarón", "Ybycuí", "Yvytimí", "Ciudad del Este", "Presidente Franco", "Domingo Martínez de Irala", "Dr. Juan León Mallorquín", "Hernandarias", "Itakyrý", "Juan E. O'Leary", "Ñacunday", "Yguazú", "Los Cedrales", "Minga Guazú", "San Cristóbal", "Santa Rita", "Naranjal", "Santa Rosa del Monday", "Minga Pora", "Mbaracayú", "San Alberto", "Iruña", "Santa Fe del Paraná", "Tavapy", "Dr. Raúl Peña", "Areguá", "Capiatá", "Fernando de la Mora", "Guarambaré", "Itá", "Itauguá", "Lambaré", "Limpio", "Luque", "Mariano Roque Alonso", "Nueva Italia", "Ñemby", "San Antonio", "San Lorenzo", "Villa Elisa", "Villeta", "Ypacaraí", "Ypané", "J Augusto Saldivar", "Pilar", "Alberdi", "Cerrito", "Desmochados", "General Díaz", "Guazú Cuá", "Humaitá", "Isla Umbú", "Los Laureles", "Mayor Martínez", "Paso de Patria", "San Juan Bautista de Ñeembucú", "Tacuaras", "Villa Franca", "Villa Oliva", "Villalbín", "Pedro Juan Caballero", "Capitán Bado", "Zanja Pytá", "Karapay", "Saltos del Guairá", "Corpus Christi", "Curuguaty", "Villa Ygatimí", "Itanara", "Ypé Jhú", "Francisco Caballero Álvarez", "Katuete", "La Paloma", "Nueva Esperanza", "Yasy Kañy", "Ybyrarobana", "Yby Pytá", "Benjamín Aceval", "Puerto Pinasco", "Villa Hayes", "Nanawa", "José Falcón", "Tte 1ro Manuel Irala Fernández", "Tte. Esteban Martínez", "Gral José María Bruguez", "Mariscal Estigarribia", "Filadelfia", "Loma Plata", "Fuerte Olimpo", "Puerto Casado", "Bahía Negra", "Carmelo Peralta"];
  var COUNTRIES = [{ code: 'PY', label: 'Paraguay' }, { code: 'AR', label: 'Argentina' }, { code: 'BR', label: 'Brasil' }, { code: 'UY', label: 'Uruguay' }];
  var PROPERTY_TYPES = [{ code: 'terreno', label: 'Terreno' }, { code: 'casa', label: 'Casa' }, { code: 'departamento', label: 'Departamento' }, { code: 'estancia', label: 'Estancia' }];
  function propertyTypeLabel(code) {
    for (var i = 0; i < PROPERTY_TYPES.length; i++) if (PROPERTY_TYPES[i].code === code) return PROPERTY_TYPES[i].label;
    return 'Terreno';
  }
  var SERVICE_CATEGORIES = [
    { code: 'dron', label: 'Dron / fotos aéreas' },
    { code: 'fotografia', label: 'Fotografía' },
    { code: 'video', label: 'Video' },
    { code: 'fumigacion', label: 'Fumigación (campo)' },
    { code: 'otros', label: 'Otros servicios' }
  ];
  function serviceCategoryLabel(code) {
    for (var i = 0; i < SERVICE_CATEGORIES.length; i++) if (SERVICE_CATEGORIES[i].code === code) return SERVICE_CATEGORIES[i].label;
    return 'Otros servicios';
  }
  var ZONE_COORDS = {
    'Asunción': [-25.2637, -57.5759], 'Luque': [-25.2699, -57.4854], 'San Lorenzo': [-25.3400, -57.5081],
    'Ñemby': [-25.3958, -57.5347], 'Capiatá': [-25.3556, -57.4453], 'Itauguá': [-25.3958, -57.3561],
    'Villa Elisa': [-25.3667, -57.5975], 'Lambaré': [-25.3467, -57.6067], 'Fernando de la Mora': [-25.3200, -57.5347],
    'Mariano Roque Alonso': [-25.1900, -57.5300], 'Limpio': [-25.1667, -57.4833], 'San Bernardino': [-25.3239, -57.2953],
    'Encarnación': [-27.3306, -55.8664], 'Ciudad del Este': [-25.5097, -54.6111], 'Coronel Oviedo': [-25.4500, -56.4406],
    'Caacupé': [-25.3861, -57.1400],
    'Concepción': [-23.4064, -57.4340], 'San Pedro': [-24.0667, -57.0833], 'Cordillera': [-25.3167, -57.0333],
    'Guairá': [-25.7833, -56.4333], 'Caaguazú': [-25.4667, -56.0167], 'Caazapá': [-26.2000, -56.3667],
    'Itapúa': [-27.3306, -55.8664], 'Misiones': [-27.0667, -56.7167], 'Paraguarí': [-25.6167, -57.1500],
    'Alto Paraná': [-25.5097, -54.6111], 'Central': [-25.2800, -57.5200], 'Ñeembucú': [-27.0333, -58.2833],
    'Amambay': [-22.5667, -56.4333], 'Canindeyú': [-24.1500, -55.0333], 'Presidente Hayes': [-24.1333, -59.8333],
    'Boquerón': [-22.6500, -60.0333], 'Alto Paraguay': [-20.2333, -58.1667]
  };
  var COUNTRY_CENTER = { PY: [-23.4425, -58.4438], AR: [-38.4161, -63.6167], BR: [-14.2350, -51.9253], UY: [-32.5228, -55.7658] };
  function resolveCoords(l) {
    if (l.lat != null && l.lng != null) return { coords: [l.lat, l.lng], precise: true, exact: true };
    if (ZONE_COORDS[l.zone]) return { coords: ZONE_COORDS[l.zone], precise: true, exact: false };
    return { coords: COUNTRY_CENTER[l.country] || COUNTRY_CENTER.PY, precise: false, exact: false };
  }
  var detailMap = null, detailMarker = null;
  function renderDetailMap(l) {
    var box = document.getElementById('dialogMap');
    var note = document.getElementById('dialogMapNote');
    if (!box) return;
    if (typeof L === 'undefined') { box.hidden = true; if (note) note.textContent = ''; return; }
    box.hidden = false;
    var resolved = resolveCoords(l);
    try {
      if (!detailMap) {
        detailMap = L.map(box, { attributionControl: true, scrollWheelZoom: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        }).addTo(detailMap);
        detailMarker = L.marker(resolved.coords).addTo(detailMap);
      }
      detailMap.setView(resolved.coords, resolved.exact ? 15 : resolved.precise ? 13 : 6);
      detailMarker.setLatLng(resolved.coords);
      setTimeout(function () { detailMap.invalidateSize(); }, 60);
    } catch (e) { /* map lib unavailable or failed — degrade silently */ }
    if (note) {
      note.textContent = resolved.exact
        ? 'Ubicación marcada por quien publicó el lote.'
        : resolved.precise
          ? 'Ubicación aproximada de la zona (no es la dirección exacta del lote).'
          : 'Todavía no tenemos una referencia puntual de "' + l.zone + '" — se muestra el centro de ' + countryLabel(l.country) + '.';
    }
  }
  var CALL_CODE = { PY: '595', AR: '54', BR: '55', UY: '598' };
  function countryLabel(code) {
    for (var i = 0; i < COUNTRIES.length; i++) if (COUNTRIES[i].code === code) return COUNTRIES[i].label;
    return code || 'Paraguay';
  }

  /* ---------------- Elements ---------------- */
  var el = {
    tabs: document.querySelectorAll('nav.tabs button[role="tab"]'),
    views: {
      explorar: document.getElementById('view-explorar'),
      publicar: document.getElementById('view-publicar'),
      servicios: document.getElementById('view-servicios'),
      ofertas: document.getElementById('view-ofertas'),
      mensajes: document.getElementById('view-mensajes'),
      admin: document.getElementById('view-admin')
    },
    adminTabBtn: document.getElementById('adminTabBtn'),
    msgBadge: document.getElementById('msgBadge'),
    userBox: document.getElementById('userBox'),
    banner: document.getElementById('banner'),
    searchInput: document.getElementById('searchInput'),
    countryFilter: document.getElementById('countryFilter'),
    typeFilter: document.getElementById('typeFilter'),
    zoneFilter: document.getElementById('zoneFilter'),
    sortSelect: document.getElementById('sortSelect'),
    listingGrid: document.getElementById('listingGrid'),
    emptyExplorar: document.getElementById('emptyExplorar'),
    publicarGate: document.getElementById('publicarGate'),
    serviciosGate: document.getElementById('serviciosGate'),
    ofertasGate: document.getElementById('ofertasGate'),
    adminStats: document.getElementById('adminStats'),
    adminUsersTable: document.getElementById('adminUsersTable'),
    adminListings: document.getElementById('adminListings'),
    overlayBg: document.getElementById('overlayBg'),
    dialogMedia: document.getElementById('dialogMedia'),
    dialogCloseBtn: document.getElementById('dialogCloseBtn'),
    dialogTitle: document.getElementById('dialogTitle'),
    dialogZone: document.getElementById('dialogZone'),
    dialogPrice: document.getElementById('dialogPrice'),
    dialogDesc: document.getElementById('dialogDesc'),
    dialogContact: document.getElementById('dialogContact'),
    dialogActionArea: document.getElementById('dialogActionArea'),
    authOverlay: document.getElementById('authOverlay'),
    aboutOverlay: document.getElementById('aboutOverlay'),
    aboutCloseBtn: document.getElementById('aboutCloseBtn'),
    aboutLink: document.getElementById('aboutLink'),
    authCloseBtn: document.getElementById('authCloseBtn'),
    authForm: document.getElementById('authForm'),
    authMsg: document.getElementById('authMsg'),
    authNameField: document.getElementById('authNameField'),
    authPhoneField: document.getElementById('authPhoneField'),
    authSubmitBtn: document.getElementById('authSubmitBtn'),
    toast: document.getElementById('toast')
  };

  var me = null; // current user, or null
  var currentTab = 'explorar';
  var openListingId = null;
  var carouselIndex = 0;
  var authMode = 'login';
  var listingsCache = []; // last Explorar fetch, used to populate the zone filter
  var openThreadUserId = null; // messaging: which conversation is open, if any
  var lastSeenMsgId = 0; // messaging: id of the last message rendered in the open thread, to avoid needless re-renders on poll
  var msgPollTimer = null;
  var editingListingId = null; // publish form: null = creating, otherwise the id being edited
  var myListingsCache = []; // last "Tus publicaciones" fetch, so Editar can prefill the form without another request

  function showToast(msg, ms) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { el.toast.hidden = true; }, ms || 3200);
  }
  function showBanner(msg, isErr) {
    el.banner.hidden = false;
    el.banner.className = 'banner' + (isErr ? ' err' : '');
    el.banner.innerHTML = esc(msg);
  }

  /* ---------------- Tabs ---------------- */
  function switchTab(tab) {
    if ((tab === 'publicar' || tab === 'ofertas' || tab === 'mensajes') && !me) tab = tab; // gates render their own login prompt
    if (tab === 'admin' && !(me && me.isAdmin)) tab = 'explorar';
    currentTab = tab;
    el.tabs.forEach(function (btn) {
      var on = btn.getAttribute('data-tab') === tab;
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    Object.keys(el.views).forEach(function (k) { el.views[k].hidden = (k !== tab); });
    renderCurrentTab();
  }
  el.tabs.forEach(function (btn) {
    btn.addEventListener('click', function () { switchTab(btn.getAttribute('data-tab')); });
  });

  function renderCurrentTab() {
    if (currentTab === 'explorar') loadExplorar();
    else if (currentTab === 'publicar') renderPublicarGate();
    else if (currentTab === 'servicios') renderServiciosGate();
    else if (currentTab === 'ofertas') renderOfertasGate();
    else if (currentTab === 'mensajes') renderMensajesGate();
    else if (currentTab === 'admin') loadAdmin();
  }

  /* ---------------- Auth ---------------- */
  function renderUserBox() {
    if (me) {
      el.userBox.innerHTML =
        '<span class="user-box"><strong>' + esc(me.displayName) + '</strong>' +
        (me.isAdmin ? ' <span class="badge admin">Admin</span>' : '') + '</span>' +
        '<button class="btn btn-sm btn-ghost" id="logoutBtn">Cerrar sesión</button>';
      document.getElementById('logoutBtn').addEventListener('click', doLogout);
    } else {
      el.userBox.innerHTML =
        '<button class="btn btn-sm btn-ghost" id="loginBtn">Iniciar sesión</button>' +
        '<button class="btn btn-sm btn-primary" id="registerBtn">Crear cuenta</button>';
      document.getElementById('loginBtn').addEventListener('click', function () { openAuth('login'); });
      document.getElementById('registerBtn').addEventListener('click', function () { openAuth('register'); });
    }
    el.adminTabBtn.hidden = !(me && me.isAdmin);
  }

  async function refreshMe() {
    try {
      var data = await api('GET', '/api/auth/me');
      me = data.user;
    } catch (e) { me = null; }
    renderUserBox();
    if (me) { updateMsgBadge(); startMsgPolling(); } else { stopMsgPolling(); }
  }

  function openAuth(mode) {
    authMode = mode;
    updateAuthMode();
    el.authForm.reset();
    el.authMsg.innerHTML = '';
    el.overlayBg.hidden = true; // don't stack dialogs
    el.authOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('a-email').focus();
  }
  function closeAuth() {
    el.authOverlay.hidden = true;
    document.body.style.overflow = '';
  }
  function updateAuthMode() {
    document.querySelectorAll('[data-auth-mode]').forEach(function (b) {
      b.setAttribute('aria-selected', b.getAttribute('data-auth-mode') === authMode ? 'true' : 'false');
    });
    el.authNameField.hidden = authMode !== 'register';
    el.authPhoneField.hidden = authMode !== 'register';
    document.getElementById('a-name').required = authMode === 'register';
    el.authSubmitBtn.textContent = authMode === 'register' ? 'Crear cuenta' : 'Iniciar sesión';
  }
  document.querySelectorAll('[data-auth-mode]').forEach(function (b) {
    b.addEventListener('click', function () { authMode = b.getAttribute('data-auth-mode'); updateAuthMode(); });
  });
  el.authCloseBtn.addEventListener('click', closeAuth);
  el.authOverlay.addEventListener('click', function (e) { if (e.target === el.authOverlay) closeAuth(); });

  el.authForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var email = document.getElementById('a-email').value.trim();
    var password = document.getElementById('a-password').value;
    el.authMsg.innerHTML = '';
    el.authSubmitBtn.disabled = true;
    try {
      if (authMode === 'register') {
        var displayName = document.getElementById('a-name').value.trim();
        var phone = document.getElementById('a-phone').value.trim();
        var data = await api('POST', '/api/auth/register', { email: email, password: password, displayName: displayName, phone: phone });
        me = data.user;
      } else {
        var data2 = await api('POST', '/api/auth/login', { email: email, password: password });
        me = data2.user;
      }
      renderUserBox();
      closeAuth();
      showToast(authMode === 'register' ? '¡Cuenta creada! Ya podés publicar y ofertar.' : 'Sesión iniciada.');
      updateMsgBadge();
      startMsgPolling();
      renderCurrentTab();
    } catch (err) {
      el.authMsg.innerHTML = '<div class="form-msg err">' + esc(err.message) + '</div>';
    } finally {
      el.authSubmitBtn.disabled = false;
    }
  });

  async function doLogout() {
    try { await api('POST', '/api/auth/logout'); } catch (e) { /* ignore */ }
    me = null;
    stopMsgPolling();
    el.msgBadge.hidden = true;
    openThreadUserId = null;
    renderUserBox();
    switchTab('explorar');
    showToast('Sesión cerrada.');
  }

  /* ---------------- Image compression ---------------- */
  var MAX_PHOTOS = 4;
  function compressImage(file, cb) {
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var maxW = 640;
        var scale = Math.min(1, maxW / img.width);
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = function () { cb(null); };
      img.src = ev.target.result;
    };
    reader.onerror = function () { cb(null); };
    reader.readAsDataURL(file);
  }

  /* ---------------- Explorar ---------------- */
  function fillFilterSelects() {
    var usedZones = {};
    listingsCache.forEach(function (l) { usedZones[l.zone] = true; });
    var allZones = ZONES.slice();
    Object.keys(usedZones).forEach(function (z) { if (allZones.indexOf(z) === -1) allZones.push(z); });
    allZones.sort();
    var currentZone = el.zoneFilter.value;
    el.zoneFilter.innerHTML = '<option value="">Todas</option>' + allZones.map(function (z) { return '<option value="' + esc(z) + '">' + esc(z) + '</option>'; }).join('');
    el.zoneFilter.value = currentZone;

    if (!el.countryFilter.dataset.filled) {
      el.countryFilter.innerHTML = '<option value="">Todos</option>' + COUNTRIES.map(function (c) { return '<option value="' + c.code + '">' + esc(c.label) + '</option>'; }).join('');
      el.countryFilter.dataset.filled = '1';
    }
    if (!el.typeFilter.dataset.filled) {
      el.typeFilter.innerHTML = '<option value="">Todos</option>' + PROPERTY_TYPES.map(function (t) { return '<option value="' + t.code + '">' + esc(t.label) + '</option>'; }).join('');
      el.typeFilter.dataset.filled = '1';
    }
  }

  async function loadExplorar() {
    var params = new URLSearchParams();
    if (el.searchInput.value.trim()) params.set('q', el.searchInput.value.trim());
    if (el.zoneFilter.value) params.set('zone', el.zoneFilter.value);
    if (el.countryFilter.value) params.set('country', el.countryFilter.value);
    if (el.typeFilter.value) params.set('tipo', el.typeFilter.value);
    if (el.sortSelect.value) params.set('sort', el.sortSelect.value);
    try {
      var data = await api('GET', '/api/listings?' + params.toString());
      listingsCache = data.listings;
      fillFilterSelects();
      el.emptyExplorar.hidden = listingsCache.length !== 0;
      el.listingGrid.innerHTML = listingsCache.map(cardHtml).join('');
    } catch (err) {
      showBanner('No se pudieron cargar los lotes: ' + err.message, true);
    }
  }
  ['input', 'change'].forEach(function (evt) {
    el.searchInput.addEventListener(evt, debounce(loadExplorar, 250));
  });
  el.zoneFilter.addEventListener('change', loadExplorar);
  el.countryFilter.addEventListener('change', loadExplorar);
  el.typeFilter.addEventListener('change', loadExplorar);
  el.sortSelect.addEventListener('change', loadExplorar);
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  function cardHtml(l) {
    var photo = l.photos && l.photos[0];
    var media = photo
      ? '<img src="' + photo + '" alt="">'
      : '<svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M4 18l5-6 4 4 3-4 4 6H4Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.6" stroke="currentColor" stroke-width="1.4"/></svg>';
    var statusPill = l.status === 'vendido' ? '<span class="status-pill vendido">Vendido</span>' : '';
    var featuredPill = l.featured ? '<span class="featured-pill">' + starIcon() + ' Destacado</span>' : '';
    var verifiedPill = l.verified ? '<span class="verified-pill">' + checkIcon() + ' Verificado</span>' : '';
    var typePill = '<span class="type-pill">' + esc(propertyTypeLabel(l.propertyType)) + '</span>';
    var mineTag = l.isMine ? ' · <em>vos</em>' : '';
    var agencyTag = l.ownerIsAgency ? '<span class="agency-tag">Agencia</span>' : '';
    var cuotasLine = (l.installmentAmount != null && (l.installmentsPaid != null || l.installmentsLeft != null))
      ? '<div class="card-cuotas">A cuotas: ' + (l.installmentsPaid != null ? l.installmentsPaid : '—') + '/' +
        ((l.installmentsPaid != null ? l.installmentsPaid : 0) + (l.installmentsLeft != null ? l.installmentsLeft : 0)) +
        ' pagadas · ' + money(l.installmentAmount, l.currency) + '/cuota</div>'
      : '';
    return (
      '<button class="card' + (l.featured ? ' featured' : '') + '" data-open="' + l.id + '">' +
      '<div class="card-media">' + media + '<span class="zone-pill">' + pinIcon() + ' <span>' + esc(l.zone) + ', ' + esc(countryLabel(l.country)) + '</span></span>' +
      '<span class="card-badges-right">' + featuredPill + verifiedPill + statusPill + '</span>' + typePill + '</div>' +
      '<div class="card-body">' +
      '<h3>' + esc(l.title) + '</h3>' +
      '<div class="card-price num">' + money(l.price, l.currency) + '</div>' +
      cuotasLine +
      '<p class="card-desc">' + esc(l.description) + '</p>' +
      '<div class="card-foot"><span class="owner-tag" style="flex:1; min-width:0;">' + esc(l.ownerLabel || '—') + mineTag + '</span>' + agencyTag + '<span class="btn btn-sm btn-ghost" style="pointer-events:none; flex:none;">Ver detalle</span></div>' +
      '</div></button>'
    );
  }
  el.listingGrid.addEventListener('click', function (e) {
    var card = e.target.closest('[data-open]');
    if (card) openDetail(Number(card.getAttribute('data-open')));
  });

  /* ---------------- Publicar ---------------- */
  var pendingPhotos = [];
  function renderPublicarGate(editListing) {
    if (!me) {
      el.publicarGate.innerHTML =
        '<div class="empty"><h3>Necesitás una cuenta para publicar</h3><p>Es gratis y toma un minuto.</p>' +
        '<div style="margin-top:14px; display:flex; gap:10px; justify-content:center;">' +
        '<button class="btn btn-primary" id="gateRegisterBtn">Crear cuenta</button>' +
        '<button class="btn btn-ghost" id="gateLoginBtn">Ya tengo cuenta</button></div></div>';
      document.getElementById('gateRegisterBtn').addEventListener('click', function () { openAuth('register'); });
      document.getElementById('gateLoginBtn').addEventListener('click', function () { openAuth('login'); });
      return;
    }
    editingListingId = editListing ? editListing.id : null;
    var L2 = editListing; // shorthand
    var hasCuotas = !!(L2 && L2.installmentAmount != null);

    el.publicarGate.innerHTML =
      '<div class="panel">' +
      '<h2 style="font-size:1.1rem; margin-bottom:4px;">' + (L2 ? 'Editar publicación' : 'Publicar una propiedad') + '</h2>' +
      '<p class="hint" style="margin-bottom:16px;">' + (L2 ? 'Actualizá los datos de tu propiedad — los cambios se ven al instante en Explorar.' : 'Contá lo esencial: qué tipo de propiedad es, cuánto pedís, dónde está y cómo te contactan. Podés mencionar el estado de las cuotas en la descripción.') + '</p>' +
      '<form id="publishForm">' +
      '<div class="form-grid">' +
      '<div class="field"><label for="f-type">Tipo de propiedad</label><select id="f-type">' + PROPERTY_TYPES.map(function (t) { return '<option value="' + t.code + '"' + (L2 ? (L2.propertyType === t.code ? ' selected' : '') : (t.code === 'terreno' ? ' selected' : '')) + '>' + esc(t.label) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="f-title">Título breve</label><input type="text" id="f-title" maxlength="70" placeholder="Ej: Casa de 3 dormitorios en zona residencial" value="' + esc(L2 ? L2.title : '') + '" required></div>' +
      '<div class="field"><label for="f-country">País</label><select id="f-country">' + COUNTRIES.map(function (c) { return '<option value="' + c.code + '"' + (L2 && L2.country === c.code ? ' selected' : '') + '>' + esc(c.label) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="f-zone">Zona o ciudad</label><input type="text" id="f-zone" list="zoneOptions" placeholder="Ej: Luque" value="' + esc(L2 ? L2.zone : '') + '" required><datalist id="zoneOptions">' + ZONES.map(function (z) { return '<option value="' + esc(z) + '">'; }).join('') + '</datalist></div>' +
      '<div class="field full"><label>Ubicación en el mapa (opcional)</label><div class="pick-map" id="pickMap"></div>' +
      '<div class="pick-map-row"><p class="hint" id="pickMapHint">Hacé clic en el mapa para marcar la ubicación exacta del lote.</p><button type="button" class="btn btn-sm btn-ghost" id="pickMapClear" hidden>Quitar marcador</button></div></div>' +
      '<div class="field full"><label for="f-price">Precio pedido</label><div class="price-row"><input type="number" id="f-price" min="0" step="1" placeholder="8500" value="' + (L2 ? Math.round(L2.price) : '') + '" required><select id="f-currency"><option value="USD"' + (L2 && L2.currency === 'PYG' ? '' : ' selected') + '>USD (dólares)</option><option value="PYG"' + (L2 && L2.currency === 'PYG' ? ' selected' : '') + '>Gs. (guaraníes)</option></select></div></div>' +
      '<div class="field full"><label for="f-phone">Teléfono / WhatsApp</label><input type="tel" id="f-phone" placeholder="0981 123 456" value="' + esc(L2 ? L2.phone : (me.phone || '')) + '" required></div>' +
      '<div class="field full"><label class="checkbox-label"><input type="checkbox" id="f-cuotas-toggle"' + (hasCuotas ? ' checked' : '') + '> Todavía estoy pagando este lote a cuotas</label></div>' +
      '<div class="cuotas-group" id="cuotasGroup"' + (hasCuotas ? '' : ' hidden') + '>' +
      '<div class="field"><label for="f-cuotas-pagadas">Cuotas pagadas</label><input type="number" id="f-cuotas-pagadas" min="0" step="1" placeholder="12" value="' + (hasCuotas && L2.installmentsPaid != null ? L2.installmentsPaid : '') + '"></div>' +
      '<div class="field"><label for="f-cuotas-restantes">Cuotas restantes</label><input type="number" id="f-cuotas-restantes" min="0" step="1" placeholder="24" value="' + (hasCuotas && L2.installmentsLeft != null ? L2.installmentsLeft : '') + '"></div>' +
      '<div class="field"><label for="f-cuotas-monto">Monto de cada cuota</label><input type="number" id="f-cuotas-monto" min="0" step="1" placeholder="150" value="' + (hasCuotas ? L2.installmentAmount : '') + '"></div>' +
      '<p class="hint" style="flex:1 1 100%; margin:-4px 0 0;">Poné el monto que pagabas al inicio de la compra — algunas loteadoras lo van ajustando con el tiempo, así que puede no ser el monto actual.</p>' +
      '<div class="field"><label for="f-cuotas-fecha">Fecha de inicio de compra</label><input type="date" id="f-cuotas-fecha" value="' + (hasCuotas && L2.purchaseStartDate ? L2.purchaseStartDate : '') + '"></div>' +
      '<div class="field"><label for="f-cuotas-total">Total abonado hasta hoy (opcional)</label><input type="number" id="f-cuotas-total" min="0" step="1" placeholder="Si pagaste montos extra, además de las cuotas" value="' + (hasCuotas && L2.totalPaid != null ? L2.totalPaid : '') + '"></div>' +
      '<div class="cuotas-calc" id="cuotasCalc" hidden></div>' +
      '</div>' +
      '<div class="field full"><label for="f-desc">Descripción</label><textarea id="f-desc" placeholder="Superficie, cuotas que faltan, loteadora, servicios, referencias del lugar..." required>' + esc(L2 ? L2.description : '') + '</textarea></div>' +
      '<div class="field full"><label>Fotos (hasta 4)</label><div class="photo-row" id="photoRow"></div><input type="file" id="photoInput" accept="image/*" multiple hidden><p class="hint">Se comprimen automáticamente para que la página cargue rápido.</p></div>' +
      (L2
        ? '<div class="field full"><p class="hint">' + (L2.commissionAcceptedAt ? 'Aceptaste que vas a abonar una comisión del 5% sobre el monto total de la venta cerrada, al publicar esta propiedad.' : '') + '</p></div>'
        : '<div class="field full"><label class="checkbox-label"><input type="checkbox" id="f-accept-terms" required> Acepto que, si concreto la venta de esta propiedad a través de Lote a Lote, voy a abonar una comisión del <b>5% sobre el monto total de la venta cerrada</b>.</label>' +
          '<p class="hint" style="margin:2px 0 0 26px;">Esta comisión aplica sobre el precio final acordado con el comprador, no necesariamente sobre el precio publicado acá.</p></div>') +
      '</div>' +
      '<div style="margin-top:16px; display:flex; gap:10px;"><button type="submit" class="btn btn-primary" id="publishSubmitBtn">' + (L2 ? 'Guardar cambios' : 'Publicar propiedad') + '</button>' +
      (L2 ? '<button type="button" class="btn btn-ghost" id="cancelEditBtn">Cancelar</button>' : '') + '</div>' +
      '<div id="publishMsg"></div>' +
      '</form></div>' +
      '<div class="my-listings"><h2>Tus publicaciones</h2><div id="myListingsList"></div><div class="empty" id="emptyMyListings" hidden><h3>Todavía no publicaste ninguna propiedad</h3><p>Completá el formulario de arriba para sumarla a Explorar.</p></div></div>';

    var cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', function () { editingListingId = null; renderPublicarGate(); });

    pendingPhotos = L2 && L2.photos ? L2.photos.slice() : [];
    var photoRow = document.getElementById('photoRow');
    var photoInput = document.getElementById('photoInput');
    function renderPhotoRow() {
      var chips = pendingPhotos.map(function (src, i) {
        return '<span class="photo-chip"><img src="' + src + '" alt=""><button type="button" data-remove="' + i + '" aria-label="Quitar foto">✕</button></span>';
      }).join('');
      photoRow.innerHTML = chips + (pendingPhotos.length < MAX_PHOTOS
        ? '<button type="button" class="photo-add" id="photoAddBtn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Agregar</button>'
        : '');
      var addBtn = document.getElementById('photoAddBtn');
      if (addBtn) addBtn.addEventListener('click', function () { photoInput.click(); });
    }
    renderPhotoRow();
    photoRow.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-remove]');
      if (rm) { pendingPhotos.splice(Number(rm.getAttribute('data-remove')), 1); renderPhotoRow(); }
    });
    photoInput.addEventListener('change', function () {
      var files = Array.prototype.slice.call(photoInput.files || []).slice(0, MAX_PHOTOS - pendingPhotos.length);
      var remaining = files.length;
      if (!remaining) return;
      files.forEach(function (f) {
        compressImage(f, function (dataUrl) {
          if (dataUrl) pendingPhotos.push(dataUrl);
          remaining--;
          if (remaining === 0) { renderPhotoRow(); photoInput.value = ''; }
        });
      });
    });

    var cuotasToggle = document.getElementById('f-cuotas-toggle');
    var cuotasGroup = document.getElementById('cuotasGroup');
    var cuotasCalc = document.getElementById('cuotasCalc');
    function updateCuotasCalc() {
      var paid = Number(document.getElementById('f-cuotas-pagadas').value) || 0;
      var left = Number(document.getElementById('f-cuotas-restantes').value) || 0;
      var amt = Number(document.getElementById('f-cuotas-monto').value) || 0;
      var totalAbonado = Number(document.getElementById('f-cuotas-total').value) || 0;
      var currency = document.getElementById('f-currency').value;
      var invertido = totalAbonado > 0 ? totalAbonado : paid * amt;
      if (amt > 0 && (paid > 0 || left > 0 || totalAbonado > 0)) {
        cuotasCalc.hidden = false;
        cuotasCalc.innerHTML =
          '<span>Ya invertido: <b class="paid num">' + money(invertido, currency) + '</b></span>' +
          '<span>Resta pagar: <b class="left num">' + money(left * amt, currency) + '</b></span>';
      } else {
        cuotasCalc.hidden = true;
      }
    }
    if (cuotasToggle) {
      cuotasToggle.addEventListener('change', function () { cuotasGroup.hidden = !cuotasToggle.checked; });
      ['f-cuotas-pagadas', 'f-cuotas-restantes', 'f-cuotas-monto', 'f-cuotas-total', 'f-currency'].forEach(function (id) {
        var fieldEl = document.getElementById(id);
        if (fieldEl) fieldEl.addEventListener('input', updateCuotasCalc);
      });
      if (hasCuotas) updateCuotasCalc();
    }

    var pickedLat = L2 && L2.lat != null ? L2.lat : null;
    var pickedLng = L2 && L2.lng != null ? L2.lng : null;
    var pickMap = null, pickMarker = null;
    (function initPickMap() {
      var box = document.getElementById('pickMap');
      if (!box) return;
      if (typeof L === 'undefined') { box.hidden = true; return; }
      function formCoords() {
        var zoneVal = document.getElementById('f-zone').value.trim();
        var countryVal = document.getElementById('f-country').value;
        return ZONE_COORDS[zoneVal] || COUNTRY_CENTER[countryVal] || COUNTRY_CENTER.PY;
      }
      try {
        pickMap = L.map(box, { scrollWheelZoom: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        }).addTo(pickMap);
        if (pickedLat != null && pickedLng != null) {
          pickMap.setView([pickedLat, pickedLng], 14);
          pickMarker = L.marker([pickedLat, pickedLng]).addTo(pickMap);
          var hint0 = document.getElementById('pickMapHint');
          if (hint0) hint0.textContent = 'Marcador colocado — se va a publicar con esta ubicación exacta.';
          var clearBtn0 = document.getElementById('pickMapClear');
          if (clearBtn0) clearBtn0.hidden = false;
        } else {
          pickMap.setView(formCoords(), 12);
        }
        setTimeout(function () { pickMap.invalidateSize(); }, 60);
        pickMap.on('click', function (e) {
          pickedLat = e.latlng.lat; pickedLng = e.latlng.lng;
          if (pickMarker) pickMarker.setLatLng(e.latlng); else pickMarker = L.marker(e.latlng).addTo(pickMap);
          var hint = document.getElementById('pickMapHint');
          if (hint) hint.textContent = 'Marcador colocado — se va a publicar con esta ubicación exacta.';
          var clearBtn = document.getElementById('pickMapClear');
          if (clearBtn) clearBtn.hidden = false;
        });
        ['f-country', 'f-zone'].forEach(function (id) {
          var fieldEl = document.getElementById(id);
          if (fieldEl) fieldEl.addEventListener('change', function () {
            if (pickedLat != null) return;
            pickMap.setView(formCoords(), 12);
          });
        });
        var clearBtn2 = document.getElementById('pickMapClear');
        if (clearBtn2) clearBtn2.addEventListener('click', function () {
          pickedLat = null; pickedLng = null;
          if (pickMarker) { pickMap.removeLayer(pickMarker); pickMarker = null; }
          var hint = document.getElementById('pickMapHint');
          if (hint) hint.textContent = 'Hacé clic en el mapa para marcar la ubicación exacta del lote.';
          clearBtn2.hidden = true;
        });
      } catch (e) { box.hidden = true; }
    })();

    document.getElementById('publishForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = document.getElementById('publishSubmitBtn');
      var msgBox = document.getElementById('publishMsg');
      var payload = {
        title: document.getElementById('f-title').value.trim(),
        propertyType: document.getElementById('f-type').value,
        country: document.getElementById('f-country').value,
        zone: document.getElementById('f-zone').value.trim(),
        price: Number(document.getElementById('f-price').value),
        currency: document.getElementById('f-currency').value,
        phone: document.getElementById('f-phone').value.trim(),
        description: document.getElementById('f-desc').value.trim(),
        photos: pendingPhotos.slice(),
        lat: pickedLat,
        lng: pickedLng,
        installmentsPaid: cuotasToggle && cuotasToggle.checked ? document.getElementById('f-cuotas-pagadas').value : null,
        installmentsLeft: cuotasToggle && cuotasToggle.checked ? document.getElementById('f-cuotas-restantes').value : null,
        installmentAmount: cuotasToggle && cuotasToggle.checked ? document.getElementById('f-cuotas-monto').value : null,
        totalPaid: cuotasToggle && cuotasToggle.checked ? document.getElementById('f-cuotas-total').value : null,
        purchaseStartDate: cuotasToggle && cuotasToggle.checked ? document.getElementById('f-cuotas-fecha').value : null
      };
      if (!editingListingId) {
        var acceptEl = document.getElementById('f-accept-terms');
        payload.acceptedTerms = !!(acceptEl && acceptEl.checked);
      }
      btn.disabled = true;
      try {
        if (editingListingId) {
          await api('PATCH', '/api/listings/' + editingListingId, payload);
          showToast('Cambios guardados.');
          editingListingId = null;
        } else {
          await api('POST', '/api/listings', payload);
          showToast('¡Listo! Tu lote ya está publicado en Explorar.');
        }
        renderPublicarGate();
        loadMyListings();
      } catch (err) {
        msgBox.innerHTML = '<div class="form-msg err">' + esc(err.message) + '</div>';
      } finally {
        btn.disabled = false;
      }
    });

    loadMyListings();
  }

  async function loadMyListings() {
    try {
      var data = await api('GET', '/api/listings/mine');
      myListingsCache = data.listings;
      var list = document.getElementById('myListingsList');
      var empty = document.getElementById('emptyMyListings');
      if (!list) return;
      empty.hidden = data.listings.length !== 0;
      list.innerHTML = data.listings.map(function (l) {
        var thumb = l.photos && l.photos[0] ? '<img src="' + l.photos[0] + '" alt="">' : pinIcon();
        var featuredLine = l.featured
          ? '<span class="featured-tag" style="margin-left:0;">' + starIcon() + ' Destacado hasta ' + new Date(l.featuredUntil).toLocaleDateString('es-PY') + '</span>'
          : '<a href="mailto:comercial@fermadi.com.py?subject=Destacar%20publicaci%C3%B3n%20' + encodeURIComponent(l.title) + '" style="font-size:0.78rem; color:var(--accent-strong);">¿Querés que aparezca primero? Destacala →</a>';
        return (
          '<div class="mini-row">' +
          '<div class="mini-thumb">' + thumb + '</div>' +
          '<div class="mini-info"><h4>' + esc(l.title) + '</h4><div class="mini-meta">' +
          '<span class="num">' + money(l.price, l.currency) + '</span><span>' + esc(l.zone) + ', ' + esc(countryLabel(l.country)) + '</span>' +
          '<span class="badge ' + l.status + '">' + (l.status === 'vendido' ? 'Vendido' : 'Activo') + '</span></div>' +
          '<div style="margin-top:4px;">' + featuredLine + '</div></div>' +
          '<div class="mini-actions">' +
          '<button class="btn btn-sm btn-ghost" data-open="' + l.id + '">Ver</button>' +
          '<button class="btn btn-sm btn-ghost" data-edit="' + l.id + '">Editar</button>' +
          (l.status !== 'vendido' ? '<button class="btn btn-sm btn-soft" data-mark-sold="' + l.id + '">Marcar vendido</button>' : '') +
          '<button class="btn btn-sm btn-danger" data-delete="' + l.id + '">Eliminar</button>' +
          '</div></div>'
        );
      }).join('');
      list.onclick = async function (e) {
        var open = e.target.closest('[data-open]');
        var edit = e.target.closest('[data-edit]');
        var sold = e.target.closest('[data-mark-sold]');
        var del = e.target.closest('[data-delete]');
        if (open) { openDetail(Number(open.getAttribute('data-open'))); return; }
        if (edit) {
          var listingToEdit = myListingsCache.find(function (l) { return l.id === Number(edit.getAttribute('data-edit')); });
          if (listingToEdit) {
            renderPublicarGate(listingToEdit);
            document.getElementById('publicarGate').scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          return;
        }
        if (sold) {
          try { await api('PATCH', '/api/listings/' + sold.getAttribute('data-mark-sold'), { status: 'vendido' }); showToast('Marcado como vendido.'); loadMyListings(); } catch (err) { showToast(err.message, 4500); }
          return;
        }
        if (del) {
          try { await api('DELETE', '/api/listings/' + del.getAttribute('data-delete')); showToast('Publicación eliminada.'); loadMyListings(); } catch (err) { showToast(err.message, 4500); }
        }
      };
    } catch (err) { /* silent */ }
  }

  /* ---------------- Servicios ---------------- */
  var pendingServicePhotos = [];
  var serviceCatFilterValue = '';
  var myServicesCache = [];

  function serviceCardHtml(s) {
    var photo = s.photos && s.photos[0];
    var media = photo
      ? '<img src="' + photo + '" alt="">'
      : '<svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M4 18l5-6 4 4 3-4 4 6H4Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.6" stroke="currentColor" stroke-width="1.4"/></svg>';
    var mineTag = s.isMine ? ' · <em>vos</em>' : '';
    var priceHtml = s.price != null ? '<div class="card-price num">' + money(s.price, s.currency) + '</div>' : '<div class="card-price num" style="font-size:0.95rem; color:var(--ink-soft);">Consultar precio</div>';
    return (
      '<button class="card" data-open-service="' + s.id + '">' +
      '<div class="card-media">' + media + '<span class="zone-pill">' + pinIcon() + ' <span>' + esc(s.zone) + ', ' + esc(countryLabel(s.country)) + '</span></span>' +
      '<span class="service-cat-pill">' + esc(serviceCategoryLabel(s.category)) + '</span></div>' +
      '<div class="card-body">' +
      '<h3>' + esc(s.title) + '</h3>' +
      priceHtml +
      '<p class="card-desc">' + esc(s.description) + '</p>' +
      '<div class="card-foot"><span class="owner-tag">' + esc(s.ownerLabel || '—') + mineTag + '</span><span class="btn btn-sm btn-ghost" style="pointer-events:none;">Ver detalle</span></div>' +
      '</div></button>'
    );
  }

  function renderServiciosGate() {
    el.serviciosGate.innerHTML =
      '<div class="cta-banner"><div><h3>¿Ofrecés un servicio para el campo o la propiedad?</h3>' +
      '<p>Dron, fotografía, video o fumigación: publicá tu servicio acá y que te encuentren compradores y vendedores de la plataforma.</p></div>' +
      '<button class="btn btn-primary" id="ctaPublishServiceBtn">Publicá aquí</button></div>' +
      '<div class="controls"><div class="field"><label for="serviceCatFilter">Categoría</label><select id="serviceCatFilter"><option value="">Todas</option>' +
      SERVICE_CATEGORIES.map(function (c) { return '<option value="' + c.code + '"' + (serviceCatFilterValue === c.code ? ' selected' : '') + '>' + esc(c.label) + '</option>'; }).join('') +
      '</select></div></div>' +
      '<div class="grid" id="serviceGrid"></div>' +
      '<div class="empty" id="emptyServicios" hidden><h3>Todavía no hay servicios publicados</h3><p>Sé el primero: publicá el tuyo más abajo.</p></div>' +
      '<div class="my-listings" id="servicePublishArea" style="margin-top:32px;"></div>';

    document.getElementById('serviceCatFilter').addEventListener('change', function () {
      serviceCatFilterValue = this.value;
      loadServices();
    });
    document.getElementById('ctaPublishServiceBtn').addEventListener('click', function () {
      if (!me) { openAuth('login'); return; }
      document.getElementById('servicePublishArea').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('serviceGrid').addEventListener('click', function (e) {
      var card = e.target.closest('[data-open-service]');
      if (card) openServiceDetail(Number(card.getAttribute('data-open-service')));
    });

    loadServices();
    renderServicePublishArea();
  }

  async function loadServices() {
    var grid = document.getElementById('serviceGrid');
    var empty = document.getElementById('emptyServicios');
    if (!grid) return;
    try {
      var params = new URLSearchParams();
      if (serviceCatFilterValue) params.set('category', serviceCatFilterValue);
      var data = await api('GET', '/api/services?' + params.toString());
      empty.hidden = data.services.length !== 0;
      grid.innerHTML = data.services.map(serviceCardHtml).join('');
    } catch (err) {
      showBanner('No se pudieron cargar los servicios: ' + err.message, true);
    }
  }

  function renderServicePublishArea() {
    var area = document.getElementById('servicePublishArea');
    if (!area) return;
    if (!me) {
      area.innerHTML =
        '<div class="empty"><h3>Iniciá sesión para publicar tu servicio</h3><p>Es gratis y toma un minuto.</p>' +
        '<div style="margin-top:14px; display:flex; gap:10px; justify-content:center;">' +
        '<button class="btn btn-primary" id="gateRegisterBtnSrv">Crear cuenta</button>' +
        '<button class="btn btn-ghost" id="gateLoginBtnSrv">Ya tengo cuenta</button></div></div>';
      document.getElementById('gateRegisterBtnSrv').addEventListener('click', function () { openAuth('register'); });
      document.getElementById('gateLoginBtnSrv').addEventListener('click', function () { openAuth('login'); });
      return;
    }

    area.innerHTML =
      '<div class="panel">' +
      '<h2 style="font-size:1.1rem; margin-bottom:4px;">Publicar un servicio</h2>' +
      '<p class="hint" style="margin-bottom:16px;">Contá qué ofrecés, en qué zona trabajás y cómo te contactan.</p>' +
      '<form id="publishServiceForm">' +
      '<div class="form-grid">' +
      '<div class="field"><label for="s-cat">Categoría</label><select id="s-cat">' + SERVICE_CATEGORIES.map(function (c) { return '<option value="' + c.code + '">' + esc(c.label) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="s-title">Título breve</label><input type="text" id="s-title" maxlength="70" placeholder="Ej: Fotos y video aéreo con dron" required></div>' +
      '<div class="field"><label for="s-country">País</label><select id="s-country">' + COUNTRIES.map(function (c) { return '<option value="' + c.code + '">' + esc(c.label) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="s-zone">Zona donde trabajás</label><input type="text" id="s-zone" list="zoneOptionsSrv" placeholder="Ej: Central, o todo el país" required><datalist id="zoneOptionsSrv">' + ZONES.map(function (z) { return '<option value="' + esc(z) + '">'; }).join('') + '</datalist></div>' +
      '<div class="field full"><label for="s-price">Precio (opcional)</label><div class="price-row"><input type="number" id="s-price" min="0" step="1" placeholder="Dejá vacío si preferís cotizar por consulta"><select id="s-currency"><option value="USD" selected>USD (dólares)</option><option value="PYG">Gs. (guaraníes)</option></select></div></div>' +
      '<div class="field full"><label for="s-phone">Teléfono / WhatsApp</label><input type="tel" id="s-phone" placeholder="0981 123 456" value="' + esc(me.phone || '') + '" required></div>' +
      '<div class="field full"><label for="s-desc">Descripción</label><textarea id="s-desc" placeholder="Qué incluye el servicio, equipo que usás, zonas donde trabajás, disponibilidad..." required></textarea></div>' +
      '<div class="field full"><label>Fotos o ejemplos de tu trabajo (hasta 4)</label><div class="photo-row" id="servicePhotoRow"></div><input type="file" id="servicePhotoInput" accept="image/*" multiple hidden><p class="hint">Se comprimen automáticamente para que la página cargue rápido.</p></div>' +
      '</div>' +
      '<div style="margin-top:16px;"><button type="submit" class="btn btn-primary" id="publishServiceSubmitBtn">Publicar servicio</button></div>' +
      '<div id="publishServiceMsg"></div>' +
      '</form></div>' +
      '<div class="my-listings"><h2>Tus servicios publicados</h2><div id="myServicesList"></div><div class="empty" id="emptyMyServices" hidden><h3>Todavía no publicaste ningún servicio</h3><p>Completá el formulario de arriba para sumarlo.</p></div></div>';

    pendingServicePhotos = [];
    var photoRow = document.getElementById('servicePhotoRow');
    var photoInput = document.getElementById('servicePhotoInput');
    function renderServicePhotoRow() {
      var chips = pendingServicePhotos.map(function (src, i) {
        return '<span class="photo-chip"><img src="' + src + '" alt=""><button type="button" data-remove="' + i + '" aria-label="Quitar foto">✕</button></span>';
      }).join('');
      photoRow.innerHTML = chips + (pendingServicePhotos.length < MAX_PHOTOS
        ? '<button type="button" class="photo-add" id="servicePhotoAddBtn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Agregar</button>'
        : '');
      var addBtn = document.getElementById('servicePhotoAddBtn');
      if (addBtn) addBtn.addEventListener('click', function () { photoInput.click(); });
    }
    renderServicePhotoRow();
    photoRow.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-remove]');
      if (rm) { pendingServicePhotos.splice(Number(rm.getAttribute('data-remove')), 1); renderServicePhotoRow(); }
    });
    photoInput.addEventListener('change', function () {
      var files = Array.prototype.slice.call(photoInput.files || []).slice(0, MAX_PHOTOS - pendingServicePhotos.length);
      var remaining = files.length;
      if (!remaining) return;
      files.forEach(function (f) {
        compressImage(f, function (dataUrl) {
          if (dataUrl) pendingServicePhotos.push(dataUrl);
          remaining--;
          if (remaining === 0) { renderServicePhotoRow(); photoInput.value = ''; }
        });
      });
    });

    document.getElementById('publishServiceForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = document.getElementById('publishServiceSubmitBtn');
      var msgBox = document.getElementById('publishServiceMsg');
      var priceVal = document.getElementById('s-price').value;
      var payload = {
        category: document.getElementById('s-cat').value,
        title: document.getElementById('s-title').value.trim(),
        country: document.getElementById('s-country').value,
        zone: document.getElementById('s-zone').value.trim(),
        price: priceVal === '' ? null : Number(priceVal),
        currency: document.getElementById('s-currency').value,
        phone: document.getElementById('s-phone').value.trim(),
        description: document.getElementById('s-desc').value.trim(),
        photos: pendingServicePhotos.slice()
      };
      btn.disabled = true;
      try {
        await api('POST', '/api/services', payload);
        showToast('¡Listo! Tu servicio ya está publicado.');
        renderServicePublishArea();
        loadServices();
      } catch (err) {
        msgBox.innerHTML = '<div class="form-msg err">' + esc(err.message) + '</div>';
      } finally {
        btn.disabled = false;
      }
    });

    loadMyServices();
  }

  async function loadMyServices() {
    try {
      var data = await api('GET', '/api/services/mine');
      myServicesCache = data.services;
      var list = document.getElementById('myServicesList');
      var empty = document.getElementById('emptyMyServices');
      if (!list) return;
      empty.hidden = data.services.length !== 0;
      list.innerHTML = data.services.map(function (s) {
        var thumb = s.photos && s.photos[0] ? '<img src="' + s.photos[0] + '" alt="">' : pinIcon();
        return (
          '<div class="mini-row">' +
          '<div class="mini-thumb">' + thumb + '</div>' +
          '<div class="mini-info"><h4>' + esc(s.title) + '</h4><div class="mini-meta">' +
          '<span>' + esc(serviceCategoryLabel(s.category)) + '</span>' +
          (s.price != null ? '<span class="num">' + money(s.price, s.currency) + '</span>' : '<span>Consultar precio</span>') +
          '<span>' + esc(s.zone) + ', ' + esc(countryLabel(s.country)) + '</span></div></div>' +
          '<div class="mini-actions">' +
          '<button class="btn btn-sm btn-ghost" data-open-service="' + s.id + '">Ver</button>' +
          '<button class="btn btn-sm btn-danger" data-delete-service="' + s.id + '">Eliminar</button>' +
          '</div></div>'
        );
      }).join('');
      list.onclick = async function (e) {
        var open = e.target.closest('[data-open-service]');
        var del = e.target.closest('[data-delete-service]');
        if (open) { openServiceDetail(Number(open.getAttribute('data-open-service'))); return; }
        if (del) {
          try { await api('DELETE', '/api/services/' + del.getAttribute('data-delete-service')); showToast('Servicio eliminado.'); loadMyServices(); loadServices(); } catch (err) { showToast(err.message, 4500); }
        }
      };
    } catch (err) { /* silent */ }
  }

  var serviceOverlayBg = document.getElementById('serviceOverlayBg');
  var openServiceId = null;
  function closeServiceDetail() {
    if (serviceOverlayBg) serviceOverlayBg.hidden = true;
    document.body.style.overflow = '';
    openServiceId = null;
  }
  var serviceDialogCloseBtn = document.getElementById('serviceDialogCloseBtn');
  if (serviceDialogCloseBtn) serviceDialogCloseBtn.addEventListener('click', closeServiceDetail);
  if (serviceOverlayBg) serviceOverlayBg.addEventListener('click', function (e) { if (e.target === serviceOverlayBg) closeServiceDetail(); });

  async function openServiceDetail(serviceId) {
    openServiceId = serviceId;
    if (!serviceOverlayBg) return;
    serviceOverlayBg.hidden = false;
    document.body.style.overflow = 'hidden';
    var s;
    try {
      var data = await api('GET', '/api/services/' + serviceId);
      s = data.service;
    } catch (err) {
      closeServiceDetail(); showToast(err.message, 4500); return;
    }
    if (openServiceId !== s.id) return;
    var media = document.getElementById('serviceDialogMedia');
    var photos = s.photos || [];
    media.innerHTML = photos.length
      ? '<img src="' + photos[0] + '" alt="">'
      : '<svg width="42" height="42" viewBox="0 0 24 24" fill="none"><path d="M4 18l5-6 4 4 3-4 4 6H4Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.6" stroke="currentColor" stroke-width="1.3"/></svg>';
    document.getElementById('serviceDialogTitle').textContent = s.title;
    document.getElementById('serviceDialogZone').innerHTML = pinIcon() + ' ' + esc(s.zone) + ', ' + esc(countryLabel(s.country)) + '<span class="type-tag">' + esc(serviceCategoryLabel(s.category)) + '</span>';
    document.getElementById('serviceDialogPrice').textContent = s.price != null ? money(s.price, s.currency) : 'Consultar';
    document.getElementById('serviceDialogDesc').textContent = s.description;
    var digits = (s.phone || '').replace(/\D/g, '');
    var code = CALL_CODE[s.country] || '595';
    var wa = digits ? ('https://wa.me/' + code + digits.replace(/^0/, '')) : null;
    document.getElementById('serviceDialogContact').innerHTML =
      '<span class="phone">' + phoneIcon() + ' ' + esc(s.phone) + '</span>' +
      (wa ? '<a class="btn btn-sm btn-soft" href="' + wa + '" target="_blank" rel="noopener">Abrir WhatsApp</a>' : '') +
      '<span style="margin-left:auto; color:var(--ink-faint); font-size:0.8rem;">Publicado por ' + esc(s.ownerLabel || '—') + '</span>';
  }

  var goServiciosBtn = document.getElementById('goServiciosBtn');
  if (goServiciosBtn) goServiciosBtn.addEventListener('click', function () { switchTab('servicios'); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------------- Mis ofertas ---------------- */
  function bidAuthorLabel(offer, bid, viewerIsBuyer) {
    if (bid.by === 'comprador') return viewerIsBuyer ? 'Vos' : esc(offer.buyerLabel || 'Comprador');
    return viewerIsBuyer ? esc(offer.listing.ownerLabel || 'Vendedor') : 'Vos';
  }

  function offerCardHtml(offer) {
    var l = offer.listing;
    var last = offer.bids[offer.bids.length - 1];
    var viewerIsBuyer = offer.dir === 'enviaste';
    var bubbles = offer.bids.map(function (b) {
      var amtHtml = b.type === 'trueque'
        ? '<div class="amt" style="font-size:0.92rem; font-weight:500;"><span class="badge trueque">Trueque</span>' + esc(b.description || '') + '</div>'
        : '<div class="amt num">' + money(b.amount, l.currency) + '</div>';
      return '<div class="bubble ' + b.by + '">' + amtHtml +
        (b.message ? '<div class="msg">' + esc(b.message) + '</div>' : '') +
        '<span class="ts">' + bidAuthorLabel(offer, b, viewerIsBuyer) + ' · ' + timeAgo(b.ts) + '</span></div>';
    }).join('');

    var actions = '';
    var statusLabel = { pendiente: 'Pendiente de respuesta', contraoferta: 'Nueva contraoferta', aceptada: 'Trato cerrado', rechazada: 'Oferta rechazada', retirada: 'Oferta retirada' }[offer.status];

    if (offer.status === 'pendiente' || offer.status === 'contraoferta') {
      var myTurn = (last.by === 'comprador' && !viewerIsBuyer) || (last.by === 'vendedor' && viewerIsBuyer);
      if (myTurn) {
        actions =
          '<div class="offer-actions">' +
          '<button class="btn btn-sm btn-primary" data-accept="' + offer.id + '">Aceptar</button>' +
          '<button class="btn btn-sm btn-danger" data-reject="' + offer.id + '">Rechazar</button>' +
          '<button class="btn btn-sm btn-ghost" data-counter-toggle="' + offer.id + '">Contraofertar</button>' +
          '</div>' +
          '<div class="counter-form" id="counter-' + offer.id + '" hidden>' +
          '<div class="field" style="flex:0 0 130px;"><label>Tipo</label><select class="counter-type" data-for="' + offer.id + '"><option value="efectivo"' + (last.type === 'trueque' ? '' : ' selected') + '>Efectivo</option><option value="trueque"' + (last.type === 'trueque' ? ' selected' : '') + '>Trueque</option></select></div>' +
          '<div class="field counter-amount-field" data-for="' + offer.id + '"' + (last.type === 'trueque' ? ' hidden' : '') + '><label>Nuevo monto (' + (l.currency === 'PYG' ? 'Gs.' : 'USD') + ')</label><input type="number" min="0" class="counter-amount" data-for="' + offer.id + '" value="' + Math.round(last.amount || 0) + '"></div>' +
          '<div class="field counter-desc-field" data-for="' + offer.id + '" style="flex:1 1 180px;"' + (last.type === 'trueque' ? '' : ' hidden') + '><label>¿Qué ofrecés?</label><input type="text" class="counter-desc" data-for="' + offer.id + '" placeholder="Ej: Toyota Hilux 2015" value="' + (last.type === 'trueque' ? esc(last.description || '') : '') + '"></div>' +
          '<div class="field" style="flex:1 1 160px;"><label>Mensaje (opcional)</label><input type="text" class="counter-msg" data-for="' + offer.id + '" placeholder="Ej: acepto si incluís..."></div>' +
          '<button class="btn btn-sm btn-primary" data-counter-send="' + offer.id + '">Enviar</button>' +
          '</div>';
      } else {
        actions = '<div class="status-line">Esperando respuesta de ' + (viewerIsBuyer ? esc(l.ownerLabel || 'el vendedor') : esc(offer.buyerLabel || 'la otra persona')) + '.' +
          (viewerIsBuyer ? ' <button class="btn btn-sm btn-ghost" data-withdraw="' + offer.id + '" style="margin-left:6px;">Retirar oferta</button>' : '') + '</div>';
      }
    }

    return (
      '<div class="offer-card">' +
      '<div class="offer-head"><span class="dir-tag ' + offer.dir + '">' + (offer.dir === 'enviaste' ? 'Enviaste' : 'Recibiste') + '</span>' +
      '<h4 style="flex:1; min-width:120px;">' + esc(l.title) + '</h4>' +
      '<span class="badge ' + offer.status + '">' + statusLabel + '</span>' +
      '<button class="btn btn-sm btn-ghost" data-open="' + l.id + '">Ver lote</button></div>' +
      '<div class="status-line">' + pinIcon() + ' ' + esc(l.zone) + ' · Pedido original: <span class="num">' + money(l.price, l.currency) + '</span></div>' +
      '<div class="thread">' + bubbles + '</div>' + actions +
      '</div>'
    );
  }

  function bindOfferActions(container, afterAction) {
    container.onchange = function (e) {
      var sel = e.target.closest('.counter-type');
      if (!sel) return;
      var oid = sel.getAttribute('data-for');
      var isTrueque = sel.value === 'trueque';
      var amtField = container.querySelector('.counter-amount-field[data-for="' + oid + '"]');
      var descField = container.querySelector('.counter-desc-field[data-for="' + oid + '"]');
      if (amtField) amtField.hidden = isTrueque;
      if (descField) descField.hidden = !isTrueque;
    };
    container.onclick = async function (e) {
      var open = e.target.closest('[data-open]');
      var acc = e.target.closest('[data-accept]');
      var rej = e.target.closest('[data-reject]');
      var wd = e.target.closest('[data-withdraw]');
      var togg = e.target.closest('[data-counter-toggle]');
      var send = e.target.closest('[data-counter-send]');
      if (open) { openDetail(Number(open.getAttribute('data-open'))); return; }
      try {
        if (acc) { await api('POST', '/api/offers/' + acc.getAttribute('data-accept') + '/accept'); showToast('Aceptaste la oferta.'); afterAction(); }
        else if (rej) { await api('POST', '/api/offers/' + rej.getAttribute('data-reject') + '/reject'); showToast('Rechazaste la oferta.'); afterAction(); }
        else if (wd) { await api('POST', '/api/offers/' + wd.getAttribute('data-withdraw') + '/withdraw'); showToast('Retiraste tu oferta.'); afterAction(); }
        else if (togg) { var box = document.getElementById('counter-' + togg.getAttribute('data-counter-toggle')); if (box) box.hidden = !box.hidden; }
        else if (send) {
          var oid = send.getAttribute('data-counter-send');
          var typeSel = container.querySelector('.counter-type[data-for="' + oid + '"]');
          var type = (typeSel && typeSel.value === 'trueque') ? 'trueque' : 'efectivo';
          var msg = container.querySelector('.counter-msg[data-for="' + oid + '"]').value.trim();
          var payload = { type: type, message: msg };
          if (type === 'trueque') {
            var desc = container.querySelector('.counter-desc[data-for="' + oid + '"]').value.trim();
            if (!desc) return;
            payload.description = desc;
          } else {
            var amt = Number(container.querySelector('.counter-amount[data-for="' + oid + '"]').value);
            if (!(amt > 0)) return;
            payload.amount = amt;
          }
          await api('POST', '/api/offers/' + oid + '/bids', payload);
          showToast('Enviaste una contraoferta.');
          afterAction();
        }
      } catch (err) { showToast(err.message, 4500); }
    };
  }

  function renderOfertasGate() {
    if (!me) {
      el.ofertasGate.innerHTML =
        '<div class="empty"><h3>Iniciá sesión para ver tus ofertas</h3><p>Ahí vas a ver tanto lo que ofertaste como lo que te ofertaron por tus lotes.</p>' +
        '<div style="margin-top:14px;"><button class="btn btn-primary" id="gateLoginBtn2">Iniciar sesión</button></div></div>';
      document.getElementById('gateLoginBtn2').addEventListener('click', function () { openAuth('login'); });
      return;
    }
    el.ofertasGate.innerHTML = '<h2 style="font-size:1.1rem; margin-bottom:14px;">Mis ofertas</h2><div id="offersFeed"></div><div class="empty" id="emptyOffers" hidden><h3>Todavía no hay movimiento acá</h3><p>Las ofertas que hagas o recibas por tus lotes van a aparecer en esta lista.</p></div>';
    loadOffersFeed();
  }

  async function loadOffersFeed() {
    try {
      var data = await api('GET', '/api/offers/mine');
      var feed = document.getElementById('offersFeed');
      var empty = document.getElementById('emptyOffers');
      if (!feed) return;
      empty.hidden = data.offers.length !== 0;
      feed.innerHTML = data.offers.map(offerCardHtml).join('');
      bindOfferActions(feed, loadOffersFeed);
    } catch (err) { /* silent */ }
  }

  /* ---------------- Detail overlay ---------------- */
  function closeDetail() {
    el.overlayBg.hidden = true;
    document.body.style.overflow = '';
    openListingId = null;
  }
  el.dialogCloseBtn.addEventListener('click', closeDetail);
  el.overlayBg.addEventListener('click', function (e) { if (e.target === el.overlayBg) closeDetail(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!el.overlayBg.hidden) closeDetail();
      if (!el.authOverlay.hidden) closeAuth();
      if (!el.aboutOverlay.hidden) closeAbout();
      if (serviceOverlayBg && !serviceOverlayBg.hidden) closeServiceDetail();
    }
  });

  /* ---------------- Quiénes somos ---------------- */
  function openAbout() {
    el.overlayBg.hidden = true;
    el.authOverlay.hidden = true;
    el.aboutOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeAbout() {
    el.aboutOverlay.hidden = true;
    document.body.style.overflow = '';
  }
  if (el.aboutLink) el.aboutLink.addEventListener('click', function (e) { e.preventDefault(); openAbout(); });
  if (el.aboutCloseBtn) el.aboutCloseBtn.addEventListener('click', closeAbout);
  if (el.aboutOverlay) el.aboutOverlay.addEventListener('click', function (e) { if (e.target === el.aboutOverlay) closeAbout(); });

  function renderDetailMedia(l) {
    var photos = l.photos || [];
    if (!photos.length) {
      el.dialogMedia.innerHTML = '<svg width="42" height="42" viewBox="0 0 24 24" fill="none"><path d="M4 18l5-6 4 4 3-4 4 6H4Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.6" stroke="currentColor" stroke-width="1.3"/></svg>';
      return;
    }
    if (carouselIndex >= photos.length) carouselIndex = 0;
    var nav = photos.length > 1 ? (
      '<button class="carousel-nav prev" id="carPrev" aria-label="Foto anterior"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<button class="carousel-nav next" id="carNext" aria-label="Foto siguiente"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<div class="carousel-dots">' + photos.map(function (_, i) { return '<span class="' + (i === carouselIndex ? 'on' : '') + '"></span>'; }).join('') + '</div>'
    ) : '';
    el.dialogMedia.innerHTML = '<img src="' + photos[carouselIndex] + '" alt="">' + nav;
    var prev = document.getElementById('carPrev'), next = document.getElementById('carNext');
    if (prev) prev.addEventListener('click', function () { carouselIndex = (carouselIndex - 1 + photos.length) % photos.length; renderDetailMedia(l); });
    if (next) next.addEventListener('click', function () { carouselIndex = (carouselIndex + 1) % photos.length; renderDetailMedia(l); });
  }

  async function openDetail(listingId) {
    openListingId = listingId;
    carouselIndex = 0;
    el.overlayBg.hidden = false;
    document.body.style.overflow = 'hidden';
    el.dialogActionArea.innerHTML = '<p class="hint">Cargando…</p>';
    await renderDetail();
    el.dialogCloseBtn.focus();
  }

  async function renderDetail() {
    var l;
    try {
      var data = await api('GET', '/api/listings/' + openListingId);
      l = data.listing;
    } catch (err) {
      closeDetail(); showToast(err.message, 4500); return;
    }
    if (openListingId !== l.id) return; // stale
    renderDetailMedia(l);
    document.getElementById('dialogTitle').textContent = l.title;
    document.getElementById('dialogZone').innerHTML = pinIcon() + ' ' + esc(l.zone) + ', ' + esc(countryLabel(l.country)) + '<span class="type-tag">' + esc(propertyTypeLabel(l.propertyType)) + '</span>' + (l.featured ? '<span class="featured-tag">' + starIcon() + ' Destacado</span>' : '') + (l.verified ? '<span class="verified-tag">' + checkIcon() + ' Verificado</span>' : '') + (l.status === 'vendido' ? ' · <span class="badge vendido" style="margin-left:4px;">Vendido</span>' : '');
    document.getElementById('dialogPrice').textContent = money(l.price, l.currency);
    document.getElementById('dialogDesc').textContent = l.description;
    var cuotasBox = document.getElementById('dialogCuotas');
    if (cuotasBox) {
      if (l.installmentAmount != null && (l.installmentsPaid != null || l.installmentsLeft != null)) {
        var paidN = l.installmentsPaid || 0, leftN = l.installmentsLeft || 0;
        var invertidoN = l.totalPaid != null ? l.totalPaid : paidN * l.installmentAmount;
        var fechaLine = l.purchaseStartDate ? '<span>Inicio de compra: <b>' + esc(l.purchaseStartDate.split('-').reverse().join('/')) + '</b></span>' : '';
        cuotasBox.hidden = false;
        cuotasBox.innerHTML =
          '<div class="cuotas-info">' +
          '<span>Cuotas pagadas: <b>' + paidN + '</b></span>' +
          '<span>Cuotas restantes: <b>' + leftN + '</b></span>' +
          '<span>Monto de cuota (al inicio): <b class="num">' + money(l.installmentAmount, l.currency) + '</b></span>' +
          fechaLine +
          '<span>Ya invertido: <b class="num">' + money(invertidoN, l.currency) + '</b></span>' +
          '<span>Resta pagar: <b class="num">' + money(leftN * l.installmentAmount, l.currency) + '</b></span>' +
          '</div>';
      } else {
        cuotasBox.hidden = true;
        cuotasBox.innerHTML = '';
      }
    }
    renderDetailMap(l);

    var digits = (l.phone || '').replace(/\D/g, '');
    var code = CALL_CODE[l.country] || '595';
    var wa = digits ? ('https://wa.me/' + code + digits.replace(/^0/, '')) : null;
    document.getElementById('dialogContact').innerHTML =
      '<span class="phone">' + phoneIcon() + ' ' + esc(l.phone) + '</span>' +
      (wa ? '<a class="btn btn-sm btn-soft" href="' + wa + '" target="_blank" rel="noopener">Abrir WhatsApp</a>' : '') +
      '<span style="margin-left:auto; color:var(--ink-faint); font-size:0.8rem;">Publicado por ' + esc(l.ownerLabel || '—') + (l.ownerIsAgency ? '<span class="agency-tag">Agencia</span>' : '') + '</span>';

    renderDialogDM(l);
    await renderDetailAction(l);
  }

  function renderDialogDM(l) {
    var box = document.getElementById('dialogDM');
    if (!box) return;
    if (!me || l.isMine) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML =
      '<span class="dm-label">Escribile un mensaje al vendedor sobre este lote (además de ofertar o llamar):</span>' +
      '<textarea id="dmInput" placeholder="Ej: ¿Sigue disponible? Me interesa..." maxlength="2000"></textarea>' +
      '<button type="button" class="btn btn-sm btn-primary" id="dmSendBtn">Enviar mensaje</button>';
    document.getElementById('dmSendBtn').addEventListener('click', async function () {
      var input = document.getElementById('dmInput');
      var body = input.value.trim();
      if (!body) return;
      var btn = document.getElementById('dmSendBtn');
      btn.disabled = true;
      try {
        await api('POST', '/api/messages', { toUserId: l.ownerId, listingId: l.id, body: body });
        input.value = '';
        showToast('Mensaje enviado. Vas a ver la respuesta en la pestaña Mensajes.');
        updateMsgBadge();
      } catch (err) { showToast(err.message, 4500); } finally { btn.disabled = false; }
    });
  }

  async function renderDetailAction(l) {
    if (!me) {
      el.dialogActionArea.innerHTML = l.isMine
        ? '<div class="own-note">' + pinIcon() + ' Esta es tu publicación.</div>'
        : '<div class="own-note">Iniciá sesión para hacerle una oferta a este lote. <button class="btn btn-sm btn-primary" id="detailLoginBtn">Iniciar sesión</button></div>';
      var b = document.getElementById('detailLoginBtn');
      if (b) b.addEventListener('click', function () { openAuth('login'); });
      return;
    }

    var mineOffer = null;
    var receivedOffers = [];
    try {
      var data = await api('GET', '/api/offers/mine');
      if (l.isMine) receivedOffers = data.offers.filter(function (o) { return o.listing.id === l.id; });
      else mineOffer = data.offers.find(function (o) { return o.listing.id === l.id && o.dir === 'enviaste'; }) || null;
    } catch (e) { /* ignore */ }

    if (l.isMine) {
      var html = '<div class="own-note">' + pinIcon() + ' Esta es tu publicación. Acá abajo vas a ver las ofertas que recibas.</div>';
      if (receivedOffers.length) html += '<div style="margin-top:12px;">' + receivedOffers.map(offerCardHtml).join('') + '</div>';
      el.dialogActionArea.innerHTML = html;
      bindOfferActions(el.dialogActionArea, function () { renderDetail(); loadOffersFeedIfVisible(); });
      return;
    }

    if (!mineOffer || mineOffer.status === 'rechazada' || mineOffer.status === 'retirada') {
      var currLabel = l.currency === 'PYG' ? 'Gs.' : 'USD';
      el.dialogActionArea.innerHTML =
        '<div class="offer-form">' +
        '<div class="field" style="flex:0 0 140px;"><label for="dOfferType">Tipo de oferta</label><select id="dOfferType"><option value="efectivo">Efectivo</option><option value="trueque">Trueque</option></select></div>' +
        '<div class="field" id="dOfferAmountField"><label for="dOfferAmount">Tu oferta (' + currLabel + ')</label><input type="number" id="dOfferAmount" min="0" placeholder="' + Math.round(l.price * 0.9) + '"></div>' +
        '<div class="field" id="dOfferDescField" style="flex:1 1 200px;" hidden><label for="dOfferDesc">¿Qué ofrecés a cambio?</label><input type="text" id="dOfferDesc" placeholder="Ej: Toyota Hilux 2015, u otra propiedad"></div>' +
        '<div class="field" style="flex:2 1 200px;"><label for="dOfferMsg">Mensaje (opcional)</label><input type="text" id="dOfferMsg" placeholder="Contale al vendedor tu propuesta"></div>' +
        '<button class="btn btn-primary" id="dOfferSend" ' + (l.status === 'vendido' ? 'disabled' : '') + '>Ofertar</button>' +
        '</div>';
      document.getElementById('dOfferType').addEventListener('change', function () {
        var isTrueque = this.value === 'trueque';
        document.getElementById('dOfferAmountField').hidden = isTrueque;
        document.getElementById('dOfferDescField').hidden = !isTrueque;
      });
      document.getElementById('dOfferSend').addEventListener('click', async function () {
        var type = document.getElementById('dOfferType').value;
        var msg = document.getElementById('dOfferMsg').value.trim();
        var payload = { listingId: l.id, type: type, message: msg };
        if (type === 'trueque') {
          var desc = document.getElementById('dOfferDesc').value.trim();
          if (!desc) return;
          payload.description = desc;
        } else {
          var amt = Number(document.getElementById('dOfferAmount').value);
          if (!(amt > 0)) return;
          payload.amount = amt;
        }
        try {
          await api('POST', '/api/offers', payload);
          showToast('Enviaste tu oferta por "' + l.title + '".');
          renderDetail();
          loadOffersFeedIfVisible();
        } catch (err) { showToast(err.message, 4500); }
      });
    } else {
      el.dialogActionArea.innerHTML = offerCardHtml(mineOffer);
      bindOfferActions(el.dialogActionArea, function () { renderDetail(); loadOffersFeedIfVisible(); });
    }
  }

  function loadOffersFeedIfVisible() {
    if (currentTab === 'ofertas' && me) loadOffersFeed();
    if (currentTab === 'publicar' && me) loadMyListings();
    if (currentTab === 'explorar') loadExplorar();
  }

  /* ---------------- Mensajes ---------------- */
  function initials(name) {
    var parts = String(name || '?').trim().split(/\s+/);
    return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }

  async function updateMsgBadge() {
    if (!me) { el.msgBadge.hidden = true; return; }
    try {
      var data = await api('GET', '/api/messages/unread-count');
      if (data.count > 0) { el.msgBadge.hidden = false; el.msgBadge.textContent = data.count > 99 ? '99+' : String(data.count); }
      else { el.msgBadge.hidden = true; }
    } catch (e) { /* silent */ }
  }

  function startMsgPolling() {
    stopMsgPolling();
    msgPollTimer = setInterval(function () {
      if (!me) return;
      updateMsgBadge();
      if (currentTab === 'mensajes' && openThreadUserId != null) pollOpenThread();
      else if (currentTab === 'mensajes') loadThreads();
    }, 15000);
  }
  function stopMsgPolling() {
    if (msgPollTimer) { clearInterval(msgPollTimer); msgPollTimer = null; }
  }

  function renderMensajesGate() {
    var gate = document.getElementById('mensajesGate');
    if (!me) {
      gate.innerHTML =
        '<div class="empty"><h3>Iniciá sesión para ver tus mensajes</h3><p>Ahí vas a poder escribirte con compradores y vendedores.</p>' +
        '<div style="margin-top:14px;"><button class="btn btn-primary" id="gateLoginBtn3">Iniciar sesión</button></div></div>';
      document.getElementById('gateLoginBtn3').addEventListener('click', function () { openAuth('login'); });
      return;
    }
    openThreadUserId = null;
    loadThreads();
  }

  async function loadThreads() {
    var gate = document.getElementById('mensajesGate');
    if (!gate) return;
    try {
      var data = await api('GET', '/api/messages/threads');
      if (!data.threads.length) {
        gate.innerHTML = '<h2 style="font-size:1.1rem; margin-bottom:14px;">Mensajes</h2><div class="empty"><h3>Todavía no tenés conversaciones</h3><p>Cuando escribas o te escriban sobre un lote, va a aparecer acá.</p></div>';
        return;
      }
      gate.innerHTML = '<h2 style="font-size:1.1rem; margin-bottom:14px;">Mensajes</h2><div id="threadList"></div>';
      var list = document.getElementById('threadList');
      list.innerHTML = data.threads.map(function (t) {
        return (
          '<button type="button" class="thread-list-row' + (t.unread ? ' unread' : '') + '" data-open-thread="' + t.otherUserId + '">' +
          '<span class="thread-avatar">' + esc(initials(t.otherUserName)) + '</span>' +
          '<span class="thread-info"><h4>' + esc(t.otherUserName || 'Usuario') + '</h4>' +
          '<p>' + (t.lastMine ? 'Vos: ' : '') + esc(t.lastMessage) + '</p>' +
          (t.listingTitle ? '<span class="lt">Sobre: ' + esc(t.listingTitle) + '</span>' : '') + '</span>' +
          '<span class="thread-meta">' + timeAgo(t.lastAt) + (t.unread ? '<span class="thread-unread-dot">' + t.unread + '</span>' : '') + '</span>' +
          '</button>'
        );
      }).join('');
      list.onclick = function (e) {
        var btn = e.target.closest('[data-open-thread]');
        if (btn) openThread(Number(btn.getAttribute('data-open-thread')));
      };
    } catch (err) { showToast(err.message, 4500); }
  }

  function msgBubbleHtml(m) {
    return (
      '<div class="msg-bubble ' + (m.mine ? 'mine' : 'theirs') + '">' +
      (m.listingTitle ? '<span class="b-listing">Sobre: ' + esc(m.listingTitle) + '</span>' : '') +
      esc(m.body) +
      '<span class="b-ts">' + timeAgo(m.createdAt) + '</span></div>'
    );
  }

  async function openThread(otherUserId) {
    openThreadUserId = otherUserId;
    lastSeenMsgId = 0;
    await renderThreadView(true);
    updateMsgBadge();
  }

  async function renderThreadView(scrollDown) {
    var gate = document.getElementById('mensajesGate');
    if (!gate || openThreadUserId == null) return;
    var data;
    try {
      data = await api('GET', '/api/messages/thread/' + openThreadUserId);
    } catch (err) { showToast(err.message, 4500); openThreadUserId = null; loadThreads(); return; }
    var msgs = data.messages;
    var newestId = msgs.length ? msgs[msgs.length - 1].id : 0;
    if (newestId === lastSeenMsgId && document.getElementById('threadMsgs')) return; // nothing new, skip re-render (avoids scroll jump)
    lastSeenMsgId = newestId;
    gate.innerHTML =
      '<div class="thread-view-head"><button type="button" class="btn btn-sm btn-ghost" id="backToThreads">&larr; Volver</button><h3>' + esc(data.otherUser.displayName) + '</h3></div>' +
      '<div class="msg-thread" id="threadMsgs">' + msgs.map(msgBubbleHtml).join('') + '</div>' +
      '<form class="msg-compose" id="msgComposeForm"><textarea id="msgComposeInput" placeholder="Escribí un mensaje..." maxlength="2000" required></textarea><button type="submit" class="btn btn-primary">Enviar</button></form>';
    document.getElementById('backToThreads').addEventListener('click', function () { openThreadUserId = null; loadThreads(); });
    var threadBox = document.getElementById('threadMsgs');
    if (scrollDown) threadBox.scrollTop = threadBox.scrollHeight;
    document.getElementById('msgComposeForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var input = document.getElementById('msgComposeInput');
      var body = input.value.trim();
      if (!body) return;
      try {
        await api('POST', '/api/messages', { toUserId: openThreadUserId, body: body });
        input.value = '';
        await renderThreadView(true);
      } catch (err) { showToast(err.message, 4500); }
    });
  }

  function pollOpenThread() { renderThreadView(false); }

  /* ---------------- Admin ---------------- */
  async function loadAdmin() {
    if (!(me && me.isAdmin)) { switchTab('explorar'); return; }
    try {
      var stats = (await api('GET', '/api/admin/stats'));
      el.adminStats.innerHTML =
        tile(stats.users, 'Usuarios') + tile(stats.listings, 'Lotes publicados') +
        tile(stats.listingsVendidos, 'Marcados vendidos') + tile(stats.offers, 'Ofertas totales');

      var usersData = await api('GET', '/api/admin/users');
      el.adminUsersTable.innerHTML =
        '<thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Lotes</th><th>Rol</th><th>Agencia</th><th>Alta</th></tr></thead><tbody>' +
        usersData.users.map(function (u) {
          var agencyCell = u.isAgency
            ? '<span class="agency-tag" style="margin-left:0;">Agencia hasta ' + new Date(u.agencyUntil).toLocaleDateString('es-PY') + '</span> <button class="btn btn-sm btn-ghost" data-agency-clear="' + u.id + '">Quitar</button>'
            : '<select class="agency-months" data-for="' + u.id + '" style="width:auto; padding:3px 6px; font-size:0.78rem;">' +
              '<option value="1">1 mes</option><option value="3">3 meses</option><option value="6">6 meses</option><option value="12">12 meses</option><option value="24">24 meses</option></select> ' +
              '<button class="btn btn-sm btn-soft" data-agency-activate="' + u.id + '">Activar agencia</button>';
          return '<tr><td>' + esc(u.displayName) + '</td><td>' + esc(u.email) + '</td><td>' + esc(u.phone || '—') + '</td><td class="num">' + u.listingsCount + '</td><td>' + (u.isAdmin ? '<span class="badge admin">Admin</span>' : 'Usuario') + '</td><td style="white-space:nowrap;">' + agencyCell + '</td><td>' + timeAgo(u.createdAt) + '</td></tr>';
        }).join('') + '</tbody>';
      el.adminUsersTable.onclick = async function (e) {
        var act = e.target.closest('[data-agency-activate]');
        var clr = e.target.closest('[data-agency-clear]');
        if (act) {
          var uid = act.getAttribute('data-agency-activate');
          var sel = el.adminUsersTable.querySelector('.agency-months[data-for="' + uid + '"]');
          var months = Number(sel ? sel.value : 1);
          try { await api('PATCH', '/api/admin/users/' + uid + '/agency', { months: months }); showToast('Cuenta agencia activada por ' + months + ' meses.'); loadAdmin(); } catch (err) { showToast(err.message, 4500); }
          return;
        }
        if (clr) {
          try { await api('PATCH', '/api/admin/users/' + clr.getAttribute('data-agency-clear') + '/agency', { clear: true }); showToast('Se quitó la cuenta agencia.'); loadAdmin(); } catch (err) { showToast(err.message, 4500); }
        }
      };

      var listingsData = await api('GET', '/api/listings?sort=recientes');
      el.adminListings.innerHTML = listingsData.listings.map(function (l) {
        var featuredLine = l.featured
          ? '<span class="featured-tag" style="margin-left:0;">' + starIcon() + ' Destacado hasta ' + new Date(l.featuredUntil).toLocaleDateString('es-PY') + '</span>'
          : '';
        var verifiedLine = l.verified ? '<span class="verified-tag" style="margin-left:0;">' + checkIcon() + ' Verificado</span>' : '';
        return (
          '<div class="mini-row">' +
          '<div class="mini-thumb">' + (l.photos && l.photos[0] ? '<img src="' + l.photos[0] + '" alt="">' : pinIcon()) + '</div>' +
          '<div class="mini-info"><h4>' + esc(l.title) + '</h4><div class="mini-meta">' +
          '<span class="num">' + money(l.price, l.currency) + '</span><span>' + esc(l.zone) + ', ' + esc(countryLabel(l.country)) + '</span>' +
          '<span>por ' + esc(l.ownerLabel) + '</span>' +
          '<span class="badge ' + l.status + '">' + (l.status === 'vendido' ? 'Vendido' : 'Activo') + '</span></div>' +
          '<div style="margin-top:4px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">' + featuredLine +
          '<select class="feature-days" data-for="' + l.id + '" style="width:auto; padding:3px 6px; font-size:0.78rem;">' +
          '<option value="7">Destacar 7 días</option><option value="15">Destacar 15 días</option><option value="30">Destacar 30 días</option></select>' +
          '<button class="btn btn-sm btn-soft" data-feature="' + l.id + '">Aplicar</button>' +
          (l.featured ? '<button class="btn btn-sm btn-ghost" data-unfeature="' + l.id + '">Quitar destacado</button>' : '') +
          '</div>' +
          '<div style="margin-top:4px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">' + verifiedLine +
          (l.verified
            ? '<button class="btn btn-sm btn-ghost" data-unverify="' + l.id + '">Quitar verificación</button>'
            : '<button class="btn btn-sm btn-soft" data-verify="' + l.id + '">Marcar como verificado</button>') +
          '</div></div>' +
          '<div class="mini-actions">' +
          '<button class="btn btn-sm btn-ghost" data-open="' + l.id + '">Ver</button>' +
          '<button class="btn btn-sm btn-danger" data-admin-delete="' + l.id + '">Eliminar</button>' +
          '</div></div>'
        );
      }).join('');
      el.adminListings.onclick = async function (e) {
        var open = e.target.closest('[data-open]');
        var del = e.target.closest('[data-admin-delete]');
        var feat = e.target.closest('[data-feature]');
        var unfeat = e.target.closest('[data-unfeature]');
        var verify = e.target.closest('[data-verify]');
        var unverify = e.target.closest('[data-unverify]');
        if (open) { openDetail(Number(open.getAttribute('data-open'))); return; }
        if (del) {
          try { await api('DELETE', '/api/listings/' + del.getAttribute('data-admin-delete')); showToast('Lote eliminado.'); loadAdmin(); } catch (err) { showToast(err.message, 4500); }
          return;
        }
        if (feat) {
          var id = feat.getAttribute('data-feature');
          var sel = el.adminListings.querySelector('.feature-days[data-for="' + id + '"]');
          var days = Number(sel ? sel.value : 7);
          try { await api('PATCH', '/api/admin/listings/' + id + '/feature', { days: days }); showToast('Publicación destacada por ' + days + ' días.'); loadAdmin(); } catch (err) { showToast(err.message, 4500); }
          return;
        }
        if (unfeat) {
          try { await api('PATCH', '/api/admin/listings/' + unfeat.getAttribute('data-unfeature') + '/feature', { clear: true }); showToast('Se quitó el destacado.'); loadAdmin(); } catch (err) { showToast(err.message, 4500); }
          return;
        }
        if (verify) {
          try { await api('PATCH', '/api/admin/listings/' + verify.getAttribute('data-verify') + '/verify', { verified: true }); showToast('Publicación marcada como verificada.'); loadAdmin(); } catch (err) { showToast(err.message, 4500); }
          return;
        }
        if (unverify) {
          try { await api('PATCH', '/api/admin/listings/' + unverify.getAttribute('data-unverify') + '/verify', { verified: false }); showToast('Se quitó la verificación.'); loadAdmin(); } catch (err) { showToast(err.message, 4500); }
        }
      };
    } catch (err) {
      showBanner('No se pudo cargar el panel de administración: ' + err.message, true);
    }
  }
  function tile(n, label) {
    return '<div class="stat-tile"><div class="n num">' + n + '</div><div class="l">' + esc(label) + '</div></div>';
  }

  /* ---------------- Init ---------------- */
  updateAuthMode();
  /* ---------------- Footer ---------------- */
  var footerYearEl = document.getElementById('footerYear');
  if (footerYearEl) footerYearEl.textContent = new Date().getFullYear();
  document.querySelectorAll('[data-footer-tab]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      switchTab(a.getAttribute('data-footer-tab'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  refreshMe().then(function () { switchTab('explorar'); });
})();

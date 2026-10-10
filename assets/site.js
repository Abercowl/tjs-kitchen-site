/* TJ's Kitchen — tjskitchenvc.com
 *
 * ============================================================
 *  EDIT YOUR DETAILS HERE (this is the only place to change)
 * ============================================================
 *  Leave a value as '' to hide that line on the site.
 */
const SITE = {
  phone: '(805) 670-5686',
  email: 'tjskitchenvc0001@gmail.com',
  instagram: '',      // e.g. 'tjskitchenvc'  (handle only, no @)
  facebook: '',       // full link, e.g. 'https://facebook.com/...'
  // Exact spot of the TJ's Kitchen building. The map on the Contact page
  // puts the TJ pin here, and "Directions" routes people to this spot.
  mapPin: { lat: 34.20194, lng: -118.98951 },  // 34.20194° N, 118.98951° W
  orderUrl: 'https://order.tjskitchenvc.com',
  address: '791 Camarillo Springs Rd, Camarillo, CA 93012',
  placeName: 'Camarillo Springs Golf Course',
};

/* ------------------------------------------------------------
 * Live data: hours, open/closed and the menu come straight from
 * the same Supabase database your ordering site and admin portal
 * use, so this site never needs updating when the menu changes.
 * The key below is the PUBLIC (anon) key -- the same one already
 * in the ordering site and app. It can only read what customers
 * are allowed to see.
 * ------------------------------------------------------------ */
const SUPABASE_URL = 'https://djfdktbcdjbijnimjsgb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZmRrdGJjZGpiaWpuaW1qc2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MTc0NjMsImV4cCI6MjA5NjE5MzQ2M30.ee7T4MFUGD8Vtcx6tmTJMClFaYVBgtWqKQGu9z4i7CY';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function sb(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// "14:30:00" -> "2:30 PM"
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

// Everything is judged in California time, wherever the visitor is.
function pacificNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = t => parts.find(p => p.type === t).value;
  return {
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}
function toMin(t) { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; }

function inWindow(start, end, nowMin) {
  const s = toMin(start), e = toMin(end);
  if (s === null || e === null) return true;
  if (s === e) return true;
  return s < e ? (nowMin >= s && nowMin < e) : (nowMin >= s || nowMin < e);
}

// Same rules as the admin portal's "Accepting Orders" card.
function isOpenNow(settings, hours) {
  if (!settings) return null;
  if (!settings.schedule_enabled) return !!settings.is_accepting_orders;
  if (settings.override === 'force_open') return true;
  if (settings.override === 'force_closed') return false;
  const now = pacificNow();
  const today = hours.find(h => h.day_of_week === now.day);
  if (!today || !today.is_open) return false;
  return inWindow(today.open_time, today.close_time, now.minutes);
}

/* ---------- shared bits on every page ---------- */
function initChrome() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('open'));
  document.querySelectorAll('[data-order-link]').forEach(a => { a.href = SITE.orderUrl; });
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  document.querySelectorAll('[data-address]').forEach(el => { el.textContent = SITE.address; });
  renderContactBits();
}

function renderContactBits() {
  const items = [];
  if (SITE.phone) items.push(`<li><span class="ci">📞</span><div><strong>Phone</strong><br><a href="tel:${esc(SITE.phone.replace(/[^\d+]/g, ''))}">${esc(SITE.phone)}</a></div></li>`);
  if (SITE.email) items.push(`<li><span class="ci">✉️</span><div><strong>Email</strong><br><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></div></li>`);
  items.push(`<li><span class="ci">📍</span><div><strong>Find us</strong><br>${esc(SITE.placeName)}<br><span class="muted">${esc(SITE.address)}</span><br><a ${directionsAttrs()}>Get directions →</a></div></li>`);
  if (SITE.instagram) items.push(`<li><span class="ci">📸</span><div><strong>Instagram</strong><br><a href="https://instagram.com/${esc(SITE.instagram)}" target="_blank" rel="noopener">@${esc(SITE.instagram)}</a></div></li>`);
  if (SITE.facebook) items.push(`<li><span class="ci">👍</span><div><strong>Facebook</strong><br><a href="${esc(SITE.facebook)}" target="_blank" rel="noopener">Follow us</a></div></li>`);
  if (!SITE.phone && !SITE.email) items.push(`<li><span class="ci">💬</span><div class="muted">Phone and email coming soon. The fastest way to reach us right now is to stop by the window or order online.</div></li>`);
  document.querySelectorAll('[data-contact-list]').forEach(el => { el.innerHTML = items.join(''); });
}

/* ---------- hours + open/closed (home & contact) ---------- */
async function initHours() {
  const tables = document.querySelectorAll('[data-hours]');
  const pills = document.querySelectorAll('[data-status]');
  if (!tables.length && !pills.length) return;
  try {
    const [settingsRows, hours] = await Promise.all([
      sb('store_settings?id=eq.1&select=is_accepting_orders,schedule_enabled,override,closed_message'),
      sb('store_hours?select=day_of_week,is_open,open_time,close_time&order=day_of_week'),
    ]);
    const settings = settingsRows[0] || null;
    const today = pacificNow().day;
    const rows = [1, 2, 3, 4, 5, 6, 0].map(d => {
      const h = hours.find(x => x.day_of_week === d);
      const val = !h || !h.is_open ? 'Closed' : `${fmtTime(h.open_time)} – ${fmtTime(h.close_time)}`;
      return `<tr class="${d === today ? 'today' : ''}"><td>${DAY_NAMES[d]}</td><td>${val}</td></tr>`;
    }).join('');
    tables.forEach(t => { t.innerHTML = hours.length ? rows : '<tr><td class="muted">Hours coming soon.</td></tr>'; });

    const open = isOpenNow(settings, hours);
    pills.forEach(p => {
      if (open === null) { p.style.display = 'none'; return; }
      p.classList.add(open ? 'open' : 'closed');
      p.querySelector('[data-status-text]').textContent = open
        ? 'Open now — taking orders'
        : (settings.closed_message || 'Closed right now');
    });
  } catch (e) {
    console.warn('Hours unavailable:', e);
    tables.forEach(t => { t.innerHTML = '<tr><td class="muted">See current hours on our <a data-order-link href="' + SITE.orderUrl + '">ordering page</a>.</td></tr>'; });
    pills.forEach(p => { p.style.display = 'none'; });
  }
}

/* ---------- menu page ---------- */
async function initMenu() {
  const root = document.getElementById('menu-root');
  if (!root) return;
  try {
    const [cats, items] = await Promise.all([
      sb('menu_categories?select=id,name,description,display_order,is_active,visible_start_time,visible_end_time&is_active=eq.true&order=display_order'),
      sb('menu_items?select=id,name,description,price,image_url,category_id,is_hidden,is_sold_out&is_hidden=eq.false&order=name'),
    ]);
    const byCat = {};
    items.forEach(i => { (byCat[i.category_id] = byCat[i.category_id] || []).push(i); });
    const shown = cats.filter(c => (byCat[c.id] || []).length);
    if (!shown.length) {
      root.innerHTML = '<div class="menu-status">Our menu is being updated — check back soon, or <a data-order-link href="' + SITE.orderUrl + '">order online</a>.</div>';
      return;
    }
    const slug = c => 'cat-' + c.id;
    document.getElementById('cat-tabs').innerHTML = shown.map(c => `<a href="#${slug(c)}">${esc(c.name)}</a>`).join('');
    root.innerHTML = shown.map(c => {
      const when = c.visible_start_time && c.visible_end_time ? `<span class="when">Served ${fmtTime(c.visible_start_time)} – ${fmtTime(c.visible_end_time)}</span>` : '';
      const dishes = byCat[c.id].map(i => {
        const img = i.image_url
          ? `<img class="dish-img" src="${esc(i.image_url)}" alt="${esc(i.name)}" loading="lazy">`
          : '<div class="dish-img placeholder">🍽️</div>';
        const price = Number(i.price) ? `$${Number(i.price).toFixed(2)}` : '';
        return `<article class="dish">${img}<div class="dish-body">
            <div class="dish-name">${esc(i.name)}</div>
            ${i.description ? `<div class="dish-desc">${esc(i.description)}</div>` : ''}
            <div class="dish-foot"><span class="price">${price}</span>${i.is_sold_out ? '<span class="tag tag-soldout">Sold out</span>' : ''}</div>
          </div></article>`;
      }).join('');
      return `<section class="menu-cat" id="${slug(c)}"><h2>${esc(c.name)} ${when}</h2>
        ${c.description ? `<p class="muted">${esc(c.description)}</p>` : ''}
        <div class="menu-grid">${dishes}</div></section>`;
    }).join('');
  } catch (e) {
    console.warn('Menu unavailable:', e);
    root.innerHTML = '<div class="menu-status">Couldn\'t load the menu right now. You can always see it on our <a href="' + SITE.orderUrl + '">ordering page</a>.</div>';
  }
}


/* ---------- Map (contact page) ----------
 * A dark street map (no satellite), centered on the building, with our
 * own gold "TJ" pin. Uses free OpenStreetMap tiles -- no API key, no
 * account. Leaflet draws it.
 */
function appleMapsDirectionsUrl() {
  const dest = SITE.mapPin ? `${SITE.mapPin.lat},${SITE.mapPin.lng}` : encodeURIComponent(SITE.address);
  return `https://maps.apple.com/?daddr=${dest}&dirflg=d`;
}
function googleMapsDirectionsUrl() {
  const dest = SITE.mapPin ? `${SITE.mapPin.lat},${SITE.mapPin.lng}` : encodeURIComponent(SITE.address);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

/* ---------- Directions in the visitor's own maps app ----------
 * iPhone / iPad / Mac -> Apple Maps app
 * Android             -> a standard "geo:" location link, which Android
 *                        hands to the visitor's DEFAULT maps app (Google
 *                        Maps, Waze, ...). If they never picked a default,
 *                        Android asks which app to use.
 * Everything else     -> Google Maps in the browser (Windows, Chromebook)
 * Every option points at the exact building pin.
 */
function visitorPlatform() {
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  // iPads report themselves as Macs; both should use Apple Maps anyway.
  if (/iphone|ipad|ipod|macintosh|mac os x/i.test(ua)) return 'apple';
  return 'other';
}
function directionsUrl() {
  const p = visitorPlatform();
  if (p === 'apple') return appleMapsDirectionsUrl();
  if (p === 'android') {
    const label = encodeURIComponent("TJ's Kitchen");
    return SITE.mapPin
      ? `geo:${SITE.mapPin.lat},${SITE.mapPin.lng}?q=${SITE.mapPin.lat},${SITE.mapPin.lng}(${label})`
      : `geo:0,0?q=${encodeURIComponent(SITE.address)}`;
  }
  return googleMapsDirectionsUrl();
}
// href + target attributes for a directions link. App links (geo:) must open
// in the same tab or Android shows a blank page first.
function directionsAttrs() {
  const url = directionsUrl();
  return url.startsWith('geo:')
    ? `href="${url}"`
    : `href="${url}" target="_blank" rel="noopener"`;
}

function showMapCard(el) {
  el.classList.add('map-card');
  el.innerHTML = `
    <div class="map-card-inner">
      <div class="map-pin">📍</div>
      <div class="map-card-title">TJ's Kitchen</div>
      <div class="muted">${esc(SITE.placeName)}<br>${esc(SITE.address)}</div>
      <div class="hero-actions" style="margin-top:18px">
        <a class="btn" ${directionsAttrs()}>Directions</a>
      </div>
    </div>`;
}

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    js.onload = () => resolve(window.L);
    js.onerror = reject;
    document.head.appendChild(js);
  });
}

async function initAppleMap() {
  const el = document.getElementById('apple-map');
  if (!el) return;
  if (!SITE.mapPin) { showMapCard(el); return; }
  try {
    const L = await loadLeaflet();
    const pin = [SITE.mapPin.lat, SITE.mapPin.lng];
    const map = L.map(el, { center: pin, zoom: 16, scrollWheelZoom: false, attributionControl: true });
    // Standard OpenStreetMap street tiles: free, no API key. style.css turns
    // them dark to match the site (see .tj-dark-tiles).
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'tj-dark-tiles',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(map);
    const icon = L.divIcon({
      className: 'tj-pin',
      html: '<div class="tj-pin-badge"><img src="/assets/logo-pin.png" alt="TJ\'s Kitchen"></div><div class="tj-pin-tip"></div>',
      iconSize: [60, 74],
      iconAnchor: [30, 74],
      popupAnchor: [0, -70],
    });
    L.marker(pin, { icon, title: "TJ's Kitchen" }).addTo(map)
      .bindPopup(`<strong>TJ's Kitchen</strong><br>${esc(SITE.placeName)}<br>
        <a ${directionsAttrs()}>Get directions</a>`);
    // Directions button floating on the map
    const bar = document.createElement('a');
    bar.className = 'btn btn-sm map-directions';
    bar.href = directionsUrl();
    if (!bar.href.startsWith('geo:')) { bar.target = '_blank'; bar.rel = 'noopener'; }
    bar.textContent = 'Directions →';
    el.appendChild(bar);
  } catch (e) {
    console.warn('Map unavailable:', e);
    showMapCard(el);
  }
}

document.addEventListener('DOMContentLoaded', () => { initChrome(); initHours(); initMenu(); initAppleMap(); });

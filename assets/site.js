/* TJ's Kitchen — tjskitchenvc.com
 *
 * FILE:  tjs-kitchen-site/assets/site.js
 *   tjs-kitchen-site/
 *   ├── index.html, menu.html, events.html, about.html, contact.html, 404.html
 *   ├── unsubscribe.html
 *   └── assets/
 *       ├── site.js     <-- THIS FILE
 *       └── style.css
 *
 * UPDATE (Nov 9 2026, later): the sign-up band at the bottom of every
 * page asks for name, mobile number and email. Email -> email list
 * (email_subscribe). Mobile -> texted specials (sms_specials_signup,
 * double opt-in: they reply JOIN), only if they tick the separate texting
 * box, which appears once they type a number. Name + email or mobile.
 *
 * UPDATE (Nov 9 2026): special days (admin -> Store -> Special days,
 * table store_special_days). Hours on the home/contact pages list the
 * next few special days under the weekly hours, and the Specials &
 * Events calendar shows that day's own hours (or "closed") instead of
 * the usual weekday hours. The weekly table always shows REGULAR hours.
 *
 * UPDATE (Nov 8 2026): events can link to a web page (events.link_url) --
 * the title and a "Details & sign-up" link open it.
 *
 * UPDATE (Nov 8 2026): menu items follow the admin portal's order
 * (display_order), not A-Z.
 *
 * UPDATE (Nov 7 2026): website editor -- headings, paragraphs, button
 * labels and pictures can be changed in the admin portal -> Website
 * (see "Website editor" below).
 *
 * ============================================================
 *  EDIT YOUR DETAILS HERE (this is the only place to change)
 * ============================================================
 *  Leave a value as '' to hide that line on the site.
 */
const SITE = {
  phone: '(805) 670-5686',
  email: 'tjskitchen0001@gmail.com',
  instagram: '',      // e.g. 'tjskitchenvc'  (handle only, no @)
  facebook: '',       // full link, e.g. 'https://facebook.com/...'
  // Exact spot of the TJ's Kitchen building. The map on the Contact page
  // puts the TJ pin here, and "Directions" routes people to this spot.
  mapPin: { lat: 34.20194, lng: -118.98951 },  // 34.20194° N, 118.98951° W
  orderUrl: 'https://order.tjskitchenvc.com',
  // Camarillo Springs' own tee sheet (TeeItUp -- GolfNow's booking engine).
  // The Events calendar adds &date=YYYY-MM-DD so it opens on that day.
  teeTimesUrl: 'https://camarillo-springs-golf-course.book.teeitup.com/?course=4796&max=999999',
  // Days the course runs its drink cart (0 = Sun ... 6 = Sat). Shown in the
  // day box on the Specials & Events page. Nov 8 2026: Thursday-Sunday.
  drinkCartDays: [4, 5, 6, 0],
  address: '791 Camarillo Springs Rd, Camarillo, CA 93012',
  placeName: 'Camarillo Springs Golf Course',
  windowSpot: 'Our trailer is at the 11th green',  // shown under the address
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

// Calls a public database function (email sign-up / unsubscribe).
async function sbRpc(fn, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`${res.status} ${fn}`);
  return res.json();
}

/* Line icons -- the same set as the ordering site (components/Icon.js).
 * Never emoji: they look different on every phone. */
const ICONS = {
  cup: '<path d="M6 4h12l-1.5 16a1 1 0 0 1-1 .9h-7a1 1 0 0 1-1-.9z"/><path d="M6.6 9h10.8"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  "arrowRight": "<path d=\"M5 12h14\"/><path d=\"M13 6l6 6-6 6\"/>",
  "phone": "<path d=\"M5 4h3l1.5 4.5-2 1.2a11 11 0 0 0 6.8 6.8l1.2-2L20 16v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z\"/>",
  "mail": "<rect x=\"3\" y=\"5.5\" width=\"18\" height=\"13\" rx=\"2\"/><path d=\"M3.5 7l8.5 6 8.5-6\"/>",
  "pin": "<path d=\"M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z\"/><circle cx=\"12\" cy=\"9.5\" r=\"2.5\"/>",
  "camera": "<rect x=\"3.5\" y=\"3.5\" width=\"17\" height=\"17\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M17.2 6.8h.01\"/>",
  "thumbsUp": "<path d=\"M7 10v11H4V10z\"/><path d=\"M7 10l4-7a2 2 0 0 1 2.5 1.8L13 9h5.5a2 2 0 0 1 2 2.3l-1.3 7.5a2 2 0 0 1-2 1.7H7\"/>",
  "chat": "<path d=\"M4 5h16v11H9l-5 4z\"/>",
  "utensils": "<path d=\"M4 3v6a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V3\"/><path d=\"M6.5 3v18\"/><path d=\"M19 15V3a4 4 0 0 0-4 4v6a2 2 0 0 0 2 2h2zm0 0v6\"/>",
  "flag": "<path d=\"M7 21V3.5\"/><path d=\"M7 4l10 3.6L7 11.2\"/><path d=\"M3.5 21h7\"/>"
};
// "Weekends only" items (Nov 6 2026): menu_items.available_days, 0 = Sun ... 6 = Sat.
// Blank = every day. Same wording as the ordering site (lib/menuDays.js).
function daysTag(item) {
  const d = Array.isArray(item.available_days) ? [...new Set(item.available_days.map(Number))].filter(x => x >= 0 && x <= 6) : [];
  if (!d.length || d.length === 7) return null;
  const same = a => a.length === d.length && a.every(x => d.includes(x));
  if (same([0, 6])) return 'Weekends only';
  if (same([1, 2, 3, 4, 5])) return 'Weekdays only';
  const LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (d.length === 1) return LONG[d[0]] + 's only';
  const n = d.sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(x => SHORT[x]);
  return n.slice(0, -1).join(', ') + ' & ' + n[n.length - 1] + ' only';
}

// Category version: "Open weekends", "Open Saturdays", "Open Fri, Sat & Sun".
function openDaysTag(cat) {
  const t = daysTag(cat);
  if (!t) return null;
  const base = t.replace(/ only$/, '');
  return 'Open ' + (base === 'Weekends' || base === 'Weekdays' ? base.toLowerCase() : base);
}

function icon(name) { return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`; }

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

// Special days (Nov 9 2026). While a special day is running, that
// weekday's store_hours row holds the special hours and the regular ones
// are in base_*; this gives back the regular weekly hours.
const HOURS_SELECT = 'day_of_week,is_open,open_time,close_time,special_day,base_is_open,base_open_time,base_close_time';
const regularHours = hours => hours.map(h => h.special_day
  ? { ...h, is_open: h.base_is_open, open_time: h.base_open_time, close_time: h.base_close_time } : h);
// Today's date in California, YYYY-MM-DD.
const pacificDateKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
// Upcoming special days; [] if the table isn't there or can't be read.
async function loadSpecialDays(fromKey, limit = 60) {
  try { return (await sb(`store_special_days?select=day,is_open,open_time,close_time,note&day=gte.${fromKey}&order=day&limit=${limit}`)) || []; }
  catch (e) { return []; }
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
  if (SITE.phone) items.push(`<li><span class="ci">${icon('phone')}</span><div><strong>Phone</strong><br><a href="tel:${esc(SITE.phone.replace(/[^\d+]/g, ''))}">${esc(SITE.phone)}</a></div></li>`);
  if (SITE.email) items.push(`<li><span class="ci">${icon('mail')}</span><div><strong>Email</strong><br><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></div></li>`);
  items.push(`<li><span class="ci">${icon('pin')}</span><div><strong>Find us</strong><br>${esc(SITE.placeName)}<br><span class="muted">${esc(SITE.address)}</span><br>${SITE.windowSpot ? `<span class="muted ci-inline">${icon('flag')} ${esc(SITE.windowSpot)}</span><br>` : ''}<a ${directionsAttrs()}>Get directions ${icon('arrowRight')}</a></div></li>`);
  if (SITE.instagram) items.push(`<li><span class="ci">${icon('camera')}</span><div><strong>Instagram</strong><br><a href="https://instagram.com/${esc(SITE.instagram)}" target="_blank" rel="noopener">@${esc(SITE.instagram)}</a></div></li>`);
  if (SITE.facebook) items.push(`<li><span class="ci">${icon('thumbsUp')}</span><div><strong>Facebook</strong><br><a href="${esc(SITE.facebook)}" target="_blank" rel="noopener">Follow us</a></div></li>`);
  if (!SITE.phone && !SITE.email) items.push(`<li><span class="ci">${icon('chat')}</span><div class="muted">Phone and email coming soon. The fastest way to reach us right now is to stop by the trailer or order online.</div></li>`);
  document.querySelectorAll('[data-contact-list]').forEach(el => { el.innerHTML = items.join(''); });
}

/* ---------- hours + open/closed (home & contact) ---------- */
async function initHours() {
  const tables = document.querySelectorAll('[data-hours]');
  const pills = document.querySelectorAll('[data-status]');
  if (!tables.length && !pills.length) return;
  try {
    const [settingsRows, hours, specials] = await Promise.all([
      sb('store_settings?id=eq.1&select=is_accepting_orders,schedule_enabled,override,closed_message'),
      sb(`store_hours?select=${HOURS_SELECT}&order=day_of_week`),
      loadSpecialDays(pacificDateKey(), 4),
    ]);
    const settings = settingsRows[0] || null;
    const today = pacificNow().day;
    const weekly = regularHours(hours);
    const rows = [1, 2, 3, 4, 5, 6, 0].map(d => {
      const h = weekly.find(x => x.day_of_week === d);
      const val = !h || !h.is_open ? 'Closed' : `${fmtTime(h.open_time)} – ${fmtTime(h.close_time)}`;
      return `<tr class="${d === today ? 'today' : ''}"><td>${DAY_NAMES[d]}</td><td>${val}</td></tr>`;
    }).join('');
    tables.forEach(t => { t.innerHTML = hours.length ? rows : '<tr><td class="muted">Hours coming soon.</td></tr>'; });
    // Special days coming up (only while the weekly schedule is in use).
    const todayKey = pacificDateKey();
    const special = settings && settings.schedule_enabled && hours.length ? specials.filter(s => s.day >= todayKey) : [];
    tables.forEach(t => {
      const table = t.closest('table');
      let note = table.nextElementSibling;
      if (!note || !note.matches('.special-hours')) { note = document.createElement('div'); note.className = 'special-hours'; table.after(note); }
      note.hidden = !special.length;
      note.innerHTML = special.length ? '<strong>Special hours</strong><ul>' + special.map(s => {
        const day = s.day === todayKey ? 'Today' : new Date(s.day + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
        const val = s.is_open ? `${fmtTime(s.open_time)} – ${fmtTime(s.close_time)}` : 'Closed';
        return `<li><span>${esc(day)}${s.note ? ' · ' + esc(s.note) : ''}</span><span>${val}</span></li>`;
      }).join('') + '</ul>' : '';
    });

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
      sb('menu_categories?select=id,name,description,display_order,is_active,visible_start_time,visible_end_time,available_days&is_active=eq.true&order=display_order'),
      // Same order as the admin portal (Categories -> Manage Items), then A-Z --
      // matches the ordering site and the Apple TV. (Was A-Z only; Nov 8 2026.)
      sb('menu_items?select=id,name,description,price,image_url,category_id,is_hidden,is_sold_out,available_days&is_hidden=eq.false&order=display_order,name'),
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
          : `<div class="dish-img placeholder">${icon('utensils')}</div>`;
        const price = Number(i.price) ? `$${Number(i.price).toFixed(2)}` : '';
        return `<article class="dish">${img}<div class="dish-body">
            <div class="dish-name">${esc(i.name)}</div>
            ${i.description ? `<div class="dish-desc">${esc(i.description)}</div>` : ''}
            <div class="dish-foot"><span class="price">${price}</span>${i.is_sold_out ? '<span class="tag tag-soldout">Sold out</span>' : ''}${daysTag(i) ? `<span class="tag tag-days">${esc(daysTag(i))}</span>` : ''}</div>
          </div></article>`;
      }).join('');
      // Category open only on some days (admin: Categories -> Days it's open)
      const open = openDaysTag(c);
      const openTag = open ? `<span class="tag tag-days">${esc(open)}</span>` : '';
      return `<section class="menu-cat" id="${slug(c)}"><h2>${esc(c.name)} ${openTag} ${when}</h2>
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
      <div class="map-pin">${icon('pin')}</div>
      <div class="map-card-title">TJ's Kitchen</div>
      <div class="muted">${esc(SITE.placeName)}<br>${esc(SITE.address)}${SITE.windowSpot ? '<br>' + esc(SITE.windowSpot) : ''}</div>
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
    const pinIcon = L.divIcon({  // (named pinIcon so it doesn't hide icon() above)
      className: 'tj-pin',
      html: '<div class="tj-pin-badge"><img src="/assets/logo-pin.png" alt="TJ\'s Kitchen"></div><div class="tj-pin-tip"></div>',
      iconSize: [60, 74],
      iconAnchor: [30, 74],
      popupAnchor: [0, -70],
    });
    L.marker(pin, { icon: pinIcon, title: "TJ's Kitchen" }).addTo(map)
      .bindPopup(`<strong>TJ's Kitchen</strong><br>${esc(SITE.placeName)}<br>${SITE.windowSpot ? esc(SITE.windowSpot) + '<br>' : ''}
        <a ${directionsAttrs()}>Get directions</a>`);
    // Directions button floating on the map
    const bar = document.createElement('a');
    bar.className = 'btn btn-sm map-directions';
    bar.href = directionsUrl();
    if (!bar.href.startsWith('geo:')) { bar.target = '_blank'; bar.rel = 'noopener'; }
    bar.innerHTML = 'Directions ' + icon('arrowRight');
    el.appendChild(bar);
  } catch (e) {
    console.warn('Map unavailable:', e);
    showMapCard(el);
  }
}


/* ------------------------------------------------------------
 * Events (Nov 2026) -- added in the admin portal -> Calendar.
 * /events shows a month calendar plus the list; the home page
 * shows the next three (and stays hidden when there are none).
 * Times are California time, wherever the visitor is.
 * ------------------------------------------------------------ */
const EV_TZ = 'America/Los_Angeles';
const evParts = (d, opts) => Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: EV_TZ, ...opts }).formatToParts(new Date(d)).map(p => [p.type, p.value]));
const evDayKey = d => { const p = evParts(d, { year: 'numeric', month: '2-digit', day: '2-digit' }); return `${p.year}-${p.month}-${p.day}`; };
const evFmt = (d, opts) => new Date(d).toLocaleString('en-US', { timeZone: EV_TZ, ...opts });

function evWhen(e) {
  const day = d => evFmt(d, { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d => evFmt(d, { hour: 'numeric', minute: '2-digit' });
  const multi = e.ends_at && evDayKey(e.ends_at) !== evDayKey(e.starts_at);
  if (e.all_day) return multi ? `${day(e.starts_at)} – ${day(e.ends_at)}` : `${day(e.starts_at)} · All day`;
  if (multi) return `${day(e.starts_at)}, ${time(e.starts_at)} – ${day(e.ends_at)}, ${time(e.ends_at)}`;
  return `${day(e.starts_at)} · ${time(e.starts_at)}${e.ends_at ? ' – ' + time(e.ends_at) : ''}`;
}

// Every day key an event covers (multi-day events show on each day).
function evDays(e) {
  const out = [];
  const end = new Date(e.ends_at || e.starts_at).getTime();
  for (let t = new Date(e.starts_at).getTime(); t <= end + 1 && out.length < 62; t += 86400000) out.push(evDayKey(t));
  const last = evDayKey(end);
  if (!out.includes(last)) out.push(last);
  return out;
}

// "Add to calendar" -- a small .ics file the phone's calendar opens.
function evIcs(e) {
  const stamp = d => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dateOnly = d => evDayKey(d).replace(/-/g, '');
  const clean = t => String(t || '').replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\r?\n/g, '\\n');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TJs Kitchen//Events//EN', 'BEGIN:VEVENT',
    `UID:${e.id}@tjskitchenvc.com`, `DTSTAMP:${stamp(Date.now())}`];
  if (e.all_day) {
    const endNext = new Date(new Date(e.ends_at || e.starts_at).getTime() + 86400000);
    lines.push(`DTSTART;VALUE=DATE:${dateOnly(e.starts_at)}`, `DTEND;VALUE=DATE:${dateOnly(endNext)}`);
  } else {
    lines.push(`DTSTART:${stamp(e.starts_at)}`, `DTEND:${stamp(e.ends_at || new Date(new Date(e.starts_at).getTime() + 3600000))}`);
  }
  lines.push(`SUMMARY:${clean(e.title)}`, `LOCATION:${clean(e.location || "TJ's Kitchen, " + SITE.address)}`);
  if (e.description) lines.push(`DESCRIPTION:${clean(e.description)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'));
}

// Event web link (admin: Calendar -> event -> Link, Nov 8 2026). Only
// plain http(s) addresses are ever used.
function evLink(e) {
  const u = String(e.link_url || '').trim();
  return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : '';
}

function evCard(e) {
  const mon = evFmt(e.starts_at, { month: 'short' });
  const day = evFmt(e.starts_at, { day: 'numeric' });
  const file = String(e.title).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'event';
  return `<article class="event" id="event-${esc(e.id)}" data-days="${evDays(e).join(' ')}">
    <div class="event-date"><span>${esc(mon)}</span><strong>${esc(day)}</strong></div>
    <div class="event-body">
      <div class="event-title">${evLink(e) ? `<a href="${esc(evLink(e))}" target="_blank" rel="noopener">${esc(e.title)}</a>` : esc(e.title)}</div>
      <div class="event-when">${esc(evWhen(e))}</div>
      ${e.location ? `<div class="event-where">${esc(e.location)}</div>` : ''}
      ${e.description ? `<div class="event-desc">${esc(e.description)}</div>` : ''}
      <div class="event-links">
        ${evLink(e) ? `<a class="event-more" href="${esc(evLink(e))}" target="_blank" rel="noopener">Details &amp; sign-up ${icon('external')}</a>` : ''}
        <a class="event-add" href="${evIcs(e)}" download="${esc(file)}.ics">+ Add to my calendar</a>
      </div>
    </div>
  </article>`;
}

async function loadPublicEvents() {
  const since = new Date(Date.now() - 120 * 86400000).toISOString();
  return sb(`events?select=id,title,description,location,starts_at,ends_at,all_day,link_url&is_published=eq.true&or=(starts_at.gte.${since},ends_at.gte.${since})&order=starts_at&limit=500`);
}

async function initEvents() {
  const page = document.querySelector('[data-events]');
  const teaser = document.querySelector('[data-events-teaser]');
  if (!page && !teaser) return;
  let events = [], hours = [], dayItems = [], specialDays = [], scheduleOn = true;
  const [evR, hrR, itR, catR, spR, stR] = await Promise.allSettled([
    loadPublicEvents(),
    page ? sb(`store_hours?select=${HOURS_SELECT}`) : Promise.resolve([]),
    // Items only served on certain days (admin: "Days it can be ordered")
    page ? sb('menu_items?select=name,price,available_days&is_hidden=eq.false&is_available=eq.true&available_days=not.is.null&order=display_order,name') : Promise.resolve([]),
    page ? sb('menu_categories?select=name,available_days&is_active=eq.true&available_days=not.is.null&order=display_order') : Promise.resolve([]),
    page ? loadSpecialDays(new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10), 400) : Promise.resolve([]),
    page ? sb('store_settings?id=eq.1&select=schedule_enabled') : Promise.resolve([]),
  ]);
  if (spR.status === 'fulfilled') specialDays = spR.value || [];
  if (stR.status === 'fulfilled' && stR.value && stR.value[0]) scheduleOn = !!stR.value[0].schedule_enabled;
  if (evR.status === 'fulfilled') events = evR.value || []; else console.warn('Events unavailable:', evR.reason);
  if (hrR.status === 'fulfilled') hours = regularHours(hrR.value || []);
  const dayCats = catR.status === 'fulfilled' ? (catR.value || []).filter(c => Array.isArray(c.available_days) && c.available_days.length && c.available_days.length < 7) : [];
  if (itR.status === 'fulfilled') dayItems = (itR.value || []).filter(i => Array.isArray(i.available_days) && i.available_days.length && i.available_days.length < 7);
  events.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  const now = Date.now();
  const upcoming = events.filter(e => new Date(e.ends_at || e.starts_at).getTime() >= now);

  if (teaser) {
    const list = teaser.querySelector('[data-event-teaser-list]');
    if (upcoming.length) { list.innerHTML = upcoming.slice(0, 3).map(evCard).join(''); teaser.hidden = false; }
  }
  if (!page) return;

  // The line under "Events" is set in the admin (Calendar -> Events page intro).
  // Blank there = keep the wording written in events.html.
  const intro = document.querySelector('[data-events-intro]');
  if (intro) sb('store_settings?id=eq.1&select=events_intro')
    .then(([st]) => { if (st && st.events_intro && st.events_intro.trim()) intro.textContent = st.events_intro.trim(); })
    .catch(() => {});

  const listEl = page.querySelector('[data-event-list]');
  const dayCard = page.querySelector('[data-day-card]');
  const dowOf = key => new Date(key + 'T12:00:00Z').getUTCDay();
  // Closed days (Nov 7 2026): if store_hours says we're closed that weekday
  // (e.g. Tue/Wed), nothing is served -- no "X is open" or day-only items,
  // and no dot on the calendar, even if a category is set to "weekdays".
  // Special days (Nov 9 2026) replace the weekday's hours for that date.
  const specialOn = key => scheduleOn ? specialDays.find(s => s.day === key) : undefined;
  const hoursOn = key => specialOn(key) || hours.find(x => x.day_of_week === dowOf(key));
  const closedOn = key => { const h = hoursOn(key); return hours.length > 0 && (!h || !h.is_open); };
  const itemsOn = key => closedOn(key) ? [] : dayItems.filter(i => i.available_days.map(Number).includes(dowOf(key)));
  const catsOn = key => closedOn(key) ? [] : dayCats.filter(c => c.available_days.map(Number).includes(dowOf(key)));
  const heading = page.querySelector('[data-events-heading]');
  const daysEl = page.querySelector('[data-cal-days]');
  const titleEl = page.querySelector('[data-cal-title]');
  const byDay = new Map();
  events.forEach(e => evDays(e).forEach(k => { if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(e); }));

  const todayKey = evDayKey(now);
  let [y, m] = todayKey.split('-').map(Number); // month shown (1-12)
  let selKey = todayKey; // the day shown in the day card

  // The day card (Nov 6 2026): hours, what's served that day, and a link
  // straight to the course's tee sheet for that date.
  function renderDayCard(key) {
    if (!dayCard) return;
    const dow = dowOf(key);
    const label = key === todayKey ? 'Today · ' + evFmt(key + 'T12:00:00Z', { weekday: 'long', month: 'long', day: 'numeric' })
      : evFmt(key + 'T12:00:00Z', { weekday: 'long', month: 'long', day: 'numeric' });
    const h = hoursOn(key);
    const sp = specialOn(key);
    const hoursText = !hours.length ? '' : (sp && sp.note ? sp.note + ': ' : sp ? 'Special hours: ' : '')
      + (!h || !h.is_open ? 'Kitchen closed' : `Kitchen open ${fmtTime(h.open_time)} – ${fmtTime(h.close_time)}`);
    const specials = itemsOn(key);
    // Nov 8 2026: categories open only some days (e.g. TJ's Cafe) are no
    // longer listed separately here -- they're part of the regular menu.
    const openCats = [];
    const past = key < todayKey;
    const tee = SITE.teeTimesUrl + (SITE.teeTimesUrl.includes('?') ? '&' : '?') + 'date=' + key;
    dayCard.innerHTML = `<div class="day-card-head">
        <div><div class="eyebrow">${past ? 'Past day' : 'Plan your round'}</div><h3 class="day-card-title">${esc(label)}</h3>
        ${hoursText ? `<div class="day-card-hours">${icon('flag')} ${esc(hoursText)}</div>` : ''}
        ${(SITE.drinkCartDays || []).includes(dow) ? `<div class="day-card-hours">${icon('cup')} Drink cart out on the course</div>` : ''}</div>
      </div>
      ${closedOn(key) ? `<div class="day-card-menu"><div class="day-card-sub">TJ's Kitchen is closed</div><p class="small muted">We're closed on this day${sp && sp.note ? ' (' + esc(sp.note) + ')' : ''}. The course is still open for tee times.</p></div>` : `<div class="day-card-menu">
        <div class="day-card-sub">${specials.length || openCats.length ? 'Only on this day' : 'On the menu'}</div>
        ${openCats.length ? `<ul class="day-specials">${openCats.map(c => `<li><span>${esc(c.name)} is open</span><span class="tag tag-days">${esc(openDaysTag(c))}</span></li>`).join('')}</ul>` : ''}
        ${specials.length
          ? `<ul class="day-specials">${specials.map(i => `<li><span>${esc(i.name)}</span><span class="price">$${Number(i.price).toFixed(2)}</span></li>`).join('')}</ul>
             <p class="small muted">Plus everything on our <a href="https://order.tjskitchenvc.com/menu">regular menu</a>.</p>`
          : `<p class="small muted">${openCats.length ? 'Plus our' : 'Our'} <a href="https://order.tjskitchenvc.com/menu">regular menu</a>.</p>`}
      </div>`}
      ${past ? '' : `<div class="day-card-actions">
        <a class="btn" href="${esc(tee)}" target="_blank" rel="noopener">Book a tee time ${icon('arrowRight')}</a>
        ${key === todayKey ? `<a class="btn btn-outline" href="${SITE.orderUrl}">Order food</a>` : ''}
      </div>`}`;
  }

  function showList(items, title) {
    heading.textContent = title;
    listEl.innerHTML = items.length ? items.map(evCard).join('')
      : `<p class="muted">Nothing on the calendar yet — check back soon, or follow along on our <a href="/">home page</a>.</p>`;
  }

  // One week of events (Nov 8 2026): the list under the calendar shows the
  // 7 days starting at the selected day (today when the page opens, the
  // 1st when you move to another month), not everything coming up.
  const addDays = (key, n) => { const d = new Date(key + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  function showWeek(startKey) {
    const endKey = addDays(startKey, 6);
    const inWeek = events.filter(e => evDays(e).some(k => k >= startKey && k <= endKey));
    const fmt = k => evFmt(k + 'T12:00:00Z', { month: 'short', day: 'numeric' });
    const title = (startKey === todayKey ? 'This week' : 'Week of ' + fmt(startKey)) + ' · ' + fmt(startKey) + ' – ' + fmt(endKey);
    heading.textContent = title;
    listEl.innerHTML = inWeek.length ? inWeek.map(evCard).join('')
      : '<p class="muted">Nothing on the calendar this week.</p>';
  }

  function renderMonth() {
    const first = new Date(Date.UTC(y, m - 1, 1));
    const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
    titleEl.textContent = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    let html = '';
    for (let i = 0; i < first.getUTCDay(); i++) html += '<div class="cal-day blank"></div>';
    for (let d = 1; d <= daysIn; d++) {
      const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const evs = byDay.get(key) || [];
      // Nov 8 2026: the dot marks every day the kitchen is OPEN (store_hours).
      const special = hours.length > 0 && !closedOn(key);
      const cls = ['cal-day', key === todayKey ? 'today' : '', evs.length ? 'has' : '', key < todayKey ? 'past' : '', special ? 'special' : '', key === selKey ? 'sel' : ''].join(' ');
      const label = `${first.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })} ${d}${evs.length ? ', ' + evs.length + ' event' + (evs.length > 1 ? 's' : '') : ''}${special ? ', TJ\'s Kitchen open' : ''}`;
      // Every day can be tapped: shows what's served + the tee-time link.
      html += `<button type="button" class="${cls}" data-day="${key}" aria-label="${esc(label)}"><span class="num">${d}${special ? '<i class="cal-dot" aria-hidden="true"></i>' : ''}</span>${evs.slice(0, 2).map(e => `<span class="cal-chip">${esc(e.title)}</span>`).join('')}${evs.length > 2 ? `<span class="cal-more">+${evs.length - 2} more</span>` : ''}</button>`;
    }
    daysEl.innerHTML = html;
    const monthKey = `${y}-${String(m).padStart(2, '0')}`;
    const isThisMonth = monthKey === todayKey.slice(0, 7);
    showWeek(isThisMonth ? todayKey : `${monthKey}-01`);
  }

  daysEl.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-day]');
    if (!btn) return;
    const key = btn.dataset.day;
    selKey = key;
    daysEl.querySelectorAll('.cal-day.sel').forEach(x => x.classList.remove('sel'));
    btn.classList.add('sel');
    renderDayCard(key);
    showWeek(key);
    // On phones the card sits under the calendar -- bring it into view.
    if (window.matchMedia('(max-width: 760px)').matches && dayCard) dayCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  page.querySelector('[data-cal-prev]').addEventListener('click', () => { m--; if (m < 1) { m = 12; y--; } renderMonth(); });
  page.querySelector('[data-cal-next]').addEventListener('click', () => { m++; if (m > 12) { m = 1; y++; } renderMonth(); });
  renderMonth();
  renderDayCard(selKey);
}

/* ------------------------------------------------------------
 * Header lines (Nov 7 2026): "New this week" and "Upcoming events",
 * the two thin lines above the header on every page. Both are set in
 * the admin portal (Calendar -> Website header lines). A blank
 * "Upcoming events" line shows the next published event by itself.
 * ------------------------------------------------------------ */
async function initHeaderLines() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let st;
  try {
    [st] = await sb('store_settings?id=eq.1&select=header_new_on,header_new_text,header_new_link,header_events_on,header_events_text,header_events_link');
  } catch (e) { console.warn('Header lines unavailable:', e); return; }
  if (!st) return;
  const lines = [];
  if (st.header_new_on && st.header_new_text) {
    const link = /^(https?:\/\/|\/)/i.test(st.header_new_link || '') ? st.header_new_link : '';
    lines.push({ label: 'New this week', text: st.header_new_text, href: link });
  }
  if (st.header_events_on) {
    let text = st.header_events_text;
    if (!text) {
      try {
        const now = new Date().toISOString();
        const [next] = await sb(`events?select=title,starts_at,ends_at,all_day&is_published=eq.true&or=(starts_at.gte.${now},ends_at.gte.${now})&order=starts_at&limit=1`);
        if (next) text = `${next.title} — ${evWhen(next)}`;
      } catch (e) { /* no events: skip the line */ }
    }
    const evLink = /^(https?:\/\/|\/)/i.test(st.header_events_link || '') ? st.header_events_link : '/events';
    if (text) lines.push({ label: 'Upcoming events', text, href: evLink });
  }
  if (!lines.length) return;
  const bar = document.createElement('div');
  bar.className = 'header-lines';
  bar.innerHTML = lines.map(l => {
    const inner = `<span class="hl-label">${esc(l.label)}</span><span class="hl-text">${esc(l.text)}</span>`;
    return l.href ? `<a class="hl-line" href="${esc(l.href)}">${inner}<span class="hl-btn">Click Here</span></a>` : `<div class="hl-line">${inner}</div>`;
  }).join('');
  header.parentNode.insertBefore(bar, header);
}

/* ------------------------------------------------------------
 * Email list (Nov 7 2026): a sign-up band above the footer on every
 * page, and the unsubscribe page. The list itself is only visible in
 * the admin portal (Email list); this site can only add or remove the
 * address someone types.
 * ------------------------------------------------------------ */
/* ------------------------------------------------------------
 * Community delivery "coming soon" sign-up (Nov 8 2026), home page.
 * Saved with delivery_interest_signup() -> delivery_interest table
 * (admin portal -> Email list -> Community delivery interest).
 * ------------------------------------------------------------ */
function initDeliveryInterest() {
  const box = document.querySelector('[data-delivery-interest]');
  if (!box) return;
  const form = box.querySelector('form');
  const note = box.querySelector('.signup-note');
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const email = form.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { note.textContent = 'Please enter a valid email address.'; note.className = 'signup-note err'; return; }
    const btn = form.querySelector('button'); btn.disabled = true;
    try {
      const r = await sbRpc('delivery_interest_signup', { p_email: email, p_first_name: form.first_name.value.trim() || null, p_area: form.area.value.trim() || null });
      if (r && r.ok) { form.reset(); note.textContent = "Thanks! We'll let you know as soon as community delivery starts."; note.className = 'signup-note ok'; }
      else { note.textContent = (r && r.error) || 'Something went wrong -- please try again.'; note.className = 'signup-note err'; }
    } catch (e) { note.textContent = 'Something went wrong -- please try again.'; note.className = 'signup-note err'; }
    btn.disabled = false;
  });
}

// Texted specials sign-up (texts.html, Nov 9 2026). Calls the
// sms_specials_signup database function; the welcome text then comes from
// Twilio within a minute. The consent box must be ticked by the customer.
function initTextSignup() {
  const form = document.querySelector('[data-text-signup]');
  if (!form) return;
  const note = form.querySelector('.signup-note');
  const pretty = v => { const d = v.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '').slice(0, 10);
    return d.length < 4 ? d : d.length < 7 ? `(${d.slice(0,3)}) ${d.slice(3)}` : `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`; };
  form.phone.addEventListener('input', () => { form.phone.value = pretty(form.phone.value); });
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const digits = form.phone.value.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
    if (!/^[2-9]\d{9}$/.test(digits)) { note.textContent = 'Please enter a 10-digit mobile number.'; note.className = 'signup-note err'; return; }
    if (!form.consent.checked) { note.textContent = 'Please tick the box to agree to get texts.'; note.className = 'signup-note err'; return; }
    const btn = form.querySelector('button'); btn.disabled = true;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sms_specials_signup`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_phone: digits, p_first_name: form.first_name.value.trim() || null, p_source: 'website' }),
      });
      const out = await res.json().catch(() => null);
      if (!res.ok) throw new Error((out && out.message) || 'Something went wrong -- please try again.');
      form.reset();
      // Double opt-in (Nov 9 2026): they're only on the list after replying JOIN.
      note.textContent = out === 'already' ? "You're already on the list -- thanks!"
        : "Almost done! We just texted you -- reply JOIN to confirm.";
      note.className = 'signup-note ok';
    } catch (e) { note.textContent = e.message; note.className = 'signup-note err'; }
    btn.disabled = false;
  });
}

function initSignup() {
  const footer = document.querySelector('.site-footer');
  if (!footer || document.body.hasAttribute('data-no-signup')) return;
  const band = document.createElement('section');
  band.className = 'signup';
  band.id = 'signup'; // direct link: tjskitchenvc.com/signup (or any page + #signup)
  band.innerHTML = `<div class="wrap signup-inner">
    <div>
      <div class="eyebrow" data-edit="signup.eyebrow" data-edit-label="Email sign-up: small label">Stay in the loop</div>
      <h2 data-edit="signup.title" data-edit-label="Email sign-up: heading">Specials &amp; where we're cooking next</h2>
      <p class="muted" data-edit="signup.text" data-edit-label="Email sign-up: text" data-edit-long>Join the list for this week's specials and where to find us next, on the course or out in the community. No spam, and you can opt out anytime.</p>
    </div>
    <form class="signup-form signup-form-3" novalidate>
      <input type="text" name="first_name" placeholder="Name" autocomplete="given-name" required maxlength="40" aria-label="Name">
      <input type="email" name="email" placeholder="Email" autocomplete="email" maxlength="254" aria-label="Email">
      <input type="tel" name="phone" placeholder="Mobile number" autocomplete="tel-national" inputmode="tel" maxlength="20" aria-label="Mobile number">
      <button class="btn" type="submit"><span data-edit="signup.button" data-edit-label="Email sign-up: button">Sign me up</span></button>
      <label class="consent" hidden>
        <input type="checkbox" name="sms_consent">
        <span>Yes, text me TJ's Kitchen specials and news at this number (up to 4 msgs/month). Consent isn't required to buy anything. Msg &amp; data rates may apply. Reply HELP for help, STOP to cancel. See our <a href="/privacy#texting">privacy &amp; texting terms</a>.</span>
      </label>
      <p class="signup-note" aria-live="polite"></p>
    </form>
  </div>`;
  footer.parentNode.insertBefore(band, footer);
  // The form is added after the page loads, so jump to it ourselves when
  // the link asks for it (also when a #signup link is tapped on the same page).
  const goToSignup = () => {
    if (location.hash !== '#signup') return;
    band.scrollIntoView({ behavior: 'smooth', block: 'center' });
    band.classList.add('flash'); // then the cursor goes to First name setTimeout(() => band.classList.remove('flash'), 1600);
    setTimeout(() => band.querySelector('input[name=first_name]').focus({ preventScroll: true }), 500);
  };
  window.addEventListener('hashchange', goToSignup);
  setTimeout(goToSignup, 50);
  // Hours, menu and events load a moment later and push the form down --
  // line it up again once they're in, unless the visitor has scrolled since.
  if (location.hash === '#signup') {
    let moved = false;
    const stop = () => { moved = true; };
    ['wheel', 'touchmove', 'keydown'].forEach(t => window.addEventListener(t, stop, { once: true, passive: true }));
    [900, 1800].forEach(ms => setTimeout(() => { if (!moved && location.hash === '#signup') band.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, ms));
  }
  const form = band.querySelector('form');
  const note = band.querySelector('.signup-note');
  // Texting box (separate, unticked) shows once they start a number.
  const consentRow = form.querySelector('.consent');
  const pretty = v => { const d = v.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '').slice(0, 10);
    return d.length < 4 ? d : d.length < 7 ? `(${d.slice(0,3)}) ${d.slice(3)}` : `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`; };
  form.phone.addEventListener('input', () => { form.phone.value = pretty(form.phone.value); consentRow.hidden = !form.phone.value; });
  const say = (msg, ok) => { note.textContent = msg; note.className = 'signup-note ' + (ok ? 'ok' : 'err'); };
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const name = form.first_name.value.trim();
    const email = form.email.value.trim();
    const digits = form.phone.value.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
    if (!name) return say('Please enter your name.');
    if (!email && !digits) return say('Please enter your email, your mobile number, or both.');
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say('Please enter a valid email address.');
    if (digits && !/^[2-9]\d{9}$/.test(digits)) return say('Please enter a 10-digit US mobile number.');
    if (digits && !form.sms_consent.checked) return say('Tick the box to get our specials by text -- or clear the number to sign up by email only.');
    const btn = form.querySelector('button'); btn.disabled = true;
    const done = [], problems = [];
    if (email) {
      try {
        const r = await sbRpc('email_subscribe', { p_email: email, p_first_name: name, p_source: 'website' });
        if (r && r.ok) done.push('email'); else problems.push((r && r.error) || "Email sign-up didn't go through.");
      } catch (e) { problems.push("Email sign-up didn't go through."); }
    }
    let textState = null;
    if (digits) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sms_specials_signup`, {
          method: 'POST',
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_phone: digits, p_first_name: name, p_source: 'website' }),
        });
        const out = await res.json().catch(() => null);
        if (!res.ok) throw new Error((out && out.message) || "Text sign-up didn't go through.");
        textState = out; done.push('text');
      } catch (e) { problems.push(e.message); }
    }
    btn.disabled = false;
    if (problems.length) return say((done.includes('email') ? "You're on the email list. " : '') + problems.join(' ') + ' Please try again.');
    form.reset(); consentRow.hidden = true;
    say(textState && textState !== 'already'
      ? (done.includes('email') ? "You're on the email list! " : '') + 'We just texted you -- reply JOIN to confirm texts.'
      : "You're on the list -- thanks!", true);
  });
}

function initUnsubscribe() {
  const box = document.querySelector('[data-unsub]');
  if (!box) return;
  const token = new URLSearchParams(location.search).get('t');
  const validToken = /^[0-9a-f-]{36}$/i.test(token || '');
  const form = box.querySelector('[data-unsub-form]');
  const emailIn = box.querySelector('[data-unsub-email]');
  const done = box.querySelector('[data-unsub-done]');
  // From an email link we already know who it is: just the button.
  // (A tap is required, so link-scanning software can't unsubscribe people.)
  if (validToken) emailIn.remove();
  else box.querySelector('[data-unsub-msg]').textContent = "Enter the address you signed up with and we'll take it off the list.";
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const args = validToken ? { p_token: token } : { p_email: (emailIn.value || '').trim() };
    if (!validToken && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(args.p_email)) { done.hidden = false; done.textContent = 'Please enter a valid email address.'; done.className = 'signup-note err'; return; }
    form.querySelector('button').disabled = true;
    try {
      await sbRpc('email_unsubscribe', args);
      form.remove();
      done.hidden = false; done.className = 'signup-note ok';
      done.innerHTML = "You're unsubscribed -- you won't get any more emails from us. Changed your mind? Sign up again at the bottom of <a href=\"/\">any page</a>.";
    } catch (e) {
      form.querySelector('button').disabled = false;
      done.hidden = false; done.textContent = 'Something went wrong -- please try again.'; done.className = 'signup-note err';
    }
  });
}

/* ------------------------------------------------------------
 * Website editor (Nov 7 2026) -- admin portal -> Website.
 *
 * Every editable spot on the site carries a key:
 *   data-edit="home.hero.title"       text (headline, paragraph, button label)
 *   data-edit-img="home.hero.image"   picture
 *   data-edit-label="Home: ..."       the name the admin shows
 *   data-edit-long                    edited in a big box (paragraphs)
 *   data-edit-optional                picture slot that stays hidden until
 *                                     a photo is added
 *   data-edit-slot                    a box that hides itself when all the
 *                                     text inside it is cleared
 *   data-edit-elsewhere="..."         set somewhere else in the admin
 *
 * The text written in the HTML is the ORIGINAL. A row in the
 * site_content table replaces it; "Reset to original" in the admin
 * deletes the row. Text is always put in as plain text (never HTML), so
 * nothing typed in the admin can break or take over the page.
 *
 * The last copy is kept in this browser so returning visitors see the
 * edited text straight away; a fresh copy is fetched on every visit.
 *
 * EDIT MODE: the admin shows this site in a frame with ?tjs-edit=1.
 * Then clicks select a spot instead of following links, and the page
 * talks to the admin with postMessage -- ONLY to the admin's own address
 * (ADMIN_ORIGINS). Edit mode can't save anything itself: saving happens
 * in the admin, signed in as staff.
 * ------------------------------------------------------------ */
const ADMIN_ORIGINS = ['https://tjs-kitchen-admin.vercel.app'];
const CONTENT_CACHE = 'tjs-site-content-v1';
const editMode = (() => {
  try { return new URLSearchParams(location.search).has('tjs-edit') && window.parent !== window; } catch (e) { return false; }
})();
let editParentOrigin = null;

function editEls() { return [...document.querySelectorAll('[data-edit],[data-edit-img]')]; }
function editKey(el) { return el.getAttribute('data-edit') || el.getAttribute('data-edit-img'); }
function editKind(el) { return el.hasAttribute('data-edit-img') ? 'image' : 'text'; }

// Remember what the HTML says before anything replaces it.
function rememberOriginals() {
  editEls().forEach(el => {
    if (el.hasAttribute('data-edit-original')) return;
    el.setAttribute('data-edit-original', editKind(el) === 'image' ? (el.getAttribute('src') || '') : el.textContent);
  });
}

// value === null -> back to the original.
function applyContent(key, value) {
  document.querySelectorAll(`[data-edit="${CSS.escape(key)}"],[data-edit-img="${CSS.escape(key)}"]`).forEach(el => {
    const v = value == null ? el.getAttribute('data-edit-original') : value;
    if (editKind(el) === 'image') {
      if (v) { el.src = v; el.hidden = false; } else { el.removeAttribute('src'); el.hidden = !editMode; }
    } else {
      el.textContent = v;
      el.style.whiteSpace = v.includes('\n') ? 'pre-line' : '';
      el.classList.toggle('edit-empty', !v.trim());
      el.hidden = !v.trim() && !editMode;   // cleared text = hidden on the live site
    }
  });
  refreshSlots();
}

// A box (notice, photo band) hides when everything editable in it is empty.
function refreshSlots() {
  document.querySelectorAll('[data-edit-slot]').forEach(slot => {
    const parts = [...slot.querySelectorAll('[data-edit],[data-edit-img]')];
    const anything = parts.some(el => editKind(el) === 'image' ? !!el.getAttribute('src') : !!el.textContent.trim());
    slot.hidden = !anything && !editMode;
  });
}

function applyAll(map) { Object.entries(map || {}).forEach(([k, v]) => applyContent(k, v)); }

function readCache() { try { return JSON.parse(localStorage.getItem(CONTENT_CACHE) || '{}'); } catch (e) { return {}; } }
function writeCache(map) { try { localStorage.setItem(CONTENT_CACHE, JSON.stringify(map)); } catch (e) { /* private window */ } }

async function initSiteContent() {
  rememberOriginals();
  if (!editMode) applyAll(readCache());
  refreshSlots();
  let rows = [];
  try { rows = await sb('site_content?select=key,kind,value'); } catch (e) { console.warn('Site text unavailable:', e); }
  const map = {};
  rows.forEach(r => { map[r.key] = r.value; });
  // Anything that was reset since the last visit goes back to the original.
  Object.keys(readCache()).forEach(k => { if (!(k in map)) applyContent(k, null); });
  applyAll(map);
  if (!editMode) writeCache(map);
  if (editMode) startEditMode(map);
}

function startEditMode(saved) {
  document.documentElement.classList.add('tjs-editing');
  const page = (location.pathname.replace(/^\/|\.html$/g, '') || 'index');
  const fieldList = () => editEls().map(el => ({
    key: editKey(el), kind: editKind(el),
    label: el.getAttribute('data-edit-label') || editKey(el),
    long: el.hasAttribute('data-edit-long'),
    optional: el.hasAttribute('data-edit-optional'),
    original: el.getAttribute('data-edit-original') || '',
    value: editKey(el) in saved ? saved[editKey(el)] : null,
  })).filter((f, i, a) => a.findIndex(x => x.key === f.key) === i);
  const send = msg => { ADMIN_ORIGINS.forEach(o => { try { window.parent.postMessage(msg, o); } catch (e) {} }); };

  // Clicks pick a spot; nothing on the page navigates or submits.
  document.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    const el = ev.target.closest('[data-edit],[data-edit-img],[data-edit-elsewhere]');
    if (!el) return;
    if (el.hasAttribute('data-edit-elsewhere')) { send({ type: 'tjs-edit-elsewhere', where: el.getAttribute('data-edit-elsewhere') }); return; }
    document.querySelectorAll('.edit-selected').forEach(x => x.classList.remove('edit-selected'));
    el.classList.add('edit-selected');
    send({ type: 'tjs-edit-select', key: editKey(el) });
  }, true);
  document.addEventListener('submit', ev => ev.preventDefault(), true);

  window.addEventListener('message', ev => {
    if (!ADMIN_ORIGINS.includes(ev.origin)) return;   // only the admin portal
    const m = ev.data || {};
    if (m.type === 'tjs-edit-apply' && typeof m.key === 'string') {
      applyContent(m.key, typeof m.value === 'string' ? m.value : null);
    } else if (m.type === 'tjs-edit-highlight' && typeof m.key === 'string') {
      document.querySelectorAll('.edit-selected').forEach(x => x.classList.remove('edit-selected'));
      const el = document.querySelector(`[data-edit="${CSS.escape(m.key)}"],[data-edit-img="${CSS.escape(m.key)}"]`);
      if (el) { el.classList.add('edit-selected'); if (m.scroll) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    } else if (m.type === 'tjs-edit-hello') {
      send({ type: 'tjs-edit-ready', page, fields: fieldList() });
    }
  });
  send({ type: 'tjs-edit-ready', page, fields: fieldList() });
}

/* ------------------------------------------------------------
 * "Push menu to all devices" (admin Dashboard, Nov 7 2026). The admin's
 * button stamps store_settings.menu_board_refresh_at -- the same signal
 * the Apple TV board and the ordering site watch. While a page is open we
 * check it every 30 s and refresh what's on screen when it changes:
 * the menu redraws in place, the header lines reload, and the Events page
 * (calendar + day card) reloads itself.
 * ------------------------------------------------------------ */
function initMenuPushWatch() {
  let last; // undefined until the first check
  async function check() {
    if (document.visibilityState !== 'visible') return;
    let row;
    try { [row] = await sb('store_settings?id=eq.1&select=menu_board_refresh_at'); } catch (e) { return; }
    if (!row) return;
    const now = row.menu_board_refresh_at || null;
    if (last !== undefined && now !== last) {
      if (document.querySelector('[data-events]')) { location.reload(); return; }
      if (document.getElementById('menu-root')) initMenu();
      document.querySelectorAll('.header-lines').forEach(el => el.remove());
      initHeaderLines();
    }
    last = now;
  }
  check();
  setInterval(check, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
}

// initSiteContent runs after initSignup so the sign-up band's text is editable too.
document.addEventListener('DOMContentLoaded', () => { if (!editMode) initMenuPushWatch(); initHeaderLines(); initSignup(); initDeliveryInterest(); initTextSignup(); initSiteContent(); initUnsubscribe(); initChrome(); initHours(); initMenu(); initAppleMap(); initEvents(); });

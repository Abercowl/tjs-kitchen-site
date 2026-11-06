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
  items.push(`<li><span class="ci">📍</span><div><strong>Find us</strong><br>${esc(SITE.placeName)}<br><span class="muted">${esc(SITE.address)}</span><br>${SITE.windowSpot ? `<span class="muted">⛳ ${esc(SITE.windowSpot)}</span><br>` : ''}<a ${directionsAttrs()}>Get directions →</a></div></li>`);
  if (SITE.instagram) items.push(`<li><span class="ci">📸</span><div><strong>Instagram</strong><br><a href="https://instagram.com/${esc(SITE.instagram)}" target="_blank" rel="noopener">@${esc(SITE.instagram)}</a></div></li>`);
  if (SITE.facebook) items.push(`<li><span class="ci">👍</span><div><strong>Facebook</strong><br><a href="${esc(SITE.facebook)}" target="_blank" rel="noopener">Follow us</a></div></li>`);
  if (!SITE.phone && !SITE.email) items.push(`<li><span class="ci">💬</span><div class="muted">Phone and email coming soon. The fastest way to reach us right now is to stop by the trailer or order online.</div></li>`);
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
    const icon = L.divIcon({
      className: 'tj-pin',
      html: '<div class="tj-pin-badge"><img src="/assets/logo-pin.png" alt="TJ\'s Kitchen"></div><div class="tj-pin-tip"></div>',
      iconSize: [60, 74],
      iconAnchor: [30, 74],
      popupAnchor: [0, -70],
    });
    L.marker(pin, { icon, title: "TJ's Kitchen" }).addTo(map)
      .bindPopup(`<strong>TJ's Kitchen</strong><br>${esc(SITE.placeName)}<br>${SITE.windowSpot ? esc(SITE.windowSpot) + '<br>' : ''}
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

function evCard(e) {
  const mon = evFmt(e.starts_at, { month: 'short' });
  const day = evFmt(e.starts_at, { day: 'numeric' });
  const file = String(e.title).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'event';
  return `<article class="event" id="event-${esc(e.id)}" data-days="${evDays(e).join(' ')}">
    <div class="event-date"><span>${esc(mon)}</span><strong>${esc(day)}</strong></div>
    <div class="event-body">
      <div class="event-title">${esc(e.title)}</div>
      <div class="event-when">${esc(evWhen(e))}</div>
      ${e.location ? `<div class="event-where">${esc(e.location)}</div>` : ''}
      ${e.description ? `<div class="event-desc">${esc(e.description)}</div>` : ''}
      <a class="event-add" href="${evIcs(e)}" download="${esc(file)}.ics">+ Add to my calendar</a>
    </div>
  </article>`;
}

async function loadPublicEvents() {
  const since = new Date(Date.now() - 120 * 86400000).toISOString();
  return sb(`events?select=id,title,description,location,starts_at,ends_at,all_day&is_published=eq.true&or=(starts_at.gte.${since},ends_at.gte.${since})&order=starts_at&limit=500`);
}

async function initEvents() {
  const page = document.querySelector('[data-events]');
  const teaser = document.querySelector('[data-events-teaser]');
  if (!page && !teaser) return;
  let events = [];
  try { events = await loadPublicEvents(); } catch (e) { console.warn('Events unavailable:', e); }
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
  const heading = page.querySelector('[data-events-heading]');
  const daysEl = page.querySelector('[data-cal-days]');
  const titleEl = page.querySelector('[data-cal-title]');
  const byDay = new Map();
  events.forEach(e => evDays(e).forEach(k => { if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(e); }));

  const todayKey = evDayKey(now);
  let [y, m] = todayKey.split('-').map(Number); // month shown (1-12)

  function showList(items, title) {
    heading.textContent = title;
    listEl.innerHTML = items.length ? items.map(evCard).join('')
      : `<p class="muted">Nothing on the calendar yet — check back soon, or follow along on our <a href="/">home page</a>.</p>`;
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
      const cls = ['cal-day', key === todayKey ? 'today' : '', evs.length ? 'has' : ''].join(' ');
      const label = `${first.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })} ${d}${evs.length ? ', ' + evs.length + ' event' + (evs.length > 1 ? 's' : '') : ''}`;
      html += evs.length
        ? `<button type="button" class="${cls}" data-day="${key}" aria-label="${esc(label)}"><span class="num">${d}</span>${evs.slice(0, 2).map(e => `<span class="cal-chip">${esc(e.title)}</span>`).join('')}${evs.length > 2 ? `<span class="cal-more">+${evs.length - 2} more</span>` : ''}</button>`
        : `<div class="${cls}" aria-label="${esc(label)}"><span class="num">${d}</span></div>`;
    }
    daysEl.innerHTML = html;
    const monthKey = `${y}-${String(m).padStart(2, '0')}`;
    const isThisMonth = monthKey === todayKey.slice(0, 7);
    if (isThisMonth) showList(upcoming.slice(0, 20), 'Coming up');
    else {
      const inMonth = events.filter(e => evDays(e).some(k => k.startsWith(monthKey)));
      showList(inMonth, titleEl.textContent);
    }
  }

  daysEl.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-day]');
    if (!btn) return;
    const key = btn.dataset.day;
    const evs = byDay.get(key) || [];
    const label = evFmt(key + 'T12:00:00Z', { weekday: 'long', month: 'long', day: 'numeric' });
    showList(evs, label);
    const first = listEl.querySelector('.event');
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'start' });
      first.classList.add('flash'); setTimeout(() => first.classList.remove('flash'), 1200);
    }
  });
  page.querySelector('[data-cal-prev]').addEventListener('click', () => { m--; if (m < 1) { m = 12; y--; } renderMonth(); });
  page.querySelector('[data-cal-next]').addEventListener('click', () => { m++; if (m > 12) { m = 1; y++; } renderMonth(); });
  renderMonth();
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
function initSignup() {
  const footer = document.querySelector('.site-footer');
  if (!footer || document.body.hasAttribute('data-no-signup')) return;
  const band = document.createElement('section');
  band.className = 'signup';
  band.id = 'signup'; // direct link: tjskitchenvc.com/signup (or any page + #signup)
  band.innerHTML = `<div class="wrap signup-inner">
    <div>
      <div class="eyebrow">Stay in the loop</div>
      <h2>Specials &amp; events by email</h2>
      <p class="muted">New menu items, tournament food and events at the course. No spam -- unsubscribe anytime.</p>
    </div>
    <form class="signup-form" novalidate>
      <input type="text" name="first_name" placeholder="First name (optional)" autocomplete="given-name" maxlength="60" aria-label="First name">
      <input type="email" name="email" placeholder="Email address" autocomplete="email" required maxlength="254" aria-label="Email address">
      <button class="btn" type="submit">Sign me up</button>
      <p class="signup-note" aria-live="polite"></p>
    </form>
  </div>`;
  footer.parentNode.insertBefore(band, footer);
  // The form is added after the page loads, so jump to it ourselves when
  // the link asks for it (also when a #signup link is tapped on the same page).
  const goToSignup = () => {
    if (location.hash !== '#signup') return;
    band.scrollIntoView({ behavior: 'smooth', block: 'center' });
    band.classList.add('flash'); setTimeout(() => band.classList.remove('flash'), 1600);
    setTimeout(() => band.querySelector('input[name=email]').focus({ preventScroll: true }), 500);
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
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const email = form.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { note.textContent = 'Please enter a valid email address.'; note.className = 'signup-note err'; return; }
    const btn = form.querySelector('button'); btn.disabled = true;
    try {
      const r = await sbRpc('email_subscribe', { p_email: email, p_first_name: form.first_name.value.trim() || null, p_source: 'website' });
      if (r && r.ok) { form.reset(); note.textContent = "You're on the list -- thanks!"; note.className = 'signup-note ok'; }
      else { note.textContent = (r && r.error) || 'Something went wrong -- please try again.'; note.className = 'signup-note err'; }
    } catch (e) { note.textContent = 'Something went wrong -- please try again.'; note.className = 'signup-note err'; }
    btn.disabled = false;
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

document.addEventListener('DOMContentLoaded', () => { initHeaderLines(); initSignup(); initUnsubscribe(); initChrome(); initHours(); initMenu(); initAppleMap(); initEvents(); });

/* TJ's Kitchen — tjskitchenvc.com
 *
 * ============================================================
 *  EDIT YOUR DETAILS HERE (this is the only place to change)
 * ============================================================
 *  Leave a value as '' to hide that line on the site.
 */
const SITE = {
  phone: '',          // e.g. '(805) 555-1234'
  email: '',          // e.g. 'hello@tjskitchenvc.com'
  instagram: '',      // e.g. 'tjskitchenvc'  (handle only, no @)
  facebook: '',       // full link, e.g. 'https://facebook.com/...'
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
  items.push(`<li><span class="ci">📍</span><div><strong>Find us</strong><br>${esc(SITE.placeName)}<br><span class="muted">${esc(SITE.address)}</span><br><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.placeName + ', ' + SITE.address)}" target="_blank" rel="noopener">Get directions →</a></div></li>`);
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

document.addEventListener('DOMContentLoaded', () => { initChrome(); initHours(); initMenu(); });

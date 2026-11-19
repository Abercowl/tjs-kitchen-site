// FILE:  Supabase Edge Function "golf-pass"   (Verify JWT OFF)
//   Supabase (project djfdktbcdjbijnimjsgb)
//   └── Edge Functions/
//       └── golf-pass   <-- THIS FILE
//
// TJ's Hole in One: holes 1-5 are free; $5 unlocks the other 13 for 24 hours.
//
//   checkout {test?}  -> makes a Square checkout link for $5 and a pass code (ref).
//                        Square sends the player back to /play2?pass=<ref>.
//   claim {ref}       -> asks Square whether that order was paid. If so the pass
//                        starts (24 hours from payment) and a signed token comes back.
//                        The same code works again on another phone / after clearing
//                        the browser, until the 24 hours are up.
//   holes {token}     -> the course list for holes 6-18, with short-lived download
//                        links for the files in the private "golf-courses" bucket
//                        (back/course-manifest.json + back/hole-XX.glb). Until those
//                        files are uploaded it returns placeholder holes.
//
// No card details ever come here: players pay on Square's own checkout page.
// Test mode (test: true) uses the Square sandbox (SQUARE_SANDBOX_ACCESS_TOKEN,
// SQUARE_SANDBOX_LOCATION_ID) and only ever unlocks the placeholder holes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SQUARE_VERSION = "2026-01-22";
const PRICE_CENTS = 500;
const PASS_MS = 24 * 60 * 60 * 1000;
const RETURN_URL = "https://tjskitchenvc.com/play2";
const FREE_HOLES = 5;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const db = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function square(test: boolean) {
  const token = Deno.env.get(test ? "SQUARE_SANDBOX_ACCESS_TOKEN" : "SQUARE_ACCESS_TOKEN");
  const location = Deno.env.get(test ? "SQUARE_SANDBOX_LOCATION_ID" : "SQUARE_LOCATION_ID");
  if (!token || !location) return null;
  const base = test ? "https://connect.squareupsandbox.com/v2" : "https://connect.squareup.com/v2";
  const call = async (path: string, init: RequestInit = {}) => {
    const res = await fetch(base + path, {
      ...init,
      headers: { "Square-Version": SQUARE_VERSION, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  };
  return { location, call };
}

// Pass code: 8 letters/digits without look-alikes (no 0/O, 1/I/L)
function newRef() {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const b = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(b, (x) => abc[x % abc.length]).join("");
}

// ---- Signed pass tokens: base64url(json).base64url(hmac) ----
// The signing key is derived from the service-role key, so there is no extra secret to manage.
const enc = new TextEncoder();
const b64u = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
async function hmacKey() {
  const seed = await crypto.subtle.digest("SHA-256", enc.encode("tjs-golf-pass:" + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")));
  return crypto.subtle.importKey("raw", seed, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function signToken(p: { ref: string; exp: number; mode: string }) {
  const body = b64u(enc.encode(JSON.stringify(p)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(body)));
  return `${body}.${b64u(sig)}`;
}
async function readToken(token: string): Promise<{ ref: string; exp: number; mode: string } | null> {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(), fromB64u(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64u(body)));
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}

// ---- Actions ----
async function checkout(test: boolean) {
  const sq = square(test);
  if (!sq) return json({ error: test ? "Test mode isn't set up (Square sandbox keys missing)." : "Payments aren't set up." }, 503);
  const ref = newRef();
  const r = await sq.call("/online-checkout/payment-links", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: `golf-${ref}`,
      quick_pay: {
        name: "TJ's Hole in One: 13 more holes (24 hours)",
        price_money: { amount: PRICE_CENTS, currency: "USD" },
        location_id: sq.location,
      },
      checkout_options: { redirect_url: `${RETURN_URL}?pass=${ref}`, ask_for_shipping_address: false },
      payment_note: `Hole in One pass ${ref}`,
    }),
  });
  const link = r.data?.payment_link;
  if (!r.ok || !link?.url) {
    console.error("[golf-pass] payment link failed", JSON.stringify(r.data));
    return json({ error: "Couldn't start checkout. Please try again." }, 502);
  }
  const { error } = await db().from("golf_passes").insert({
    ref, mode: test ? "test" : "live", payment_link_id: link.id, square_order_id: link.order_id, amount_cents: PRICE_CENTS,
  });
  if (error) { console.error("[golf-pass] insert failed", error); return json({ error: "Couldn't start checkout." }, 500); }
  return json({ url: link.url, ref });
}

async function claim(refIn: string) {
  const ref = String(refIn || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (ref.length !== 8) return json({ error: "That pass code isn't right. It's 8 letters and numbers." }, 400);
  const supabase = db();
  const { data: row } = await supabase.from("golf_passes").select().eq("ref", ref).maybeSingle();
  if (!row) return json({ error: "We couldn't find that pass code." }, 404);

  let paidAt = row.paid_at ? new Date(row.paid_at).getTime() : 0;
  if (row.status !== "paid") {
    const sq = square(row.mode === "test");
    if (!sq || !row.square_order_id) return json({ status: "pending" });
    const r = await sq.call(`/orders/${row.square_order_id}`);
    const o = r.data?.order;
    const paid = r.ok && o && Number(o.total_money?.amount) === row.amount_cents &&
      (o.state === "COMPLETED" || ((o.tenders?.length ?? 0) > 0 && Number(o.net_amount_due_money?.amount ?? 1) === 0));
    if (!paid) return json({ status: "pending" });     // not paid (yet): the page asks again in a moment
    paidAt = Date.parse(o.tenders?.[0]?.created_at || o.updated_at || "") || Date.now();
    await supabase.from("golf_passes").update({
      status: "paid", paid_at: new Date(paidAt).toISOString(), expires_at: new Date(paidAt + PASS_MS).toISOString(),
    }).eq("ref", ref);
  }
  const exp = paidAt + PASS_MS;
  if (exp <= Date.now()) return json({ status: "expired", error: "That pass has run out (passes last 24 hours)." }, 410);
  return json({ status: "paid", token: await signToken({ ref, exp, mode: row.mode }), expires_at: new Date(exp).toISOString(), ref });
}

// Placeholder holes 6-18 (front-nine files repeated) until the real ones are uploaded
function placeholderHoles() {
  const names = ["Garden Slalom", "Bunker Run", "Water Crossing", "Windmill Challenge", "TJ's Grand Finale"];
  return Array.from({ length: 13 }, (_, i) => ({
    ref: `hole-0${(i % 5) + 1}.glb`, name: `${names[i % 5]} (preview)`, placeholder: true,
  }));
}

async function holes(token: string) {
  const pass = await readToken(token);
  if (!pass) return json({ error: "Your pass has run out." }, 401);
  const storage = db().storage.from("golf-courses");
  if (pass.mode === "live") {
    const { data: file } = await storage.download("back/course-manifest.json");
    if (file) {
      const back = JSON.parse(await file.text());
      const list = back.holes.slice(0, 18 - FREE_HOLES);
      const { data: signed, error } = await storage.createSignedUrls(list.map((h: { file: string }) => `back/${h.file}`), 6 * 60 * 60);
      if (error || !signed) return json({ error: "Couldn't load the holes. Please try again." }, 502);
      return json({ expires_at: new Date(pass.exp).toISOString(), ballRadius: back.ballRadius,
        holes: list.map((h: Record<string, unknown>, i: number) => ({ ...h, url: signed[i].signedUrl })) });
    }
  }
  return json({ expires_at: new Date(pass.exp).toISOString(), placeholder: true, holes: placeholderHoles() });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === "checkout") return await checkout(!!body.test);
    if (body.action === "claim") return await claim(body.ref);
    if (body.action === "holes") return await holes(body.token);
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("[golf-pass] unexpected", String(e));
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});

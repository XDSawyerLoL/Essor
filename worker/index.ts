/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  STRIPE_PORTAL_URL?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

type StripeSubscription = {
  id: string;
  status: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  trial_end?: number | null;
  metadata?: Record<string, string>;
  customer?: string | { id?: string } | null;
  items?: { data?: Array<{ price?: { id?: string } | null; current_period_end?: number | null }> };
};

type StripeCheckoutSession = {
  id: string;
  mode?: string;
  status?: string;
  customer?: string | { id?: string } | null;
  payment_link?: string | null;
  metadata?: Record<string, string>;
  subscription?: string | StripeSubscription | null;
};

const ESSOR_PAYMENT_LINKS = new Set(["plink_1U4IqiJ0vNrYb7NJWgczbjet", "plink_1U4IqvJ0vNrYb7NJUMfRIfIO"]);
const ESSOR_PRICE_PLANS = new Map<string, "monthly" | "annual">([
  ["price_1U4IpPJ0vNrYb7NJUxi9J0Wq", "monthly"],
  ["price_1U4IpYJ0vNrYb7NJ4CFcdHKL", "annual"],
]);
const ESSOR_PAYMENT_LINK_PLANS = new Map<string, "monthly" | "annual">([
  ["plink_1U4IqiJ0vNrYb7NJWgczbjet", "monthly"],
  ["plink_1U4IqvJ0vNrYb7NJUMfRIfIO", "annual"],
]);
const GOOGLE_PLAY_PRODUCTS = new Map<string, "monthly" | "annual">([
  ["essor_plus_monthly", "monthly"],
  ["essor_plus_annual", "annual"],
]);
const GOOGLE_OAUTH_SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const GOOGLE_OAUTH_AUDIENCE = "https://oauth2.googleapis.com/token";
const ANDROID_PACKAGE_ID = "com.xdsawyer.essor";
let googleAccessTokenCache: { token: string; expiresAt: number } | null = null;

type SubscriptionRecord = {
  subscription_id: string;
  checkout_session_id: string | null;
  customer_id: string | null;
  plan: string;
  status: string;
  cancel_at_period_end: number;
  current_period_end: number | null;
  trial_end: number | null;
};

type CirclePostRecord = {
  id: string;
  author_hash: string;
  alias: string;
  message_key: string;
  days: number | null;
  created_at: number;
  support_count: number;
  supported: number;
};

const CIRCLE_MESSAGE_KEYS = new Set(["still_here", "crossed_wave", "restart", "one_more_day", "asked_help", "not_alone"]);
const CIRCLE_ADJECTIVES = ["Courageux", "Lumineux", "Serein", "Vaillant", "Libre", "Solidaire", "Patient", "Tenace"];
const CIRCLE_ANIMALS = ["Renard", "Colibri", "Blaireau", "Loutre", "Hibou", "Dauphin", "Lynx", "Panda"];

async function ensureSubscriptionSchema(env: Env) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS essor_subscriptions (
      subscription_id TEXT PRIMARY KEY NOT NULL,
      checkout_session_id TEXT,
      customer_id TEXT,
      plan TEXT DEFAULT 'monthly' NOT NULL,
      status TEXT DEFAULT 'trialing' NOT NULL,
      cancel_at_period_end INTEGER DEFAULT 0 NOT NULL,
      current_period_end INTEGER,
      trial_end INTEGER,
      updated_at INTEGER NOT NULL
    )`),
    env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS essor_subscriptions_checkout_session_idx ON essor_subscriptions (checkout_session_id)"),
  ]);
}

async function ensureCircleSchema(env: Env) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS essor_circle_posts (
      id TEXT PRIMARY KEY NOT NULL,
      author_hash TEXT NOT NULL,
      alias TEXT NOT NULL,
      message_key TEXT NOT NULL,
      days INTEGER,
      created_at INTEGER NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS essor_circle_posts_created_idx ON essor_circle_posts (created_at DESC)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS essor_circle_posts_author_idx ON essor_circle_posts (author_hash, created_at DESC)"),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS essor_circle_supports (
      post_id TEXT NOT NULL,
      supporter_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (post_id, supporter_hash)
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS essor_circle_supports_post_idx ON essor_circle_supports (post_id)"),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS essor_circle_reports (
      post_id TEXT NOT NULL,
      reporter_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (post_id, reporter_hash)
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS essor_circle_reports_post_idx ON essor_circle_reports (post_id)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS essor_circle_reports_reporter_idx ON essor_circle_reports (reporter_hash, created_at DESC)"),
  ]);
}

async function ensurePresenceSchema(env: Env) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS essor_presence (
      session_hash TEXT PRIMARY KEY NOT NULL,
      last_seen INTEGER NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS essor_presence_last_seen_idx ON essor_presence (last_seen)"),
  ]);
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function handlePresence(request: Request, env: Env) {
  if (!requestIsSameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const raw = await request.text();
  if (raw.length > 512) return json({ error: "invalid_session" }, 400);
  let sessionId = "";
  let action = "heartbeat";
  try {
    const body = JSON.parse(raw) as { sessionId?: unknown; action?: unknown };
    sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    action = body.action === "delete" ? "delete" : "heartbeat";
  } catch {
    return json({ error: "invalid_session" }, 400);
  }
  if (!validCircleMember(sessionId)) return json({ error: "invalid_session" }, 400);

  await ensurePresenceSchema(env);
  const now = Math.floor(Date.now() / 1000);
  const sessionHash = await sha256Hex(sessionId);
  if (action === "delete") {
    await env.DB.prepare("DELETE FROM essor_presence WHERE session_hash = ?").bind(sessionHash).run();
    return json({ deleted: true });
  }
  await env.DB.batch([
    env.DB.prepare("DELETE FROM essor_presence WHERE last_seen < ?").bind(now - 86_400),
    env.DB.prepare("INSERT INTO essor_presence (session_hash, last_seen) VALUES (?, ?) ON CONFLICT(session_hash) DO UPDATE SET last_seen = excluded.last_seen").bind(sessionHash, now),
  ]);
  const counts = await env.DB.prepare(`SELECT
      COALESCE(SUM(CASE WHEN last_seen >= ? THEN 1 ELSE 0 END), 0) AS live,
      COUNT(*) AS today
    FROM essor_presence
    WHERE last_seen >= ?`)
    .bind(now - 180, now - 86_400)
    .first<{ live: number; today: number }>();
  return json({ live: Number(counts?.live) || 1, today: Number(counts?.today) || 1 });
}

function circleAlias(hash: string) {
  const first = Number.parseInt(hash.slice(0, 4), 16) % CIRCLE_ADJECTIVES.length;
  const second = Number.parseInt(hash.slice(4, 8), 16) % CIRCLE_ANIMALS.length;
  return `${CIRCLE_ANIMALS[second]} ${CIRCLE_ADJECTIVES[first]}`;
}

function validCircleMember(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function serializeCirclePost(post: CirclePostRecord, memberHash: string) {
  return {
    id: post.id,
    alias: post.alias,
    messageKey: post.message_key,
    days: post.days,
    createdAt: post.created_at,
    supportCount: Number(post.support_count) || 0,
    supported: Boolean(post.supported),
    mine: post.author_hash === memberHash,
  };
}

async function listCirclePosts(env: Env, memberHash: string) {
  await ensureCircleSchema(env);
  const since = Math.floor(Date.now() / 1000) - 30 * 86_400;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM essor_circle_supports WHERE post_id IN (SELECT id FROM essor_circle_posts WHERE created_at < ?)").bind(since),
    env.DB.prepare("DELETE FROM essor_circle_reports WHERE post_id IN (SELECT id FROM essor_circle_posts WHERE created_at < ?)").bind(since),
    env.DB.prepare("DELETE FROM essor_circle_posts WHERE created_at < ?").bind(since),
  ]);
  const result = await env.DB.prepare(`SELECT
      p.id, p.author_hash, p.alias, p.message_key, p.days, p.created_at,
      COUNT(s.supporter_hash) AS support_count,
      MAX(CASE WHEN s.supporter_hash = ? THEN 1 ELSE 0 END) AS supported
    FROM essor_circle_posts p
    LEFT JOIN essor_circle_supports s ON s.post_id = p.id
    WHERE p.created_at >= ?
      AND (SELECT COUNT(*) FROM essor_circle_reports r WHERE r.post_id = p.id) < 3
    GROUP BY p.id, p.author_hash, p.alias, p.message_key, p.days, p.created_at
    ORDER BY p.created_at DESC
    LIMIT 40`)
    .bind(memberHash, since)
    .all<CirclePostRecord>();
  return (result.results ?? []).map((post) => serializeCirclePost(post, memberHash));
}

async function readCircleBody(request: Request) {
  const raw = await request.text();
  if (raw.length > 2_000) return null;
  try {
    return JSON.parse(raw) as { action?: unknown; memberId?: unknown; messageKey?: unknown; days?: unknown; postId?: unknown };
  } catch {
    return null;
  }
}

async function handleCircle(request: Request, env: Env) {
  if (!requestIsSameOrigin(request)) return json({ error: "forbidden" }, 403);
  await ensureCircleSchema(env);
  const url = new URL(request.url);

  if (request.method === "GET") {
    const memberId = url.searchParams.get("member");
    if (!validCircleMember(memberId)) return json({ error: "invalid_member" }, 400);
    const memberHash = await sha256Hex(memberId);
    return json({ posts: await listCirclePosts(env, memberHash) });
  }

  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const body = await readCircleBody(request);
  if (!body || !validCircleMember(body.memberId)) return json({ error: "invalid_member" }, 400);
  const memberHash = await sha256Hex(body.memberId);
  const now = Math.floor(Date.now() / 1000);

  if (body.action === "publish") {
    if (typeof body.messageKey !== "string" || !CIRCLE_MESSAGE_KEYS.has(body.messageKey)) return json({ error: "invalid_message" }, 400);
    const recent = await env.DB.prepare("SELECT COUNT(*) AS count FROM essor_circle_posts WHERE author_hash = ? AND created_at >= ?")
      .bind(memberHash, now - 86_400)
      .first<{ count: number }>();
    if (Number(recent?.count) >= 3) return json({ error: "rate_limited" }, 429);
    const id = crypto.randomUUID();
    const days = typeof body.days === "number" && Number.isInteger(body.days) ? Math.max(0, Math.min(9_999, body.days)) : null;
    const alias = circleAlias(memberHash);
    await env.DB.prepare("INSERT INTO essor_circle_posts (id, author_hash, alias, message_key, days, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, memberHash, alias, body.messageKey, days, now)
      .run();
    return json({ post: { id, alias, messageKey: body.messageKey, days, createdAt: now, supportCount: 0, supported: false, mine: true } }, 201);
  }

  if (body.action === "delete_all") {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM essor_circle_supports WHERE post_id IN (SELECT id FROM essor_circle_posts WHERE author_hash = ?)").bind(memberHash),
      env.DB.prepare("DELETE FROM essor_circle_reports WHERE post_id IN (SELECT id FROM essor_circle_posts WHERE author_hash = ?)").bind(memberHash),
      env.DB.prepare("DELETE FROM essor_circle_supports WHERE supporter_hash = ?").bind(memberHash),
      env.DB.prepare("DELETE FROM essor_circle_reports WHERE reporter_hash = ?").bind(memberHash),
      env.DB.prepare("DELETE FROM essor_circle_posts WHERE author_hash = ?").bind(memberHash),
    ]);
    return json({ deleted: true });
  }

  if (body.action === "support") {
    if (typeof body.postId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.postId)) return json({ error: "invalid_post" }, 400);
    const post = await env.DB.prepare("SELECT author_hash FROM essor_circle_posts WHERE id = ? LIMIT 1").bind(body.postId).first<{ author_hash: string }>();
    if (!post) return json({ error: "post_not_found" }, 404);
    if (post.author_hash === memberHash) return json({ error: "own_post" }, 400);
    const recent = await env.DB.prepare("SELECT COUNT(*) AS count FROM essor_circle_supports WHERE supporter_hash = ? AND created_at >= ?")
      .bind(memberHash, now - 86_400)
      .first<{ count: number }>();
    if (Number(recent?.count) >= 60) return json({ error: "rate_limited" }, 429);
    await env.DB.prepare("INSERT OR IGNORE INTO essor_circle_supports (post_id, supporter_hash, created_at) VALUES (?, ?, ?)")
      .bind(body.postId, memberHash, now)
      .run();
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM essor_circle_supports WHERE post_id = ?").bind(body.postId).first<{ count: number }>();
    return json({ supported: true, supportCount: Number(count?.count) || 0 });
  }

  if (body.action === "report") {
    if (typeof body.postId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.postId)) return json({ error: "invalid_post" }, 400);
    const post = await env.DB.prepare("SELECT author_hash FROM essor_circle_posts WHERE id = ? LIMIT 1").bind(body.postId).first<{ author_hash: string }>();
    if (!post) return json({ error: "post_not_found" }, 404);
    if (post.author_hash === memberHash) return json({ error: "own_post" }, 400);
    const recent = await env.DB.prepare("SELECT COUNT(*) AS count FROM essor_circle_reports WHERE reporter_hash = ? AND created_at >= ?")
      .bind(memberHash, now - 86_400)
      .first<{ count: number }>();
    if (Number(recent?.count) >= 20) return json({ error: "rate_limited" }, 429);
    await env.DB.prepare("INSERT OR IGNORE INTO essor_circle_reports (post_id, reporter_hash, created_at) VALUES (?, ?, ?)")
      .bind(body.postId, memberHash, now)
      .run();
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM essor_circle_reports WHERE post_id = ?").bind(body.postId).first<{ count: number }>();
    return json({ reported: true, hidden: Number(count?.count) >= 3 });
  }

  if (body.action === "delete") {
    if (typeof body.postId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.postId)) return json({ error: "invalid_post" }, 400);
    const post = await env.DB.prepare("SELECT author_hash FROM essor_circle_posts WHERE id = ? LIMIT 1").bind(body.postId).first<{ author_hash: string }>();
    if (!post) return json({ error: "post_not_found" }, 404);
    if (post.author_hash !== memberHash) return json({ error: "forbidden" }, 403);
    await env.DB.batch([
      env.DB.prepare("DELETE FROM essor_circle_supports WHERE post_id = ?").bind(body.postId),
      env.DB.prepare("DELETE FROM essor_circle_reports WHERE post_id = ?").bind(body.postId),
      env.DB.prepare("DELETE FROM essor_circle_posts WHERE id = ?").bind(body.postId),
    ]);
    return json({ deleted: true });
  }

  return json({ error: "invalid_action" }, 400);
}

async function upsertSubscription(env: Env, record: {
  subscriptionId: string;
  checkoutSessionId?: string | null;
  customerId?: string | null;
  plan?: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number | null;
  trialEnd?: number | null;
}) {
  await ensureSubscriptionSchema(env);
  await env.DB.prepare(`INSERT INTO essor_subscriptions (
      subscription_id, checkout_session_id, customer_id, plan, status,
      cancel_at_period_end, current_period_end, trial_end, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(subscription_id) DO UPDATE SET
      checkout_session_id = COALESCE(excluded.checkout_session_id, checkout_session_id),
      customer_id = COALESCE(excluded.customer_id, customer_id),
      plan = excluded.plan,
      status = excluded.status,
      cancel_at_period_end = excluded.cancel_at_period_end,
      current_period_end = excluded.current_period_end,
      trial_end = excluded.trial_end,
      updated_at = excluded.updated_at`)
    .bind(
      record.subscriptionId,
      record.checkoutSessionId ?? null,
      record.customerId ?? null,
      record.plan === "annual" ? "annual" : "monthly",
      record.status ?? "trialing",
      record.cancelAtPeriodEnd ? 1 : 0,
      record.currentPeriodEnd ?? null,
      record.trialEnd ?? null,
      Math.floor(Date.now() / 1000),
    )
    .run();
}

async function getSubscriptionBySession(env: Env, checkoutSessionId: string) {
  await ensureSubscriptionSchema(env);
  return env.DB.prepare(`SELECT subscription_id, checkout_session_id, customer_id, plan, status,
      cancel_at_period_end, current_period_end, trial_end
    FROM essor_subscriptions WHERE checkout_session_id = ? LIMIT 1`)
    .bind(checkoutSessionId)
    .first<SubscriptionRecord>();
}

function objectId(value: string | { id?: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function planFromSubscription(subscription: StripeSubscription) {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const pricePlan = priceId ? ESSOR_PRICE_PLANS.get(priceId) : undefined;
  if (pricePlan) return pricePlan;
  return subscription.metadata?.cadence === "annual" ? "annual" : subscription.metadata?.cadence === "monthly" ? "monthly" : null;
}

function periodEndFromSubscription(subscription: StripeSubscription) {
  return subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end ?? null;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function requestIsSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function readSessionId(request: Request) {
  const raw = await request.text();
  if (raw.length > 8_000) return null;
  try {
    const body = JSON.parse(raw) as { sessionId?: unknown };
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    return /^cs_[A-Za-z0-9_]+$/.test(sessionId) ? sessionId : null;
  } catch {
    return null;
  }
}

function base64Url(input: Uint8Array | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pkcs8Bytes(pem: string) {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function googleAccessToken(env: Env) {
  const now = Math.floor(Date.now() / 1000);
  if (googleAccessTokenCache && googleAccessTokenCache.expiresAt > now + 90) return googleAccessTokenCache.token;
  if (!env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) throw new Error("google_play_not_configured");

  const credentials = JSON.parse(env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) as { client_email?: string; private_key?: string };
  if (!credentials.client_email || !credentials.private_key) throw new Error("invalid_google_credentials");
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: GOOGLE_OAUTH_SCOPE,
    aud: GOOGLE_OAUTH_AUDIENCE,
    iat: now,
    exp: now + 3_300,
  }));
  const unsignedJwt = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8Bytes(credentials.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsignedJwt));
  const assertion = `${unsignedJwt}.${base64Url(new Uint8Array(signature))}`;
  const tokenResponse = await fetch(GOOGLE_OAUTH_AUDIENCE, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const tokenBody = await tokenResponse.json() as { access_token?: string; expires_in?: number };
  if (!tokenResponse.ok || !tokenBody.access_token) throw new Error("google_oauth_failed");
  googleAccessTokenCache = { token: tokenBody.access_token, expiresAt: now + (tokenBody.expires_in ?? 3_600) };
  return tokenBody.access_token;
}

async function readPlayPurchase(request: Request) {
  const raw = await request.text();
  if (raw.length > 12_000) return null;
  try {
    const body = JSON.parse(raw) as { purchaseToken?: unknown; productId?: unknown };
    const purchaseToken = typeof body.purchaseToken === "string" ? body.purchaseToken : "";
    const productId = typeof body.productId === "string" ? body.productId : "";
    if (purchaseToken.length < 20 || purchaseToken.length > 8_000 || /\s/.test(purchaseToken) || !GOOGLE_PLAY_PRODUCTS.has(productId)) return null;
    return { purchaseToken, productId };
  } catch {
    return null;
  }
}

async function handleGooglePlayVerification(request: Request, env: Env) {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!requestIsSameOrigin(request)) return json({ error: "forbidden" }, 403);
  const purchase = await readPlayPurchase(request);
  if (!purchase) return json({ error: "invalid_purchase" }, 400);

  try {
    const accessToken = await googleAccessToken(env);
    const verificationUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE_ID}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchase.purchaseToken)}`;
    const verificationResponse = await fetch(verificationUrl, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const verification = await verificationResponse.json() as {
      subscriptionState?: string;
      acknowledgementState?: string;
      lineItems?: Array<{ productId?: string; expiryTime?: string }>;
    };
    if (!verificationResponse.ok) return json({ error: "purchase_verification_failed" }, 403);
    const matchingItem = verification.lineItems?.find((item) => item.productId === purchase.productId);
    if (!matchingItem) return json({ error: "product_mismatch" }, 403);

    const currentPeriodEnd = matchingItem.expiryTime ? Math.floor(new Date(matchingItem.expiryTime).getTime() / 1000) : null;
    const state = verification.subscriptionState ?? "";
    const active = state === "SUBSCRIPTION_STATE_ACTIVE" || state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ||
      (state === "SUBSCRIPTION_STATE_CANCELED" && Boolean(currentPeriodEnd && currentPeriodEnd > Math.floor(Date.now() / 1000)));
    if (!active) return json({ active: false, state }, 403);

    if (verification.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
      const acknowledgeUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE_ID}/purchases/subscriptions/${purchase.productId}/tokens/${encodeURIComponent(purchase.purchaseToken)}:acknowledge`;
      const acknowledgement = await fetch(acknowledgeUrl, {
        method: "POST",
        headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
        body: "{}",
      });
      if (!acknowledgement.ok) return json({ error: "purchase_acknowledgement_failed" }, 503);
    }

    return json({
      active: true,
      status: state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ? "past_due" : "active",
      plan: GOOGLE_PLAY_PRODUCTS.get(purchase.productId),
      currentPeriodEnd,
      cancelAtPeriodEnd: state === "SUBSCRIPTION_STATE_CANCELED",
    });
  } catch (error) {
    return json({ error: error instanceof Error && error.message === "google_play_not_configured" ? "google_play_not_configured" : "google_play_unavailable" }, 503);
  }
}

function timingSafeEqualHex(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const values = signatureHeader.split(",").reduce<Record<string, string[]>>((result, part) => {
    const [key, value] = part.split("=", 2);
    if (key && value) (result[key] ??= []).push(value);
    return result;
  }, {});
  const timestamp = Number(values.t?.[0]);
  if (!Number.isFinite(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return (values.v1 ?? []).some((candidate) => timingSafeEqualHex(candidate, expected));
}

async function handleSubscriptionVerification(request: Request, env: Env) {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!requestIsSameOrigin(request)) return json({ error: "forbidden" }, 403);
  const sessionId = await readSessionId(request);
  if (!sessionId) return json({ error: "invalid_session" }, 400);
  try {
    const record = await getSubscriptionBySession(env, sessionId);
    if (!record) return json({ active: false, pending: true }, 202);
    const active = ["trialing", "active", "past_due"].includes(record.status);
    return json({
      active,
      status: record.status,
      plan: record.plan === "annual" ? "annual" : "monthly",
      cancelAtPeriodEnd: Boolean(record.cancel_at_period_end),
      currentPeriodEnd: record.current_period_end ?? null,
      trialEnd: record.trial_end ?? null,
    }, active ? 200 : 403);
  } catch {
    return json({ error: "verification_failed" }, 503);
  }
}

async function handlePortalSession(request: Request, env: Env) {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!requestIsSameOrigin(request)) return json({ error: "forbidden" }, 403);
  const sessionId = await readSessionId(request);
  if (!sessionId) return json({ error: "invalid_session" }, 400);
  if (env.STRIPE_PORTAL_URL?.startsWith("https://billing.stripe.com/")) return json({ url: env.STRIPE_PORTAL_URL });
  return json({ error: "portal_unavailable" }, 503);
}

async function handleStripeWebhook(request: Request, env: Env) {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: "webhook_not_configured" }, 503);
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();
  if (!signature || payload.length > 1_000_000 || !(await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET))) {
    return json({ error: "invalid_signature" }, 400);
  }
  let event: { id?: string; type?: string; data?: { object?: unknown } };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return json({ error: "invalid_event" }, 400);
  }
  if (!event.id || !event.type) return json({ error: "invalid_event" }, 400);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data?.object as StripeCheckoutSession | undefined;
      const paymentLink = typeof session?.payment_link === "string" ? session.payment_link : null;
      const plan = paymentLink ? ESSOR_PAYMENT_LINK_PLANS.get(paymentLink) : undefined;
      const subscriptionId = objectId(session?.subscription ?? null);
      const fromEssor = session?.metadata?.app === "essor" && Boolean(paymentLink && ESSOR_PAYMENT_LINKS.has(paymentLink));
      if (session?.id && subscriptionId && plan && fromEssor && session.mode === "subscription" && session.status === "complete") {
        const expanded = typeof session.subscription === "object" ? session.subscription : null;
        await upsertSubscription(env, {
          subscriptionId,
          checkoutSessionId: session.id,
          customerId: objectId(session.customer),
          plan,
          status: expanded?.status ?? "trialing",
          cancelAtPeriodEnd: expanded?.cancel_at_period_end,
          currentPeriodEnd: expanded ? periodEndFromSubscription(expanded) : null,
          trialEnd: expanded?.trial_end,
        });
      }
    }

    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      const subscription = event.data?.object as StripeSubscription | undefined;
      const plan = subscription ? planFromSubscription(subscription) : null;
      if (subscription?.id && plan) {
        await upsertSubscription(env, {
          subscriptionId: subscription.id,
          customerId: objectId(subscription.customer),
          plan,
          status: event.type === "customer.subscription.deleted" ? "canceled" : subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: periodEndFromSubscription(subscription),
          trialEnd: subscription.trial_end,
        });
      }
    }

    return json({ received: true });
  } catch {
    return json({ error: "webhook_processing_failed" }, 500);
  }
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/stripe/verify") return handleSubscriptionVerification(request, env);
    if (url.pathname === "/api/stripe/portal") return handlePortalSession(request, env);
    if (url.pathname === "/api/stripe/webhook") return handleStripeWebhook(request, env);
    if (url.pathname === "/api/google-play/verify") return handleGooglePlayVerification(request, env);
    if (url.pathname === "/api/circle") return handleCircle(request, env);
    if (url.pathname === "/api/presence") return handlePresence(request, env);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;

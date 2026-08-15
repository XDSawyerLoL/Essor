import express from "express";
import { createHash, createHmac, createSign, randomUUID, timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import { db, initSchema, withTransaction } from "./db.mjs";

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || "https://essor-app.fr";
const STATIC_DIR = resolve(process.env.STATIC_DIR || "hostinger-dist/public");

const ESSOR_PAYMENT_LINKS = new Set(["plink_1U4IqiJ0vNrYb7NJWgczbjet", "plink_1U4IqvJ0vNrYb7NJUMfRIfIO"]);
const ESSOR_PRICE_PLANS = new Map([
  ["price_1U4IpPJ0vNrYb7NJUxi9J0Wq", "monthly"],
  ["price_1U4IpYJ0vNrYb7NJ4CFcdHKL", "annual"],
]);
const ESSOR_PAYMENT_LINK_PLANS = new Map([
  ["plink_1U4IqiJ0vNrYb7NJWgczbjet", "monthly"],
  ["plink_1U4IqvJ0vNrYb7NJUMfRIfIO", "annual"],
]);
const GOOGLE_PLAY_PRODUCTS = new Map([
  ["essor_plus_monthly", "monthly"],
  ["essor_plus_annual", "annual"],
]);
const GOOGLE_OAUTH_SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const GOOGLE_OAUTH_AUDIENCE = "https://oauth2.googleapis.com/token";
const ANDROID_PACKAGE_ID = "com.xdsawyer.essor";
const CIRCLE_MESSAGE_KEYS = new Set(["still_here", "crossed_wave", "restart", "one_more_day", "asked_help", "not_alone"]);
const CIRCLE_ADJECTIVES = ["Courageux", "Lumineux", "Serein", "Vaillant", "Libre", "Solidaire", "Patient", "Tenace"];
const CIRCLE_ANIMALS = ["Renard", "Colibri", "Blaireau", "Loutre", "Hibou", "Dauphin", "Lynx", "Panda"];
let googleAccessTokenCache = null;

function apiHeaders(res) {
  res.set({
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
  });
}

app.use((req, res, next) => {
  res.set({
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
  });
  next();
});

function requestOrigin(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function sameOrigin(req) {
  const origin = req.get("origin");
  return !origin || origin === requestOrigin(req) || origin === PUBLIC_ORIGIN;
}

function rejectCrossOrigin(req, res) {
  if (sameOrigin(req)) return false;
  apiHeaders(res);
  res.status(403).json({ error: "forbidden" });
  return true;
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function validCircleMember(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validPostId(value) {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
}

function circleAlias(hash) {
  const first = Number.parseInt(hash.slice(0, 4), 16) % CIRCLE_ADJECTIVES.length;
  const second = Number.parseInt(hash.slice(4, 8), 16) % CIRCLE_ANIMALS.length;
  return `${CIRCLE_ANIMALS[second]} ${CIRCLE_ADJECTIVES[first]}`;
}

function serializeCirclePost(post, memberHash) {
  return {
    id: post.id,
    alias: post.alias,
    messageKey: post.message_key,
    days: post.days === null ? null : Number(post.days),
    createdAt: Number(post.created_at),
    supportCount: Number(post.support_count) || 0,
    supported: Boolean(post.supported),
    mine: post.author_hash === memberHash,
  };
}

async function listCirclePosts(memberHash) {
  const since = Math.floor(Date.now() / 1000) - 30 * 86_400;
  await db().execute("DELETE FROM essor_circle_posts WHERE created_at < ?", [since]);
  const [rows] = await db().execute(
    `SELECT
      p.id, p.author_hash, p.alias, p.message_key, p.days, p.created_at,
      COUNT(s.supporter_hash) AS support_count,
      MAX(CASE WHEN s.supporter_hash = ? THEN 1 ELSE 0 END) AS supported
    FROM essor_circle_posts p
    LEFT JOIN essor_circle_supports s ON s.post_id = p.id
    WHERE p.created_at >= ?
      AND (SELECT COUNT(*) FROM essor_circle_reports r WHERE r.post_id = p.id) < 3
    GROUP BY p.id, p.author_hash, p.alias, p.message_key, p.days, p.created_at
    ORDER BY p.created_at DESC
    LIMIT 40`,
    [memberHash, since],
  );
  return rows.map((post) => serializeCirclePost(post, memberHash));
}

app.post("/api/presence", express.json({ limit: "2kb" }), async (req, res) => {
  apiHeaders(res);
  if (rejectCrossOrigin(req, res)) return;
  const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId : "";
  const action = req.body?.action === "delete" ? "delete" : "heartbeat";
  if (!validCircleMember(sessionId)) return res.status(400).json({ error: "invalid_session" });

  try {
    const now = Math.floor(Date.now() / 1000);
    const sessionHash = sha256Hex(sessionId);
    if (action === "delete") {
      await db().execute("DELETE FROM essor_presence WHERE session_hash = ?", [sessionHash]);
      return res.json({ deleted: true });
    }

    await db().execute("DELETE FROM essor_presence WHERE last_seen < ?", [now - 86_400]);
    await db().execute(
      "INSERT INTO essor_presence (session_hash, last_seen) VALUES (?, ?) ON DUPLICATE KEY UPDATE last_seen = VALUES(last_seen)",
      [sessionHash, now],
    );
    const [rows] = await db().execute(
      `SELECT
        COALESCE(SUM(CASE WHEN last_seen >= ? THEN 1 ELSE 0 END), 0) AS live,
        COUNT(*) AS today
      FROM essor_presence
      WHERE last_seen >= ?`,
      [now - 180, now - 86_400],
    );
    const counts = rows[0] || {};
    return res.json({ live: Number(counts.live) || 1, today: Number(counts.today) || 1 });
  } catch (error) {
    console.error("presence", error);
    return res.status(503).json({ error: "presence_unavailable" });
  }
});

app.get("/api/circle", async (req, res) => {
  apiHeaders(res);
  if (rejectCrossOrigin(req, res)) return;
  const memberId = typeof req.query.member === "string" ? req.query.member : "";
  if (!validCircleMember(memberId)) return res.status(400).json({ error: "invalid_member" });
  try {
    const memberHash = sha256Hex(memberId);
    return res.json({ posts: await listCirclePosts(memberHash) });
  } catch (error) {
    console.error("circle:list", error);
    return res.status(503).json({ error: "circle_unavailable" });
  }
});

app.post("/api/circle", express.json({ limit: "3kb" }), async (req, res) => {
  apiHeaders(res);
  if (rejectCrossOrigin(req, res)) return;
  const body = req.body || {};
  if (!validCircleMember(body.memberId)) return res.status(400).json({ error: "invalid_member" });

  const memberHash = sha256Hex(body.memberId);
  const now = Math.floor(Date.now() / 1000);
  try {
    if (body.action === "publish") {
      if (typeof body.messageKey !== "string" || !CIRCLE_MESSAGE_KEYS.has(body.messageKey)) return res.status(400).json({ error: "invalid_message" });
      const [recentRows] = await db().execute(
        "SELECT COUNT(*) AS count FROM essor_circle_posts WHERE author_hash = ? AND created_at >= ?",
        [memberHash, now - 86_400],
      );
      if (Number(recentRows[0]?.count) >= 3) return res.status(429).json({ error: "rate_limited" });
      const id = randomUUID();
      const days = typeof body.days === "number" && Number.isInteger(body.days) ? Math.max(0, Math.min(9_999, body.days)) : null;
      const alias = circleAlias(memberHash);
      await db().execute(
        "INSERT INTO essor_circle_posts (id, author_hash, alias, message_key, days, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [id, memberHash, alias, body.messageKey, days, now],
      );
      return res.status(201).json({ post: { id, alias, messageKey: body.messageKey, days, createdAt: now, supportCount: 0, supported: false, mine: true } });
    }

    if (body.action === "delete_all") {
      await withTransaction(async (connection) => {
        await connection.execute("DELETE FROM essor_circle_posts WHERE author_hash = ?", [memberHash]);
        await connection.execute("DELETE FROM essor_circle_supports WHERE supporter_hash = ?", [memberHash]);
        await connection.execute("DELETE FROM essor_circle_reports WHERE reporter_hash = ?", [memberHash]);
      });
      return res.json({ deleted: true });
    }

    if (body.action === "support") {
      if (!validPostId(body.postId)) return res.status(400).json({ error: "invalid_post" });
      const [postRows] = await db().execute("SELECT author_hash FROM essor_circle_posts WHERE id = ? LIMIT 1", [body.postId]);
      const post = postRows[0];
      if (!post) return res.status(404).json({ error: "post_not_found" });
      if (post.author_hash === memberHash) return res.status(400).json({ error: "own_post" });
      const [recentRows] = await db().execute(
        "SELECT COUNT(*) AS count FROM essor_circle_supports WHERE supporter_hash = ? AND created_at >= ?",
        [memberHash, now - 86_400],
      );
      if (Number(recentRows[0]?.count) >= 60) return res.status(429).json({ error: "rate_limited" });
      await db().execute(
        "INSERT IGNORE INTO essor_circle_supports (post_id, supporter_hash, created_at) VALUES (?, ?, ?)",
        [body.postId, memberHash, now],
      );
      const [countRows] = await db().execute("SELECT COUNT(*) AS count FROM essor_circle_supports WHERE post_id = ?", [body.postId]);
      return res.json({ supported: true, supportCount: Number(countRows[0]?.count) || 0 });
    }

    if (body.action === "report") {
      if (!validPostId(body.postId)) return res.status(400).json({ error: "invalid_post" });
      const [postRows] = await db().execute("SELECT author_hash FROM essor_circle_posts WHERE id = ? LIMIT 1", [body.postId]);
      const post = postRows[0];
      if (!post) return res.status(404).json({ error: "post_not_found" });
      if (post.author_hash === memberHash) return res.status(400).json({ error: "own_post" });
      const [recentRows] = await db().execute(
        "SELECT COUNT(*) AS count FROM essor_circle_reports WHERE reporter_hash = ? AND created_at >= ?",
        [memberHash, now - 86_400],
      );
      if (Number(recentRows[0]?.count) >= 20) return res.status(429).json({ error: "rate_limited" });
      await db().execute(
        "INSERT IGNORE INTO essor_circle_reports (post_id, reporter_hash, created_at) VALUES (?, ?, ?)",
        [body.postId, memberHash, now],
      );
      const [countRows] = await db().execute("SELECT COUNT(*) AS count FROM essor_circle_reports WHERE post_id = ?", [body.postId]);
      return res.json({ reported: true, hidden: Number(countRows[0]?.count) >= 3 });
    }

    if (body.action === "delete") {
      if (!validPostId(body.postId)) return res.status(400).json({ error: "invalid_post" });
      const [postRows] = await db().execute("SELECT author_hash FROM essor_circle_posts WHERE id = ? LIMIT 1", [body.postId]);
      const post = postRows[0];
      if (!post) return res.status(404).json({ error: "post_not_found" });
      if (post.author_hash !== memberHash) return res.status(403).json({ error: "forbidden" });
      await db().execute("DELETE FROM essor_circle_posts WHERE id = ?", [body.postId]);
      return res.json({ deleted: true });
    }

    return res.status(400).json({ error: "invalid_action" });
  } catch (error) {
    console.error("circle:write", error);
    return res.status(503).json({ error: "circle_unavailable" });
  }
});

function objectId(value) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function planFromSubscription(subscription) {
  const priceId = subscription?.items?.data?.[0]?.price?.id;
  const pricePlan = priceId ? ESSOR_PRICE_PLANS.get(priceId) : undefined;
  if (pricePlan) return pricePlan;
  return subscription?.metadata?.cadence === "annual" ? "annual" : subscription?.metadata?.cadence === "monthly" ? "monthly" : null;
}

function periodEndFromSubscription(subscription) {
  return subscription?.current_period_end ?? subscription?.items?.data?.[0]?.current_period_end ?? null;
}

async function upsertSubscription(record) {
  await db().execute(
    `INSERT INTO essor_subscriptions (
      subscription_id, checkout_session_id, customer_id, plan, status,
      cancel_at_period_end, current_period_end, trial_end, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      checkout_session_id = COALESCE(VALUES(checkout_session_id), checkout_session_id),
      customer_id = COALESCE(VALUES(customer_id), customer_id),
      plan = VALUES(plan),
      status = VALUES(status),
      cancel_at_period_end = VALUES(cancel_at_period_end),
      current_period_end = VALUES(current_period_end),
      trial_end = VALUES(trial_end),
      updated_at = VALUES(updated_at)`,
    [
      record.subscriptionId,
      record.checkoutSessionId ?? null,
      record.customerId ?? null,
      record.plan === "annual" ? "annual" : "monthly",
      record.status ?? "trialing",
      record.cancelAtPeriodEnd ? 1 : 0,
      record.currentPeriodEnd ?? null,
      record.trialEnd ?? null,
      Math.floor(Date.now() / 1000),
    ],
  );
}

async function getSubscriptionBySession(sessionId) {
  const [rows] = await db().execute(
    `SELECT subscription_id, checkout_session_id, customer_id, plan, status,
      cancel_at_period_end, current_period_end, trial_end
    FROM essor_subscriptions WHERE checkout_session_id = ? LIMIT 1`,
    [sessionId],
  );
  return rows[0] || null;
}

function validCheckoutSession(sessionId) {
  return typeof sessionId === "string" && /^cs_[A-Za-z0-9_]+$/.test(sessionId);
}

app.post("/api/stripe/verify", express.json({ limit: "10kb" }), async (req, res) => {
  apiHeaders(res);
  if (rejectCrossOrigin(req, res)) return;
  const sessionId = req.body?.sessionId;
  if (!validCheckoutSession(sessionId)) return res.status(400).json({ error: "invalid_session" });
  try {
    const record = await getSubscriptionBySession(sessionId);
    if (!record) return res.status(202).json({ active: false, pending: true });
    const active = ["trialing", "active", "past_due"].includes(record.status);
    return res.status(active ? 200 : 403).json({
      active,
      status: record.status,
      plan: record.plan === "annual" ? "annual" : "monthly",
      cancelAtPeriodEnd: Boolean(record.cancel_at_period_end),
      currentPeriodEnd: record.current_period_end === null ? null : Number(record.current_period_end),
      trialEnd: record.trial_end === null ? null : Number(record.trial_end),
    });
  } catch (error) {
    console.error("stripe:verify", error);
    return res.status(503).json({ error: "verification_failed" });
  }
});

app.post("/api/stripe/portal", express.json({ limit: "10kb" }), (req, res) => {
  apiHeaders(res);
  if (rejectCrossOrigin(req, res)) return;
  if (!validCheckoutSession(req.body?.sessionId)) return res.status(400).json({ error: "invalid_session" });
  if (process.env.STRIPE_PORTAL_URL?.startsWith("https://billing.stripe.com/")) return res.json({ url: process.env.STRIPE_PORTAL_URL });
  return res.status(503).json({ error: "portal_unavailable" });
});

function verifyStripeSignature(payload, signatureHeader, secret) {
  const values = signatureHeader.split(",").reduce((result, part) => {
    const [key, value] = part.split("=", 2);
    if (key && value) (result[key] ??= []).push(value);
    return result;
  }, {});
  const timestamp = Number(values.t?.[0]);
  if (!Number.isFinite(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest();
  return (values.v1 ?? []).some((candidate) => {
    if (!/^[0-9a-f]{64}$/i.test(candidate)) return false;
    const actual = Buffer.from(candidate, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  });
}

app.post("/api/stripe/webhook", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
  apiHeaders(res);
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: "webhook_not_configured" });
  const signature = req.get("stripe-signature");
  const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  if (!signature || !payload || !verifyStripeSignature(payload, signature, secret)) return res.status(400).json({ error: "invalid_signature" });

  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return res.status(400).json({ error: "invalid_event" });
  }
  if (!event?.id || !event?.type) return res.status(400).json({ error: "invalid_event" });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      const paymentLink = typeof session?.payment_link === "string" ? session.payment_link : null;
      const plan = paymentLink ? ESSOR_PAYMENT_LINK_PLANS.get(paymentLink) : undefined;
      const subscriptionId = objectId(session?.subscription ?? null);
      const fromEssor = session?.metadata?.app === "essor" && Boolean(paymentLink && ESSOR_PAYMENT_LINKS.has(paymentLink));
      if (session?.id && subscriptionId && plan && fromEssor && session.mode === "subscription" && session.status === "complete") {
        const expanded = typeof session.subscription === "object" ? session.subscription : null;
        await upsertSubscription({
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
      const subscription = event.data?.object;
      const plan = subscription ? planFromSubscription(subscription) : null;
      if (subscription?.id && plan) {
        await upsertSubscription({
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
    return res.json({ received: true });
  } catch (error) {
    console.error("stripe:webhook", error);
    return res.status(500).json({ error: "webhook_processing_failed" });
  }
});

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

async function googleAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (googleAccessTokenCache && googleAccessTokenCache.expiresAt > now + 90) return googleAccessTokenCache.token;
  if (!process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) throw new Error("google_play_not_configured");

  const credentials = JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
  if (!credentials.client_email || !credentials.private_key) throw new Error("invalid_google_credentials");
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: GOOGLE_OAUTH_SCOPE,
    aud: GOOGLE_OAUTH_AUDIENCE,
    iat: now,
    exp: now + 3300,
  }));
  const unsignedJwt = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedJwt);
  signer.end();
  const assertion = `${unsignedJwt}.${signer.sign(credentials.private_key).toString("base64url")}`;
  const tokenResponse = await fetch(GOOGLE_OAUTH_AUDIENCE, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const tokenBody = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenBody.access_token) throw new Error("google_oauth_failed");
  googleAccessTokenCache = { token: tokenBody.access_token, expiresAt: now + (tokenBody.expires_in ?? 3600) };
  return tokenBody.access_token;
}

app.post("/api/google-play/verify", express.json({ limit: "15kb" }), async (req, res) => {
  apiHeaders(res);
  if (rejectCrossOrigin(req, res)) return;
  const purchaseToken = typeof req.body?.purchaseToken === "string" ? req.body.purchaseToken : "";
  const productId = typeof req.body?.productId === "string" ? req.body.productId : "";
  if (purchaseToken.length < 20 || purchaseToken.length > 8000 || /\s/.test(purchaseToken) || !GOOGLE_PLAY_PRODUCTS.has(productId)) {
    return res.status(400).json({ error: "invalid_purchase" });
  }

  try {
    const accessToken = await googleAccessToken();
    const verificationUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE_ID}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;
    const verificationResponse = await fetch(verificationUrl, { headers: { authorization: `Bearer ${accessToken}` } });
    const verification = await verificationResponse.json();
    if (!verificationResponse.ok) return res.status(403).json({ error: "purchase_verification_failed" });
    const matchingItem = verification.lineItems?.find((item) => item.productId === productId);
    if (!matchingItem) return res.status(403).json({ error: "product_mismatch" });

    const currentPeriodEnd = matchingItem.expiryTime ? Math.floor(new Date(matchingItem.expiryTime).getTime() / 1000) : null;
    const state = verification.subscriptionState ?? "";
    const active = state === "SUBSCRIPTION_STATE_ACTIVE" || state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ||
      (state === "SUBSCRIPTION_STATE_CANCELED" && Boolean(currentPeriodEnd && currentPeriodEnd > Math.floor(Date.now() / 1000)));
    if (!active) return res.status(403).json({ active: false, state });

    if (verification.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
      const acknowledgeUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE_ID}/purchases/subscriptions/${productId}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`;
      const acknowledgement = await fetch(acknowledgeUrl, {
        method: "POST",
        headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
        body: "{}",
      });
      if (!acknowledgement.ok) return res.status(503).json({ error: "purchase_acknowledgement_failed" });
    }

    return res.json({
      active: true,
      status: state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ? "past_due" : "active",
      plan: GOOGLE_PLAY_PRODUCTS.get(productId),
      currentPeriodEnd,
      cancelAtPeriodEnd: state === "SUBSCRIPTION_STATE_CANCELED",
    });
  } catch (error) {
    console.error("google-play", error);
    return res.status(503).json({ error: error?.message === "google_play_not_configured" ? "google_play_not_configured" : "google_play_unavailable" });
  }
});

app.get("/api/health", async (_req, res) => {
  apiHeaders(res);
  try {
    await db().query("SELECT 1 AS ok");
    return res.json({ ok: true, service: "essor", database: "mysql" });
  } catch (error) {
    console.error("health", error);
    return res.status(503).json({ ok: false, database: "unavailable" });
  }
});

app.use(express.static(STATIC_DIR, {
  index: "index.html",
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith("index.html") || filePath.endsWith("manifest.webmanifest")) res.setHeader("cache-control", "no-cache");
    if (filePath.includes("/.well-known/")) res.setHeader("cache-control", "public, max-age=300");
  },
}));

app.get("*", (_req, res) => res.sendFile(resolve(STATIC_DIR, "index.html")));

app.use((error, _req, res, _next) => {
  console.error("unhandled", error);
  apiHeaders(res);
  if (!res.headersSent) res.status(500).json({ error: "internal_error" });
});

await initSchema();
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`ESSOR Hostinger listening on :${PORT}`);
});

function shutdown(signal) {
  console.log(`ESSOR received ${signal}`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

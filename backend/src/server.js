import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { getSupabase } from "./supabase.js";
import { searchGooglePlaces } from "./services/googlePlaces.js";
import { scanWebsite } from "./services/siteScanner.js";
import { generateDiagnosis } from "./services/aiDiagnosis.js";
import { getLiveIntegrationStatus, getStaticIntegrationStatus, testIntegration, validatePageSpeed } from "./services/integrations.js";
import { leadsToCsv } from "./services/csv.js";

const app = express();
const rateLimitBuckets = new Map();

const allowedOrigins = new Set([
  config.frontendOrigin,
  config.productionFrontendOrigin,
  "https://edipocamposlima-alt.github.io",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "null"
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.use((request, response, next) => {
  const ip = request.headers["x-forwarded-for"]?.toString().split(",")[0] || request.socket.remoteAddress || "unknown";
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip) || { count: 0, resetAt: now + 60_000 };

  if (bucket.resetAt < now) {
    bucket.count = 0;
    bucket.resetAt = now + 60_000;
  }

  bucket.count += 1;
  rateLimitBuckets.set(ip, bucket);

  if (bucket.count > 120) {
    return response.status(429).json({ error: "Rate limit exceeded. Try again in a few seconds." });
  }

  return next();
});

app.use((request, response, next) => {
  if (!config.ownerToken) return next();

  const token = request.headers.authorization?.replace("Bearer ", "");
  if (token !== config.ownerToken) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  return next();
});

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "nodere-mvp-api" });
});

app.get("/api/v1/integrations/status", async (request, response, next) => {
  try {
    const live = request.query.live === "1" || request.query.live === "true";
    const integrations = live ? await getLiveIntegrationStatus() : getStaticIntegrationStatus();
    response.json({
      ok: true,
      live,
      integrations,
      ready: integrations.filter((item) => item.required).every((item) => item.configured && item.status !== "error")
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/v1/integrations/test", async (request, response, next) => {
  try {
    const integration = await testIntegration(request.body.key);
    response.json({ integration });
  } catch (error) {
    next(error);
  }
});

app.post("/api/v1/ai/diagnosis", async (request, response, next) => {
  try {
    const diagnosis = await generateDiagnosis(request.body.lead || request.body, request.body.pageSpeed || request.body.scan || null, request.body);
    response.json({ mode: config.openaiApiKey ? "openai" : "template", diagnosis });
  } catch (error) {
    next(error);
  }
});

app.post("/api/openai", async (request, response, next) => {
  try {
    const diagnosis = await generateDiagnosis(request.body.lead || request.body, request.body.pageSpeed || request.body.scan || null, request.body);
    response.json({ mode: config.openaiApiKey ? "openai" : "server-fallback", diagnosis });
  } catch (error) {
    next(error);
  }
});

app.post("/api/v1/pagespeed", async (request, response, next) => {
  try {
    const message = await validatePageSpeed(request.body.url || "https://www.wikipedia.org");
    response.json({ status: "connected", message });
  } catch (error) {
    next(error);
  }
});

app.post("/api/v1/jobs/discovery", async (request, response, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("mvp_crm_events")
      .insert({
        lead_id: request.body.leadId,
        event_type: "discovery_job_requested",
        body: JSON.stringify({
          city: request.body.city,
          state: request.body.state,
          segment: request.body.segment,
          radiusKm: request.body.radiusKm,
          providers: request.body.providers || ["google_places"]
        })
      })
      .select()
      .single();

    if (error) throw error;
    response.status(202).json({
      status: "queued_placeholder",
      event: data,
      note: "For production, move this to a jobs table with Redis/BullMQ or Cloud Tasks."
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/v1/search/google-places", async (request, response, next) => {
  try {
    const results = await searchGooglePlaces(request.body);
    try {
      const supabase = getSupabase();
      await supabase.from("mvp_searches").insert({
        city: request.body.city || null,
        state: request.body.state || null,
        segment: request.body.segment || null,
        keyword: request.body.keyword || null,
        provider: "google_places",
        result_count: results.length
      });
    } catch (_error) {
      // Search must remain usable while the database is being provisioned.
    }
    response.json({ results });
  } catch (error) {
    next(error);
  }
});

app.get("/api/v1/leads", async (_request, response, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("mvp_leads")
      .select("*, mvp_site_scans(*), mvp_diagnoses(*), mvp_crm_events(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    response.json({ leads: data });
  } catch (error) {
    next(error);
  }
});

app.post("/api/v1/leads", async (request, response, next) => {
  try {
    const supabase = getSupabase();
    const payload = {
      company_name: request.body.companyName || request.body.company_name,
      google_place_id: request.body.googlePlaceId || request.body.google_place_id || null,
      phone: request.body.phone || null,
      whatsapp: request.body.whatsapp || null,
      website: request.body.website || null,
      address: request.body.address || null,
      city: request.body.city || null,
      state: request.body.state || null,
      segment: request.body.segment || null,
      google_rating: request.body.googleRating || request.body.google_rating || null,
      google_reviews: request.body.googleReviews || request.body.google_reviews || 0,
      google_maps_url: request.body.googleMapsUrl || request.body.google_maps_url || null,
      status: request.body.status || "lead_new",
      source: request.body.source || "google_places"
    };

    const { data, error } = await supabase.from("mvp_leads").insert(payload).select().single();
    if (error) throw error;
    response.status(201).json({ lead: data });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/v1/leads/:id/status", async (request, response, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("mvp_leads")
      .update({ status: request.body.status, updated_at: new Date().toISOString() })
      .eq("id", request.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("mvp_crm_events").insert({
      lead_id: request.params.id,
      event_type: "status_changed",
      body: `Status atualizado para ${request.body.status}`
    });

    response.json({ lead: data });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/v1/leads/:id", async (request, response, next) => {
  try {
    const supabase = getSupabase();
    const payload = {
      company_name: request.body.companyName || request.body.company_name,
      phone: request.body.phone,
      whatsapp: request.body.whatsapp,
      website: request.body.website,
      address: request.body.address,
      city: request.body.city,
      state: request.body.state,
      segment: request.body.segment,
      notes: request.body.notes,
      updated_at: new Date().toISOString()
    };

    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    const { data, error } = await supabase.from("mvp_leads").update(payload).eq("id", request.params.id).select().single();
    if (error) throw error;
    response.json({ lead: data });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/v1/leads/:id", async (request, response, next) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("mvp_leads").delete().eq("id", request.params.id);
    if (error) throw error;
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/api/v1/tasks", async (_request, response, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("mvp_tasks").select("*, mvp_leads(company_name)").order("due_at", { ascending: true });
    if (error) throw error;
    response.json({ tasks: data });
  } catch (error) {
    next(error);
  }
});

app.post("/api/v1/tasks", async (request, response, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("mvp_tasks")
      .insert({
        lead_id: request.body.leadId || request.body.lead_id,
        title: request.body.title,
        description: request.body.description || null,
        due_at: request.body.dueAt || request.body.due_at || null,
        status: request.body.status || "open"
      })
      .select()
      .single();

    if (error) throw error;
    response.status(201).json({ task: data });
  } catch (error) {
    next(error);
  }
});

app.post("/api/v1/whatsapp/send", async (request, response, next) => {
  try {
    if (!config.whatsappCloudToken || !config.whatsappPhoneNumberId) {
      const error = new Error("WHATSAPP_CLOUD_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required to send messages.");
      error.status = 503;
      throw error;
    }

    const to = String(request.body.to || "").replace(/\D/g, "");
    const text = String(request.body.text || "").trim();

    if (!to || !text) {
      const error = new Error("Informe destino e mensagem.");
      error.status = 400;
      throw error;
    }

    const responseApi = await fetch(`https://graph.facebook.com/v20.0/${config.whatsappPhoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.whatsappCloudToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.startsWith(config.whatsappDefaultCountryCode) ? to : `${config.whatsappDefaultCountryCode}${to}`,
        type: "text",
        text: { preview_url: false, body: text }
      })
    });

    const payload = await responseApi.json().catch(() => ({}));
    if (!responseApi.ok) {
      const error = new Error(payload?.error?.message || "WhatsApp Cloud API request failed.");
      error.status = responseApi.status;
      throw error;
    }

    response.json({ message: payload });
  } catch (error) {
    next(error);
  }
});

app.get("/api/v1/leads/:id/events", async (request, response, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("mvp_crm_events")
      .select("*")
      .eq("lead_id", request.params.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    response.json({ events: data });
  } catch (error) {
    next(error);
  }
});

app.post("/api/v1/leads/:id/events", async (request, response, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("mvp_crm_events")
      .insert({
        lead_id: request.params.id,
        event_type: request.body.eventType || request.body.event_type || "note",
        body: request.body.body
      })
      .select()
      .single();

    if (error) throw error;
    response.status(201).json({ event: data });
  } catch (error) {
    next(error);
  }
});

app.post("/api/v1/leads/:id/scan-site", async (request, response, next) => {
  try {
    const supabase = getSupabase();
    const { data: lead, error: leadError } = await supabase
      .from("mvp_leads")
      .select("*")
      .eq("id", request.params.id)
      .single();

    if (leadError) throw leadError;

    const scan = await scanWebsite(request.body.website || lead.website);
    const { data, error } = await supabase
      .from("mvp_site_scans")
      .insert({
        lead_id: lead.id,
        website: request.body.website || lead.website,
        scan_result: scan,
        score: scan.score
      })
      .select()
      .single();

    if (error) throw error;
    response.json({ scan: data });
  } catch (error) {
    next(error);
  }
});

app.post("/api/v1/leads/:id/diagnosis", async (_request, response, next) => {
  try {
    const supabase = getSupabase();
    const { data: lead, error: leadError } = await supabase
      .from("mvp_leads")
      .select("*")
      .eq("id", _request.params.id)
      .single();

    if (leadError) throw leadError;

    const { data: scans, error: scanError } = await supabase
      .from("mvp_site_scans")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (scanError) throw scanError;

    const diagnosis = await generateDiagnosis(lead, scans?.[0]?.scan_result || null);
    const { data, error } = await supabase
      .from("mvp_diagnoses")
      .insert({
        lead_id: lead.id,
        diagnosis,
        opportunity_score: diagnosis.opportunityScore
      })
      .select()
      .single();

    if (error) throw error;
    response.json({ diagnosis: data });
  } catch (error) {
    next(error);
  }
});

app.get("/api/v1/leads/export.csv", async (_request, response, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("mvp_leads")
      .select("*, mvp_diagnoses(opportunity_score)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const leads = data.map((lead) => ({
      ...lead,
      opportunity_score: lead.mvp_diagnoses?.[0]?.opportunity_score || ""
    }));

    response.setHeader("content-type", "text/csv; charset=utf-8");
    response.setHeader("content-disposition", "attachment; filename=nodere-leads.csv");
    response.send(leadsToCsv(leads));
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  const status = error.status || 500;
  response.status(status).json({
    error: error.message || "Internal server error"
  });
});

app.listen(config.port, () => {
  console.log(`Nodere MVP API running on http://localhost:${config.port}`);
});

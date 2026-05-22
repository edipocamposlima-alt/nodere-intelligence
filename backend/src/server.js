import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { getSupabase } from "./supabase.js";
import { searchGooglePlaces } from "./services/googlePlaces.js";
import { scanWebsite } from "./services/siteScanner.js";
import { generateDiagnosis } from "./services/aiDiagnosis.js";
import { leadsToCsv } from "./services/csv.js";

const app = express();

const allowedOrigins = new Set([
  config.frontendOrigin,
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

app.post("/api/v1/search/google-places", async (request, response, next) => {
  try {
    const results = await searchGooglePlaces(request.body);
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

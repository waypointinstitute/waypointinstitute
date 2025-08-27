// assets/js/portal.js
(function () {
  // --- helpers --------------------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const panels = $$(".panel");
  const pills  = $$("[data-step-pill]");
  const byPanel = n => $(`.panel[data-panel="${n}"]`);
  const byPill  = n => $(`[data-step-pill="${n}"]`);

  function gotoPanel(name) {
    panels.forEach(p => p.hidden = p.dataset.panel !== name);
    updateStepper(name);
    // scroll the active card into view (handy on mobile)
    const card = $("#portal-card");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateStepper(active) {
    const order = ["consent", "survey", "narrative", "complete"];
    pills.forEach(p => p.classList.remove("active", "done"));

    for (const id of order) {
      if (id === active) { byPill(id)?.classList.add("active"); break; }
      byPill(id)?.classList.add("done");
    }
  }

  // --- UI enable/disable rules ---------------------------------------------
  function validateConsent() {
    const ok = $("#consent_research_use")?.checked === true;
    $("#next-to-survey").disabled = !ok;
  }

  function validateSurvey() {
    const req = [
      $("#age_bracket")?.value,
      $("#sex")?.value,
      $("#religiosity")?.value
    ].every(Boolean);
    $("#next-to-narrative").disabled = !req;
  }

  function validateNarrative() {
    const txt = ($("#narrative_text")?.value || "").trim();
    // keep it permissive; you can raise the threshold later
    $("#submit-experience").disabled = (txt.length < 10);
  }

  // --- CSV fallback ---------------------------------------------------------
  function downloadCSV(obj) {
    const headers = Object.keys(obj);
    const row = headers.map(h =>
      `"${String(obj[h] ?? "").replace(/"/g, '""')}"`
    ).join(",");
    const csv = headers.join(",") + "\n" + row + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `waypoint_portal_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // --- submit to endpoint (Apps Script) ------------------------------------
  async function submitPayload(payload) {
    const cfg = window.PORTAL_CONFIG || {};
    const endpoint = cfg.endpoint || "";
    const method   = cfg.method || "POST";

    if (!endpoint) return { ok: false, reason: "no-endpoint" };

    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    };
    // allow no-cors or other overrides
    if (cfg.fetchOptions) Object.assign(opts, cfg.fetchOptions);

    try {
      const res = await fetch(endpoint, opts);
      // In no-cors, res.type === "opaque" (no status/ok). Treat that as success.
      if (res?.ok || res?.type === "opaque") return { ok: true };
      return { ok: false, reason: "bad-status" };
    } catch (e) {
      return { ok: false, reason: "network" };
    }
  }

  // --- main wiring ----------------------------------------------------------
  function wireUp() {
    // external form link (optional)
    const link = $("#portal-gform-link");
    const externalUrl = (window.PORTAL_CONFIG && window.PORTAL_CONFIG.externalFormUrl) || "";
    if (link) {
      if (externalUrl) link.href = externalUrl;
      else link.parentElement?.remove(); // remove the whole card if unused
    }

    // step 1: consent
    $("#consent_research_use")?.addEventListener("change", validateConsent);
    $("#consent_public_excerpt")?.addEventListener("change", validateConsent);
    $("#next-to-survey")?.addEventListener("click", () => gotoPanel("survey"));

    // step 2: survey fields
    ["#age_bracket","#sex","#religiosity","#tradition","#context","#country","#intensity","#duration_minutes"]
      .forEach(sel => $(sel)?.addEventListener("input", validateSurvey));
    $("#back-to-consent")?.addEventListener("click", () => gotoPanel("consent"));
    $("#next-to-narrative")?.addEventListener("click", () => gotoPanel("narrative"));

    // step 3: narrative
    $("#narrative_text")?.addEventListener("input", validateNarrative);
    $("#back-to-survey")?.addEventListener("click", () => gotoPanel("survey"));

    // submit
    $("#submit-experience")?.addEventListener("click", async () => {
      const payload = {
        timestamp: new Date().toISOString(),
        consent_research_use: $("#consent_research_use")?.checked || false,
        consent_public_excerpt: $("#consent_public_excerpt")?.checked || false,
        age_bracket: $("#age_bracket")?.value || "",
        sex: $("#sex")?.value || "",
        religiosity: $("#religiosity")?.value || "",
        tradition: $("#tradition")?.value || "",
        context: $("#context")?.value || "",
        country: $("#country")?.value || "",
        intensity: $("#intensity")?.value || "",
        duration_minutes: $("#duration_minutes")?.value || "",
        narrative_text: $("#narrative_text")?.value || "",
        ua: navigator.userAgent
      };

      const res = await submitPayload(payload);
      if (res.ok) {
        gotoPanel("complete");
      } else {
        // fallback
        downloadCSV(payload);
        alert("Submission failed. A file with your responses was downloaded as backup.");
      }
    });

    // initial state
    validateConsent();
    validateSurvey();
    validateNarrative();
    gotoPanel("consent");
  }

  // run
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireUp);
  } else {
    wireUp();
  }
})();

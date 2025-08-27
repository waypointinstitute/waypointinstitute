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
  // Sends application/x-www-form-urlencoded to avoid an OPTIONS preflight.
  async function submitPayload(payload) {
    const cfg = window.PORTAL_CONFIG || {};
    const endpoint = cfg.endpoint || "";
    if (!endpoint) return { ok: false, reason: "no-endpoint" };

    const formBody = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => {
      // Coerce booleans to "true"/"false" so Sheets shows something readable
      formBody.append(k, typeof v === "boolean" ? String(v) : (v ?? ""));
    });

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: formBody.toString()
      });
      // Apps Script responds 200 on success; treat non-2xx as failure
      if (res && res.ok) return { ok: true };
      return { ok: false, reason: `bad-status:${res?.status || "?"}` };
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
      else link.parentElement?.remove();
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
    $("#submit-experience")?.addEventListener("click", async (ev) => {
      const btn = ev.currentTarget;
      btn.disabled = true;

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
        downloadCSV(payload);
        alert("Submission couldn’t reach the server. A CSV backup was downloaded.");
      }

      btn.disabled = false;
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

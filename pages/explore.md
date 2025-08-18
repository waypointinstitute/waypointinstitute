---
layout: page
title: Explore
permalink: /explore/
---

<div class="explore-hero">
  <div class="explore-legend">
    <span class="dot dot-essays"></span> Essays
    <span class="dot dot-research"></span> Research
    <span class="dot dot-projects"></span> Projects
    <span class="dot dot-people"></span> People
    <span class="dot dot-publications"></span> Publications
  </div>
  <div id="starfield" class="starfield" aria-label="Explorable waypoints"></div>
  <div id="waypoint-tooltip" class="waypoint-tooltip" role="tooltip" hidden></div>
</div>

<script>
  window.WAYPOINT_ITEMS = [
    {% for i in site.essays %}
      {"t":"essays","title":{{ i.title | jsonify }},"url":"{{ i.url | relative_url }}"},
    {% endfor %}
    {% for i in site.research %}
      {"t":"research","title":{{ i.title | jsonify }},"url":"{{ i.url | relative_url }}"},
    {% endfor %}
    {% for i in site.projects %}
      {"t":"projects","title":{{ i.title | jsonify }},"url":"{{ i.url | relative_url }}"},
    {% endfor %}
    {% for i in site.people %}
      {"t":"people","title":{{ i.title | jsonify }},"url":"{{ i.url | relative_url }}"},
    {% endfor %}
    {% for i in site.publications %}
      {"t":"publications","title":{{ i.title | jsonify }},"url":"{{ i.url | relative_url }}"},
    {% endfor %}
  ];
</script>
<script src="{{ '/assets/js/explore.js' | relative_url }}" defer></script>

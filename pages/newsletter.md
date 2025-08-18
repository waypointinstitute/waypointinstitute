---
layout: page
title: Newsletter
permalink: /newsletter/
---

<section class="substack-feed">
  <h2>Latest from Substack (mirrored)</h2>

  {% assign posts = site.data.substack_mirrors | default: empty %}
  {% if posts and posts.size > 0 %}
    {% for p in posts %}
      <article class="substack-item">
        <h3 class="substack-title">
          {{ p.title }}
          <a class="substack-source" href="{{ p.url }}">↗ original</a>
        </h3>

        <div class="substack-html">
          {{ p.content | raw }}
        </div>
      </article>
    {% endfor %}
  {% else %}
    <p>No mirrored posts yet. Run the “Mirror Substack Posts” workflow in the <em>Actions</em> tab.</p>
  {% endif %}
</section>

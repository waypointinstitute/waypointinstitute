---
layout: page
title: Newsletter
permalink: /newsletter/
---

<div class="newsletter-intro">
  <p>Subscribe on Substack to receive essays, research notes, and project updates.</p>
</div>

<section class="substack-feed">
  <h2>Latest from Substack</h2>
  {% assign posts = site.data.substack | default: empty %}
  {% if posts and posts.size > 0 %}
    {% for p in posts %}
      <article class="substack-item">
        <h3 class="substack-title"><a href="{{ p.url }}">{{ p.title }}</a></h3>
        {% if p.date %}<div class="substack-date">{{ p.date | date: "%B %-d, %Y" }}</div>{% endif %}
        {% if p.html %}
          <div class="substack-html">
            {{ p.html | replace: 'src=\"/', 'src=\"https://YOUR-SUBDOMAIN.substack.com/' | raw }}
          </div>
          <p><a href="{{ p.url }}">Continue on Substack →</a></p>
        {% else %}
          {% if p.summary %}<p class="substack-summary">{{ p.summary }}</p>{% endif %}
          <p><a href="{{ p.url }}">Read on Substack →</a></p>
        {% endif %}
      </article>
    {% endfor %}
  {% else %}
    <p>No posts found yet. Check back soon.</p>
  {% endif %}
</section>

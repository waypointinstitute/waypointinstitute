---
layout: default
title: Projects
permalink: /projects/
---

{% assign items = site.projects | sort:'date' | reverse %}
{% include list.html items=items %}

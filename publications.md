---
layout: default
title: Publications
permalink: /publications/
---

{% assign items = site.publications | sort:'date' | reverse %}
{% include list.html items=items %}

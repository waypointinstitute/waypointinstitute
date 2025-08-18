---
layout: default
title: People
permalink: /people/
---

{% assign items = site.people | sort:'title' %}
{% include list.html items=items %}

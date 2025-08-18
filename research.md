---
layout: default
title: Research
permalink: /research/
---

{% assign items = site.research | where_exp:'i',"i.status != 'draft'" | sort:'date' | reverse %}
{% include list.html items=items %}

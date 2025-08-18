---
layout: default
title: Essays
permalink: /essays/
---

{% assign items = site.essays | where_exp:'i',"i.status != 'draft'" | sort:'date' | reverse %}
{% include list.html items=items %}

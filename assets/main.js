/* 一程 · shared reveal motion + first-screen kick */
(function () {
  var root = document.documentElement;
  var storageKey = "yicheng-theme";

  function preferredTheme() {
    var params = new URLSearchParams(window.location.search);
    var requested = params.get("theme");
    if (requested === "night" || requested === "day") {
      try { localStorage.setItem(storageKey, requested); } catch (err) {}
      return requested;
    }
    try {
      var stored = localStorage.getItem(storageKey);
      if (stored === "night" || stored === "day") return stored;
    } catch (err) {}
    return "day";
  }

  function applyCopy(theme) {
    document.querySelectorAll("[data-day], [data-night], [data-day-html], [data-night-html]").forEach(function (el) {
      var text = el.getAttribute(theme === "night" ? "data-night" : "data-day");
      var html = el.getAttribute(theme === "night" ? "data-night-html" : "data-day-html");
      if (html !== null) {
        el.innerHTML = html;
      } else if (text !== null) {
        el.textContent = text;
      }
    });
  }

  function icon(theme) {
    if (theme === "night") {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A8.5 8.5 0 1 1 11.21 3 6.7 6.7 0 0 0 21 12.79z"></path></svg>';
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    applyCopy(theme);
    document.querySelectorAll(".theme-toggle").forEach(function (button) {
      button.innerHTML = icon(theme);
      button.setAttribute("aria-label", theme === "night" ? "切换到白天模式" : "切换到黑夜模式");
      button.setAttribute("title", theme === "night" ? "白天模式" : "黑夜模式");
    });
  }

  function installThemeToggle() {
    document.querySelectorAll(".nav").forEach(function (nav) {
      if (nav.querySelector(".theme-toggle")) return;
      var button = document.createElement("button");
      button.type = "button";
      button.className = "theme-toggle";
      button.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "night" ? "day" : "night";
        try { localStorage.setItem(storageKey, next); } catch (err) {}
        applyTheme(next);
      });
      nav.appendChild(button);
    });
  }

  var initialTheme = preferredTheme();
  applyTheme(initialTheme);
  installThemeToggle();
  applyTheme(initialTheme);

  function stableRandom(seed) {
    var value = Math.sin(seed * 999) * 10000;
    return value - Math.floor(value);
  }

  function wrapTitle(title) {
    if (title.querySelector(".title-effect-text")) return null;

    var text = title.textContent.trim();
    var textWrap = document.createElement("span");
    textWrap.className = "title-effect-text";
    textWrap.setAttribute("aria-hidden", "true");

    Array.prototype.forEach.call(text, function (char, index) {
      var span = document.createElement("span");
      span.className = "title-effect-char";
      span.textContent = char;
      span.style.setProperty("--char-index", index);
      textWrap.appendChild(span);
    });

    title.textContent = "";
    title.setAttribute("aria-label", text);
    title.appendChild(textWrap);
    title.classList.add("is-title-ready");

    return { text: text, textWrap: textWrap, chars: Array.prototype.slice.call(textWrap.children) };
  }

  function setupClouds(title) {
    var clouds = [
      { x: "23%", y: "44%", w: "46%", h: "48%", dx: "-86px", dy: "-24px", rot: "-8deg", delay: "90ms", dur: "3100ms" },
      { x: "47%", y: "51%", w: "52%", h: "52%", dx: "14px", dy: "-70px", rot: "6deg", delay: "0ms", dur: "3400ms" },
      { x: "69%", y: "45%", w: "44%", h: "46%", dx: "92px", dy: "-20px", rot: "10deg", delay: "170ms", dur: "3300ms" },
      { x: "53%", y: "63%", w: "58%", h: "40%", dx: "36px", dy: "58px", rot: "-5deg", delay: "260ms", dur: "3600ms" }
    ];

    clouds.forEach(function (cloud) {
      var node = document.createElement("span");
      node.className = "title-cloud";
      Object.keys(cloud).forEach(function (key) {
        node.style.setProperty("--" + key, cloud[key]);
      });
      title.appendChild(node);
    });
  }

  function setupDushu(chars) {
    var order = { "札": 0, "桓": 1, "记": 2, "盤": 3, "盘": 3 };
    chars.forEach(function (char, index) {
      var rank = order[char.textContent] !== undefined ? order[char.textContent] : index;
      char.style.setProperty("--clear-delay", String(180 + rank * 560) + "ms");
    });
  }

  function setupKuangjia(chars) {
    chars.forEach(function (char, index) {
      char.style.setProperty("--build-delay", String(220 + index * 420) + "ms");
    });
  }

  function drawSpacedText(ctx, text, x, y, letterSpacing) {
    var chars = Array.prototype.slice.call(text);
    var widths = chars.map(function (char) { return ctx.measureText(char).width; });
    var total = widths.reduce(function (sum, width) { return sum + width; }, 0) + letterSpacing * Math.max(0, chars.length - 1);
    var cursor = x - total / 2;

    chars.forEach(function (char, index) {
      ctx.fillText(char, cursor + widths[index] / 2, y);
      cursor += widths[index] + letterSpacing;
    });
  }

  function setupPeopleLights(title, text) {
    var layer = document.createElement("span");
    layer.className = "title-lights";
    title.appendChild(layer);

    function renderLights() {
      var rect = title.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      var computed = window.getComputedStyle(title);
      var width = Math.max(320, Math.ceil(rect.width));
      var height = Math.max(110, Math.ceil(rect.height * 1.15));
      var fontSize = parseFloat(computed.fontSize) || 96;
      var letterSpacing = parseFloat(computed.letterSpacing) || fontSize * 0.25;
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      var points = [];

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#111";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = (computed.fontWeight || "300") + " " + fontSize + "px " + computed.fontFamily;
      drawSpacedText(ctx, text, width / 2, height / 2, letterSpacing);

      var data = ctx.getImageData(0, 0, width, height).data;
      var step = Math.max(5, Math.round(width / 92));

      for (var y = 0; y < height; y += step) {
        for (var x = 0; x < width; x += step) {
          if (data[(y * width + x) * 4 + 3] > 80) {
            points.push({ x: x, y: y });
          }
        }
      }

      points.sort(function (a, b) {
        return stableRandom(a.x * 17 + a.y * 31) - stableRandom(b.x * 17 + b.y * 31);
      });

      points = points.slice(0, 210);
      layer.innerHTML = "";

      points.forEach(function (point, index) {
        var light = document.createElement("span");
        var seed = point.x * 13 + point.y * 7 + index;
        var dx = Math.round((stableRandom(seed) - 0.5) * 70);
        var dy = Math.round((stableRandom(seed + 5) - 0.5) * 56);
        var size = 2 + Math.round(stableRandom(seed + 11) * 2);

        light.className = "title-light";
        light.style.setProperty("--x", (point.x / width * 100).toFixed(3) + "%");
        light.style.setProperty("--y", (point.y / height * 100).toFixed(3) + "%");
        light.style.setProperty("--dx", dx + "px");
        light.style.setProperty("--dy", dy + "px");
        light.style.setProperty("--s", size + "px");
        light.style.setProperty("--delay", String(Math.round(stableRandom(seed + 19) * 1450)) + "ms");
        layer.appendChild(light);
      });
    }

    requestAnimationFrame(renderLights);
    window.addEventListener("resize", function () {
      window.clearTimeout(title.__peopleLightsTimer);
      title.__peopleLightsTimer = window.setTimeout(renderLights, 180);
    });
  }

  document.querySelectorAll(".title-effect[data-title-effect]").forEach(function (title) {
    var effect = title.getAttribute("data-title-effect");
    var titleData = wrapTitle(title);
    if (!titleData) return;

    if (effect === "guoxue") setupClouds(title);
    if (effect === "dushu") setupDushu(titleData.chars);
    if (effect === "kuangjia") setupKuangjia(titleData.chars);
    if (effect === "fangtan") setupPeopleLights(title, titleData.text);
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  // Kick first-screen reveals immediately so the door doesn't feel "still loading".
  requestAnimationFrame(function () {
    var firstScreen = document.querySelectorAll(".door .reveal, .page-hero .reveal, .sec-hero .reveal");
    firstScreen.forEach(function (el, i) {
      setTimeout(function () { el.classList.add("in"); }, 80 + i * 180);
    });
  });

  var scrollFadeTitle = document.querySelector("[data-scroll-fade]");
  var sectionHeader = document.querySelector(".site-header[data-section-title]");

  if (scrollFadeTitle && sectionHeader) {
    var ticking = false;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function syncSectionHeader() {
      var rect = scrollFadeTitle.getBoundingClientRect();
      var progress = clamp((80 - rect.top) / 220, 0, 1);
      var opacity = 1 - progress;

      scrollFadeTitle.style.setProperty("--scroll-title-opacity", opacity.toFixed(3));
      scrollFadeTitle.style.setProperty("--scroll-title-y", String(Math.round(progress * -18)) + "px");
      scrollFadeTitle.style.setProperty("--scroll-title-blur", String((progress * 2.2).toFixed(2)) + "px");
      sectionHeader.classList.toggle("is-section-aware", progress > 0.88);
      ticking = false;
    }

    function requestSync() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(syncSectionHeader);
    }

    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);
    requestSync();
  }

  document.querySelectorAll(".article-list[data-page-size]").forEach(function (list) {
    var pageSize = parseInt(list.getAttribute("data-page-size"), 10) || 5;
    var items = Array.prototype.slice.call(list.children);
    if (items.length <= pageSize) return;

    var current = 1;
    var pageCount = Math.ceil(items.length / pageSize);
    var pager = document.createElement("nav");
    pager.className = "pagination reveal in";
    pager.setAttribute("aria-label", "文章分页");

    function render() {
      items.forEach(function (item, index) {
        var page = Math.floor(index / pageSize) + 1;
        item.hidden = page !== current;
      });

      pager.innerHTML = "";
      for (var i = 1; i <= pageCount; i += 1) {
        var node = i === current ? document.createElement("span") : document.createElement("a");
        node.textContent = String(i);
        if (i === current) {
          node.className = "current";
          node.setAttribute("aria-current", "page");
        } else {
          node.href = "#";
          node.dataset.page = String(i);
        }
        pager.appendChild(node);
      }

      if (current < pageCount) {
        var next = document.createElement("a");
        next.href = "#";
        next.dataset.page = String(current + 1);
        next.textContent = "Next";
        pager.appendChild(next);
      }
    }

    pager.addEventListener("click", function (event) {
      var link = event.target.closest("a[data-page]");
      if (!link) return;
      event.preventDefault();
      current = parseInt(link.dataset.page, 10);
      render();
      list.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    list.insertAdjacentElement("afterend", pager);
    render();
  });
})();

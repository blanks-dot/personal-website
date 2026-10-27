/* Marked Up: the pen. Plain DOM helpers, no framework. Everything here draws in the pen colour (var(--pen)) and reads sizes from the element it marks. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  /* the ballpoint filter: a faint turbulence so pen lines and handwriting are not vector-clean */
  function ink() {
    if (document.getElementById('mu-ink')) return;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    svg.innerHTML = '<filter id="mu-ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0.7" xChannelSelector="R" yChannelSelector="G"/></filter>';
    document.body.insertBefore(svg, document.body.firstChild);
  }

  /* handwriting: wrap every glyph so it can lean, lift and shrink on its own */
  function hand(el) {
    if (el.dataset.muHand) return;
    el.dataset.muHand = '1';
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      if (!n.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      n.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span'); w.className = 'w';
        for (var i = 0; i < part.length; i++) {
          var c = document.createElement('span'); c.className = 'c'; c.textContent = part[i];
          c.style.setProperty('--y', rnd(-1.1, 1.1).toFixed(2) + 'px');
          c.style.setProperty('--r', rnd(-3.5, 3.5).toFixed(2) + 'deg');
          c.style.setProperty('--s', rnd(0.96, 1.05).toFixed(3));
          c.style.setProperty('--k', rnd(-0.4, 0.3).toFixed(2) + 'px');
          w.appendChild(c);
        }
        frag.appendChild(w);
      });
      n.parentNode.replaceChild(frag, n);
    });
  }

  /* pen marks around a word: squiggle, circle, underline, double, strike, hl (highlighter) */
  function wob(n) { return rnd(-n, n); }
  function pathFor(kind, w, h, fs) {
    var d = '';
    if (kind === 'squiggle') {
      var y = h * 0.96, step = 11, x = -2; d = 'M' + x + ' ' + y;
      var up = true;
      while (x < w + 2) { var nx = x + step; d += ' Q' + (x + step / 2) + ' ' + (y + (up ? -4 : 4) + wob(0.6)) + ' ' + nx + ' ' + (y + wob(0.8)); x = nx; up = !up; }
    } else if (kind === 'underline' || kind === 'double') {
      var y1 = h + 1; d = 'M-3 ' + (y1 + wob(0.6)) + ' C ' + (w * 0.3) + ' ' + (y1 + 2 + wob(1)) + ', ' + (w * 0.7) + ' ' + (y1 - 2 + wob(1)) + ', ' + (w + 4) + ' ' + (y1 + 1 + wob(0.6));
      if (kind === 'double') d += ' M' + (w + 2) + ' ' + (y1 + 5) + ' C ' + (w * 0.6) + ' ' + (y1 + 7 + wob(1)) + ', ' + (w * 0.3) + ' ' + (y1 + 4 + wob(1)) + ', -1 ' + (y1 + 6 + wob(0.6));
    } else if (kind === 'strike') {
      var ys = h * 0.56; d = 'M-3 ' + (ys + 1) + ' C ' + (w * 0.35) + ' ' + (ys - 1.5 + wob(0.8)) + ', ' + (w * 0.65) + ' ' + (ys + 2 + wob(0.8)) + ', ' + (w + 4) + ' ' + (ys - 0.5);
    } else if (kind === 'circle') {
      var cx = w / 2, cy = h / 2, rx = w / 2 + 10, ry = h / 2 + 6, k = 0.5523;
      d = 'M' + (cx - rx) + ' ' + (cy + 2) +
        ' C ' + (cx - rx) + ' ' + (cy - ry * k - 2) + ', ' + (cx - rx * k) + ' ' + (cy - ry) + ', ' + cx + ' ' + (cy - ry + wob(1)) +
        ' C ' + (cx + rx * k) + ' ' + (cy - ry) + ', ' + (cx + rx) + ' ' + (cy - ry * k) + ', ' + (cx + rx + wob(1)) + ' ' + cy +
        ' C ' + (cx + rx) + ' ' + (cy + ry * k) + ', ' + (cx + rx * k) + ' ' + (cy + ry) + ', ' + cx + ' ' + (cy + ry + wob(1)) +
        ' C ' + (cx - rx * k) + ' ' + (cy + ry) + ', ' + (cx - rx - 2) + ' ' + (cy + ry * k) + ', ' + (cx - rx - 4) + ' ' + (cy - 4) +
        ' C ' + (cx - rx - 4) + ' ' + (cy - ry * 0.8) + ', ' + (cx - rx * 0.6) + ' ' + (cy - ry - 2) + ', ' + (cx - rx * 0.2) + ' ' + (cy - ry - 1);
    } else if (kind === 'hl') {
      var yh = h * 0.58; d = 'M-5 ' + (yh + 1) + ' C ' + (w * 0.4) + ' ' + (yh - 1) + ', ' + (w * 0.7) + ' ' + (yh + 2) + ', ' + (w + 7) + ' ' + (yh - 1);
    }
    return d;
  }
  function mark(el, kind, delay) {
    kind = kind || el.dataset.mark;
    var old = el.querySelector(':scope > svg.mark'); if (old) old.remove();
    var w = el.offsetWidth, h = el.offsetHeight;
    var fs = parseFloat(getComputedStyle(el).fontSize) || 16;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'mark ' + kind + ' fresh'); svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'none');
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', pathFor(kind, w, h, fs));
    if (kind === 'hl') { p.style.strokeWidth = (fs * 0.62) + 'px'; }
    svg.appendChild(p); el.appendChild(svg);
    var len = p.getTotalLength(); p.style.setProperty('--len', len);
    if (delay) p.style.setProperty('--d', delay);
    return svg;
  }

  /* single pen strokes used as glyphs */
  var glyph = {
    tick: '<svg class="tick" viewBox="0 0 16 8" aria-hidden="true"><path d="M1 4.5 C 5 2.5, 10 6, 15 3.5"/></svg>',
    heart: '<svg class="doodle" viewBox="0 0 26 24" aria-hidden="true" style="width:1.4em;height:1.3em;vertical-align:-0.2em"><path d="M13 22 C 4 15, 1 10, 2.5 6 C 4 2, 9 1.5, 12.5 6 C 16 1.5, 21 2, 23 6 C 24.5 10, 21 15, 13 22 Z"/></svg>',
    boxTick: '<path d="M4 10 L8 14.5 L17 4"/>'
  };

  /* the track knows where you are: lanes you have run past get a pen tick, the current one goes bold */
  function track(nav) {
    var lanes = Array.prototype.slice.call(nav.querySelectorAll('.lane[href^="#"]'));
    var targets = lanes.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    function update() {
      var line = window.innerHeight * 0.4, here = -1;
      targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top < line) here = i; });
      lanes.forEach(function (a, i) { a.classList.toggle('passed', i < here); a.classList.toggle('here', i === here); });
    }
    window.addEventListener('scroll', update, { passive: true }); update();
  }

  /* the copy button writes "copied!!" in pen instead of changing its label */
  function copyButtons(root) {
    root.querySelectorAll('button.copy[data-copy]').forEach(function (b) {
      var note = document.createElement('span'); note.className = 'copied hw'; note.textContent = 'copied!!'; note.hidden = true;
      b.insertAdjacentElement('afterend', note); hand(note);
      b.addEventListener('click', function () {
        var done = function () { note.hidden = false; clearTimeout(note._t); note._t = setTimeout(function () { note.hidden = true; }, 1800); };
        if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, done); else done();
      });
    });
  }

  /* a pen-drawn frame around a print: a rectangle she outlined by hand, slightly off the edges */
  function frame(el) {
    if (el.querySelector(':scope > svg.frame')) return;
    var w = el.offsetWidth + 14, h = el.offsetHeight + 14; if (!w || !h) return;
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'frame'); svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('preserveAspectRatio', 'none');
    var j = function () { return wob(1.6); };
    var d = 'M' + (2 + j()) + ' ' + (3 + j()) +
      ' C ' + (w * 0.3) + ' ' + (1 + j()) + ', ' + (w * 0.7) + ' ' + (3 + j()) + ', ' + (w - 2 + j()) + ' ' + (2 + j()) +
      ' C ' + (w - 1 + j()) + ' ' + (h * 0.3) + ', ' + (w - 3 + j()) + ' ' + (h * 0.7) + ', ' + (w - 2 + j()) + ' ' + (h - 2 + j()) +
      ' C ' + (w * 0.7) + ' ' + (h - 1 + j()) + ', ' + (w * 0.3) + ' ' + (h - 3 + j()) + ', ' + (3 + j()) + ' ' + (h - 2 + j()) +
      ' C ' + (1 + j()) + ' ' + (h * 0.7) + ', ' + (3 + j()) + ' ' + (h * 0.3) + ', ' + (2 + j()) + ' ' + (6 + j());
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); svg.appendChild(p); el.appendChild(svg);
  }

  /* run everything inside a root (default: the document) */
  function init(root) {
    root = root || document;
    ink();
    root.querySelectorAll('.hw').forEach(hand);
    root.querySelectorAll('[data-glyph]').forEach(function (el) { var g = glyph[el.dataset.glyph]; if (g) el.innerHTML = g; });
    root.querySelectorAll('[data-ring]').forEach(function (el) { el.outerHTML = '<span class="n hw">' + el.dataset.ring + '</span><svg class="ok" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 8 L5.5 12 L13 2"/></svg>'; });
    root.querySelectorAll('.lane .n').forEach(hand);
    root.querySelectorAll('.todo .box[data-done]').forEach(function (b) { b.innerHTML = glyph.boxTick; });
    root.querySelectorAll('nav.startline').forEach(track);
    root.querySelectorAll('.print img').forEach(function (im) { if (im.complete) frame(im.parentNode); else im.addEventListener('load', function () { frame(im.parentNode); }); });
    root.querySelectorAll('.print').forEach(frame);
    copyButtons(root);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { root.querySelectorAll('[data-mark]').forEach(function (el, i) { mark(el, el.dataset.mark, (0.15 + Math.min(i, 8) * 0.12).toFixed(2) + 's'); }); });
    } else {
      root.querySelectorAll('[data-mark]').forEach(function (el) { mark(el); });
    }
  }

  window.MarkedUp = { init: init, hand: hand, mark: mark, ink: ink, track: track, frame: frame };
})();

document.addEventListener('DOMContentLoaded', function () { MarkedUp.init(); });

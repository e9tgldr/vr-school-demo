/* vr-guardian 3D lab simulation — A-Frame logic (offline demo) */
/* global AFRAME, THREE */
(function () {
  'use strict';

  // ---- Canvas text renderer: works with any Unicode (Mongolian Cyrillic) ----
  AFRAME.registerComponent('canvas-label', {
    schema: {
      value: { default: '' },
      color: { default: '#ffffff' },
      width: { default: 2 },                                  // plane width in meters
      align: { default: 'center', oneOf: ['left', 'center', 'right'] },
      px: { default: 72 }                                     // canvas font size
    },
    init: function () {
      this.canvas = document.createElement('canvas');
      this.texture = new THREE.CanvasTexture(this.canvas);
      this.texture.anisotropy = 4;
      if (THREE.SRGBColorSpace !== undefined) { this.texture.colorSpace = THREE.SRGBColorSpace; }
      else if (THREE.sRGBEncoding !== undefined) { this.texture.encoding = THREE.sRGBEncoding; }
      this.material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, depthWrite: false });
      this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
      this.el.setObject3D('label', this.mesh);
      this.redraw();
    },
    update: function () { this.redraw(); },
    remove: function () {
      this.el.removeObject3D('label');
      this.texture.dispose();
      this.material.dispose();
    },
    redraw: function () {
      var d = this.data;
      var font = d.px + 'px "Segoe UI", Arial, sans-serif';
      var lines = String(d.value).split('\n');
      var c = this.canvas.getContext('2d');
      c.font = font;
      var textWidth = 4;
      lines.forEach(function (line) {
        textWidth = Math.max(textWidth, Math.ceil(c.measureText(line).width));
      });
      var w = textWidth + 16;
      var lineH = Math.ceil(d.px * 1.3);
      var h = lines.length * lineH + 16;
      this.canvas.width = w;
      this.canvas.height = h;
      c = this.canvas.getContext('2d');           // resizing resets context state
      c.clearRect(0, 0, w, h);
      c.font = font;
      c.fillStyle = d.color;
      c.textBaseline = 'middle';
      lines.forEach(function (line, i) {
        var y = (i + 0.5) * lineH + 8;
        if (d.align === 'left') { c.textAlign = 'left'; c.fillText(line, 6, y); }
        else if (d.align === 'right') { c.textAlign = 'right'; c.fillText(line, w - 6, y); }
        else { c.textAlign = 'center'; c.fillText(line, w / 2, y); }
      });
      this.texture.needsUpdate = true;

      var pw = d.width;
      var ph = d.width * (h / w);
      this.mesh.geometry.dispose();
      this.mesh.geometry = new THREE.PlaneGeometry(pw, ph);
      var ox = d.align === 'left' ? pw / 2 : (d.align === 'right' ? -pw / 2 : 0);
      this.mesh.position.set(ox, 0, 0);
    }
  });

  // ---- PC state model ----
  //  duty -> allowed educational app (blue)
  //  hand -> student raised a hand (yellow)
  //  none -> no vr-guardian activity (red = potential violation)
  var STATES = {
    duty: { label: 'Комп: сургалтын апп (duty)', screen: '#1d4fd7', body: '#c9d4e8', dot: '#22e08a' },
    hand: { label: 'Комп: гараа өргөсөн', screen: '#b98900', body: '#e8d9b0', dot: '#ffd34d' },
    none: { label: 'Комп: зөрчил илэрсэн', screen: '#8c1f1f', body: '#e8c0c0', dot: '#ff5a5a' }
  };

  var desks = [];

  function el(tag, attrs, parent) {
    var node = document.createElement(tag);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (parent) { parent.appendChild(node); }
    return node;
  }

  function applyState(d, stateKey) {
    var s = STATES[stateKey];
    d.state = stateKey;
    d.screen.setAttribute('material', 'color', s.screen);
    d.body.setAttribute('material', 'color', s.body);
    d.dot.setAttribute('material', 'color', s.dot);
    d.label.setAttribute('canvas-label', 'value', s.label);
    if (d.chip) { d.chip.setAttribute('material', 'color', s.screen); }
  }

  function toggleState(d) {
    applyState(d, d.state === 'none' ? 'duty' : 'none');
    refreshDashboard();
  }

  function seatName(row, col) {
    return 'Т' + (row + 1) + '-' + (col + 1);
  }

  function buildDesks() {
    var host = document.getElementById('desks');
    var row, col;
    for (row = 0; row < 2; row++) {
      for (col = 0; col < 4; col++) {
        (function (row, col) {
          var x = -4.5 + col * 3;
          var z = -2.2 + row * 3;
          var root = el('a-entity', { position: x + ' 0 ' + z }, host);

          // Desk + legs
          el('a-box', {
            position: '0 0.72 0', width: '2.2', height: '0.06', depth: '1.1',
            material: 'color: #4a5468; roughness: 0.8'
          }, root);
          el('a-box', { position: '-0.95 0.36 0.4', width: '0.07', height: '0.72', depth: '0.07', material: 'color: #333a4a' }, root);
          el('a-box', { position: '0.95 0.36 0.4', width: '0.07', height: '0.72', depth: '0.07', material: 'color: #333a4a' }, root);
          el('a-box', { position: '-0.95 0.36 -0.4', width: '0.07', height: '0.72', depth: '0.07', material: 'color: #333a4a' }, root);
          el('a-box', { position: '0.95 0.36 -0.4', width: '0.07', height: '0.72', depth: '0.07', material: 'color: #333a4a' }, root);

          // Student chair
          el('a-box', { position: '0 0.45 0.95', width: '0.7', height: '0.06', depth: '0.7', material: 'color: #3c4459' }, root);
          el('a-box', { position: '0 0.75 1.28', width: '0.7', height: '0.6', depth: '0.06', material: 'color: #3c4459' }, root);

          // Monitor stand + clickable body
          var body = el('a-box', {
            class: 'clickable', 'data-role': 'pc', 'data-row': String(row), 'data-col': String(col),
            position: '0 1.35 -0.25', width: '0.95', height: '0.58', depth: '0.06',
            material: 'color: #c9d4e8'
          }, root);
          el('a-box', { position: '0 1.02 -0.25', width: '0.16', height: '0.3', depth: '0.05', material: 'color: #6b768c' }, root);
          el('a-box', { position: '0 0.9 -0.25', width: '0.5', height: '0.04', depth: '0.3', material: 'color: #6b768c' }, root);

          // Screen (glows with the state color)
          var screen = el('a-plane', {
            position: '0 1.35 -0.215', width: '0.87', height: '0.5',
            material: 'color: #1d4fd7; shader: flat'
          }, root);

          // Status dot on the desk edge
          var dot = el('a-sphere', {
            position: '0 0.78 0.5', radius: '0.045',
            material: 'color: #22e08a; shader: flat; transparent: true',
            animation__blink: 'property: material.opacity; from: 1; to: 0.35; dir: alternate; loop: true; dur: 1200'
          }, root);

          // Floating label
          var label = el('a-entity', {
            position: '0 1.98 0',
            'canvas-label': { value: '', color: '#e8eefc', width: 1.3 }
          }, root);

          var d = { root: root, screen: screen, body: body, dot: dot, label: label, seat: seatName(row, col), row: row, col: col };
          desks.push(d);
          applyState(d, (row * 4 + col) % 4 === 0 ? 'none' : 'duty');
          body.addEventListener('click', function () { toggleState(d); });
        })(row, col);
      }
    }
    // One student raised a hand for realism
    applyState(desks[5], 'hand');
    refreshDashboard();
  }

  function counts() {
    var c = { duty: 0, hand: 0, none: 0 };
    desks.forEach(function (d) { c[d.state]++; });
    return c;
  }

  function refreshDashboard() {
    var c = counts();
    var viol = document.getElementById('dash-viol');
    var status = document.getElementById('dash-status');
    var tpv = document.getElementById('tp-viol');
    if (viol) { viol.setAttribute('canvas-label', 'value', 'Зөрчил: ' + c.none); }
    if (tpv) {
      tpv.setAttribute('canvas-label', {
        value: 'Зөрчил: ' + c.none,
        color: c.none > 0 ? '#ffb14c' : '#22e08a'
      });
    }
    if (status) {
      status.setAttribute('canvas-label', {
        value: c.none > 0 ? 'vr-guardian: ХАРИУЦЛАГА ШААРДЛАТАЙ' : 'vr-guardian: ACTIVE',
        color: c.none > 0 ? '#ffb14c' : '#22e08a'
      });
    }
  }

  function teleport(x, z) {
    var cam = document.getElementById('camera');
    if (!cam) { return; }
    var veil = document.getElementById('fade-veil');
    var y = parseFloat(cam.getAttribute('position').y) || 1.6;
    var doMove = function () {
      cam.setAttribute('position', x + ' ' + y + ' ' + z);
    };
    // Comfort fade: quick black dip, move, fade back (~300 ms total).
    if (veil && veil.setAttribute) {
      veil.setAttribute('material', 'opacity', '1');
      setTimeout(function () {
        doMove();
        setTimeout(function () { veil.setAttribute('material', 'opacity', '0'); }, 140);
      }, 140);
    } else {
      doMove();
    }
  }

  // Desktop cursor must not float in VR; lasers handle clicks there.
  var cursorEl = document.getElementById('click-cursor');
  var sceneEl0 = document.querySelector('a-scene');
  function syncCursor() {
    var inVR = sceneEl0.is('vr-mode');
    if (cursorEl) { cursorEl.setAttribute('visible', inVR ? 'false' : 'true'); }
    syncTeacherUI();
  }
  sceneEl0.addEventListener('enter-vr', syncCursor);
  sceneEl0.addEventListener('exit-vr', syncCursor);

  // Ambient hum: browsers block autoplay until a user gesture — kick it on first interaction
  var ambSrc = document.getElementById('amb-src');
  function kickAmbience() {
    if (!ambSrc) { return; }
    var sc = ambSrc.components.sound;
    if (sc && !sc.isPlaying) { sc.playSound(); }
  }
  sceneEl0.addEventListener('enter-vr', kickAmbience);
  window.addEventListener('mousedown', kickAmbience);
  window.addEventListener('click', kickAmbience);

  // Direct per-entity bindings (desktop cursor and VR lasers both emit `click`)
  Array.prototype.forEach.call(document.querySelectorAll('[data-role="tp"]'), function (pad) {
    pad.addEventListener('click', function () {
      teleport(parseFloat(pad.getAttribute('data-x')), parseFloat(pad.getAttribute('data-z')));
    });
  });
  var dash = document.querySelector('[data-role="dash"]');
  if (dash) {
    dash.addEventListener('click', function () {
      desks.forEach(function (d) { if (d.state === 'none') { toggleState(d); } });
    });
  }

  // ---- Teacher UI: small ПАНЕЛЬ button on the left wrist summons a big
  // floating panel locked ~1 m in front of the face (child of the camera).
  // Both are VR-only; desktop never shows them.
  var panelOpen = false;
  var wristBtnEl = null;
  var bigPanelEl = null;

  function clearAllViolations() {
    desks.forEach(function (d) { if (d.state === 'none') { toggleState(d); } });
  }

  function syncTeacherUI() {
    var inVR = sceneEl0 && sceneEl0.is('vr-mode');
    if (wristBtnEl) { wristBtnEl.setAttribute('visible', inVR ? 'true' : 'false'); }
    if (bigPanelEl) { bigPanelEl.setAttribute('visible', (inVR && panelOpen) ? 'true' : 'false'); }
  }

  function buildTeacherPanel() {
    // (a) wrist summon button on the left controller
    var host = document.getElementById('lhand');
    if (!host) { return; }
    wristBtnEl = el('a-entity', {
      id: 'teacher-wrist-btn', visible: 'false',
      position: '0 0.06 0.14', rotation: '-55 0 0'
    }, host);
    var wbBg = el('a-plane', {
      class: 'clickable',
      width: '0.11', height: '0.05',
      material: 'color: #123a7a; shader: flat'
    }, wristBtnEl);
    el('a-entity', {
      'canvas-label': { value: 'ПАНЕЛЬ', color: '#bfe0ff', width: 0.10, px: 44 },
      position: '0 0 0.003'
    }, wbBg);
    wbBg.addEventListener('click', function () {
      panelOpen = !panelOpen;
      syncTeacherUI();
    });

    // (c) wall button next to the dashboard — always visible; this is the
    // reliable way to open the panel with HAND TRACKING (no controller).
    var wallBtn = el('a-entity', {
      id: 'teacher-wall-btn', position: '2.85 2.55 -4.95'
    }, sceneEl0);
    var wallBg = el('a-plane', {
      class: 'clickable',
      width: '0.62', height: '0.2',
      material: 'color: #0e7a5f; shader: flat'
    }, wallBtn);
    el('a-entity', {
      'canvas-label': { value: 'ПАНЕЛЬ', color: '#ffffff', width: 0.54, px: 72 },
      position: '0 0 0.003'
    }, wallBg);
    wallBg.addEventListener('click', function () {
      panelOpen = !panelOpen;
      syncTeacherUI();
    });

    // (b) big floating panel, head-locked so it is always readable
    var cam = document.getElementById('camera');
    if (!cam) { return; }
    bigPanelEl = el('a-entity', {
      id: 'teacher-panel', visible: 'false',
      position: '0 -0.1 -1.05'
    }, cam);

    el('a-plane', {
      width: '0.88', height: '0.75',
      material: 'color: #0b1220; shader: flat; transparent: true; opacity: 0.94'
    }, bigPanelEl);
    el('a-entity', {
      'canvas-label': { value: 'Багшийн панель', color: '#4cc3ff', width: 0.50, px: 56 },
      position: '0 0.325 0.004'
    }, bigPanelEl);
    el('a-entity', {
      id: 'tp-viol',
      'canvas-label': { value: 'Зөрчил: 0', color: '#ffb14c', width: 0.34, px: 48 },
      position: '0 0.255 0.004'
    }, bigPanelEl);
    var xBtn = el('a-entity', { position: '0.395 0.325 0.004' }, bigPanelEl);
    var xbBg = el('a-plane', {
      class: 'clickable',
      width: '0.07', height: '0.055',
      material: 'color: #333a4a; shader: flat'
    }, xBtn);
    el('a-entity', {
      'canvas-label': { value: 'X', color: '#ffffff', width: 0.05, px: 48 },
      position: '0 0 0.003'
    }, xbBg);
    xbBg.addEventListener('click', function () {
      panelOpen = false;
      syncTeacherUI();
    });

    desks.forEach(function (d, i) {
      var row = Math.floor(i / 4);
      var col = i % 4;
      var x = -0.315 + col * 0.21;
      var y = 0.12 - row * 0.15;
      var chip = el('a-entity', { position: x + ' ' + y + ' 0.005' }, bigPanelEl);
      var chipBg = el('a-plane', {
        class: 'clickable',
        width: '0.17', height: '0.125',
        material: 'color: ' + STATES[d.state].screen + '; shader: flat'
      }, chip);
      el('a-entity', {
        'canvas-label': { value: d.seat, color: '#eef4ff', width: 0.15, px: 48 },
        position: '0 0 0.003'
      }, chip);
      d.chip = chipBg;
      chipBg.addEventListener('click', function () { toggleState(d); });
    });

    var clearBtn = el('a-entity', { position: '0 -0.27 0.005' }, bigPanelEl);
    var clrBg = el('a-plane', {
      class: 'clickable',
      width: '0.36', height: '0.08',
      material: 'color: #7a1420; shader: flat'
    }, clearBtn);
    el('a-entity', {
      'canvas-label': { value: 'ЦЭВЭРЛЭХ', color: '#ffffff', width: 0.32, px: 48 },
      position: '0 0 0.003'
    }, clearBtn);
    clrBg.addEventListener('click', clearAllViolations);
  }

  // Build once A-Frame has initialized the scene (guarded against double-build)
  var sceneEl = document.querySelector('a-scene');
  var built = false;
  function buildOnce() {
    if (built) { return; }
    built = true;
    buildDesks();
    buildTeacherPanel();
    refreshDashboard();
    syncCursor();
  }
  if (sceneEl.hasLoaded) { buildOnce(); } else {
    sceneEl.addEventListener('loaded', buildOnce);
  }
  refreshDashboard();
})();
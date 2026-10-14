/* =========================================================
   Cursor Image Trail — desktop-only, cards page
   Ported from the React <CursorImageTrail/> pattern to vanilla JS.
   - Only runs on devices with a fine pointer (mouse / trackpad)
   - Disabled when the user prefers reduced motion
   - The layer is pointer-events:none, so it never blocks the
     existing board drag, form inputs, or navigation.
   ========================================================= */
(function () {
  "use strict";

  // --- guards -------------------------------------------------
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduced) return; // keep the native cursor untouched

  // --- tunables (mirrors the React component props) -----------
  var ITEM_SIZE = 110;       // px
  var TRAIL_LENGTH = 8;      // max simultaneous items
  var SPAWN_DISTANCE = 80;   // px the cursor must travel before a new item
  var ROTATION_RANGE = 20;   // +/- degrees of random tilt

  // --- cheerful collage-shaped sprites (themed to the page) ---
  var SPRITES = [
    // heart
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 85C10 55 10 25 35 25c10 0 15 10 15 15 0-5 5-15 15-15 25 0 25 30-15 60Z" fill="#ef4444" stroke="#fff" stroke-width="3"/><path d="M30 38c-4-6-2-13 4-14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.7"/></svg>',
    // star
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 6 61 39 96 39 68 61 79 95 50 73 21 95 32 61 4 39 39 39Z" fill="#f59e0b" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>',
    // smiley
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#facc15" stroke="#fff" stroke-width="3"/><circle cx="35" cy="42" r="6" fill="#3a2e22"/><circle cx="65" cy="42" r="6" fill="#3a2e22"/><path d="M32 62q18 18 36 0" fill="none" stroke="#3a2e22" stroke-width="5" stroke-linecap="round"/></svg>',
    // flower
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="#f472b6" stroke="#fff" stroke-width="2.5"><ellipse cx="50" cy="22" rx="13" ry="20"/><ellipse cx="50" cy="78" rx="13" ry="20"/><ellipse cx="22" cy="50" rx="20" ry="13"/><ellipse cx="78" cy="50" rx="20" ry="13"/><ellipse cx="30" cy="30" rx="16" ry="11" transform="rotate(-45 30 30)"/><ellipse cx="70" cy="70" rx="16" ry="11" transform="rotate(-45 70 70)"/><ellipse cx="70" cy="30" rx="16" ry="11" transform="rotate(45 70 30)"/><ellipse cx="30" cy="70" rx="16" ry="11" transform="rotate(45 30 70)"/></g><circle cx="50" cy="50" r="14" fill="#fcd34d" stroke="#fff" stroke-width="2.5"/></svg>',
    // gem
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M25 15h50L95 40 50 92 5 40Z" fill="#7c6bff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M5 40h90M50 92 25 15M50 92 75 15" stroke="#fff" stroke-width="2" opacity="0.5" fill="none"/></svg>',
    // bolt
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M58 6 24 56h18l-6 38 40-56H56Z" fill="#38bdf8" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>'
  ];

  // --- DOM scaffold -------------------------------------------
  var layer = document.createElement("div");
  layer.className = "cursor-trail-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  var active = [];   // currently living items
  var last = null;   // last spawn point
  var counter = 0;

  function spawn(x, y) {
    var el = document.createElement("div");
    el.className = "cursor-trail-item";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.width = ITEM_SIZE + "px";
    el.style.height = ITEM_SIZE + "px";
    var rot = (Math.random() * 2 - 1) * ROTATION_RANGE;
    el.style.setProperty("--rot", rot + "deg");
    el.innerHTML = SPRITES[counter % SPRITES.length];
    counter++;

    el.addEventListener("animationend", function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      var i = active.indexOf(el);
      if (i !== -1) active.splice(i, 1);
    });

    layer.appendChild(el);
    // next frame so the entrance keyframe actually plays
    requestAnimationFrame(function () { el.classList.add("is-on"); });

    active.push(el);
    if (active.length > TRAIL_LENGTH) {
      var oldest = active.shift();
      if (oldest && oldest.parentNode) oldest.parentNode.removeChild(oldest);
    }
  }

  function onMove(e) {
    var x = e.clientX;
    var y = e.clientY;
    if (last) {
      var dx = x - last.x;
      var dy = y - last.y;
      if (Math.sqrt(dx * dx + dy * dy) < SPAWN_DISTANCE) return;
    }
    last = { x: x, y: y };
    spawn(x, y);
  }

  function clearAll() {
    for (var i = 0; i < active.length; i++) {
      if (active[i].parentNode) active[i].parentNode.removeChild(active[i]);
    }
    active.length = 0;
    last = null;
  }

  window.addEventListener("mousemove", onMove, { passive: true });
  // tidy up when the cursor leaves the window
  document.addEventListener("mouseout", function (e) {
    if (!e.relatedTarget && !e.toElement) clearAll();
  });
})();

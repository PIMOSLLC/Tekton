/*
 * phoenix-Tekton interaction layer. The grid is pre-rendered static DOM (semantic
 * without JS); this script only wires behavior:
 *   - card click -> inspector drawer (opens once, content swaps in place, no focus steal)
 *   - Esc / close button -> dismiss
 *   - focus-layer filter -> hides lanes (display:none + inert, keeping them out of
 *     the tab order and the accessibility tree — WCAG remediation for reading order)
 *   - print button
 *   - --bp-header-h: measures a host page's sticky header so the drawer and toolbar
 *     dock below it (embedded contexts bring their own fixed chrome)
 */
(function () {
  'use strict';

  var root = document.querySelector('.bp-root');
  if (!root) return;

  var drawer = root.querySelector('.bp-drawer');
  var drawerBody = root.querySelector('.bp-drawer-body');
  var dataEl = root.querySelector('.bp-data');
  var data = { stages: [], lanes: {} };
  try { if (dataEl) data = JSON.parse(dataEl.textContent); } catch (e) { /* keep defaults */ }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  root.querySelectorAll('.bp-item').forEach(function (b) {
    b.addEventListener('click', function () {
      root.querySelectorAll('.bp-item').forEach(function (x) {
        x.classList.remove('selected');
        x.setAttribute('aria-expanded', 'false');
      });
      b.classList.add('selected');
      b.setAttribute('aria-expanded', 'true');

      var lane = (data.lanes || {})[b.dataset.lane] || {};
      var stageIndex = parseInt(b.dataset.stage, 10);
      var stage = (data.stages || [])[stageIndex] || {};
      // Handoff: the author's line when the card carries one; otherwise the
      // generated template — every card in every half-authored blueprint
      // always reads an accountability line into the next stage.
      var handoff = b.dataset.handoff
        ? b.dataset.handoff
        : stageIndex < (data.stages || []).length - 1
          ? 'Moves to ' + String((data.stages[stageIndex + 1] || {}).name || '').toLowerCase() +
            ' with accountable evidence and status.'
          : 'Feeds the next observation and prioritization cycle.';

      var interpretationHtml =
        lane.interpretation
          ? '<h4>Service design interpretation</h4>' +
            '<p>' + esc(lane.interpretation) + '</p>'
          : ''; // a lane with no authored interpretation gets NO empty headed section

      drawerBody.innerHTML =
        '<span class="bp-pill">' + esc(lane.name) + ' \u00B7 ' + esc(stage.name) + '</span>' +
        '<h3>' + esc(b.dataset.title) + '</h3>' +
        '<p>' + esc(b.dataset.blurb) + '</p>' +
        interpretationHtml +
        '<h4>Handoff</h4>' +
        '<p>' + esc(handoff) + '</p>';

      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
    });
  });

  root.querySelector('.bp-drawer-close').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  var focus = root.querySelector('.bp-focus');
  function applyFilter() {
    var f = focus.value;
    root.querySelectorAll('[data-lane]').forEach(function (el) {
      var show = f === 'all' || el.dataset.lane === f;
      el.classList.toggle('bp-hidden', !show);
      // Why inert and not just display:none handling: inert removes the subtree from
      // interaction AND the accessibility tree, so filtered lanes never enter reading order.
      if ('inert' in el) el.inert = !show;
    });
    root.querySelectorAll('.bp-divider').forEach(function (el) {
      el.classList.toggle('bp-hidden', f !== 'all');
    });
  }
  focus.addEventListener('change', applyFilter);

  root.querySelector('.bp-show-all').addEventListener('click', function () {
    focus.value = 'all';
    applyFilter();
    root.querySelectorAll('.bp-toolbar button').forEach(function (b) { b.classList.remove('active'); });
    this.classList.add('active');
  });

  root.querySelector('.bp-print').addEventListener('click', function () { window.print(); });

  // Dock below a host page's sticky header when present (standalone pages have none).
  function syncHeaderOffset() {
    var h = document.querySelector('header.wp-block-template-part,.wp-site-blocks>header,.wp-site-blocks header');
    root.style.setProperty('--bp-header-h', (h ? h.offsetHeight : 0) + 'px');
  }
  syncHeaderOffset();
  window.addEventListener('load', syncHeaderOffset);
  window.addEventListener('resize', syncHeaderOffset);
})();
/* =========================================================================
   AQUASENSE — Página: Pontos de Consumo
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  // --- 13. Pontos de Consumo (`pontos.html`) ---
  var emptyFilter = document.getElementById('empty-f');
  if (emptyFilter) {
    var chipsPontos = [].slice.call(document.querySelectorAll('.chip'));
    chipsPontos.forEach(function (c) {
      c.addEventListener('click', function () {
        chipsPontos.forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
        var f = c.dataset.f, vis = 0;
        [].forEach.call(document.querySelectorAll('.row[data-g]'), function (r) {
          var on = (f === 'todos' || r.dataset.g === f); r.hidden = !on; if (on) vis++;
        });
        emptyFilter.hidden = vis > 0;
      });
    });
  }
});

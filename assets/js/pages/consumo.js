/* =========================================================================
   AQUASENSE — Página: Consumo
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  // --- 8. Consumo (`consumo.html`) ---
  var boxConsumoChart = document.getElementById('c-chart');
  if (boxConsumoChart) {
    (function () {
      var D = {
        d: { l: 'Hoje', t: '142', c: '5% abaixo', cl: 'ok', v: [8, 6, 4, 12, 26, 31, 22, 18, 9, 4, 2, 0], x: ['0h', '4h', '8h', '12h', '16h', '20h'], k: ['142<i>L</i>', '31<i>L · 19h</i>', '0', '0<i>L</i>'], hl: [] },
        w: { l: 'Últimos 7 dias', t: '1.024', c: '8% abaixo', cl: 'ok', v: [118, 142, 131, 214, 126, 158, 135], x: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], k: ['1.024<i>L</i>', '214<i>L · Qua</i>', '2', '31<i>L</i>'], hl: { 3: 'mid', 5: 'low' } },
        m: { l: 'Últimos 30 dias', t: '3.180', c: '3% acima', cl: 'low', v: [742, 806, 689, 943], x: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'], k: ['3.180<i>L</i>', '943<i>L · Sem 4</i>', '5', '86<i>L</i>'], hl: { 3: 'mid' } }
      };
      var xb = document.getElementById('c-chart-x');
      [].forEach.call(document.querySelectorAll('.seg button'), function (b) {
        b.addEventListener('click', function () {
          [].forEach.call(document.querySelectorAll('.seg button'), function (o) { o.setAttribute('aria-pressed', String(o === b)); });
          var d = D[b.dataset.p], m = Math.max.apply(null, d.v);
          var cLabel = document.getElementById('c-label');
          var cTotal = document.getElementById('c-total');
          var cmp = document.getElementById('c-cmp');
          if (cLabel) cLabel.textContent = d.l;
          if (cTotal) cTotal.innerHTML = d.t + '<span class="u">L</span>';
          if (cmp) { cmp.className = 'badge ' + d.cl; cmp.innerHTML = '<span class="dot"></span>' + d.c; }
          boxConsumoChart.innerHTML = d.v.map(function (v, i) {
            var c = (d.hl && d.hl[i]) || '';
            return '<div class="b ' + c + '" style="height:' + Math.max(6, Math.round(v / m * 100)) + '%"><i style="height:100%"></i></div>';
          }).join('');
          if (xb) xb.innerHTML = d.x.map(function (s) { return '<span>' + s + '</span>'; }).join('');
          ['k1', 'k2', 'k3', 'k4'].forEach(function (id, i) {
            var el = document.getElementById(id);
            if (el) el.innerHTML = d.k[i];
          });
        });
      });
    })();
  }

});

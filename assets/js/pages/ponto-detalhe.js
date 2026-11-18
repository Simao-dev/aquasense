/* =========================================================================
   AQUASENSE — Página: Detalhe do Ponto
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  // --- 12. Detalhe do Ponto (`ponto-detalhe.html`) ---
  var boxPontoDetalhe = document.getElementById('pd-chart');
  if (boxPontoDetalhe) {
    (function () {
      var D = {
        d: { l: 'Hoje', t: '28 L', c: '12% abaixo da média', v: [18, 22, 16, 28, 24, 31, 19, 26, 21, 14, 23, 28], x: ['0h', '4h', '8h', '12h', '16h', '20h'] },
        w: { l: 'Últimos 7 dias', t: '196 L', c: '4% acima da média', v: [24, 31, 27, 38, 29, 26, 21], x: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] },
        m: { l: 'Últimos 30 dias', t: '742 L', c: 'na média', v: [92, 118, 104, 131, 126, 88, 83], x: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'] }
      };
      var xb = document.getElementById('pd-chart-x');
      [].forEach.call(document.querySelectorAll('.seg button'), function (b) {
        b.addEventListener('click', function () {
          [].forEach.call(document.querySelectorAll('.seg button'), function (o) { o.setAttribute('aria-pressed', String(o === b)); });
          var d = D[b.dataset.p], m = Math.max.apply(null, d.v);
          var pLabel = document.getElementById('p-label');
          var pTotal = document.getElementById('p-total');
          var pCmp = document.getElementById('p-cmp');
          if (pLabel) pLabel.textContent = d.l;
          if (pTotal) pTotal.textContent = d.t;
          if (pCmp) pCmp.textContent = d.c;
          boxPontoDetalhe.innerHTML = d.v.map(function (v) { return '<div class="b" style="height:' + Math.max(6, Math.round(v / m * 100)) + '%"><i style="height:100%"></i></div>'; }).join('');
          if (xb) xb.innerHTML = d.x.map(function (s) { return '<span>' + s + '</span>'; }).join('');
        });
      });
    })();
  }

});

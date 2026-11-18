/* =========================================================================
   AQUASENSE — Página: Detalhe da Ocorrência
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  // --- 9. Detalhe da Ocorrência (`ocorrencia.html`) ---
  var btnOpenCheck = document.getElementById('open-check');
  var dlgOcorrencia = document.getElementById('dlg');
  if (btnOpenCheck && dlgOcorrencia) {
    function openDlg() { dlgOcorrencia.classList.add('is-open'); var inp = dlgOcorrencia.querySelector('input'); if (inp) inp.focus(); }
    function closeDlg() { dlgOcorrencia.classList.remove('is-open'); btnOpenCheck.focus(); }
    btnOpenCheck.addEventListener('click', openDlg);
    var dlgCancel = document.getElementById('dlg-cancel');
    if (dlgCancel) dlgCancel.addEventListener('click', closeDlg);
    var dlgOk = document.getElementById('dlg-ok');
    if (dlgOk) {
      dlgOk.addEventListener('click', function () {
        closeDlg();
        var h = document.querySelector('[data-od-id="cabecalho-ocorrencia"]');
        if (h) {
          h.style.background = 'var(--ok-bg)'; h.style.borderColor = '#A9DFC0';
          var b1 = h.querySelector('.badge'); if (b1) { b1.className = 'badge ok'; b1.lastChild.textContent = 'Resolvido'; }
          var big = h.querySelector('.big'); if (big) big.style.color = 'var(--ok-ink)';
          var bigU = h.querySelector('.big .u'); if (bigU) bigU.style.color = 'var(--ok-ink)';
          var pEl = h.querySelector('p'); if (pEl) pEl.style.color = 'var(--ok-ink)';
        }
        var st = document.querySelectorAll('.dl .badge');
        if (st.length) { var b = st[st.length - 1]; b.className = 'badge ok'; b.lastChild.textContent = 'Resolvido'; }
        btnOpenCheck.textContent = 'Ocorrência verificada';
        btnOpenCheck.disabled = true;
      });
    }
    dlgOcorrencia.addEventListener('click', function (e) { if (e.target === dlgOcorrencia) closeDlg(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dlgOcorrencia.classList.contains('is-open')) closeDlg(); });
    var btnIgnore = document.getElementById('ignore');
    if (btnIgnore) btnIgnore.addEventListener('click', function () { location.href = 'alertas.html'; });
  }

});

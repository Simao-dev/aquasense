/* =========================================================================
   AQUASENSE — Página: Perfil
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  // --- 10. Perfil (`perfil.html`) ---
  var btnLogout = document.getElementById('logout');
  if (btnLogout) {
    [].forEach.call(document.querySelectorAll('.toggle'), function (t) {
      t.addEventListener('click', function () {
        t.setAttribute('aria-checked', String(t.getAttribute('aria-checked') !== 'true'));
      });
    });
    var dlgLogout = document.getElementById('dlg');
    if (dlgLogout) {
      btnLogout.addEventListener('click', function () { dlgLogout.classList.add('is-open'); var c = document.getElementById('dlg-cancel'); if (c) c.focus(); });
      var cCancel = document.getElementById('dlg-cancel');
      if (cCancel) cCancel.addEventListener('click', function () { dlgLogout.classList.remove('is-open'); btnLogout.focus(); });
      var cOk = document.getElementById('dlg-ok');
      if (cOk) cOk.addEventListener('click', function () { location.href = 'login.html'; });
      dlgLogout.addEventListener('click', function (e) { if (e.target === dlgLogout) dlgLogout.classList.remove('is-open'); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dlgLogout.classList.remove('is-open'); });
    }
  }

});

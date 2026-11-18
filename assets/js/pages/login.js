/* =========================================================================
   AQUASENSE — Página: Login
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  // --- 6. Login (`login.html`) ---
  var formLogin = document.getElementById('f');
  var inputUser = document.getElementById('user');
  var inputPwd = document.getElementById('pwd');
  if (formLogin && inputUser && inputPwd) {
    var togglePwd = document.getElementById('toggle-pwd');
    if (togglePwd) {
      togglePwd.addEventListener('click', function () {
        var on = inputPwd.type === 'password'; inputPwd.type = on ? 'text' : 'password';
        this.setAttribute('aria-pressed', String(on));
        this.setAttribute('aria-label', on ? 'Ocultar senha' : 'Mostrar senha');
      });
    }
    function markError(el, box, bad) {
      el.classList.toggle('is-error', bad);
      if (box) box.hidden = !bad;
    }
    formLogin.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var bu = !inputUser.value.trim(), bp = inputPwd.value.length < 8;
      markError(inputUser, document.getElementById('e-user'), bu);
      markError(inputPwd, document.getElementById('e-pwd'), bp);
      if (bu) { inputUser.focus(); return; }
      if (bp) { inputPwd.focus(); return; }
      location.href = 'inicio.html';
    });
    [inputUser, inputPwd].forEach(function (el) {
      el.addEventListener('input', function () {
        el.classList.remove('is-error');
        var b = document.getElementById(el === inputUser ? 'e-user' : 'e-pwd');
        if (b) b.hidden = true;
      });
    });
  }

});

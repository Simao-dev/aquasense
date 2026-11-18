/* =========================================================================
   AQUASENSE — Página: Cadastro
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  // --- 5. Cadastro (`cadastro.html`) ---
  var step1 = document.getElementById('step1');
  var step2 = document.getElementById('step2');
  var btnNext = document.getElementById('next');
  if (step1 && step2 && btnNext) {
    btnNext.addEventListener('click', function () {
      step1.hidden = true; step2.hidden = false;
      var s2Pill = document.getElementById('s2');
      if (s2Pill) s2Pill.classList.add('on');
      var scrollEl = document.querySelector('.scroll');
      if (scrollEl) scrollEl.scrollTop = 0;
      var stepsEl = document.querySelector('.steps');
      if (stepsEl) stepsEl.setAttribute('aria-label', 'Etapa 2 de 2');
    });
    var btnBack2 = document.getElementById('back2');
    if (btnBack2) {
      btnBack2.addEventListener('click', function () {
        step2.hidden = true; step1.hidden = false;
        var s2Pill = document.getElementById('s2');
        if (s2Pill) s2Pill.classList.remove('on');
        var stepsEl = document.querySelector('.steps');
        if (stepsEl) stepsEl.setAttribute('aria-label', 'Etapa 1 de 2');
      });
    }
    var btnCreate = document.getElementById('create');
    if (btnCreate) {
      btnCreate.addEventListener('click', function () { location.href = 'inicio.html'; });
    }
  }

});

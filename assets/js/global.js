/* =========================================================================
   AQUASENSE — Script Global
   Centraliza o armazenamento local, badges da Tab Bar e funções compartilhadas.
   ========================================================================= */

// --- Armazenamento compartilhado de eventos (localStorage) ---
var AQ_EVENTOS_KEY = "aquasense:eventos";
var AQ_LASTREAD_KEY = "aquasense:alertas_lastread";

function aqLoadEventos() {
  try {
    var v = JSON.parse(localStorage.getItem(AQ_EVENTOS_KEY));
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

function aqSaveEventos(list) {
  try {
    localStorage.setItem(AQ_EVENTOS_KEY, JSON.stringify(list.slice(0, 40)));
  } catch (e) {}
}

function aqPushEvento(ev) {
  var list = aqLoadEventos();
  list.unshift(ev);
  aqSaveEventos(list);
  aqAtualizarBadgeTabbar();
}

function aqUnreadCount() {
  var lastread = parseInt(localStorage.getItem(AQ_LASTREAD_KEY) || "0", 10);
  return aqLoadEventos().filter(function (e) {
    return e.ts > lastread;
  }).length;
}

function aqAtualizarBadgeTabbar() {
  var tab = document.querySelector('.tabbar a[href="alertas.html"]');
  if (!tab) return;
  var n = aqUnreadCount();
  var nb = tab.querySelector(".nb");
  if (n > 0) {
    if (!nb) {
      nb = document.createElement("span");
      nb.className = "nb";
      tab.insertBefore(nb, tab.firstChild);
    }
    nb.textContent = n > 9 ? "9+" : String(n);
  } else if (nb) {
    nb.remove();
  }
}

// Expõe no escopo global (window) para acesso pelos scripts de páginas
window.AQ_EVENTOS_KEY = AQ_EVENTOS_KEY;
window.AQ_LASTREAD_KEY = AQ_LASTREAD_KEY;
window.aqLoadEventos = aqLoadEventos;
window.aqSaveEventos = aqSaveEventos;
window.aqPushEvento = aqPushEvento;
window.aqUnreadCount = aqUnreadCount;
window.aqAtualizarBadgeTabbar = aqAtualizarBadgeTabbar;

// Inicialização de componentes globais após carregamento do DOM
document.addEventListener("DOMContentLoaded", function () {
  aqAtualizarBadgeTabbar();
});

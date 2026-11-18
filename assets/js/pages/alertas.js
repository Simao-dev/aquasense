/* =========================================================================
   AQUASENSE — Página: Alertas
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  // --- 2. Alertas (`alertas.html`) ---
  var wrapAlertas = document.getElementById("gruposAlertas");
  if (wrapAlertas) {
    (function () {
      var ICONE_VAZAMENTO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>';
      var ICONE_OFFLINE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 2l20 20"/><path d="M5 12.5a10 10 0 0 1 4-2.4"/><path d="M8.8 16.3a5 5 0 0 1 6.4 0"/><path d="M12 20h.01"/><path d="M15.5 10.6a10 10 0 0 1 3.5 1.9"/></svg>';
      var ICONE_VOLTOU = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
      var LABEL_POR_CLASSE = { ok: "Normal", low: "Leve", mid: "Moderado", high: "Crítico", off: "Indisponível" };
      var HREF_POR_TIPO = { vazamento: "ocorrencia.html", sensor: "sensores.html" };

      function iconePara(ev) {
        if (ev.classe === "off") return ICONE_OFFLINE;
        if (ev.tipo === "sensor") return ICONE_VOLTOU;
        return ICONE_VAZAMENTO;
      }
      function grupoPara(ts) {
        var d = new Date(ts); d.setHours(0, 0, 0, 0);
        var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        var ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
        if (d.getTime() === hoje.getTime()) return "hoje";
        if (d.getTime() === ontem.getTime()) return "ontem";
        return "antes";
      }
      function subPara(ts) {
        var d = new Date(ts);
        var hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        var g = grupoPara(ts);
        if (g === "hoje") return "hoje, " + hora;
        if (g === "ontem") return "ontem, " + hora;
        var dia = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2);
        return dia + ", " + hora;
      }

      var lastread = parseInt(localStorage.getItem(AQ_LASTREAD_KEY) || "0", 10);
      var TITULO_GRUPO = { hoje: "Hoje", ontem: "Ontem", antes: "Anteriores" };

      function montarAlertas() {
        var eventos = aqLoadEventos();
        wrapAlertas.innerHTML = "";
        if (eventos.length === 0) return;

        var grupos = { hoje: [], ontem: [], antes: [] };
        eventos.forEach(function (ev) { grupos[grupoPara(ev.ts)].push(ev); });

        ["hoje", "ontem", "antes"].forEach(function (g) {
          if (grupos[g].length === 0) return;
          var secHead = document.createElement("div");
          secHead.className = "sec-head"; secHead.dataset.grp = g;
          secHead.innerHTML = "<h2>" + TITULO_GRUPO[g] + "</h2>";
          var list = document.createElement("div");
          list.className = "list"; list.dataset.grp = g;
          list.innerHTML = grupos[g].map(function (ev) {
            var href = HREF_POR_TIPO[ev.tipo] || "#";
            var unread = ev.ts > lastread ? " unread" : "";
            return '<a class="row' + unread + '" href="' + href + '" data-c="' + ev.tipo + '">' +
              '<span class="ic ' + ev.classe + '">' + iconePara(ev) + '</span>' +
              '<span class="txt"><b>' + ev.texto + '</b><span>' + subPara(ev.ts) + '</span></span>' +
              '<span class="end"><span class="badge ' + ev.classe + '"><span class="dot"></span>' + LABEL_POR_CLASSE[ev.classe] + '</span>' +
              '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></span></a>';
          }).join("");
          wrapAlertas.appendChild(secHead);
          wrapAlertas.appendChild(list);
        });
      }
      montarAlertas();

      function marcarTodosLidos() {
        localStorage.setItem(AQ_LASTREAD_KEY, String(Date.now()));
        document.querySelectorAll(".row.unread").forEach(function (r) { r.classList.remove("unread"); });
        aqAtualizarBadgeTabbar();
      }

      var btnMarcarLidos = document.getElementById("btnMarcarLidos");
      if (btnMarcarLidos) {
        btnMarcarLidos.addEventListener("click", function () {
          marcarTodosLidos();
          btnMarcarLidos.textContent = "Todos lidos";
          btnMarcarLidos.disabled = true;
        });
      }

      var chipsAlertas = [].slice.call(document.querySelectorAll(".chip"));
      chipsAlertas.forEach(function (c) {
        c.addEventListener("click", function () {
          chipsAlertas.forEach(function (o) { o.setAttribute("aria-pressed", String(o === c)); });
          var f = c.dataset.f;
          document.querySelectorAll(".row[data-c]").forEach(function (r) {
            var on = f === "todos" || r.dataset.c === f;
            r.style.display = on ? "flex" : "none";
          });
          ["hoje", "ontem", "antes"].forEach(function (g) {
            var l = document.querySelector('.list[data-grp="' + g + '"]');
            var h = document.querySelector('.sec-head[data-grp="' + g + '"]');
            if (!l || !h) return;
            var vis = [].slice.call(l.querySelectorAll('.row[data-c]')).filter(function (r) { return r.style.display !== "none"; }).length;
            l.style.display = vis > 0 ? "block" : "none";
            h.style.display = vis > 0 ? "flex" : "none";
          });
        });
      });

      marcarTodosLidos();
    })();
  }

});

/* =========================================================================
   AQUASENSE — Página: Planos e Pagamento
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  // --- 11. Planos e pagamento ilustrativo (`planos.html`) ---
  var btnAssinar = document.getElementById("btnAssinar");
  if (btnAssinar) {
    (function () {
      var PLANOS = {
        mensal:    { nome: "Mensal",    preco: "R$ 30,00",  periodo: "cobrado mensalmente" },
        semestral: { nome: "Semestral", preco: "R$ 150,00", periodo: "cobrado a cada 6 meses" },
        anual:     { nome: "Anual",     preco: "R$ 250,00", periodo: "cobrado anualmente" }
      };
      var PAG = { credito: "Cartão de crédito", debito: "Cartão de débito", pix: "Pix", boleto: "Boleto" };
      var PIX = "00020126360014BR.GOV.BCB.PIX0114AQUASENSE-DEMO5204000053039865802BR5909AQUASENSE6007BRASIL6304ABCD";
      var BOLETO = "00190.00009 01234.567890 12345.678901 1 00000000025000";
      // Plano e forma de pagamento já começam escolhidos: basta conferir e assinar.
      var plano = "anual", pag = "credito";
      var $ = function (id) { return document.getElementById(id); };
      var cards = [].slice.call(document.querySelectorAll(".plan-card"));
      var opts = [].slice.call(document.querySelectorAll(".pay-opt"));
      var panel = $("payPanel");

      function marcar(lista, atual, chave) {
        lista.forEach(function (el) { el.setAttribute("aria-pressed", el.dataset[chave] === atual ? "true" : "false"); });
      }

      // QR Code ilustrativo (grade 21x21 com os 3 marcadores de canto; não é um QR válido)
      function qr() {
        var seed = 7, r = "", x, y, i, dx, dy, on, cant = [[0, 0], [14, 0], [0, 14]];
        for (y = 0; y < 21; y++) for (x = 0; x < 21; x++) {
          on = null;
          for (i = 0; i < 3; i++) {
            dx = x - cant[i][0]; dy = y - cant[i][1];
            if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) on = dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
          }
          if (on === null) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; on = ((seed >> 16) % 2) === 0; }
          if (on) r += '<rect x="' + x * 6 + '" y="' + y * 6 + '" width="6" height="6"/>';
        }
        return '<svg class="qr" viewBox="0 0 126 126" fill="#0F2A3D" role="img" aria-label="QR Code ilustrativo">' + r + '</svg>';
      }

      function copiar(codigo) {
        return '<div class="pay-code">' + codigo + '</div><button class="btn btn-outline" type="button" data-copiar="' + codigo + '" style="margin-top:10px;min-height:44px">Copiar código</button>';
      }

      function desenharPainel() {
        if (pag === "credito" || pag === "debito") {
          panel.innerHTML =
            '<div class="field"><label for="cNum">Número do cartão</label><input class="input" id="cNum" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="19"></div>' +
            '<div class="field"><label for="cNome">Nome impresso no cartão</label><input class="input" id="cNome" autocomplete="cc-name" placeholder="MARIA DA SILVA"></div>' +
            '<div class="pay-row"><div class="field"><label for="cVal">Validade</label><input class="input" id="cVal" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5"></div>' +
            '<div class="field"><label for="cCvv">CVV</label><input class="input" id="cCvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"></div></div>' +
            '<p class="pay-err" id="payErr" role="alert"></p>';
        } else if (pag === "pix") {
          panel.innerHTML = '<p class="pay-note">Escaneie o QR Code no app do seu banco ou use o Pix copia e cola.</p>' + qr() + copiar(PIX);
        } else {
          panel.innerHTML = '<p class="pay-note">O boleto é gerado ao confirmar e vence em 3 dias. Depois de pago, a compensação leva até 2 dias úteis.</p>' + copiar(BOLETO);
        }
      }

      function resumo() {
        var p = PLANOS[plano];
        $("sumPlano").textContent = p.nome + " · " + p.periodo;
        $("sumPag").textContent = PAG[pag];
        $("sumTotal").textContent = p.preco;
        btnAssinar.textContent = "Assinar plano " + p.nome + " · " + p.preco;
      }

      cards.forEach(function (c) {
        c.addEventListener("click", function () { plano = c.dataset.plano; marcar(cards, plano, "plano"); resumo(); });
      });
      opts.forEach(function (o) {
        o.addEventListener("click", function () { pag = o.dataset.pay; marcar(opts, pag, "pay"); desenharPainel(); resumo(); });
      });

      // Máscaras dos campos do cartão
      panel.addEventListener("input", function (e) {
        var t = e.target, v = t.value.replace(/\D/g, "");
        if (t.id === "cNum") t.value = v.slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
        else if (t.id === "cVal") t.value = v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2, 4) : v;
        else if (t.id === "cCvv") t.value = v.slice(0, 4);
      });

      // Botão "Copiar código" (Pix e boleto)
      panel.addEventListener("click", function (e) {
        var b = e.target.closest("[data-copiar]");
        if (!b) return;
        try { navigator.clipboard.writeText(b.dataset.copiar); } catch (err) { /* sem permissão: segue ilustrativo */ }
        b.textContent = "Copiado!";
        setTimeout(function () { b.textContent = "Copiar código"; }, 1600);
      });

      // Validação simples dos dados do cartão (só para a demonstração)
      function validar() {
        if (pag !== "credito" && pag !== "debito") return true;
        var err = $("payErr"), msg = "";
        if ($("cNum").value.replace(/\D/g, "").length < 13) msg = "Confira o número do cartão.";
        else if ($("cNome").value.trim().length < 3) msg = "Informe o nome impresso no cartão.";
        else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test($("cVal").value)) msg = "Validade inválida. Use MM/AA.";
        else if ($("cCvv").value.length < 3) msg = "Confira o CVV.";
        err.textContent = msg;
        return !msg;
      }

      var dlgPlano = $("dlgPlano"), dlgOk = $("dlgOk");

      btnAssinar.addEventListener("click", function () {
        if (!validar()) return;
        var p = PLANOS[plano];
        $("dlgPlano-t").textContent = "Confirmar assinatura " + p.nome;
        $("dlgPlano-txt").textContent = "Você está assinando o plano " + p.nome + " por " + p.preco + " (" + p.periodo + ") com " + PAG[pag] + ". Deseja continuar?";
        dlgPlano.classList.add("is-open");
      });

      $("dlgPlano-cancel").addEventListener("click", function () { dlgPlano.classList.remove("is-open"); });

      $("dlgPlano-ok").addEventListener("click", function () {
        dlgPlano.classList.remove("is-open");
        var p = PLANOS[plano], pendente = pag === "pix" || pag === "boleto";
        $("dlgOk-t").textContent = pendente ? "Pedido criado!" : "Plano ativado!";
        $("dlgOk-txt").textContent = pendente
          ? "Assim que o pagamento via " + PAG[pag] + " for confirmado, seu plano " + p.nome + " (" + p.preco + ") será ativado."
          : "Seu plano " + p.nome + " (" + p.preco + ") está ativo. Você já tem acesso ao app, ao feedback dos sensores e a todos os recursos da plataforma.";
        dlgOk.classList.add("is-open");
      });

      $("dlgOk-fechar").addEventListener("click", function () { dlgOk.classList.remove("is-open"); });

      [dlgPlano, dlgOk].forEach(function (d) {
        d.addEventListener("click", function (e) { if (e.target === d) d.classList.remove("is-open"); });
      });

      desenharPainel();
      resumo();
    })();
  }

});

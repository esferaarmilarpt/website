/* =========================================================
   INÍCIO · a curva da carteira desenhada em grande no topo,
   e os números lidos do trades.json (nunca escritos à mão)
   ========================================================= */
(function () {
  const { money0, pct, mesAno } = window.EA;

  EA.carregar().then(r => {
    const set = (id, t) => { const e = document.getElementById(id); if (e) e.textContent = t; };
    set('n-capital', money0(r.capitalAtual));
    set('n-retorno', pct(r.retorno, 0));
    set('n-trades', r.nPosicoes);
    set('n-desde', r.anoInicio);
    set('tl-hoje-valor', money0(r.capitalAtual));
    set('tl-hoje-data', mesAno(r.ultimaData));
    const hodl = r.curva.find(p => p.hodl);
    if (hodl) set('tl-dca-valor', money0(hodl.v));
    const primeira = r.linhas.find(t => t.tipo !== 'hodl');
    if (primeira) set('tl-trade-data', mesAno(EA.parseDate(primeira.fecho)));
    desenhar(r);
    let espera; window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(() => desenhar(r), 150); });
  });

  /* A curva do topo: decorativa, a mesma do gráfico de resultados */
  function desenhar(r) {
    const caixa = document.getElementById('curva-topo');
    if (!caixa) return;
    const pts = r.curva, W = caixa.clientWidth || 600, H = caixa.clientHeight || 400;
    const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    const lo = pts[0].v * 0.6, hi = Math.max(...pts.map(p => p.v)) * 1.06;
    const x = t => 16 + (t - t0) / (t1 - t0) * (W - 32);
    const y = v => H - 28 - (v - lo) / (hi - lo) * (H - 56);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + x(p.t).toFixed(1) + ' ' + y(p.v).toFixed(1)).join(' ');
    const ult = pts[pts.length - 1];
    caixa.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
      <defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--dourado)" stop-opacity=".28"/><stop offset="1" stop-color="var(--dourado)" stop-opacity="0"/></linearGradient></defs>
      ${[0.25, 0.5, 0.75].map(f => `<line x1="0" x2="${W}" y1="${H * f}" y2="${H * f}" class="g-grelha"/>`).join('')}
      <path d="${d} L${x(t1)} ${H} L${x(t0)} ${H} Z" fill="url(#ar)"/>
      <path d="${d}" class="curva-linha" pathLength="1"/>
      <circle cx="${x(t0)}" cy="${y(pts[0].v)}" r="5" class="curva-ponto"/>
      <circle cx="${x(t1)}" cy="${y(ult.v)}" r="7" class="curva-ponto curva-fim"/>
      <text x="${x(t0) + 12}" y="${y(pts[0].v) + 26}" class="curva-txt">${money0(pts[0].v)} investidos · 2022–2025</text>
      <text x="${x(t1) - 12}" y="${y(ult.v) - 18}" text-anchor="end" class="curva-txt curva-txt-fim">${money0(ult.v)} · ${mesAno(t1)}</text>
    </svg>`;
  }
})();

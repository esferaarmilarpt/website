/* =========================================================
   COPYTRADE · gráfico, estatísticas, retornos mensais, trades
   O gráfico é desenhado em SVG por este ficheiro (sem bibliotecas):
   - linha do saldo com área dourada; a fase DCA (2022–2025) a tracejado
   - um ponto por dia de fecho: verde se ganhou, vermelho se perdeu
   - etiqueta com o último valor à direita
   - por baixo, o drawdown: quanto a carteira esteve abaixo do pico
   ========================================================= */
(function () {
  const { money, money0, pct, data, mesAno, MESES, dia } = window.EA;
  const $ = s => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';

  EA.carregar().then(r => {
    estatisticas(r);
    grafico(r);
    mensais(r);
    tabela(r, 1);
    $('#atualizado').textContent = 'Atualizado a ' + data(r.ultimaData);
  });

  /* ---------- Estatísticas ---------- */
  function estatisticas(r) {
    const set = (id, txt, v) => { const e = document.getElementById(id); e.innerHTML = txt; if (v != null) e.classList.add(v < 0 ? 'desce' : 'sobe'); };
    set('st-capital', money(r.capitalAtual));
    set('st-capital-nota', 'após ' + r.nPosicoes + ' posições');
    set('st-retorno', pct(r.retorno), r.retorno);
    set('st-retorno-nota', 'desde ' + r.anoInicio + ' · média anual ' + pct(r.retorno / r.anos));
    set('st-lucro', money(r.lucro, true), r.lucro);
    set('st-acerto', Math.round(r.acerto) + '%');
    set('st-acerto-nota', r.ganhas + ' de ' + r.nPosicoes + ' posições fecharam a ganhar');
    set('st-extremos', '<span class="sobe">' + money0(r.melhor.pnl, true) + '</span> / <span class="desce">' + money0(r.pior.pnl, true) + '</span>');
    const quando = t => t.par + ' ' + t.tipo + ', ' + mesAno(EA.parseDate(t.fecho));
    set('st-extremos-nota', 'melhor: ' + quando(r.melhor) + ' · pior: ' + quando(r.pior));
  }

  /* ---------- Gráfico ---------- */
  function grafico(r) {
    const pts = r.curva;
    const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    let modo = '$', periodo = 'Tudo';
    const saldoEm = t => { let v = pts[0].v; for (const p of pts) { if (p.t <= t) v = p.v; else break; } return v; };
    const inicio = p => {
      if (p === 'Tudo') return t0;
      const d = new Date(t1);
      if (p === 'YTD') return Math.max(t0, Date.UTC(d.getUTCFullYear(), 0, 1));
      d.setUTCMonth(d.getUTCMonth() - { '1M': 1, '3M': 3, '6M': 6, '1A': 12 }[p]);
      return Math.max(t0, d.getTime());
    };

    const caixa = $('#grafico'), dica = $('#dica');
    const el = (tag, attrs, pai) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (pai) pai.appendChild(n); return n; };

    function desenhar() {
      const a = inicio(periodo), b = t1;
      const base = saldoEm(a);
      /* pontos da janela: começa no saldo em "a" */
      const vis = [{ t: a, v: base, pnl: 0, inicio: true }].concat(pts.filter(p => p.t > a && p.t <= b));
      const val = p => modo === '$' ? p.v : (p.v / base - 1) * 100;

      /* drawdown dentro da janela */
      let pico = base; vis.forEach(p => { pico = Math.max(pico, p.v); p.dd = (p.v / pico - 1) * 100; });
      const ddMin = Math.min(...vis.map(p => p.dd));

      /* KPIs da janela */
      const fim = vis[vis.length - 1].v, ret = (fim / base - 1) * 100;
      $('#kpi-valor').textContent = money(fim);
      const kr = $('#kpi-retorno'); kr.textContent = pct(ret); kr.className = 'kpi-valor ' + (ret < 0 ? 'desce' : 'sobe');
      const kd = $('#kpi-dd'); kd.textContent = pct(ddMin); kd.className = 'kpi-valor ' + (ddMin < 0 ? 'desce' : '');
      $('#kpi-desde').textContent = data(a);

      /* medidas */
      const W = Math.max(300, caixa.clientWidth), H1 = W < 600 ? 240 : 320, H2 = W < 600 ? 70 : 96, gap = 28;
      const m = { l: W < 600 ? 52 : 68, r: W < 600 ? 12 : 92, t: 16, b: 28 };
      const H = m.t + H1 + gap + H2 + m.b;
      const x = t => m.l + (t - a) / Math.max(1, b - a) * (W - m.l - m.r);
      const vals = vis.map(val);
      let lo = Math.min(...vals), hi = Math.max(...vals);
      const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
      const y = v => m.t + (1 - (v - lo) / (hi - lo)) * H1;
      const y2top = m.t + H1 + gap, y2 = d => y2top + (d / Math.min(-1, ddMin * 1.1)) * H2;

      caixa.innerHTML = '';
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img',
        'aria-label': `Saldo de ${data(a)} a ${data(b)}: de ${money(base)} para ${money(fim)} (${pct(ret)}). Drawdown máximo ${pct(ddMin)}.` }, caixa);
      const defs = el('defs', {}, svg);
      const lg = el('linearGradient', { id: 'area', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el('stop', { offset: '0', 'stop-color': 'var(--dourado)', 'stop-opacity': '.32' }, lg);
      el('stop', { offset: '1', 'stop-color': 'var(--dourado)', 'stop-opacity': '0' }, lg);

      /* grelha e eixo Y */
      const passo = (hi - lo) / 4;
      for (let i = 0; i <= 4; i++) {
        const v = lo + passo * i, yy = y(v);
        el('line', { x1: m.l, x2: W - m.r, y1: yy, y2: yy, class: 'g-grelha' }, svg);
        const tx = el('text', { x: m.l - 8, y: yy + 4, 'text-anchor': 'end', class: 'g-eixo' }, svg);
        tx.textContent = modo === '$' ? '$' + (v >= 1000 ? (v / 1000).toLocaleString('pt-PT', { maximumFractionDigits: 1 }) + 'k' : Math.round(v)) : pct(v, 0);
      }
      /* linha de referência: capital no início da janela */
      const yRef = y(modo === '$' ? base : 0);
      el('line', { x1: m.l, x2: W - m.r, y1: yRef, y2: yRef, class: 'g-ref' }, svg);

      /* eixo X: até 6 marcas, no 1.º dia do mês */
      const meses = [];
      const d0 = new Date(a); let d = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + 1, 1);
      while (d <= b) { meses.push(d); const dd = new Date(d); d = Date.UTC(dd.getUTCFullYear(), dd.getUTCMonth() + 1, 1); }
      const salto = Math.max(1, Math.ceil(meses.length / (W < 600 ? 4 : 7)));
      meses.filter((_, i) => i % salto === 0).forEach(t => {
        const tx = el('text', { x: x(t), y: y2top + H2 + 20, 'text-anchor': 'middle', class: 'g-eixo' }, svg);
        tx.textContent = mesAno(t);
      });

      /* área + linha (fase DCA a tracejado) */
      const caminho = arr => arr.map((p, i) => (i ? 'L' : 'M') + x(p.t).toFixed(1) + ' ' + y(val(p)).toFixed(1)).join(' ');
      const iHodl = vis.findIndex(p => p.hodl);
      el('path', { d: caminho(vis) + ` L${x(b)} ${m.t + H1} L${x(a)} ${m.t + H1} Z`, fill: 'url(#area)' }, svg);
      if (iHodl > 0) {
        el('path', { d: caminho(vis.slice(0, iHodl + 1)), class: 'g-linha g-dca' }, svg);
        el('path', { d: caminho(vis.slice(iHodl)), class: 'g-linha' }, svg);
        const meio = (vis[0].t + vis[iHodl].t) / 2;
        const tx = el('text', { x: x(meio), y: y((val(vis[0]) + val(vis[iHodl])) / 2) - 14, 'text-anchor': 'middle', class: 'g-nota' }, svg);
        tx.textContent = 'Fase DCA · $25 ao domingo';
      } else el('path', { d: caminho(vis), class: 'g-linha' }, svg);

      /* pontos de fecho */
      vis.forEach(p => { if (!p.inicio && !p.hodl) el('circle', { cx: x(p.t), cy: y(val(p)), r: 3.2, class: p.pnl < 0 ? 'g-ponto desce' : 'g-ponto sobe' }, svg); });

      /* etiqueta do último valor */
      if (m.r > 40) {
        const ult = vis[vis.length - 1], yy = y(val(ult));
        el('rect', { x: W - m.r + 8, y: yy - 12, width: m.r - 10, height: 24, rx: 12, class: 'g-ultimo' }, svg);
        const tx = el('text', { x: W - m.r + 8 + (m.r - 10) / 2, y: yy + 4, 'text-anchor': 'middle', class: 'g-ultimo-txt' }, svg);
        tx.textContent = modo === '$' ? money0(ult.v) : pct(val(ult), 1);
      }

      /* drawdown */
      const t2 = el('text', { x: m.l, y: y2top - 8, class: 'g-eixo' }, svg); t2.textContent = 'Abaixo do pico';
      el('line', { x1: m.l, x2: W - m.r, y1: y2top, y2: y2top, class: 'g-grelha' }, svg);
      const t3 = el('text', { x: m.l - 8, y: y2(ddMin) + 4, 'text-anchor': 'end', class: 'g-eixo' }, svg); t3.textContent = pct(ddMin, 0);
      const dd = vis.map((p, i) => (i ? 'L' : 'M') + x(p.t).toFixed(1) + ' ' + y2(p.dd).toFixed(1)).join(' ');
      el('path', { d: dd + ` L${x(b)} ${y2top} L${x(a)} ${y2top} Z`, class: 'g-dd' }, svg);

      /* cursor + dica (rato e toque) */
      const cursor = el('line', { y1: m.t, y2: y2top + H2, class: 'g-cursor', visibility: 'hidden' }, svg);
      const bola = el('circle', { r: 5, class: 'g-bola', visibility: 'hidden' }, svg);
      const mostrar = ev => {
        const rect = svg.getBoundingClientRect();
        const px = (ev.clientX - rect.left) * (W / rect.width);
        let i = 0, best = Infinity; vis.forEach((p, j) => { const dx = Math.abs(x(p.t) - px); if (dx < best) { best = dx; i = j; } });
        const p = vis[i], cx = x(p.t), cy = y(val(p));
        cursor.setAttribute('x1', cx); cursor.setAttribute('x2', cx); cursor.setAttribute('visibility', 'visible');
        bola.setAttribute('cx', cx); bola.setAttribute('cy', cy); bola.setAttribute('visibility', 'visible');
        const ant = i ? vis[i - 1].v : null, dif = ant != null ? p.v - ant : 0;
        dica.innerHTML = `<b>${data(p.t)}</b><span class="dica-valor">${money(p.v)}</span>`
          + (modo === '%' ? `<span class="${val(p) < 0 ? 'desce' : 'sobe'}">${pct(val(p))} no período</span>` : '')
          + (ant != null ? `<span class="${dif < 0 ? 'desce' : 'sobe'}">${money(dif, true)} (${pct(dif / ant * 100)})</span>` : '<span>Início do período</span>')
          + (p.hodl ? '<span>Fim da fase DCA</span>' : '')
          + `<span>${pct(p.dd, 1)} abaixo do pico</span>`
          + (!p.inicio ? '<span class="dica-dica">Clica para ver a trade</span>' : '');
        dica.hidden = false;
        atual = p;
        const larg = dica.offsetWidth, esq = cx * (rect.width / W);
        dica.style.left = Math.min(rect.width - larg, Math.max(0, esq - larg / 2)) + 'px';
        dica.style.top = Math.max(0, cy * (rect.height / H) - dica.offsetHeight - 14) + 'px';
      };
      const esconder = () => { cursor.setAttribute('visibility', 'hidden'); bola.setAttribute('visibility', 'hidden'); dica.hidden = true; };
      svg.addEventListener('pointermove', mostrar);
      svg.addEventListener('pointerdown', mostrar);
      svg.addEventListener('pointerleave', esconder);
      /* clique (ou toque): mostra por baixo as trades fechadas nesse dia */
      let atual = null;
      svg.addEventListener('click', ev => { mostrar(ev); if (atual) detalhe(atual); });
    }

    /* ---------- Trades do ponto escolhido ---------- */
    const caixaDet = $('#trades-dia');
    function detalhe(p) {
      const iso = new Date(p.t).toISOString().slice(0, 10);
      const dia = r.linhas.filter(t => t.fecho === iso);
      if (!dia.length) {
        caixaDet.innerHTML = `<p class="det-vazio">${data(p.t)}: início do período, sem trades fechadas neste dia.</p>`;
      } else {
        const soma = dia.reduce((s, t) => s + t.pnl, 0);
        caixaDet.innerHTML = `<div class="det-cabeca"><p class="kpi-rotulo">Trades fechadas a ${data(p.t)}</p>
            <p class="det-soma ${soma < 0 ? 'desce' : 'sobe'}">${money(soma, true)} no dia</p></div>
          <ul class="det-lista">${dia.map(t => `<li>
            <span class="tipo tipo-${t.tipo}">${ROTULO[t.tipo] || t.tipo}</span>
            <strong class="det-par">${t.par}</strong>
            <span class="det-datas">${data(EA.parseDate(t.abertura))} → ${data(EA.parseDate(t.fecho))} · ${duracao(t)}</span>
            <span>Capital ${money(t.capital)}</span>
            <span class="${t.pnl < 0 ? 'desce' : 'sobe'} det-pnl">${money(t.pnl, true)} · ${pct(t.percent)}</span>
            <span>Saldo após ${money(t.saldoApos)}</span>
            <span class="det-n">Trade n.º ${t.n}</span></li>`).join('')}</ul>`;
      }
      caixaDet.hidden = false;
      caixaDet.scrollIntoView({ block: 'nearest' });
    }

    /* botões de período e de unidade */
    document.querySelectorAll('[data-periodo]').forEach(bt => bt.addEventListener('click', () => {
      periodo = bt.dataset.periodo;
      document.querySelectorAll('[data-periodo]').forEach(o => o.setAttribute('aria-pressed', o === bt));
      desenhar();
    }));
    document.querySelectorAll('[data-modo]').forEach(bt => bt.addEventListener('click', () => {
      modo = bt.dataset.modo;
      document.querySelectorAll('[data-modo]').forEach(o => o.setAttribute('aria-pressed', o === bt));
      desenhar();
    }));
    let espera; window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(desenhar, 150); });
    desenhar();
  }

  /* ---------- Retornos mensais (desde a primeira trade) ---------- */
  function mensais(r) {
    const pts = r.curva;
    const saldoEm = t => { let v = pts[0].v; for (const p of pts) { if (p.t <= t) v = p.v; else break; } return v; };
    const primeira = r.linhas.find(t => t.tipo !== 'hodl');
    const [ya, ma] = primeira.fecho.split('-').map(Number);
    const fim = new Date(r.ultimaData), yb = fim.getUTCFullYear(), mb = fim.getUTCMonth() + 1;
    const fimMes = (y, m) => Date.UTC(y, m, 0);
    let html = '<thead><tr><th scope="col">Ano</th>' + MESES.map(n => `<th scope="col">${n}</th>`).join('') + '<th scope="col">Ano</th></tr></thead><tbody>';
    for (let y = ya; y <= yb; y++) {
      html += `<tr><th scope="row">${y}</th>`;
      let ini = null, ult = null;
      for (let m = 1; m <= 12; m++) {
        const dentro = (y > ya || m >= ma) && (y < yb || m <= mb);
        if (!dentro) { html += '<td class="vazio">—</td>'; continue; }
        const antes = saldoEm(fimMes(y, m - 1)), depois = saldoEm(fimMes(y, m));
        if (ini == null) ini = antes; ult = depois;
        const v = (depois / antes - 1) * 100;
        const forca = Math.min(1, Math.abs(v) / 15);
        html += `<td class="${v < 0 ? 'desce' : v > 0 ? 'sobe' : ''}" style="--forca:${forca.toFixed(2)}">${pct(v, 1)}</td>`;
      }
      const va = ini ? (ult / ini - 1) * 100 : 0;
      html += `<td class="ano ${va < 0 ? 'desce' : 'sobe'}">${pct(va, 1)}</td></tr>`;
    }
    $('#mensais').innerHTML = html + '</tbody>';
  }

  /* ---------- Tabela de trades (mais recentes primeiro) ---------- */
  const POR_PAGINA = 10;
  const ROTULO = { hodl: 'HODL', long: 'Long', short: 'Short' };
  const duracao = t => {
    const d = Math.round((EA.parseDate(t.fecho) - EA.parseDate(t.abertura)) / dia);
    return d <= 0 ? 'mesmo dia' : d === 1 ? '1 dia' : d + ' dias';
  };
  function tabela(r, pagina) {
    const ord = r.linhas.slice().sort((a, b) => b.fecho.localeCompare(a.fecho) || b.n - a.n);
    const total = Math.max(1, Math.ceil(ord.length / POR_PAGINA));
    pagina = Math.min(Math.max(1, pagina), total);
    const c = t => t.pnl < 0 ? 'desce' : 'sobe';
    $('#trades-corpo').innerHTML = ord.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map(t => `<tr>
      <td data-r="#">${t.n}</td>
      <td data-r="Tipo"><span class="tipo tipo-${t.tipo}">${ROTULO[t.tipo] || t.tipo}</span></td>
      <td data-r="Par" class="par">${t.par}</td>
      <td data-r="Capital">${money(t.capital)}</td>
      <td data-r="Capital total **">${money(t.capitalTotal)}</td>
      <td data-r="Abertura">${data(EA.parseDate(t.abertura))}</td>
      <td data-r="Fecho">${data(EA.parseDate(t.fecho))}</td>
      <td data-r="P&amp;L" class="${c(t)} forte">${money(t.pnl, true)}</td>
      <td data-r="% *" class="${c(t)}">${pct(t.percent)}</td>
      <td data-r="Saldo após">${money(t.saldoApos)}</td>
      <td data-r="Duração" class="suave">${duracao(t)}</td></tr>`).join('');
    $('#trades-total').innerHTML = `<tr><th scope="row" colspan="7">Total P&amp;L</th><td class="${r.lucro < 0 ? 'desce' : 'sobe'} forte">${money(r.lucro, true)}</td><td colspan="3"></td></tr>`;
    const nav = $('#paginas');
    let h = `<button type="button" data-pag="${pagina - 1}" ${pagina === 1 ? 'disabled' : ''}>‹ Anterior</button>`;
    for (let p = 1; p <= total; p++) h += `<button type="button" data-pag="${p}" ${p === pagina ? 'aria-current="page"' : ''}>${p}</button>`;
    h += `<button type="button" data-pag="${pagina + 1}" ${pagina === total ? 'disabled' : ''}>Seguinte ›</button>`;
    nav.innerHTML = h;
    nav.onclick = e => { const b = e.target.closest('[data-pag]'); if (b && !b.disabled) { tabela(r, +b.dataset.pag); $('#registo').scrollIntoView({ block: 'start' }); } };
  }
})();

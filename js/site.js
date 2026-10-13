/* =========================================================
   COMUM A TODAS AS PÁGINAS
   1. Menu do telemóvel
   2. Carteira: ler trades.json e fazer as contas (window.EA)
   ========================================================= */

/* ---------- 1. Menu do telemóvel ---------- */
(function () {
  const botao = document.querySelector('.menu-botao');
  const menu = document.getElementById('menu');
  if (!botao || !menu) return;
  /* abre e fecha o menu de ecrã inteiro; o site por trás não desliza */
  const mudar = aberto => {
    menu.classList.toggle('aberto', aberto);
    document.body.classList.toggle('menu-aberto', aberto);
    botao.setAttribute('aria-expanded', aberto);
    botao.textContent = aberto ? 'Fechar' : 'Menu';
  };
  botao.addEventListener('click', () => mudar(!menu.classList.contains('aberto')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) mudar(false); });
  /* Escape fecha o menu */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('aberto')) { mudar(false); botao.focus(); }
  });
})();

/* ---------- Ligações que abrem noutro separador: avisar quem usa leitor de ecrã ---------- */
document.querySelectorAll('a[target="_blank"]').forEach(a => {
  a.innerHTML = a.innerHTML.replace('↗', '<span aria-hidden="true">↗</span>');
  a.insertAdjacentHTML('beforeend', '<span class="so-leitor"> (abre noutro separador)</span>');
});


/* ---------- 2. Carteira ----------
   As mesmas contas da página de copytrade atual, para os números baterem certo. */
window.EA = (function () {
  const dia = 86400000;
  const parseDate = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };

  /* Formatos: $16 056,15 · +4,25% · 24/09/2026 */
  const n2 = v => Math.abs(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
  const n0 = v => Math.abs(v).toLocaleString('pt-PT', { maximumFractionDigits: 0, useGrouping: 'always' });
  const money = (v, sinal) => (sinal ? (v < 0 ? '−' : '+') : (v < 0 ? '−' : '')) + '$' + n2(v);
  const money0 = (v, sinal) => (sinal ? (v < 0 ? '−' : '+') : (v < 0 ? '−' : '')) + '$' + n0(v);
  const pct = (v, casas = 2) => (v < 0 ? '−' : '+') + Math.abs(v).toLocaleString('pt-PT', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + '%';
  const data = t => { const d = new Date(t); return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + d.getUTCFullYear(); };
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const mesAno = t => { const d = new Date(t); return MESES[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };

  function calcular(db) {
    let saldo = db.capitalInicial;
    const linhas = db.trades.map(t => {
      const capitalTotal = t.capitalTotal != null ? t.capitalTotal : saldo;
      saldo = Math.round((saldo + t.pnl) * 100) / 100;
      return Object.assign({}, t, { capitalTotal, saldoApos: saldo, percent: (t.pnl / capitalTotal) * 100 });
    });
    const capitalAtual = saldo;
    const lucro = Math.round((capitalAtual - db.capitalInicial) * 100) / 100;
    const retorno = (lucro / db.capitalInicial) * 100;
    const inicio = parseDate(db.trades[0].abertura);
    const fim = Math.max(...db.trades.map(t => parseDate(t.fecho)));  /* fecho mais recente */
    const anos = (fim - inicio) / (365.25 * dia);
    const posicoes = linhas.filter(t => t.tipo !== 'hodl');
    const ganhas = posicoes.filter(t => t.pnl > 0);
    return {
      linhas, capitalAtual, lucro, retorno, anos, capitalInicial: db.capitalInicial,
      anoInicio: new Date(inicio).getUTCFullYear(), nPosicoes: posicoes.length,
      ganhas: ganhas.length,
      acerto: posicoes.length ? ganhas.length / posicoes.length * 100 : 0,
      melhor: posicoes.reduce((a, t) => t.pnl > a.pnl ? t : a, posicoes[0]),
      pior: posicoes.reduce((a, t) => t.pnl < a.pnl ? t : a, posicoes[0]),
      ultimaData: fim, curva: curva(db)
    };
  }

  /* Curva do saldo: um ponto por dia de fecho, a começar no capital inicial */
  function curva(db) {
    const ord = db.trades.slice().sort((a, b) => a.fecho.localeCompare(b.fecho) || a.n - b.n);
    const inicio = db.trades.reduce((m, t) => t.abertura < m ? t.abertura : m, db.trades[0].abertura);
    const porDia = new Map([[inicio, { v: db.capitalInicial, pnl: 0, hodl: false }]]);
    let saldo = db.capitalInicial;
    ord.forEach(t => {
      saldo = Math.round((saldo + t.pnl) * 100) / 100;
      const p = porDia.get(t.fecho) || { pnl: 0, hodl: false };
      porDia.set(t.fecho, { v: saldo, pnl: p.pnl + t.pnl, hodl: p.hodl || t.tipo === 'hodl' });
    });
    return [...porDia].map(([iso, p]) => ({ t: parseDate(iso), v: p.v, pnl: p.pnl, hodl: p.hodl }))
      .sort((a, b) => a.t - b.t);
  }

  /* trades.json no site publicado; cópia local quando se abre com duplo clique */
  function carregar() {
    /* Aberto com duplo clique: o browser não deixa ler o trades.json, por isso usa a cópia */
    if (location.protocol === 'file:') return new Promise(ok => {
      if (window.TRADES_COPIA) return ok(calcular(window.TRADES_COPIA));
      const sc = document.createElement('script'); sc.src = 'js/trades-copia.js';
      sc.onload = () => ok(calcular(window.TRADES_COPIA)); document.head.appendChild(sc);
    });
    return fetch('trades.json?v=' + Date.now())
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .catch(() => window.TRADES_COPIA)
      .then(db => calcular(db));
  }


  return { carregar, money, money0, pct, data, mesAno, MESES, parseDate, dia };
})();

/* =========================================================
   CARTEIRA PÚBLICA · comportamento da página
   1. Desenhar os cartões a partir de js/episodios.js
   2. Filtros (Todos · Origem · Semana a semana)
   3. Janela do episódio (o vídeo só carrega quando se pede)
   ========================================================= */
(function () {
  const EPS = window.EPISODIOS || [];
  const $ = (s, el = document) => el.querySelector(s);
  const disponiveis = EPS.filter(e => e.estado === 'no-ar');

  /* Datas e números em português de Portugal */
  const fmtData = d => d ? new Date(d + 'T12:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }) : '';
  const fmtDolar = v => v.toLocaleString('pt-PT') + ' $';
  const fmtPct = v => (v > 0 ? '+' : '') + v.toLocaleString('pt-PT', { maximumFractionDigits: 1 }) + ' %';


  /* ---------- 2. Cartões ---------- */
  function cartao(e) {
    const noAr = e.estado === 'no-ar';
    const selo = noAr ? '<span class="selo selo-ar">No ar</span>'
                      : `<span class="selo">${e.estreia ? 'Estreia ' + fmtData(e.estreia) : 'Segunda-feira'}</span>`;
    const imagem = e.imagem
      ? `<img src="${e.imagem}" alt="" width="640" height="688" loading="lazy">`
      : '<span class="cartao-vazio"><img src="img/logo.webp" alt="" width="178" height="240"></span>';
    let meta = e.duracao || '';
    if (e.valor != null) meta = `${fmtDolar(e.valor)} <span class="${e.variacao >= 0 ? 'sobe' : 'desce'}">${fmtPct(e.variacao)}</span>`;
    return `<li><button type="button" class="cartao" data-abrir="${e.id}" ${noAr ? '' : 'aria-disabled="true"'}
              aria-label="${e.etiqueta}: ${e.titulo}${noAr ? '' : ' (ainda não saiu)'}">
      <span class="cartao-imagem">${selo}${imagem}</span>
      <span class="cartao-corpo">
        <span class="cartao-etiqueta">${e.etiqueta}</span>
        <span class="cartao-titulo">${e.titulo}</span>
        <span class="cartao-meta"><span>${meta}</span>${noAr ? '<span class="cartao-play" aria-hidden="true">▶</span>' : ''}</span>
      </span>
    </button></li>`;
  }
  function desenhar() {
    document.querySelectorAll('[data-trilho]').forEach(ol => {
      ol.innerHTML = EPS.filter(e => e.fase === ol.dataset.trilho).map(cartao).join('');
    });
  }

  /* ---------- 3. Filtros ---------- */
  const filtros = $('#filtros');
  if (filtros) filtros.addEventListener('click', ev => {
    const b = ev.target.closest('[data-filtro]'); if (!b) return;
    document.querySelectorAll('[data-filtro]').forEach(x => x.setAttribute('aria-pressed', x === b));
    document.querySelectorAll('.fila').forEach(f => { f.hidden = b.dataset.filtro !== 'todos' && f.dataset.fase !== b.dataset.filtro; });
  });

  /* ---------- 4. Janela do episódio ---------- */
  const janela = $('#janela');
  let atual = null;

  /* Endereço de incorporação do Instagram: /p/CODIGO/ -> /p/CODIGO/embed/ */
  /* Instagram (/p/ ou /reel/) ou YouTube (Shorts, watch, youtu.be) */
  const embed = link => {
    if (/instagram\.com\/(p|reel)\//.test(link)) return link.split('?')[0].replace(/\/?$/, '/') + 'embed/';
    const yt = link.match(/(?:shorts\/|watch\?v=|youtu\.be\/)([\w-]{11})/);
    return yt ? 'https://www.youtube-nocookie.com/embed/' + yt[1] : '';
  };
  const origem = link => /youtu/.test(link) ? 'YouTube' : 'Instagram';

  function abrir(id) {
    const e = EPS.find(x => x.id === id);
    if (!e || e.estado !== 'no-ar') return;
    atual = e;
    $('#janela-etiqueta').textContent = [e.etiqueta, fmtData(e.estreia), e.duracao].filter(Boolean).join(' · ');
    $('#janela-titulo').textContent = e.titulo;
    $('#janela-resumo').textContent = e.resumo;
    $('#janela-link').href = e.link;
    $('#janela-link').firstChild.textContent = 'Abrir no ' + origem(e.link) + ' ';

    /* O vídeo aparece logo ao abrir o episódio (o clique no cartão já é o pedido da pessoa),
       como na página Verificação. YouTube em modo de privacidade reforçada (youtube-nocookie). */
    const src = embed(e.link);
    $('#leitor').innerHTML = src
      ? `<iframe src="${src}" title="${e.etiqueta}: ${e.titulo}" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
      : (e.imagem ? `<img src="${e.imagem}" alt="" width="640" height="688">` : '');

    const c = $('#janela-carteira');
    c.hidden = e.valor == null;
    if (e.valor != null) c.innerHTML = `<div><dt>Carteira</dt><dd>${fmtDolar(e.valor)}</dd></div>
      <div><dt>Na semana</dt><dd class="${e.variacao >= 0 ? 'sobe' : 'desce'}">${fmtPct(e.variacao)}</dd></div>`;

    const i = disponiveis.indexOf(e);
    $('#anterior').disabled = i <= 0;
    $('#seguinte').disabled = i >= disponiveis.length - 1;
    if (!janela.open) janela.showModal();
  }
  function fechar() { janela.close(); }

  document.addEventListener('click', ev => {
    const a = ev.target.closest('[data-abrir]'); if (a) { abrir(a.dataset.abrir); return; }
    if (ev.target.closest('[data-fechar]')) fechar();
  });
  janela.addEventListener('click', ev => { if (ev.target === janela) fechar(); });
  janela.addEventListener('close', () => { $('#leitor').innerHTML = ''; desenhar(); });
  $('#anterior').addEventListener('click', () => abrir(disponiveis[disponiveis.indexOf(atual) - 1].id));
  $('#seguinte').addEventListener('click', () => abrir(disponiveis[disponiveis.indexOf(atual) + 1].id));

  desenhar();
  /* serie.html#origem-1 abre logo esse episódio */
  const alvo = location.hash.slice(1);
  if (alvo && EPS.some(e => e.id === alvo)) abrir(alvo);
})();

/* =========================================================
   EPISÓDIOS DA CARTEIRA PÚBLICA
   Este ficheiro é escrito pela admin, no computador do Hugo.
   Está em .js (e não .json) para o site abrir também com duplo clique.

   Campos:
   - fase:      "origem" ou "semanal"
   - etiqueta:  o texto pequeno do cartão ("Origem · 1 de 3")
   - estado:    "no-ar" (tem link) ou "em-breve"
   - link:      endereço do YouTube Shorts (ou do post no Instagram)
   - valor / variacao: só nas atualizações semanais (dólares, Bybit)
   ========================================================= */
window.EPISODIOS = [
  {
    "id": "origem-1",
    "fase": "origem",
    "etiqueta": "Origem · 1 de 3",
    "titulo": "25 dólares ao domingo",
    "duracao": "0:35",
    "estreia": "2026-10-12",
    "resumo": "Em 2022 comecei a comprar 25 dólares de Bitcoin todos os domingos. E mostrei cada compra nos stories, semanas em perda incluídas.",
    "imagem": "img/origem-1.webp",
    "estado": "no-ar",
    "link": "https://youtube.com/shorts/e50iyaMnfJs"
  },
  {
    "id": "origem-2",
    "fase": "origem",
    "etiqueta": "Origem · 2 de 3",
    "titulo": "De 3.310 a 10.500",
    "duracao": "0:33",
    "estreia": "2026-10-14",
    "resumo": "Três anos de compras semanais, sem falhar um domingo. Quanto foi investido e quanto passou a valer.",
    "imagem": "img/origem-2.webp",
    "estado": "no-ar",
    "link": "https://youtube.com/shorts/JsqUB70eFds"
  },
  {
    "id": "origem-3",
    "fase": "origem",
    "etiqueta": "Origem · 3 de 3",
    "titulo": "A viragem",
    "duracao": "0:34",
    "estreia": "2026-10-16",
    "resumo": "Em 2025 deixei de comprar todos os domingos e passei a fazer trading. Como a carteira é gerida hoje.",
    "imagem": "img/origem-3.webp",
    "estado": "no-ar",
    "link": "https://youtube.com/shorts/kO_oqH-9Uzw"
  },
  {
    "id": "atualizacao-1",
    "fase": "semanal",
    "etiqueta": "Atualização 1",
    "titulo": "O ponto de partida",
    "duracao": "",
    "estreia": "2026-10-19",
    "resumo": "A primeira segunda-feira: o valor da carteira hoje e o que está aberto.",
    "imagem": "img/atualizacao-1.webp",
    "estado": "no-ar",
    "link": "https://youtube.com/shorts/Y2ie7Rplys0",
    "valor": 15627,
    "variacao": null
  },
  {
    "id": "atualizacao-2",
    "fase": "semanal",
    "etiqueta": "Atualização 2",
    "titulo": "Semana 2",
    "duracao": "",
    "estreia": "2026-10-26",
    "resumo": "O valor da carteira nesta segunda-feira e como correu a semana.",
    "imagem": "",
    "estado": "em-breve",
    "link": "",
    "valor": null,
    "variacao": null
  }
];

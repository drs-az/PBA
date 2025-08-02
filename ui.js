import { decksConfig } from './deck.js';
import {
  players,
  currentPlayer,
  canUseAttack,
  playAttack,
  playCard,
  playPokemonToBench,
  retreatPokemon,
  endTurn,
  choosePokemon,
  provideHint
} from './battle.js';

const setupSection = document.getElementById('setup');
const battleSection = document.getElementById('battle');
const pokemonChoicesDiv = document.getElementById('pokemonChoices');
const statusP = document.getElementById('status');
const movesDiv = document.getElementById('moves');
const handDiv = document.getElementById('hand');
const benchDiv = document.getElementById('bench');
const p1Img = document.getElementById('p1Img');
const p2Img = document.getElementById('p2Img');
const p1DeckSpan = document.getElementById('p1Deck');
const p2DeckSpan = document.getElementById('p2Deck');
const p1PrizesSpan = document.getElementById('p1Prizes');
const p2PrizesSpan = document.getElementById('p2Prizes');
const currentPlayerSpan = document.getElementById('currentPlayer');
const p1ActiveName = document.getElementById('p1ActiveName');
const p2ActiveName = document.getElementById('p2ActiveName');
const cardInfoDiv = document.getElementById('cardInfo');
const hintBtn = document.getElementById('hintBtn');
hintBtn.addEventListener('click', provideHint);

let selectedCardIdx = null;

function getPokemonImage(name) {
  return `img/pokemon/${name.toLowerCase()}.png`;
}

export function updateStatus(text) {
  statusP.innerHTML = text;
}

export function updateDeckInfo() {
  p1DeckSpan.textContent = `Deck: ${players[0].deck.length}`;
  p2DeckSpan.textContent = `Deck: ${players[1].deck.length}`;
  p1PrizesSpan.textContent = `Prizes: ${players[0].prizeCards.length}`;
  p2PrizesSpan.textContent = `Prizes: ${players[1].prizeCards.length}`;
}

export function updateActiveInfo() {
  p1Img.src = getPokemonImage(players[0].active.name);
  p2Img.src = getPokemonImage(players[1].active.name);
  p1ActiveName.textContent = `${players[0].active.name} (${players[0].active.hp} HP)`;
  p2ActiveName.textContent = `${players[1].active.name} (${players[1].active.hp} HP)`;
}

export function renderHand() {
  const player = players[currentPlayer];
  movesDiv.innerHTML = '';
  handDiv.innerHTML = '';
  benchDiv.innerHTML = '';
  cardInfoDiv.innerHTML = '';
  selectedCardIdx = null;

  renderBench(player);

  const groups = player.hand.reduce((acc, card, idx) => {
    (acc[card.type] = acc[card.type] || []).push({ card, idx });
    return acc;
  }, {});

  Object.keys(groups).forEach(type => {
    const heading = document.createElement('h3');
    heading.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    handDiv.appendChild(heading);
    groups[type].forEach(({ card, idx }) => {
      const btn = document.createElement('button');
      btn.textContent = card.name;
      btn.onclick = () => showCardDetails(card, idx);
      handDiv.appendChild(btn);
    });
  });

  if (!player.turnState.attack && player.active) {
    player.active.attacks.forEach((attack, idx) => {
      if (canUseAttack(player.active, attack)) {
        const aBtn = document.createElement('button');
        aBtn.textContent = `${attack.name} (${attack.damage})`;
        aBtn.onclick = () => playAttack(idx);
        movesDiv.appendChild(aBtn);
      }
    });
  }

  const endBtn = document.createElement('button');
  endBtn.textContent = 'End Turn';
  endBtn.onclick = endTurn;
  movesDiv.appendChild(endBtn);
}

function renderBench(player) {
  const heading = document.createElement('h3');
  heading.textContent = 'Bench';
  benchDiv.appendChild(heading);
  player.bench.forEach((poke, idx) => {
    const btn = document.createElement('button');
    btn.textContent = `${poke.name} (${poke.hp} HP)`;
    btn.onclick = () => {
      retreatPokemon(idx);
      updateStatus(`${players[currentPlayer].name} retreated to ${players[currentPlayer].active.name}.`);
    };
    benchDiv.appendChild(btn);
  });
  for (let i = player.bench.length; i < 5; i++) {
    const placeholder = document.createElement('button');
    if (selectedCardIdx !== null) {
      placeholder.textContent = 'Place here';
      placeholder.onclick = () => playPokemonToBench(selectedCardIdx);
    } else {
      placeholder.textContent = '(empty)';
      placeholder.disabled = true;
    }
    benchDiv.appendChild(placeholder);
  }
}

function showCardDetails(card, idx) {
  const player = players[currentPlayer];
  if (selectedCardIdx === idx) {
    selectedCardIdx = null;
    cardInfoDiv.innerHTML = '';
    benchDiv.innerHTML = '';
    renderBench(player);
    return;
  }
  selectedCardIdx = idx;
  let info = `<strong>${card.name}</strong> (${card.type})`;
  if (card.type === 'pokemon') {
    info += `<br>HP: ${card.hp}<br>Attacks: ${card.attacks.map(a => `${a.name} (${a.damage})`).join(', ')}`;
  } else if (card.type === 'trainer') {
    info += `<br>Effect: ${card.effect}`;
  } else if (card.type === 'energy') {
    info += `<br>Energy Type: ${card.energyType}`;
  }
  cardInfoDiv.innerHTML = info;
  benchDiv.innerHTML = '';
  renderBench(player);
  if (card.type === 'pokemon') {
    const benchBtn = document.createElement('button');
    benchBtn.textContent = 'Play to Bench';
    benchBtn.onclick = () => playPokemonToBench(idx);
    if (player.bench.length >= 5) benchBtn.disabled = true;
    cardInfoDiv.appendChild(document.createElement('br'));
    cardInfoDiv.appendChild(benchBtn);
  } else {
    const playBtn = document.createElement('button');
    playBtn.textContent = 'Play Card';
    playBtn.onclick = () => playCard(idx);
    if (card.type === 'energy' && player.turnState.energy) playBtn.disabled = true;
    if (card.type === 'trainer' && player.turnState.trainer) playBtn.disabled = true;
    cardInfoDiv.appendChild(document.createElement('br'));
    cardInfoDiv.appendChild(playBtn);
  }
}

export function showPokemonChoices() {
  pokemonChoicesDiv.innerHTML = '';
  const chosen = players.map(p => p.persona).filter(Boolean);
  Object.keys(decksConfig).forEach(name => {
    if (chosen.includes(name)) return;
    const btn = document.createElement('button');
    btn.classList.add('pokemon-choice');
    const img = document.createElement('img');
    img.src = getPokemonImage(name);
    img.alt = name;
    btn.appendChild(img);
    const label = document.createElement('div');
    label.textContent = name;
    btn.appendChild(label);
    btn.onclick = () => choosePokemon(name);
    pokemonChoicesDiv.appendChild(btn);
  });
}

export function showBattleUI() {
  setupSection.classList.add('hidden');
  battleSection.classList.remove('hidden');
}

export { currentPlayerSpan };

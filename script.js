// Simplified text-based Pokémon Battle Academy logic

let cardDB = [];

async function loadCardDB() {
  const res = await fetch('data/pokemon_cardDB.json');
  const data = await res.json();
  cardDB = data.cards;
}

function getCardDefinition(cardId) {
  const card = cardDB.find(c => c.id === cardId);
  if (!card) throw new Error(`Card not found: ${cardId}`);
  return JSON.parse(JSON.stringify(card));
}

const decksConfig = {
  Pikachu: [
    { id: 'pikachu', count: 1 },
    { id: 'electabuzz', count: 1 },
    { id: 'magnemite', count: 1 },
    { id: 'raichu', count: 1 },
    { id: 'jolteon', count: 1 },
    { id: 'electric_energy', count: 10 },
    { id: 'potion', count: 2 },
    { id: 'professor_oak', count: 2 },
    { id: 'switch', count: 2 },
    { id: 'energy_retrieval', count: 2 },
    { id: 'escape_rope', count: 2 }
  ],
  Charmander: [
    { id: 'charmander', count: 1 },
    { id: 'growlithe', count: 1 },
    { id: 'ponyta', count: 1 },
    { id: 'charmeleon', count: 1 },
    { id: 'flareon', count: 1 },
    { id: 'fire_energy', count: 10 },
    { id: 'potion', count: 2 },
    { id: 'bill', count: 2 },
    { id: 'energy_search', count: 2 },
    { id: 'fire_crystal', count: 2 },
    { id: 'burn_heal', count: 2 }
  ],
  Bulbasaur: [
    { id: 'bulbasaur', count: 1 },
    { id: 'oddish', count: 1 },
    { id: 'bellsprout', count: 1 },
    { id: 'ivysaur', count: 1 },
    { id: 'leafeon', count: 1 },
    { id: 'grass_energy', count: 10 },
    { id: 'energy_switch', count: 2 },
    { id: 'full_heal', count: 2 },
    { id: 'professor_elm', count: 2 },
    { id: 'sleep_powder', count: 2 }
  ]
};

function assembleDeck(persona) {
  const config = decksConfig[persona];
  if (!config) throw new Error(`Deck config missing for persona: ${persona}`);

  let deck = [];
  config.forEach(entry => {
    for (let i = 0; i < entry.count; i++) {
      deck.push(getCardDefinition(entry.id));
    }
  });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function drawCards(deck, n = 1) {
  return deck.splice(0, n);
}

function attachEnergy(pokemon, energyCard) {
  pokemon.attachedEnergy = pokemon.attachedEnergy || [];
  pokemon.attachedEnergy.push(energyCard);
}

function canUseAttack(pokemon, attack) {
  return (
    (pokemon.attachedEnergy?.length || 0) >= attack.energyRequired &&
    pokemon.hp > 0
  );
}

function applyAttack(attacker, attack, defender) {
  defender.hp = Math.max(defender.hp - attack.damage, 0);
  switch (attack.effectKeyword) {
    case 'paralyze':
      defender.status = 'Paralyzed';
      break;
    case 'heal':
      attacker.hp = Math.min(attacker.hp + 10, attacker.maxHp);
      break;
    case 'discard_energy':
      attacker.attachedEnergy?.pop();
      break;
  }
}

function getPokemonImage(name) {
  return `img/pokemon/${name.toLowerCase()}.png`;
}

// Player structures
const players = [
  { name: 'Player 1', isAI: false },
  { name: 'Player 2', isAI: false }
];

let currentPlayer = 0;
let defendingPlayer = 1;
let choosingPlayer = 0;

const setupSection = document.getElementById('setup');
const battleSection = document.getElementById('battle');
const pokemonChoicesDiv = document.getElementById('pokemonChoices');
const statusP = document.getElementById('status');
const movesDiv = document.getElementById('moves');
const handDiv = document.getElementById('hand');
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

function showPokemonChoices() {
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

function buildDeck(player) {
  player.deck = assembleDeck(player.persona);
  player.prizeCards = drawCards(player.deck, 3);
  player.hand = drawCards(player.deck, 7);
  const activeIdx = player.hand.findIndex(c => c.type === 'pokemon');
  if (activeIdx >= 0) {
    player.active = player.hand.splice(activeIdx, 1)[0];
  } else {
    const idx = player.deck.findIndex(c => c.type === 'pokemon');
    player.active = player.deck.splice(idx, 1)[0];
  }
  player.active.maxHp = player.active.hp;
  player.active.attachedEnergy = [];
  player.prizesTaken = 0;
}

function choosePokemon(name) {
  players[choosingPlayer].persona = name;
  choosingPlayer++;
  if (choosingPlayer < players.length) {
    currentPlayerSpan.textContent = choosingPlayer + 1;
    showPokemonChoices();
  } else {
    buildDeck(players[0]);
    buildDeck(players[1]);
    startBattle();
  }
}

function startBattle() {
  currentPlayer = 0;
  defendingPlayer = 1;
  updateActiveInfo();
  updateDeckInfo();
  setupSection.classList.add('hidden');
  battleSection.classList.remove('hidden');
  startTurn("Game start! ");
}

function startTurn(message = '') {
  const player = players[currentPlayer];
  player.turnState = { energy: false, trainer: false, attack: false };
  player.hand.push(...drawCards(player.deck, 1));
  updateDeckInfo();
  updateStatus(`${message}${player.name}'s turn.`);
  if (player.isAI) {
    setTimeout(aiTurn, 500);
  } else {
    renderHand();
  }
}

function renderHand() {
  const player = players[currentPlayer];
  movesDiv.innerHTML = '';
  handDiv.innerHTML = '';
  cardInfoDiv.innerHTML = '';
  selectedCardIdx = null;

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

function showCardDetails(card, idx) {
  const player = players[currentPlayer];
  if (selectedCardIdx === idx) {
    selectedCardIdx = null;
    cardInfoDiv.innerHTML = '';
    return;
  }
  selectedCardIdx = idx;
  let info = `<strong>${card.name}</strong> (${card.type})`;
  if (card.type === 'pokemon') {
    info += `<br>HP: ${card.hp}<br>Attacks: ${card.attacks`
      .map(a => `${a.name} (${a.damage})`)
      .join(', ')}`;
  } else if (card.type === 'trainer') {
    info += `<br>Effect: ${card.effect}`;
  } else if (card.type === 'energy') {
    info += `<br>Energy Type: ${card.energyType}`;
  }
  cardInfoDiv.innerHTML = info;
  const playBtn = document.createElement('button');
  playBtn.textContent = 'Play Card';
  playBtn.onclick = () => playCard(idx);
  if (card.type === 'energy' && player.turnState.energy) playBtn.disabled = true;
  if (card.type === 'trainer' && player.turnState.trainer) playBtn.disabled = true;
  if (card.type === 'pokemon') playBtn.disabled = true;
  cardInfoDiv.appendChild(document.createElement('br'));
  cardInfoDiv.appendChild(playBtn);
}

function playCard(idx) {
  const card = players[currentPlayer].hand[idx];
  if (!card) return;
  if (card.type === 'energy') {
    playEnergy(idx);
  } else if (card.type === 'trainer') {
    playTrainer(idx);
  }
}

function playEnergy(idx) {
  const player = players[currentPlayer];
  if (player.turnState.energy) return;
  const energyCard = player.hand.splice(idx, 1)[0];
  attachEnergy(player.active, energyCard);
  player.turnState.energy = true;
  updateStatus(`${player.name} attached ${energyCard.name}.`);
  renderHand();
}

function applyTrainer(player, card) {
  switch (card.effectKeyword) {
    case 'heal': {
      const amount = parseInt(card.effect.match(/\d+/)) || 10;
      player.active.hp = Math.min(player.active.maxHp, player.active.hp + amount);
      updateStatus(`${player.name} healed ${amount} HP.`);
      break;
    }
    case 'draw': {
      const amount = parseInt(card.effect.match(/\d+/)) || 1;
      player.hand.push(...drawCards(player.deck, amount));
      updateStatus(`${player.name} drew ${amount} cards.`);
      break;
    }
    default:
      player.hand.push(...drawCards(player.deck, 1));
      updateStatus(`${player.name} drew a card.`);
      break;
  }
  updateActiveInfo();
}

function playTrainer(idx) {
  const player = players[currentPlayer];
  if (player.turnState.trainer) return;
  const card = player.hand.splice(idx, 1)[0];
  applyTrainer(player, card);
  player.turnState.trainer = true;
  renderHand();
}

function playAttack(idx) {
  const attacker = players[currentPlayer];
  const defender = players[defendingPlayer];
  if (attacker.turnState.attack) return;
  const attack = attacker.active.attacks[idx];
  if (!canUseAttack(attacker.active, attack)) {
    updateStatus('Not enough energy.');
    return;
  }
  applyAttack(attacker.active, attack, defender.active);
  updateActiveInfo();
  attacker.turnState.attack = true;
  let message = `${attacker.name}'s ${attacker.active.name} used ${attack.name} for ${attack.damage} damage! `;
  if (defender.active.hp === 0) {
    handleKnockout(attacker, defender, message);
  } else {
    message += `${defender.active.name} has ${defender.active.hp} HP left.`;
    updateStatus(message);
    endTurn();
  }
}

function handleKnockout(attacker, defender, message) {
  message += `${defender.active.name} was knocked out! `;
  if (attacker.prizeCards.length > 0) {
    attacker.prizeCards.pop();
    attacker.prizesTaken++;
    message += `${attacker.name} takes a prize (${attacker.prizesTaken}/3). `;
    if (attacker.prizeCards.length === 0) {
      updateStatus(message + `${attacker.name} wins!`);
      movesDiv.innerHTML = '';
      return;
    }
  }
  if (!promotePokemon(defender)) {
    updateStatus(message + `${defender.name} has no Pokémon left. ${attacker.name} wins!`);
    movesDiv.innerHTML = '';
    return;
  }
  updateStatus(message + `${defender.name} promotes ${defender.active.name}.`);
  updateActiveInfo();
  endTurn();
}

function promotePokemon(player) {
  let idx = player.hand.findIndex(c => c.type === 'pokemon');
  if (idx >= 0) {
    player.active = player.hand.splice(idx, 1)[0];
  } else {
    idx = player.deck.findIndex(c => c.type === 'pokemon');
    if (idx >= 0) {
      player.active = player.deck.splice(idx, 1)[0];
    } else {
      return false;
    }
  }
  player.active.maxHp = player.active.hp;
  player.active.attachedEnergy = [];
  return true;
}

function endTurn() {
  [currentPlayer, defendingPlayer] = [defendingPlayer, currentPlayer];
  startTurn();
}

function updateStatus(text) {
  statusP.innerHTML = text;
}

function updateDeckInfo() {
  p1DeckSpan.textContent = `Deck: ${players[0].deck.length}`;
  p2DeckSpan.textContent = `Deck: ${players[1].deck.length}`;
  p1PrizesSpan.textContent = `Prizes: ${players[0].prizeCards.length}`;
  p2PrizesSpan.textContent = `Prizes: ${players[1].prizeCards.length}`;
}

function updateActiveInfo() {
  p1Img.src = getPokemonImage(players[0].active.name);
  p2Img.src = getPokemonImage(players[1].active.name);
  p1ActiveName.textContent = `${players[0].active.name} (${players[0].active.hp} HP)`;
  p2ActiveName.textContent = `${players[1].active.name} (${players[1].active.hp} HP)`;
}

function aiTurn() {
  const player = players[currentPlayer];
  if (!player.turnState.energy) {
    const idx = player.hand.findIndex(c => c.type === 'energy');
    if (idx >= 0) playEnergy(idx);
  }
  if (!player.turnState.trainer && player.active.hp < player.active.maxHp) {
    const idx = player.hand.findIndex(
      c => c.type === 'trainer' && c.effectKeyword === 'heal'
    );
    if (idx >= 0) playTrainer(idx);
  }
  const atkIdx = player.active.attacks.findIndex(a => canUseAttack(player.active, a));
  if (atkIdx >= 0) {
    playAttack(atkIdx);
  } else {
    endTurn();
  }
}

function provideHint() {
  const player = players[currentPlayer];
  if (!player.turnState.energy) {
    const idx = player.hand.findIndex(c => c.type === 'energy');
    if (idx >= 0) {
      updateStatus(`Hint: Attach ${player.hand[idx].name}.`);
      return;
    }
  }
  if (!player.turnState.trainer) {
    const idx = player.hand.findIndex(c => c.type === 'trainer');
    if (idx >= 0) {
      updateStatus(`Hint: Play ${player.hand[idx].name}.`);
      return;
    }
  }
  const atkIdx = player.active.attacks.findIndex(a => canUseAttack(player.active, a));
  if (atkIdx >= 0) {
    updateStatus(`Hint: Use ${player.active.attacks[atkIdx].name}.`);
    return;
  }
  updateStatus('Hint: End your turn.');
}

loadCardDB()
  .then(showPokemonChoices)
  .catch(err => {
    console.error('Failed to load card DB', err);
    updateStatus('Failed to load card database. Check console for details.');
    showPokemonChoices();
  });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}


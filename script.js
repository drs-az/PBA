// Simplified text-based Pokémon Battle Academy logic

// Deck definitions for each starter persona
const DECKS = {
  Pikachu: {
    energyType: 'Electric',
    pokemon: ['Pikachu', 'Electabuzz', 'Magnemite', 'Raichu', 'Jolteon'],
    energy: 10,
    trainers: [
      'Potion',
      'Potion',
      'Professor Oak',
      'Professor Oak',
      'Switch',
      'Switch',
      'Energy Retrieval',
      'Energy Retrieval',
      'Escape Rope',
      'Escape Rope'
    ],
    attacks: [
      { name: 'Thunder Shock', damage: 20, cost: 1 },
      { name: 'Electro Ball', damage: 40, cost: 2 },
      { name: 'Thunderbolt', damage: 80, cost: 3, discard: 1 },
      { name: 'Spark', damage: 20, cost: 2 },
      { name: 'Quick Attack', damage: 20, cost: 1 }
    ]
  },
  Charmander: {
    energyType: 'Fire',
    pokemon: ['Charmander', 'Growlithe', 'Ponyta', 'Charmeleon', 'Flareon'],
    energy: 10,
    trainers: [
      'Potion',
      'Potion',
      'Bill',
      'Bill',
      'Energy Search',
      'Energy Search',
      'Fire Crystal',
      'Fire Crystal',
      'Burn Heal',
      'Burn Heal'
    ],
    attacks: [
      { name: 'Ember', damage: 30, cost: 1, discard: 1 },
      { name: 'Flamethrower', damage: 60, cost: 3, discard: 1 },
      { name: 'Scratch', damage: 10, cost: 1 },
      { name: 'Flame Tail', damage: 40, cost: 2 },
      { name: 'Blaze Kick', damage: 50, cost: 3 }
    ]
  },
  Bulbasaur: {
    energyType: 'Grass',
    pokemon: ['Bulbasaur', 'Oddish', 'Bellsprout', 'Ivysaur', 'Leafeon'],
    energy: 10,
    trainers: [
      'Potion',
      'Potion',
      'Energy Switch',
      'Energy Switch',
      'Sleep Powder',
      'Sleep Powder',
      'Full Heal',
      'Full Heal',
      'Professor Elm',
      'Professor Elm'
    ],
    attacks: [
      { name: 'Vine Whip', damage: 20, cost: 1 },
      { name: 'Razor Leaf', damage: 30, cost: 2 },
      { name: 'Sleep Powder', damage: 20, cost: 2 },
      { name: 'Leech Seed', damage: 20, cost: 2 },
      { name: 'Solar Beam', damage: 60, cost: 4 }
    ]
  }
};

function getPokemonImage(name) {
  return `img/pokemon/${name.toLowerCase()}.png`;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Player structures
const players = [
  { name: 'Player 1', isAI: false },
  { name: 'Player 2', isAI: true }
];

let currentPlayer = 0;
let defendingPlayer = 1;

const setupSection = document.getElementById('setup');
const battleSection = document.getElementById('battle');
const pokemonChoicesDiv = document.getElementById('pokemonChoices');
const statusP = document.getElementById('status');
const movesDiv = document.getElementById('moves');
const p1Img = document.getElementById('p1Img');
const p2Img = document.getElementById('p2Img');
const p1DeckSpan = document.getElementById('p1Deck');
const p2DeckSpan = document.getElementById('p2Deck');
const p1PrizesSpan = document.getElementById('p1Prizes');
const p2PrizesSpan = document.getElementById('p2Prizes');

function showPokemonChoices() {
  pokemonChoicesDiv.innerHTML = '';
  Object.keys(DECKS).forEach(name => {
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
  const def = DECKS[player.persona];
  let deck = [];
  def.pokemon.forEach(name => {
    deck.push({
      type: 'Pokemon',
      name,
      hp: 100,
      energy: 0,
      energyType: def.energyType
    });
  });
  for (let i = 0; i < def.energy; i++) {
    deck.push({ type: 'Energy', energyType: def.energyType });
  }
  def.trainers.forEach(name => deck.push({ type: 'Trainer', name }));
  def.attacks.forEach(a => deck.push({ type: 'Attack', ...a }));
  deck = shuffle(deck);
  const idx = deck.findIndex(c => c.type === 'Pokemon' && c.name === player.persona);
  player.active = deck.splice(idx, 1)[0];
  player.deck = deck;
  player.prizeCards = player.deck.splice(0, 3);
  player.hand = player.deck.splice(0, 5);
  player.prizesTaken = 0;
}

function choosePokemon(name) {
  players[0].persona = name;
  const other = Object.keys(DECKS);
  players[1].persona = other[Math.floor(Math.random() * other.length)];
  buildDeck(players[0]);
  buildDeck(players[1]);
  startBattle();
}

function startBattle() {
  currentPlayer = 0;
  defendingPlayer = 1;
  p1Img.src = getPokemonImage(players[0].active.name);
  p2Img.src = getPokemonImage(players[1].active.name);
  updateDeckInfo();
  setupSection.classList.add('hidden');
  battleSection.classList.remove('hidden');
  startTurn("Game start! ");
}

function drawCards(player, n) {
  for (let i = 0; i < n; i++) {
    if (player.deck.length > 0) player.hand.push(player.deck.shift());
  }
}

function startTurn(message = '') {
  const player = players[currentPlayer];
  player.turnState = { energy: false, trainer: false, attack: false };
  drawCards(player, 1);
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
  if (!player.turnState.energy) {
    const energyIdx = player.hand.findIndex(c => c.type === 'Energy');
    if (energyIdx >= 0) {
      const btn = document.createElement('button');
      btn.textContent = `Attach Energy`;
      btn.onclick = () => playEnergy(energyIdx);
      movesDiv.appendChild(btn);
    }
  }
  if (!player.turnState.trainer) {
    player.hand.forEach((card, idx) => {
      if (card.type === 'Trainer') {
        const btn = document.createElement('button');
        btn.textContent = `Play ${card.name}`;
        btn.onclick = () => playTrainer(idx);
        movesDiv.appendChild(btn);
      }
    });
  }
  if (!player.turnState.attack) {
    player.hand.forEach((card, idx) => {
      if (card.type === 'Attack' && player.active.energy >= card.cost) {
        const btn = document.createElement('button');
        btn.textContent = `${card.name} (${card.damage})`;
        btn.onclick = () => playAttack(idx);
        movesDiv.appendChild(btn);
      }
    });
  }
  const endBtn = document.createElement('button');
  endBtn.textContent = 'End Turn';
  endBtn.onclick = endTurn;
  movesDiv.appendChild(endBtn);
}

function playEnergy(idx) {
  const player = players[currentPlayer];
  if (player.turnState.energy) return;
  player.hand.splice(idx, 1);
  player.active.energy += 1;
  player.turnState.energy = true;
  updateStatus(`${player.name} attached an energy.`);
  renderHand();
}

function applyTrainer(player, card) {
  switch (card.name) {
    case 'Potion':
    case 'Burn Heal':
    case 'Full Heal':
      player.active.hp = Math.min(100, player.active.hp + 30);
      updateStatus(`${player.name} healed 30 HP.`);
      break;
    case 'Professor Oak':
      drawCards(player, 3);
      updateStatus(`${player.name} drew 3 cards.`);
      break;
    case 'Bill':
      drawCards(player, 2);
      updateStatus(`${player.name} drew 2 cards.`);
      break;
    default:
      drawCards(player, 1);
      updateStatus(`${player.name} drew a card.`);
      break;
  }
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
  const card = attacker.hand.splice(idx, 1)[0];
  if (attacker.active.energy < card.cost) {
    attacker.hand.splice(idx, 0, card);
    updateStatus('Not enough energy.');
    return;
  }
  defender.active.hp -= card.damage;
  if (defender.active.hp < 0) defender.active.hp = 0;
  if (card.discard) attacker.active.energy = Math.max(0, attacker.active.energy - card.discard);
  attacker.turnState.attack = true;
  let message = `${attacker.name}'s ${attacker.active.name} used ${card.name} for ${card.damage} damage! `;
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
  if (defender === players[0]) {
    p1Img.src = getPokemonImage(defender.active.name);
  } else {
    p2Img.src = getPokemonImage(defender.active.name);
  }
  endTurn();
}

function promotePokemon(player) {
  let idx = player.hand.findIndex(c => c.type === 'Pokemon');
  if (idx >= 0) {
    player.active = player.hand.splice(idx, 1)[0];
    return true;
  }
  idx = player.deck.findIndex(c => c.type === 'Pokemon');
  if (idx >= 0) {
    player.active = player.deck.splice(idx, 1)[0];
    return true;
  }
  return false;
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

function aiTurn() {
  const player = players[currentPlayer];
  if (!player.turnState.energy) {
    const idx = player.hand.findIndex(c => c.type === 'Energy');
    if (idx >= 0) playEnergy(idx);
  }
  if (!player.turnState.trainer && player.active.hp < 50) {
    const idx = player.hand.findIndex(
      c => c.type === 'Trainer' && c.name === 'Potion'
    );
    if (idx >= 0) playTrainer(idx);
  }
  if (
    !player.turnState.trainer &&
    player.hand.length < 2
  ) {
    const idx = player.hand.findIndex(c => c.type === 'Trainer');
    if (idx >= 0) playTrainer(idx);
  }
  const atkIdx = player.hand.findIndex(
    c => c.type === 'Attack' && player.active.energy >= c.cost
  );
  if (atkIdx >= 0) {
    playAttack(atkIdx);
  } else {
    endTurn();
  }
}

showPokemonChoices();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}


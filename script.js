function buildPokemon(pokemonName, energyType) {
  const moves = {
    Pikachu: [
      { name: 'Thunderbolt', damage: 20 },
      { name: 'Quick Attack', damage: 15 }
    ],
    Charmander: [
      { name: 'Flamethrower', damage: 25 },
      { name: 'Scratch', damage: 10 }
    ],
    Bulbasaur: [
      { name: 'Vine Whip', damage: 20 },
      { name: 'Tackle', damage: 15 }
    ]
  };

  return {
    hp: 100,
    energyType,
    moves: moves[pokemonName]
  };
}

const POKEMON = {
  Pikachu: buildPokemon('Pikachu', 'electric'),
  Charmander: buildPokemon('Charmander', 'fire'),
  Bulbasaur: buildPokemon('Bulbasaur', 'grass')
};

function getPokemonImage(name) {
  return `img/pokemon/${name.toLowerCase()}.png`;
}

function generateDeck(size = 10) {
  return Array.from({ length: size }, (_, i) => i + 1);
}

const players = [
  { name: 'Player 1', pokemon: null, pokemonName: null, deck: [] },
  { name: 'Player 2', pokemon: null, pokemonName: null, deck: [] }
];

let currentPlayer = 0;
let defendingPlayer = 1;

const setupSection = document.getElementById('setup');
const battleSection = document.getElementById('battle');
const currentPlayerSpan = document.getElementById('currentPlayer');
const pokemonChoicesDiv = document.getElementById('pokemonChoices');
const statusP = document.getElementById('status');
const movesDiv = document.getElementById('moves');
const p1Img = document.getElementById('p1Img');
const p2Img = document.getElementById('p2Img');
const p1DeckSpan = document.getElementById('p1Deck');
const p2DeckSpan = document.getElementById('p2Deck');

function showPokemonChoices() {
  pokemonChoicesDiv.innerHTML = '';
  Object.keys(POKEMON).forEach(name => {
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

function choosePokemon(name) {
  players[currentPlayer].pokemon = JSON.parse(JSON.stringify(POKEMON[name]));
  players[currentPlayer].pokemonName = name;
  currentPlayer++;
  if (currentPlayer < players.length) {
    currentPlayerSpan.textContent = currentPlayer + 1;
  } else {
    startBattle();
  }
}

function startBattle() {
  players.forEach(player => {
    player.deck = generateDeck();
  });
  currentPlayer = 0;
  defendingPlayer = 1;
  p1Img.src = getPokemonImage(players[0].pokemonName);
  p2Img.src = getPokemonImage(players[1].pokemonName);
  updateDeckInfo();
  setupSection.classList.add('hidden');
  battleSection.classList.remove('hidden');
  startTurn();
}

function renderMoves() {
  const moves = players[currentPlayer].pokemon.moves;
  movesDiv.innerHTML = '';
  moves.forEach(move => {
    const btn = document.createElement('button');
    btn.textContent = `${move.name} (${move.damage})`;
    btn.onclick = () => performMove(move);
    movesDiv.appendChild(btn);
  });
}

function startTurn(message = '') {
  const player = players[currentPlayer];
  const opponent = players[defendingPlayer];

  if (player.deck.length === 0) {
    movesDiv.innerHTML = '';
    updateStatus(`${message}${opponent.name} wins! ${player.name} has no cards left.`);
    return;
  }

  player.deck.pop();
  updateDeckInfo();
  updateStatus(`${message}${player.name}'s turn. ${player.deck.length} cards left in deck.`);
  renderMoves();
}

function performMove(move) {
  const attacker = players[currentPlayer];
  const defender = players[defendingPlayer];
  defender.pokemon.hp -= move.damage;
  if (defender.pokemon.hp < 0) defender.pokemon.hp = 0;
  let message = `${attacker.name}'s ${attacker.pokemonName} used ${move.name}!<br>`;
  if (defender.pokemon.hp === 0) {
    message += `${defender.name}'s ${defender.pokemonName} fainted. ${attacker.name} wins!`;
    movesDiv.innerHTML = '';
    updateStatus(message);
  } else {
    message += `${defender.name}'s ${defender.pokemonName} has ${defender.pokemon.hp} HP left.<br>`;
    [currentPlayer, defendingPlayer] = [defendingPlayer, currentPlayer];
    startTurn(message);
  }
}

function updateStatus(text) {
  statusP.innerHTML = text;
}

function updateDeckInfo() {
  p1DeckSpan.textContent = `Player 1 Deck: ${players[0].deck.length}`;
  p2DeckSpan.textContent = `Player 2 Deck: ${players[1].deck.length}`;
}

showPokemonChoices();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}

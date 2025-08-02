function buildDeck(pokemonName, energyType) {
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
  Pikachu: buildDeck('Pikachu', 'electric'),
  Charmander: buildDeck('Charmander', 'fire'),
  Bulbasaur: buildDeck('Bulbasaur', 'grass')
};

const players = [
  { name: 'Player 1', pokemon: null, pokemonName: null },
  { name: 'Player 2', pokemon: null, pokemonName: null }
];

let currentPlayer = 0;
let defendingPlayer = 1;

const setupSection = document.getElementById('setup');
const battleSection = document.getElementById('battle');
const currentPlayerSpan = document.getElementById('currentPlayer');
const pokemonChoicesDiv = document.getElementById('pokemonChoices');
const statusP = document.getElementById('status');
const movesDiv = document.getElementById('moves');

function showPokemonChoices() {
  pokemonChoicesDiv.innerHTML = '';
  Object.keys(POKEMON).forEach(name => {
    const btn = document.createElement('button');
    btn.textContent = name;
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
  currentPlayer = 0;
  defendingPlayer = 1;
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

  if (player.deck && player.deck.length === 0) {
    movesDiv.innerHTML = '';
    updateStatus(`${message}${opponent.name} wins! ${player.name} has no cards left.`);
    return;
  }

  updateStatus(`${message}${player.name}'s turn.`);
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

showPokemonChoices();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}

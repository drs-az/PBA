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
  updateStatus(`${players[currentPlayer].name}'s turn.`);
  renderMoves();
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

function performMove(move) {
  const attacker = players[currentPlayer];
  const defender = players[defendingPlayer];
  defender.pokemon.hp -= move.damage;
  if (defender.pokemon.hp < 0) defender.pokemon.hp = 0;
  let message = `${attacker.name}'s ${attacker.pokemonName} used ${move.name}!\n`;
  if (defender.pokemon.hp === 0) {
    message += `${defender.name}'s ${defender.pokemonName} fainted. ${attacker.name} wins!`;
    movesDiv.innerHTML = '';
  } else {
    message += `${defender.name}'s ${defender.pokemonName} has ${defender.pokemon.hp} HP left.\nPass the device to ${players[defendingPlayer].name}.`;
    [currentPlayer, defendingPlayer] = [defendingPlayer, currentPlayer];
    renderMoves();
  }
  updateStatus(message);
}

function updateStatus(text) {
  statusP.textContent = text;
}

showPokemonChoices();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}

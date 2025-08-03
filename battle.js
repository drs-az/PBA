import { assembleDeck, drawCards } from './deck.js';
import {
  updateStatus,
  updateDeckInfo,
  updateActiveInfo,
  renderHand,
  showPokemonChoices,
  showBattleUI,
  currentPlayerSpan
} from './ui.js';

export const players = [
  { name: 'Player 1', isAI: false },
  { name: 'Player 2', isAI: false }
];

export let currentPlayer = 0;
export let defendingPlayer = 1;
export let choosingPlayer = 0;

export function attachEnergy(pokemon, energyCard) {
  pokemon.attachedEnergy = pokemon.attachedEnergy || [];
  pokemon.attachedEnergy.push(energyCard);
}

export function canUseAttack(pokemon, attack) {
  return (
    (pokemon.attachedEnergy?.length || 0) >= attack.energyRequired &&
    pokemon.hp > 0
  );
}

export function applyAttack(attacker, attack, defender) {
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
    case 'bench_damage':
      if (defender.bench && defender.bench.length > 0) {
        const target = defender.bench[0];
        target.hp = Math.max(target.hp - 10, 0);
        console.log(`Bench damage dealt to ${target.name}`);
      } else {
        console.log('Bench damage effect: defender has no benched Pokémon.');
      }
      break;
    case 'coin_flip_bonus':
      const match = attack.effect?.match(/(\d+)\s+more damage/);
      const bonus = match ? parseInt(match[1], 10) : 20;
      if (Math.random() < 0.5) {
        defender.hp = Math.max(defender.hp - bonus, 0);
        console.log(`Coin flip success! Bonus ${bonus} damage.`);
      } else {
        console.log('Coin flip failed. No bonus damage.');
      }
      break;
    default:
      if (attack.effectKeyword) {
        console.warn(`Unknown effect keyword: ${attack.effectKeyword}`);
      }
      break;
  }
}

function buildDeck(player) {
  player.deck = assembleDeck(player.persona);
  player.prizeCards = drawCards(player.deck, 3);
  player.hand = drawCards(player.deck, 7);
  player.bench = [];
  const activeIdx = player.hand.findIndex(c => c.type === 'pokemon');
  if (activeIdx >= 0) {
    player.active = player.hand.splice(activeIdx, 1)[0];
  } else {
    const idx = player.deck.findIndex(c => c.type === 'pokemon');
    if (idx === -1) {
      throw new Error('No Pokémon card found in deck. Please choose a different deck.');
    }
    player.active = player.deck.splice(idx, 1)[0];
  }
  player.active.maxHp = player.active.hp;
  player.active.attachedEnergy = [];
  player.prizesTaken = 0;
}
export { buildDeck };

export function choosePokemon(name) {
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

export function startBattle() {
  currentPlayer = 0;
  defendingPlayer = 1;
  updateActiveInfo();
  updateDeckInfo();
  showBattleUI();
  startTurn('Game start! ');
}

export function startTurn(message = '') {
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

export function playCard(idx) {
  const card = players[currentPlayer].hand[idx];
  if (!card) return;
  if (card.type === 'energy') {
    playEnergy(idx);
  } else if (card.type === 'trainer') {
    playTrainer(idx);
  }
}

export function playEnergy(idx) {
  const player = players[currentPlayer];
  if (player.turnState.energy) return;
  const energyCard = player.hand.splice(idx, 1)[0];
  attachEnergy(player.active, energyCard);
  player.turnState.energy = true;
  updateStatus(`${player.name} attached ${energyCard.name}.`);
  renderHand();
}

export function playPokemonToBench(idx) {
  const player = players[currentPlayer];
  const card = player.hand[idx];
  if (!card || card.type !== 'pokemon' || player.bench.length >= 5) return;
  const pokemon = player.hand.splice(idx, 1)[0];
  pokemon.maxHp = pokemon.hp;
  pokemon.attachedEnergy = [];
  player.bench.push(pokemon);
  updateStatus(`${player.name} benched ${pokemon.name}.`);
  renderHand();
}

export function retreatPokemon(benchIdx, playerIdx = currentPlayer) {
  const player = players[playerIdx];
  if (!player.bench || !player.bench[benchIdx]) return false;
  const newActive = player.bench.splice(benchIdx, 1)[0];
  const oldActive = player.active;
  player.active = newActive;
  player.bench.push(oldActive);
  updateActiveInfo();
  if (playerIdx === currentPlayer) renderHand();
  return true;
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
    case 'switch': {
      if (player.bench.length > 0) {
        retreatPokemon(0, currentPlayer);
        updateStatus(`${player.name} switched their Active Pokémon.`);
      } else {
        updateStatus(`${player.name} has no benched Pokémon to switch.`);
      }
      break;
    }
    case 'mutual_switch': {
      const msgs = [];
      if (players[currentPlayer].bench.length > 0) {
        retreatPokemon(0, currentPlayer);
        msgs.push(`${players[currentPlayer].name} switched.`);
      }
      if (players[defendingPlayer].bench.length > 0) {
        retreatPokemon(0, defendingPlayer);
        msgs.push(`${players[defendingPlayer].name} switched.`);
      }
      if (msgs.length === 0) msgs.push('No switches occurred.');
      updateStatus(msgs.join(' '));
      break;
    }
    default:
      player.hand.push(...drawCards(player.deck, 1));
      updateStatus(`${player.name} drew a card.`);
      break;
  }
  updateActiveInfo();
}

export function playTrainer(idx) {
  const player = players[currentPlayer];
  if (player.turnState.trainer) return;
  const card = player.hand.splice(idx, 1)[0];
  applyTrainer(player, card);
  player.turnState.trainer = true;
  renderHand();
}

export function playAttack(idx) {
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

export function handleKnockout(attacker, defender, message) {
  message += `${defender.active.name} was knocked out! `;
  if (attacker.prizeCards.length > 0) {
    attacker.prizeCards.pop();
    attacker.prizesTaken++;
    updateDeckInfo();
    message += `${attacker.name} takes a prize (${attacker.prizesTaken}/3). `;
    if (attacker.prizeCards.length === 0) {
      updateStatus(message + `${attacker.name} wins!`);
      return;
    }
  }
  if (!promotePokemon(defender)) {
    updateStatus(message + `${defender.name} has no Pokémon left. ${attacker.name} wins!`);
    return;
  }
  updateStatus(message + `${defender.name} promotes ${defender.active.name}.`);
  updateActiveInfo();
  endTurn();
}

export function promotePokemon(player) {
  if (player.bench && player.bench.length > 0) {
    player.active = player.bench.shift();
    return true;
  }
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

export function endTurn() {
  [currentPlayer, defendingPlayer] = [defendingPlayer, currentPlayer];
  startTurn();
}

export function aiTurn() {
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

export function provideHint() {
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

let cardDB = [];

export async function loadCardDB() {
  const res = await fetch('data/pokemon_cardDB.json');
  const data = await res.json();
  cardDB = data.cards;
}

export function getCardDefinition(cardId) {
  const card = cardDB.find(c => c.id === cardId);
  if (!card) throw new Error(`Card not found: ${cardId}`);
  return JSON.parse(JSON.stringify(card));
}

export const decksConfig = {
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

export function assembleDeck(persona) {
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

export function drawCards(deck, n = 1) {
  return deck.splice(0, n);
}

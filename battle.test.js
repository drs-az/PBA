import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal DOM stubs so ui.js can be imported in Node
const elements = {};
const elementStub = () => ({
  classList: { add() {}, remove() {} },
  addEventListener() {},
  appendChild() {},
  textContent: '',
  innerHTML: '',
  onclick: null,
  src: '',
  disabled: false
});

global.document = {
  getElementById(id) {
    if (!elements[id]) elements[id] = elementStub();
    return elements[id];
  }
};

test('bench damage knockout awards prize card', async () => {
  const battle = await import('./battle.js');
  const { players, applyAttack } = battle;

  players[0].deck = [];
  players[0].prizeCards = ['p'];
  players[0].prizesTaken = 0;
  players[0].active = { name: 'Attacker', hp: 50, maxHp: 50, attachedEnergy: [] };

  players[1].deck = [];
  players[1].active = { name: 'Defender', hp: 60, maxHp: 60 };
  players[1].bench = [{ name: 'Benched', hp: 10, maxHp: 10 }];

  const attack = { name: 'Splash', damage: 0, effectKeyword: 'bench_damage', energyRequired: 0 };

  applyAttack(players[0].active, attack, players[1].active);

  assert.equal(players[1].bench.length, 0, 'bench Pokémon should be removed');
  assert.equal(players[0].prizeCards.length, 0, 'attacker should take a prize card');
  assert.equal(players[0].prizesTaken, 1, 'attacker prize count should increase');
  assert.equal(elements['p1Prizes'].textContent, 'Score: 1/3', 'UI should update prize display');
});


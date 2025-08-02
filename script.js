import { loadCardDB } from './deck.js';
import { showPokemonChoices } from './ui.js';

loadCardDB()
  .then(showPokemonChoices)
  .catch(err => {
    console.error('Failed to load card DB', err);
    showPokemonChoices();
  });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}

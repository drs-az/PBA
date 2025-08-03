# Pokémon Battle Academy

Pokémon Battle Academy (PBA) is a browser-based, two player trading card game. Each player chooses a starter Pokémon deck and takes turns drawing cards, attaching energy, playing trainers and battling until one player collects all three prize cards.

## Features

- Three pre-built starter decks based on Pikachu, Charmander and Bulbasaur.
- Turn-based battling with support for status effects, healing, bench damage and more.
- Simple hand, bench and active Pokémon management entirely in the browser.
- Progressive Web App support with a service worker for basic offline play.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later (for running tests and a development server).

### Installation

Clone the repository and install dependencies (none are required, but this will create a `node_modules` directory for tooling):

```bash
npm install
```

### Running the App

Serve the files with any static web server and open the site in your browser:

```bash
npx http-server -p 8080
```

Then navigate to [http://localhost:8080](http://localhost:8080) to play.

### Testing

Unit tests use Node's built-in test runner:

```bash
npm test
```

## Project Structure

- `index.html` – Main page and DOM structure.
- `script.js` – Loads card data and registers the service worker.
- `battle.js`, `deck.js`, `ui.js` – Core game logic and rendering.
- `data/pokemon_cardDB.json` – Card definitions and deck lists.
- `service-worker.js` & `manifest.json` – Enable PWA features.

## License

This project is provided for educational purposes. No affiliation with Nintendo or The Pokémon Company is implied.


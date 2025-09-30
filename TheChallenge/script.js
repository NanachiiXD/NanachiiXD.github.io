let games = {};
let weights = {};

// Fetch the games.txt and weights.txt files
async function loadFiles() {
  try {
    // Fetch games.txt and parse it
    const gamesResponse = await fetch('games.txt');
    const gamesData = await gamesResponse.text();
    games = parseGames(gamesData);

    // Fetch weights.txt and parse it
    const weightsResponse = await fetch('weights.txt');
    const weightsData = await weightsResponse.text();
    weights = parseWeights(weightsData);

    // Enable the roll button after files are loaded
    document.getElementById('rollBtn').disabled = false;
  } catch (error) {
    console.error('Error loading files:', error);
    alert('Failed to load the games or weights data.');
  }
}

// Parse the games.txt data
function parseGames(data) {
  const games = {};
  const lines = data.split('\n');

  lines.forEach(line => {
    if (line.trim() === '') return;

    const [gameName, modsStr] = line.split(',', 2);
    const mods = modsStr.trim().replace(/\[|\]/g, '').split(',');

    games[gameName.trim()] = mods.map(mod => mod.trim());
  });

  return games;
}

// Parse the weights.txt data
function parseWeights(data) {
  const weights = {};
  const lines = data.split('\n');

  lines.forEach(line => {
    if (line.trim() === '') return;

    const [mod, weight] = line.split(',', 2);
    weights[mod.trim()] = parseInt(weight.trim(), 10);
  });

  return weights;
}

// Get random weighted choice
function weightedChoice(weightsDict) {
  const total = Object.values(weightsDict).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let upto = 0;
  for (const [mod, w] of Object.entries(weightsDict)) {
    if (upto + w >= r) return mod;
    upto += w;
  }
}

// Roll games with weights
function rollGames(games, weights, rolls) {
  const gameKeys = Object.keys(games);
  const chosenGames = [];
  while (chosenGames.length < rolls) {
    const game = gameKeys[Math.floor(Math.random() * gameKeys.length)];
    chosenGames.push(game);
  }
  const results = [];
  for (const game of chosenGames) {
    let modifier;
    if (Math.random() < 0.25 && games[game].length > 1) {
      const m1 = weightedChoice(Object.fromEntries(games[game].map(m => [m, weights[m]])));
      const remaining = games[game].filter(m => m !== m1);
      const m2 = weightedChoice(Object.fromEntries(remaining.map(m => [m, weights[m]])));
      modifier = `${m1} + ${m2}`;
    } else {
      modifier = weightedChoice(Object.fromEntries(games[game].map(m => [m, weights[m]])));
    }
    results.push({ game, modifier });
  }
  return results;
}

// Display results with typewriter effect
async function typewriter(element, text, delay = 30) {
  for (let char of text) {
    element.innerHTML += char;
    await new Promise(r => setTimeout(r, delay));
  }
}

// Print results
function printResults(results) {
  const resultContainer = document.getElementById('results');
  resultContainer.innerHTML = ''; // Clear previous results
  const totalRatio = results.reduce((acc, { modifier }) => acc + getWeight(modifier), 0) / results.length;

  const challengeMessage = totalRatio < 0.4 ? "Die Challenge Götter verschonen dich." :
                          totalRatio < 0.7 ? "Die Challenge Götter testen dich." :
                          totalRatio < 0.9 ? "Die Challenge Götter bestrafen dich." :
                          "Die Challenge Götter wollen dich leiden sehen.";

  // Display challenge message
  typewriter(resultContainer, `Deine Win Challenge:\n`);
  typewriter(resultContainer, challengeMessage + '\n', 100);

  results.forEach((result, index) => {
    const resultItem = document.createElement('div');
    resultItem.classList.add('result-item');
    resultItem.innerHTML = `${index + 1}. <span>${result.game}</span> - <span>${result.modifier}</span>`;
    resultContainer.appendChild(resultItem);
  });

  typewriter(resultContainer, `Der Macher-Lacher Prozentsatz beträgt ${Math.floor(totalRatio * 100)}%\n`, 100);
}

// Get weight of a modifier
function getWeight(modifier) {
  const mods = modifier.split(' + ');
  return mods.reduce((acc, mod) => acc * (weights[mod] / 100), 1);
}

// Handle roll button click
document.getElementById('rollBtn').addEventListener('click', () => {
  const rolls = parseInt(document.getElementById('rolls').value);
  if (isNaN(rolls) || rolls <= 0) {
    alert('Please enter a valid number of games.');
    return;
  }
  const results = rollGames(games, weights, rolls);
  printResults(results);
});

// Dark mode toggle
document.getElementById('darkModeBtn').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  document.getElementById('container').classList.toggle('dark-mode');
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => button.classList.toggle('dark-mode'));
});

// Initialize the app
window.addEventListener('load', loadFiles);

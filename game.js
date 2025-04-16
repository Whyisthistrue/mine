const serverUrl = 'https://node62.lunes.host:3261';

let username = "";
let balance = 0;
let minePositions = [];
let revealedCount = 0;
let currentPayout = 0;
let gameOver = false;
let gameInProgress = false;
let betAmount = 0;
let mineCount = 0;

async function login() {
  username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const res = await fetch(`${serverUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!data.success) return alert(data.message);

  balance = data.balance;
  document.getElementById('user-label').textContent = username;
  document.getElementById('balance').textContent = balance.toFixed(2);
  document.querySelector('.login-form').classList.add('hidden');
  document.getElementById('game-area').classList.remove('hidden');
}

async function register() {
  username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const res = await fetch(`${serverUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!data.success) return alert(data.message);
  alert("Registered successfully. You can now login.");
}

function startGame() {

  if (gameInProgress) return;  // Prevent starting a game if one is in progress

    // Disable the Start button and gray it out
  document.getElementById("start-button").disabled = true;
  document.getElementById("start-button").style.opacity = "0.5";

  document.getElementById("cashout-button").disabled = false;
    document.getElementById("cashout-button").style.opacity = "1";

    // Set game status variables
  gameInProgress = true;  // Mark that a game is now in progress
  gameOver = false;  // Reset gameOver state
  revealedCount = 0;  // Reset revealed tiles count
  currentPayout = 0;  // Reset payout
  betAmount = parseFloat(document.getElementById('bet-amount').value);
  mineCount = parseInt(document.getElementById('mine-count').value);

  if (isNaN(betAmount) || betAmount < 1 || betAmount > balance) {
    alert("Invalid bet amount.");
    return;
  }

  if (mineCount < 1 || mineCount > 24) {
    alert("Pick between 1 and 24 mines.");
    return;
  }

  balance -= betAmount;
  updateBalanceDisplay();
  updateServerBalance();

  minePositions = [];
  revealedCount = 0;
  gameOver = false;
  currentPayout = 0;
  document.getElementById('result').textContent = '';

  while (minePositions.length < mineCount) {
    const rand = Math.floor(Math.random() * 25);
    if (!minePositions.includes(rand)) minePositions.push(rand);
  }

  drawGrid();
}

function drawGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  for (let i = 0; i < 25; i++) {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.dataset.index = i;
    tile.addEventListener('click', revealTile);
    grid.appendChild(tile);
  }
}

function revealTile(e) {
  if (gameOver) return;
  const tile = e.target;
  const index = parseInt(tile.dataset.index);
  if (tile.classList.contains('revealed')) return;

  if (minePositions.includes(index)) {
    tile.classList.add('mine');
    tile.textContent = '💣';
    endGame(false);
  } else {
    tile.classList.add('revealed');
    revealedCount++;
    updatePayout();
  }
}

function updatePayout() {
    const totalTiles = 25;
    const safeTiles = totalTiles - mineCount;
    let chance = 1;
  
    // Calculate chance of revealing all safe tiles so far
    for (let i = 0; i < revealedCount; i++) {
      chance *= (safeTiles - i) / (totalTiles - i);
    }
  
    // Optional: house edge (e.g., 2% edge)
    const houseEdge = 0.98;
  
    // Calculate multiplier and payout
    const multiplier = (1 / chance) * houseEdge;
    currentPayout = betAmount * multiplier;
  
    // Update UI
    document.getElementById('result').textContent = `Safe tiles: ${revealedCount} | Potential cash out: $${currentPayout.toFixed(2)}`;
  }

function cashOut() {
  if (!gameOver && revealedCount > 0) {
    balance += currentPayout;
    updateBalanceDisplay();
    updateServerBalance();
    endGame(true);
  }
}

function endGame(won) {
  gameOver = true;
  gameOver = true;  // The game has ended
  gameInProgress = false;  // Mark that the game is no longer in progress

  // Re-enable the Start button and restore its normal opacity
  document.getElementById("cashout-button").disabled = true;
    document.getElementById("cashout-button").style.opacity = "0.5";
  document.getElementById("start-button").disabled = false;
  document.getElementById("start-button").style.opacity = "1";
  const result = document.getElementById('result');
  result.textContent = won
    ? `✅ You won $${currentPayout.toFixed(2)}!`
    : '💥 You hit a mine and lost your bet!';

  document.querySelectorAll('.tile').forEach((tile, idx) => {
    if (minePositions.includes(idx)) {
      tile.classList.add('mine');
      tile.textContent = '💣';
    }
  });
}

function updateBalanceDisplay() {
  document.getElementById('balance').textContent = balance.toFixed(2);
}

async function updateServerBalance() {
  await fetch(`${serverUrl}/update-balance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, balance })
  });
}

(() => {
  "use strict";

  // --- 状態 ---
  let size = 4; // 1辺のタイル数
  let tiles = []; // 盤面。0 は空きマスを表す
  let emptyIndex = 0; // 空きマスの位置 (0..size*size-1)
  let moves = 0;
  let timerId = null;
  let startTime = 0;
  let started = false; // 最初の操作でタイマー開始
  let solved = false;

  // --- DOM ---
  const boardEl = document.getElementById("board");
  const movesEl = document.getElementById("moves");
  const timerEl = document.getElementById("timer");
  const sizeEl = document.getElementById("size");
  const shuffleBtn = document.getElementById("shuffle");
  const winEl = document.getElementById("win");
  const winDetailEl = document.getElementById("win-detail");
  const playAgainBtn = document.getElementById("play-again");

  // --- ユーティリティ ---
  const rowOf = (i) => Math.floor(i / size);
  const colOf = (i) => i % size;

  // ゴール状態を作る: [1, 2, ..., n*n-1, 0]
  function goalTiles() {
    const total = size * size;
    const arr = [];
    for (let i = 1; i < total; i++) arr.push(i);
    arr.push(0);
    return arr;
  }

  // 解ける配置になるようにシャッフルする。
  // 空きマスからのランダムな合法手を多数回行うことで、必ず解ける配置を保証する。
  function shuffle() {
    tiles = goalTiles();
    emptyIndex = tiles.length - 1;
    const iterations = size * size * 200;
    let last = -1;
    for (let n = 0; n < iterations; n++) {
      const neighbors = neighborsOf(emptyIndex).filter((i) => i !== last);
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      last = emptyIndex;
      swap(emptyIndex, pick);
      emptyIndex = pick;
    }
    // 偶然そろってしまった場合はやり直し
    if (isSolved()) {
      shuffle();
    }
  }

  // 空きマスに隣接するインデックス一覧
  function neighborsOf(i) {
    const r = rowOf(i);
    const c = colOf(i);
    const result = [];
    if (r > 0) result.push(i - size);
    if (r < size - 1) result.push(i + size);
    if (c > 0) result.push(i - 1);
    if (c < size - 1) result.push(i + 1);
    return result;
  }

  function swap(a, b) {
    const tmp = tiles[a];
    tiles[a] = tiles[b];
    tiles[b] = tmp;
  }

  function isSolved() {
    for (let i = 0; i < tiles.length - 1; i++) {
      if (tiles[i] !== i + 1) return false;
    }
    return tiles[tiles.length - 1] === 0;
  }

  // 指定タイルが空きマスに隣接していれば動かす
  function tryMove(index) {
    if (solved) return;
    if (!neighborsOf(emptyIndex).includes(index)) return;

    if (!started) startTimer();
    swap(index, emptyIndex);
    emptyIndex = index;
    moves++;
    movesEl.textContent = moves;
    render();

    if (isSolved()) onWin();
  }

  // 矢印キー操作: 空きマスへ動かすタイルの方向
  function moveByDirection(dir) {
    let target = -1;
    const r = rowOf(emptyIndex);
    const c = colOf(emptyIndex);
    // 「上」キー = 空きマスの下のタイルを上へ動かす
    if (dir === "up" && r < size - 1) target = emptyIndex + size;
    if (dir === "down" && r > 0) target = emptyIndex - size;
    if (dir === "left" && c < size - 1) target = emptyIndex + 1;
    if (dir === "right" && c > 0) target = emptyIndex - 1;
    if (target >= 0) tryMove(target);
  }

  // --- 描画 ---
  function render() {
    boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    boardEl.innerHTML = "";
    const movable = new Set(neighborsOf(emptyIndex));

    tiles.forEach((value, i) => {
      const cell = document.createElement("div");
      if (value === 0) {
        cell.className = "tile empty";
      } else {
        cell.className = "tile";
        cell.textContent = value;
        if (movable.has(i)) cell.classList.add("movable");
        cell.addEventListener("click", () => tryMove(i));
      }
      boardEl.appendChild(cell);
    });
  }

  // --- タイマー ---
  function startTimer() {
    started = true;
    startTime = Date.now();
    timerId = setInterval(updateTimer, 250);
  }

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function elapsedSeconds() {
    return started ? Math.floor((Date.now() - startTime) / 1000) : 0;
  }

  function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function updateTimer() {
    timerEl.textContent = formatTime(elapsedSeconds());
  }

  // --- ゲーム進行 ---
  function newGame() {
    stopTimer();
    started = false;
    solved = false;
    moves = 0;
    movesEl.textContent = "0";
    timerEl.textContent = "00:00";
    winEl.classList.add("hidden");
    shuffle();
    render();
  }

  function onWin() {
    solved = true;
    stopTimer();
    const sec = elapsedSeconds();
    winDetailEl.textContent = `手数 ${moves} ・ タイム ${formatTime(sec)}`;
    winEl.classList.remove("hidden");
  }

  // --- イベント ---
  sizeEl.addEventListener("change", () => {
    size = parseInt(sizeEl.value, 10);
    newGame();
  });

  shuffleBtn.addEventListener("click", newGame);
  playAgainBtn.addEventListener("click", newGame);

  document.addEventListener("keydown", (e) => {
    const keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    if (keyMap[e.key]) {
      e.preventDefault();
      moveByDirection(keyMap[e.key]);
    }
  });

  // --- 初期化 ---
  size = parseInt(sizeEl.value, 10);
  newGame();
})();

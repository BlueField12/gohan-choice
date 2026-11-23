// タブと画面要素の取得
const tabMonth = document.getElementById("tabMonth");
const tabWeek = document.getElementById("tabWeek");
const tabDay = document.getElementById("tabDay");

const monthView = document.getElementById("monthView");
const weekView = document.getElementById("weekView");
const dayView = document.getElementById("dayView");

const daySelect = document.getElementById("daySelect");
const monthCalendarGrid = document.getElementById("monthCalendarGrid");

// 保存データの読み込み（localStorage）
let records = JSON.parse(localStorage.getItem("tenZentakuRecords")) || {};

// 1日〜30日の選択肢とカレンダーマスを生成
for (let d = 1; d <= 30; d++) {
  const option = document.createElement("option");
  option.value = d;
  option.textContent = `${d}日`;
  daySelect.appendChild(option);
}

// タブ切り替え関数
function switchTab(target) {
  monthView.classList.add("hidden");
  weekView.classList.add("hidden");
  dayView.classList.add("hidden");

  tabMonth.classList.remove("active");
  tabWeek.classList.remove("active");
  tabDay.classList.remove("active");

  if (target === "month") {
    monthView.classList.remove("hidden");
    tabMonth.classList.add("active");
    renderSummary();
  } else if (target === "week") {
    weekView.classList.remove("hidden");
    tabWeek.classList.add("active");
    renderSummary();
  } else if (target === "day") {
    dayView.classList.remove("hidden");
    tabDay.classList.add("active");
  }
}

tabMonth.addEventListener("click", () => switchTab("month"));
tabWeek.addEventListener("click", () => switchTab("week"));
tabDay.addEventListener("click", () => switchTab("day"));

// 採点＆記録処理（日表示）
const judgeBtn = document.getElementById("judgeBtn");
const resultArea = document.getElementById("resultArea");
const scoreText = document.getElementById("scoreText");
const fortuneText = document.getElementById("fortuneText");
const commentText = document.getElementById("commentText");

// 料理候補を表示する要素（HTMLになければ自動生成）
let suggestionArea = document.getElementById("suggestionArea");
if (!suggestionArea && resultArea) {
  suggestionArea = document.createElement("div");
  suggestionArea.id = "suggestionArea";
  resultArea.appendChild(suggestionArea);
}

// 組み合わせ辞書（ここを自分で増やしていくと料理候補が増えます）
const dishDictionary = {
  "和食-米-魚": [
    "焼き魚定食（サバ塩焼き・青菜のおひたし）",
    "煮魚定食（ブリ照り焼き・きんぴらごぼう）",
    "海鮮丼＆小鉢セット（まぐろ漬け丼・ひじき煮）",
  ],
  "和食-米-肉": [
    "生姜焼き定食（豚生姜焼き・千切りキャベツ）",
    "鶏の照り焼き定食（鶏もも照り焼き・ほうれん草和え）",
    "肉じゃが定食（豚肉じゃが・冷奴）",
  ],
  "和食-米-卵・大豆": [
    "出し巻き卵定食（だし巻き卵・ほうれん草胡麻和え）",
    "親子丼・たまご丼＆小鉢セット",
    "揚げ出し豆腐＆ひじき煮定食",
  ],
  "和食-麺-魚": [
    "にしんそば・魚介だしうどん＆薬味セット",
    "焼き魚ほぐしぶっかけうどん＆おひたし",
    "海鮮あんかけ焼きそば風和え麺",
  ],
  "洋食-パン-肉": [
    "BLTサンド＆具だくさんスープセット",
    "ハンバーグプレート＆バゲット・サラダ",
    "チキンソテー＆トースト・温野菜",
  ],
  "洋食-パン-卵・大豆": [
    "スクランブルエッグ＆トースト・サラダ",
    "フレンチトースト＆温野菜スープ",
    "オムレツプレート＆バゲット",
  ],
  "洋食-米-肉": [
    "チキンライス／オムライス＆グリーンサラダ",
    "デミグラスハンバーグ＆ライス・付け合わせ",
    "カレーライス＆福神漬け・コールスロー",
  ],
  "中華-米-肉": [
    "青椒肉絲定食（チンジャオロース・中華和え）",
    "回鍋肉定食（ホイコーロー・棒々鶏サラダ）",
    "チャーハン＆餃子・もやしナムル",
  ],
  "中華-米-卵・大豆": [
    "麻婆豆腐定食（麻婆豆腐・中華サラダ）",
    "かに玉・天津飯＆もやしナムル",
    "ニラ玉炒め＆ごはん・スープ",
  ],
  "中華-麺-肉": [
    "野菜たっぷりタンメン＆焼売・メンマ",
    "ジャージャー麺＆きゅうりの中華サラダ",
    "担々麺＆青菜炒め",
  ],
  "エスニック-米-肉": [
    "ガパオライス＆パクチー・野菜スープ",
    "グリーンカレー／チキンカレー＆生春巻き",
    "ルーローハン（魯肉飯）＆青菜炒め",
  ],
};

// 組み合わせから料理候補を2〜3通り返す関数
function getDishSuggestions(genre, staple, mainDish, sideDish, soup) {
  if (
    staple === "なし" &&
    mainDish === "なし" &&
    sideDish === "なし" &&
    soup === "なし"
  ) {
    return ["透明な空気スープ（0kcal・想像力100%）"];
  }

  const exactKey = `${genre}-${staple}-${mainDish}`;
  let candidates = dishDictionary[exactKey];

  if (!candidates) {
    const matchedByGenreMain = Object.entries(dishDictionary).find(
      ([key]) => key.startsWith(`${genre}-`) && key.endsWith(`-${mainDish}`),
    );
    if (matchedByGenreMain) {
      candidates = matchedByGenreMain[1];
    }
  }

  if (!candidates) {
    const matchedByGenreStaple = Object.entries(dishDictionary).find(([key]) =>
      key.startsWith(`${genre}-${staple}-`),
    );
    if (matchedByGenreStaple) {
      candidates = matchedByGenreStaple[1];
    }
  }

  if (!candidates) {
    if (genre === "和食") {
      candidates = [
        "おまかせ和定食（季節の一品＋小鉢）",
        "だし茶漬け＆おばんざいセット",
        "炊き込みご飯＆旬の副菜プレート",
      ];
    } else if (genre === "洋食") {
      candidates = [
        "ワンプレート洋食ランチ（メイン＋サラダ）",
        "グラタン／ドリア＆スープセット",
        "パスタ＆彩りサラダプレート",
      ];
    } else if (genre === "中華") {
      candidates = [
        "中華定食セット（炒め物＋副菜）",
        "あんかけご飯／麺＆中華小鉢",
        "点心＆野菜炒めプレート",
      ];
    } else {
      candidates = [
        "スパイス香るワンボウル飯＆サラダ",
        "エスニック麺＆さっぱり副菜セット",
        "ハーブ＆香辛料アレンジプレート",
      ];
    }
  }

  const extras = [];
  if (sideDish !== "なし") extras.push(`副菜(${sideDish})あり`);
  if (soup === "あり") extras.push("汁物あり");
  const extraLabel = extras.length > 0 ? ` [${extras.join("・")}]` : "";

  return candidates.slice(0, 3).map((dish) => `${dish}${extraLabel}`);
}

judgeBtn.addEventListener("click", function () {
  const day = daySelect.value;
  const genre = document.getElementById("genre").value;
  const staple = document.getElementById("staple").value;
  const mainDish = document.getElementById("mainDish").value;
  const sideDish = document.getElementById("sideDish").value;
  const soup = document.getElementById("soup").value;
  const memo = document.getElementById("memo").value;

  let score = 50;
  let comment = "";

  if (staple !== "なし") score += 10;
  if (mainDish !== "なし") score += 15;
  if (sideDish !== "なし") score += 15;
  if (soup !== "なし") score += 10;

  if (
    staple === "なし" &&
    mainDish === "なし" &&
    sideDish === "なし" &&
    soup === "なし"
  ) {
    score = 0;
    comment = "全部なし！？エア食卓はさすがにナンセンス！（笑）";
  } else if (
    genre === "和食" &&
    staple === "米" &&
    mainDish === "魚" &&
    sideDish !== "なし" &&
    soup === "あり"
  ) {
    score = 100;
    comment = "いいね！王道の一汁三菜バランス。完璧な和の食卓です！";
  } else if (
    staple !== "なし" &&
    mainDish !== "なし" &&
    sideDish !== "なし" &&
    soup === "あり"
  ) {
    comment = "いいね！主食・主菜・副菜・汁物がそろった理想的な組み合わせ！";
  } else if (genre === "和食" && staple === "パン" && soup === "あり") {
    score -= 10;
    comment = "和食×パン×汁物…攻めたフュージョン！ある意味ナンセンス？（笑）";
  } else if (sideDish === "なし") {
    comment = "あと一歩！副菜（野菜や海藻）を1品足すとグッと健康的になります。";
  } else {
    comment = "ナイス組み合わせ！悩まずサクッと決めたのが一番の勝利です。";
  }

  let fortune = "中吉";
  if (score >= 95) {
    fortune = "🌟 超大吉（神バランス）";
  } else if (score >= 80) {
    fortune = "✨ 大吉（いいね！）";
  } else if (score >= 65) {
    fortune = "😊 中吉（まずまず）";
  } else {
    fortune = "🌀 カオス吉（ナンセンス枠）";
  }

  const suggestions = getDishSuggestions(
    genre,
    staple,
    mainDish,
    sideDish,
    soup,
  );

  // 日付ごとに保存
  records[day] = {
    genre,
    staple,
    mainDish,
    sideDish,
    soup,
    memo,
    score,
    fortune,
    suggestions,
  };
  localStorage.setItem("tenZentakuRecords", JSON.stringify(records));

  scoreText.textContent = `${score} 点`;
  fortuneText.textContent = fortune;
  commentText.textContent = `【${day}日・${genre}】${comment}`;

  if (suggestionArea) {
    suggestionArea.innerHTML = `
      <p><strong>🍽️ こんな料理候補はどう？</strong></p>
      <ul>
        ${suggestions.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    `;
  }

  resultArea.classList.remove("hidden");

  renderSummary();
});

// 月表示・週表示の集計と描画
function renderSummary() {
  monthCalendarGrid.innerHTML = "";
  let monthTotal = 0;
  let monthDays = 0;
  let weekTotal = 0;
  let weekDays = 0;

  for (let d = 1; d <= 30; d++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.innerHTML = `<span>${d}日</span>`;

    if (records[d]) {
      const rec = records[d];
      monthTotal += rec.score;
      monthDays++;
      if (d <= 7) {
        weekTotal += rec.score;
        weekDays++;
      }
      cell.classList.add("recorded");
      cell.innerHTML += `<span class="day-score">${rec.score}pt</span>`;
    }

    // カレンダーの日付をクリックしたら日表示へ移動してその日を選択
    cell.addEventListener("click", () => {
      daySelect.value = d;
      switchTab("day");
    });

    monthCalendarGrid.appendChild(cell);
  }

  // 月間合計とランク判定
  document.getElementById("monthTotalScore").textContent = monthTotal;
  let rank = "のんびり食卓";
  if (monthTotal >= 2000) rank = "しあわせ食卓";
  else if (monthTotal >= 1000) rank = "つややか食卓";
  else if (monthTotal >= 400) rank = "ごきげん食卓";
  else if (monthTotal > 0) rank = "ほっこり食卓";
  document.getElementById("monthRank").textContent = rank;
  document.getElementById("monthReflection").textContent =
    monthDays > 0
      ? `今月は ${monthDays} 日分の食卓を記録！平均 ${Math.round(monthTotal / monthDays)} 点のペースです。`
      : "まだ記録がありません。「日表示」または下のカレンダー日付から採点してみよう！";

  // 週間中間ポイント（1日〜7日）と反省
  document.getElementById("weekTotalScore").textContent = weekTotal;
  document.getElementById("weekCount").textContent = weekDays;
  document.getElementById("weekReflection").textContent =
    weekDays > 0
      ? `第1週（1〜7日）の中間ポイントは ${weekTotal} pt（平均 ${Math.round(weekTotal / weekDays)} 点）！副菜や汁物を意識するとさらに伸びます。`
      : "1日〜7日の記録を入れると、ここに週間中間ポイントと反省コメントが出ます。";
}

// 初期描画（月表示からスタート）
renderSummary();
// ステップ2：「🎲 おまかせで選ぶ」ボタンの処理
const randomBtn = document.getElementById("randomBtn");

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

if (randomBtn) {
  randomBtn.addEventListener("click", () => {
    const selectIds = ["genre", "staple", "mainDish", "sideDish", "soup"];

    selectIds.forEach((id) => {
      const selectEl = document.getElementById(id);
      if (selectEl && selectEl.options.length > 0) {
        const values = Array.from(selectEl.options).map((opt) => opt.value);
        selectEl.value = pickRandom(values);
      }
    });
  });
}
// ステップ3：選んだ日付の過去記録を呼び戻す処理
function loadDayRecord(day) {
  const rec = records[day];

  if (!rec) {
    document.getElementById("memo").value = "";
    resultArea.classList.add("hidden");
    return;
  }

  document.getElementById("genre").value = rec.genre || "和食";
  document.getElementById("staple").value = rec.staple || "米";
  document.getElementById("mainDish").value = rec.mainDish || "肉";
  document.getElementById("sideDish").value = rec.sideDish || "野菜";
  document.getElementById("soup").value = rec.soup || "あり";
  document.getElementById("memo").value = rec.memo || "";

  scoreText.textContent = `${rec.score} 点`;
  fortuneText.textContent = rec.fortune || "中吉";
  commentText.textContent = `【${day}日・${rec.genre}】（保存済みの記録）`;

  if (
    suggestionArea &&
    Array.isArray(rec.suggestions) &&
    rec.suggestions.length > 0
  ) {
    suggestionArea.innerHTML = `
      <p><strong>🍽️ こんな料理候補はどう？</strong></p>
      <ul>
        ${rec.suggestions.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    `;
  } else if (suggestionArea) {
    suggestionArea.innerHTML = "";
  }

  resultArea.classList.remove("hidden");
}

// 日付プルダウンを変更したときに呼び戻す
if (daySelect) {
  daySelect.addEventListener("change", () => {
    loadDayRecord(daySelect.value);
  });
}

// カレンダーの日付をクリックしたあとも、その日の記録を呼び戻す
const calendarCells = monthCalendarGrid
  ? monthCalendarGrid.querySelectorAll(".day-cell")
  : [];
calendarCells.forEach((cell, idx) => {
  const dayNum = idx + 1;
  cell.addEventListener("click", () => {
    loadDayRecord(dayNum);
  });
});

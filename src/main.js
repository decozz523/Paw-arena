const SAVE_KEY = 'paw-arena-save-v2';

const rarityOrder = ['Обычная', 'Редкая', 'Эпическая', 'Легендарная'];
const rarityMeta = {
  Обычная: { className: 'common', packChance: 52, price: 30 },
  Редкая: { className: 'rare', packChance: 30, price: 65 },
  Эпическая: { className: 'epic', packChance: 14, price: 130 },
  Легендарная: { className: 'legendary', packChance: 4, price: 240 },
};

const baseDogs = [
  { id: 1, name: 'Барон', breed: 'Овчарка', rarity: 'Обычная', emoji: '🐕‍🦺', power: 16, hp: 68, speed: 13, role: 'Страж', element: 'Броня', ability: 'Закрывает союзников и даёт +5% к защите стаи.' },
  { id: 2, name: 'Молли', breed: 'Корги', rarity: 'Обычная', emoji: '🐶', power: 14, hp: 58, speed: 18, role: 'Скаут', element: 'Ловкость', ability: 'Находит слабое место врага и ускоряет первый раунд.' },
  { id: 3, name: 'Рокки', breed: 'Боксер', rarity: 'Редкая', emoji: '🐕', power: 22, hp: 74, speed: 15, role: 'Боец', element: 'Сила', ability: 'Наносит тяжёлый удар, если команда уступает по силе.' },
  { id: 4, name: 'Луна', breed: 'Хаски', rarity: 'Редкая', emoji: '🐺', power: 20, hp: 65, speed: 24, role: 'Рывок', element: 'Лёд', ability: 'Замедляет бота и повышает шанс критического рывка.' },
  { id: 5, name: 'Акира', breed: 'Акита', rarity: 'Эпическая', emoji: '🦊', power: 30, hp: 84, speed: 21, role: 'Самурай', element: 'Фокус', ability: 'Комбо-клинок усиливает следующий удар союзника.' },
  { id: 6, name: 'Гром', breed: 'Доберман', rarity: 'Эпическая', emoji: '⚡', power: 33, hp: 78, speed: 25, role: 'Штурм', element: 'Молния', ability: 'Молниеносный старт добавляет бонус к атаке.' },
  { id: 7, name: 'Орион', breed: 'Тибетский мастиф', rarity: 'Легендарная', emoji: '🦁', power: 42, hp: 105, speed: 17, role: 'Титан', element: 'Гора', ability: 'Титаническая стойкость снижает урон в решающем раунде.' },
  { id: 8, name: 'Нова', breed: 'Самоед', rarity: 'Легендарная', emoji: '✨', power: 38, hp: 88, speed: 31, role: 'Звезда', element: 'Свет', ability: 'Звёздное вдохновение увеличивает награду за победу.' },
];

const packs = [
  { id: 'mini', title: 'Малый бокс', price: 60, cards: 1, description: 'Быстрый шанс усилить стаю.' },
  { id: 'standard', title: 'Боевой пак', price: 150, cards: 3, description: 'Оптимальный набор для арены.' },
  { id: 'champion', title: 'Чемпионский ящик', price: 340, cards: 7, description: 'Больше карт и высокий шанс редкостей.' },
];

const botTeams = [
  { name: 'Тренер Макс', icon: '🧢', reward: 55, dogs: [1, 2, 3], trait: 'учебный бой', minWins: 0 },
  { name: 'Стая Севера', icon: '❄️', reward: 95, dogs: [4, 5, 2], trait: 'быстрые ледяные рывки', minWins: 1 },
  { name: 'Лига Альфа', icon: '👑', reward: 145, dogs: [6, 7, 8], trait: 'чемпионские легенды', minWins: 3 },
];

const questDefinitions = [
  { id: 'first-win', title: 'Первая победа', target: 1, reward: 80, label: 'Победи любого бота', progress: () => state.stats.wins },
  { id: 'pack-hunter', title: 'Охотник за паками', target: 2, reward: 120, label: 'Открой 2 бокса или пака', progress: () => state.stats.packsOpened },
  { id: 'trainer', title: 'Наставник стаи', target: 3, reward: 150, label: 'Сделай 3 прокачки собак', progress: () => state.stats.upgrades },
  { id: 'collector', title: 'Коллекционер', target: 6, reward: 200, label: 'Открой 6 разных собак', progress: () => ownedDogs().length },
  { id: 'streak', title: 'Горячая серия', target: 3, reward: 250, label: 'Собери серию из 3 побед', progress: () => state.stats.bestStreak },
];

const achievementDefinitions = [
  { id: 'first-legendary', title: 'Легенда в будке', reward: 120, condition: () => ownedDogs().some((dog) => dog.rarity === 'Легендарная') },
  { id: 'alpha-slayer', title: 'Победитель Альфы', reward: 180, condition: () => state.stats.defeatedBots.includes('Лига Альфа') },
  { id: 'full-kennel', title: 'Полный питомник', reward: 300, condition: () => ownedDogs().length === baseDogs.length },
  { id: 'power-pack', title: 'Сила 300+', reward: 200, condition: () => teamPower() >= 300 },
];

function createCollection() {
  return baseDogs.map((dog) => ({ ...dog, level: dog.id <= 3 ? 1 : 0, copies: dog.id <= 3 ? 1 : 0 }));
}

function createDefaultState() {
  return {
    scene: 'collection',
    points: 220,
    collection: createCollection(),
    selectedBotIndex: 0,
    log: ['Добро пожаловать в Paw Arena! Теперь у стаи есть способности, миссии, серии побед и автосохранение.'],
    lastPack: [],
    battleReport: ['Выбери соперника и начни бой, чтобы увидеть раунды и способности.'],
    stats: { wins: 0, losses: 0, streak: 0, bestStreak: 0, packsOpened: 0, upgrades: 0, defeatedBots: [] },
    claimedQuests: [],
    claimedAchievements: [],
  };
}

let state = loadState();
const app = document.querySelector('#root');

function loadState() {
  const defaults = createDefaultState();
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return defaults;
    const parsed = JSON.parse(saved);
    return {
      ...defaults,
      ...parsed,
      stats: { ...defaults.stats, ...parsed.stats },
      collection: defaults.collection.map((dog) => ({ ...dog, ...(parsed.collection || []).find((savedDog) => savedDog.id === dog.id) })),
    };
  } catch (error) {
    console.warn('Не удалось загрузить сохранение Paw Arena, создан новый профиль.', error);
    return defaults;
  }
}

function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Не удалось сохранить прогресс Paw Arena.', error);
  }
}

function icon(name) {
  const icons = {
    bone: '🦴', box: '📦', coins: '🪙', heart: '❤️', shield: '🛡️', shop: '🛍️', sparkles: '✨', swords: '⚔️', trophy: '🏆', zap: '⚡', star: '⭐', target: '🎯', fire: '🔥', reset: '🔄', paw: '🐾', scroll: '📜', lock: '🔒', gift: '🎁', combo: '🧬', chart: '📈',
  };
  return `<span class="icon" aria-hidden="true">${icons[name]}</span>`;
}

function dogScore(dog) {
  return dog.level ? dog.power + dog.hp * 0.34 + dog.speed * 0.8 + dog.level * 9 : 0;
}

function ownedDogs() {
  return state.collection.filter((dog) => dog.level > 0);
}

function teamLineup() {
  return [...ownedDogs()].sort((a, b) => dogScore(b) - dogScore(a)).slice(0, 3);
}

function synergyInfo(lineup = teamLineup()) {
  const bonuses = [];
  if (lineup.length < 3) return { multiplier: 1, bonuses: ['Нужно 3 собаки для командного бонуса'] };
  if (new Set(lineup.map((dog) => dog.element)).size === 3) bonuses.push({ label: 'Разные стихии', value: 0.08 });
  if (new Set(lineup.map((dog) => dog.rarity)).size === 1) bonuses.push({ label: 'Одна редкость', value: 0.07 });
  if (lineup.some((dog) => dog.rarity === 'Легендарная')) bonuses.push({ label: 'Легендарный лидер', value: 0.05 });
  if (lineup.some((dog) => dog.role === 'Страж') && lineup.some((dog) => dog.role === 'Штурм')) bonuses.push({ label: 'Страж + Штурм', value: 0.06 });
  const multiplier = 1 + bonuses.reduce((sum, bonus) => sum + bonus.value, 0);
  return { multiplier, bonuses: bonuses.map((bonus) => `${bonus.label} +${Math.round(bonus.value * 100)}%`) };
}

function teamPower() {
  const basePower = teamLineup().reduce((sum, dog) => sum + dogScore(dog), 0);
  return basePower * synergyInfo().multiplier;
}

function selectedBot() {
  return botTeams[state.selectedBotIndex];
}

function isBotLocked(bot) {
  return state.stats.wins < bot.minWins;
}

function botPower() {
  const level = selectedBot().reward > 100 ? 3 : 2;
  const botLineup = selectedBot().dogs.map((id) => ({ ...baseDogs.find((dog) => dog.id === id), level }));
  return botLineup.reduce((sum, dog) => sum + dogScore(dog), 0) * (selectedBot().reward > 100 ? 1.08 : 1);
}

function addLog(message) {
  state.log = [message, ...state.log].slice(0, 6);
}

function rollDog(packId) {
  const boost = packId === 'champion' ? 7 : packId === 'standard' ? 3 : 0;
  const roll = Math.random() * 100;
  let cursor = 0;
  for (const rarity of rarityOrder) {
    const chance = rarityMeta[rarity].packChance + (rarity === 'Эпическая' || rarity === 'Легендарная' ? boost : -boost / 2);
    cursor += Math.max(2, chance);
    if (roll <= cursor) {
      const pool = baseDogs.filter((dog) => dog.rarity === rarity);
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }
  return baseDogs[0];
}

function upgradeDog(id) {
  const dog = state.collection.find((item) => item.id === id);
  if (!dog || dog.level === 0) return;
  const cost = dog.level * rarityMeta[dog.rarity].price;
  if (state.points < cost) {
    addLog(`Не хватает победных очков для прокачки ${dog.name}.`);
    render();
    return;
  }
  state.points -= cost;
  dog.level += 1;
  dog.power += 4;
  dog.hp += 8;
  dog.speed += 2;
  state.stats.upgrades += 1;
  addLog(`${dog.name} повышен до уровня ${dog.level}! Способность стала сильнее.`);
  checkAchievements();
  render();
}

function buyPack(packId) {
  const pack = packs.find((item) => item.id === packId);
  if (!pack) return;
  if (state.points < pack.price) {
    addLog(`Для покупки «${pack.title}» нужно ещё ${pack.price - state.points} очков.`);
    render();
    return;
  }
  const drops = Array.from({ length: pack.cards }, () => rollDog(pack.id));
  state.points -= pack.price;
  state.lastPack = drops;
  state.stats.packsOpened += 1;
  drops.forEach((drop) => {
    const dog = state.collection.find((item) => item.id === drop.id);
    dog.level = dog.level || 1;
    dog.copies += 1;
  });
  addLog(`Открыт ${pack.title}: ${drops.map((dog) => `${dog.emoji} ${dog.name}`).join(', ')}.`);
  checkAchievements();
  render();
}

function fight() {
  if (ownedDogs().length < 3) {
    addLog('Для боя нужно минимум 3 открытые собаки.');
    render();
    return;
  }
  if (isBotLocked(selectedBot())) {
    addLog(`${selectedBot().name} откроется после ${selectedBot().minWins} побед.`);
    render();
    return;
  }
  const lineup = teamLineup();
  const playerBase = teamPower();
  const enemyBase = botPower();
  const playerRoll = playerBase * (0.86 + Math.random() * 0.34);
  const enemyRoll = enemyBase * (0.86 + Math.random() * 0.34);
  const won = playerRoll >= enemyRoll;
  const novaBonus = won && lineup.some((dog) => dog.id === 8) ? 25 : 0;
  const streakBonus = won ? Math.min(state.stats.streak + 1, 5) * 10 : 0;
  state.battleReport = createBattleReport(lineup, playerRoll, enemyRoll, won);
  if (won) {
    const reward = selectedBot().reward + novaBonus + streakBonus;
    state.points += reward;
    state.stats.wins += 1;
    state.stats.streak += 1;
    state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    if (!state.stats.defeatedBots.includes(selectedBot().name)) state.stats.defeatedBots.push(selectedBot().name);
    addLog(`Победа над ${selectedBot().name}! +${reward} очков (${streakBonus} за серию${novaBonus ? ', 25 за Нову' : ''}).`);
  } else {
    const consolation = Math.round(selectedBot().reward * 0.25);
    state.points += consolation;
    state.stats.losses += 1;
    state.stats.streak = 0;
    addLog(`${selectedBot().name} оказался сильнее. Утешительный бонус +${consolation} очков.`);
  }
  unlockNextBot();
  checkAchievements();
  render();
}

function createBattleReport(lineup, playerRoll, enemyRoll, won) {
  const enemyDogs = selectedBot().dogs.map((id) => baseDogs.find((dog) => dog.id === id));
  return [0, 1, 2].map((round) => {
    const ally = lineup[round % lineup.length];
    const enemy = enemyDogs[round % enemyDogs.length];
    const swing = Math.round((playerRoll - enemyRoll) / 3 + (round + 1) * (won ? 4 : -3));
    return `${round + 1}. ${ally.emoji} ${ally.name}: ${ally.role} против ${enemy.emoji} ${enemy.name}. ${ally.ability} ${swing >= 0 ? `Преимущество +${swing}` : `Просадка ${swing}`}.`;
  });
}

function unlockNextBot() {
  const lockedBot = botTeams.find((bot) => isBotLocked(bot));
  if (lockedBot && state.stats.wins >= lockedBot.minWins) addLog(`Открыт новый соперник: ${lockedBot.name}!`);
}

function checkAchievements() {
  achievementDefinitions.forEach((achievement) => {
    if (!state.claimedAchievements.includes(achievement.id) && achievement.condition()) {
      state.claimedAchievements.push(achievement.id);
      state.points += achievement.reward;
      addLog(`Достижение «${achievement.title}»! +${achievement.reward} очков.`);
    }
  });
}

function claimQuest(id) {
  const quest = questDefinitions.find((item) => item.id === id);
  if (!quest || state.claimedQuests.includes(id) || quest.progress() < quest.target) return;
  state.claimedQuests.push(id);
  state.points += quest.reward;
  addLog(`Миссия «${quest.title}» выполнена! +${quest.reward} очков.`);
  render();
}

function setScene(scene) {
  state.scene = scene;
  render();
}

function setBot(index) {
  const bot = botTeams[index];
  if (isBotLocked(bot)) {
    addLog(`${bot.name} закрыт: нужно побед ${bot.minWins}, сейчас ${state.stats.wins}.`);
  } else {
    state.selectedBotIndex = index;
  }
  render();
}

function resetProgress() {
  state = createDefaultState();
  localStorage.removeItem(SAVE_KEY);
  render();
}

function collectionScene() {
  return `<section class="scene-grid cards-grid">
    ${state.collection.map((dog) => {
      const locked = dog.level === 0;
      const cost = dog.level * rarityMeta[dog.rarity].price;
      return `<article class="dog-card ${rarityMeta[dog.rarity].className} ${locked ? 'locked' : ''}">
        <div class="dog-emoji">${dog.emoji}</div>
        <div class="card-heading">
          <div><h2>${dog.name}</h2><p>${dog.breed} · ${dog.role} · ${dog.element}</p></div>
          <span>${dog.rarity}</span>
        </div>
        <div class="level-row">Уровень ${dog.level || '???'} <small>копии: ${dog.copies}</small></div>
        <p class="ability-text">${locked ? 'Карта не изучена: найди её в паке.' : dog.ability}</p>
        ${statLine('zap', 'Атака', dog.power)}
        ${statLine('heart', 'Здоровье', dog.hp)}
        ${statLine('shield', 'Скорость', dog.speed)}
        <button data-upgrade="${dog.id}" ${locked || state.points < cost ? 'disabled' : ''}>${locked ? 'Найди в паке' : `Прокачать · ${cost} очков`}</button>
      </article>`;
    }).join('')}
  </section>`;
}

function shopScene() {
  return `<section class="shop-layout">
    <div class="pack-list">
      ${packs.map((pack) => `<article class="pack-card">
        <div class="pack-icon">📦</div>
        <h2>${pack.title}</h2>
        <p>${pack.description}</p>
        <strong>${pack.cards} карт · ${pack.price} очков</strong>
        <button data-pack="${pack.id}" ${state.points < pack.price ? 'disabled' : ''}>Купить и открыть</button>
      </article>`).join('')}
    </div>
    <div class="drop-panel">
      <h2>Последний пак</h2>
      ${state.lastPack.length === 0 ? '<p>Открой бокс, чтобы увидеть добычу.</p>' : state.lastPack.map((dog, index) => `<span class="drop ${rarityMeta[dog.rarity].className}" key="${dog.id}-${index}">${dog.emoji} ${dog.name} · ${dog.rarity}</span>`).join('')}
      <div class="odds-card">
        <h3>Шансы редкости</h3>
        ${rarityOrder.map((rarity) => `<span>${rarity}: ${rarityMeta[rarity].packChance}%</span>`).join('')}
      </div>
    </div>
  </section>`;
}

function battleScene() {
  return `<section class="battle-layout">
    <div class="bot-list">
      ${botTeams.map((bot, index) => `<button class="${index === state.selectedBotIndex ? 'active ' : ''}bot-button" data-bot="${index}" ${isBotLocked(bot) ? 'aria-disabled="true"' : ''}>
        <span>${isBotLocked(bot) ? '🔒' : bot.icon}</span><strong>${bot.name}</strong><small>${isBotLocked(bot) ? `нужно побед: ${bot.minWins}` : `награда ${bot.reward} · ${bot.trait}`}</small>
      </button>`).join('')}
    </div>
    <div class="arena-card">
      <div class="versus">
        <div><p>Твоя стая</p><strong>${Math.round(teamPower())}</strong></div>
        <span>VS</span>
        <div><p>${selectedBot().name}</p><strong>${Math.round(botPower())}</strong></div>
      </div>
      <div class="synergy-card">
        <strong>${icon('combo')} Комбо стаи</strong>
        <p>${synergyInfo().bonuses.join(' · ')}</p>
      </div>
      <div class="enemy-team">
        ${selectedBot().dogs.map((id) => {
          const dog = baseDogs.find((item) => item.id === id);
          return `<span>${dog.emoji} ${dog.name}</span>`;
        }).join('')}
      </div>
      <button class="fight-button" data-fight="true">${icon('swords')} Начать бой</button>
      <div class="battle-report">
        <h3>${icon('scroll')} Ход боя</h3>
        ${state.battleReport.map((entry) => `<p>${entry}</p>`).join('')}
      </div>
    </div>
  </section>`;
}

function progressPanel() {
  const completedQuests = questDefinitions.filter((quest) => state.claimedQuests.includes(quest.id)).length;
  return `<section class="progress-layout">
    <article class="profile-card">
      <h2>${icon('paw')} Питомник тренера</h2>
      <div class="profile-stats">
        <span>${icon('trophy')} Победы: <strong>${state.stats.wins}</strong></span>
        <span>${icon('fire')} Серия: <strong>${state.stats.streak}</strong></span>
        <span>${icon('bone')} Собаки: <strong>${ownedDogs().length}/${baseDogs.length}</strong></span>
        <span>${icon('target')} Миссии: <strong>${completedQuests}/${questDefinitions.length}</strong></span>
      </div>
      <button class="ghost-button" data-reset="true">${icon('reset')} Сбросить прогресс</button>
    </article>
    <article class="quest-card">
      <h2>${icon('target')} Миссии</h2>
      ${questDefinitions.map((quest) => questMarkup(quest)).join('')}
    </article>
    <article class="quest-card">
      <h2>${icon('star')} Достижения</h2>
      ${achievementDefinitions.map((achievement) => `<div class="achievement ${state.claimedAchievements.includes(achievement.id) ? 'done' : ''}">
        <span>${state.claimedAchievements.includes(achievement.id) ? '✅' : '⬜'} ${achievement.title}</span>
        <small>+${achievement.reward} очков</small>
      </div>`).join('')}
    </article>
  </section>`;
}

function questMarkup(quest) {
  const progress = Math.min(quest.progress(), quest.target);
  const done = progress >= quest.target;
  const claimed = state.claimedQuests.includes(quest.id);
  return `<div class="quest-row ${claimed ? 'done' : ''}">
    <div>
      <strong>${quest.title}</strong>
      <small>${quest.label}</small>
      <div class="progress-bar"><span style="width: ${(progress / quest.target) * 100}%"></span></div>
    </div>
    <button data-quest="${quest.id}" ${!done || claimed ? 'disabled' : ''}>${claimed ? 'Получено' : `${progress}/${quest.target} · +${quest.reward}`}</button>
  </div>`;
}

function statLine(iconName, label, value) {
  return `<div class="stat-line">${icon(iconName)}<span>${label}</span><strong>${value}</strong></div>`;
}

function activeSceneMarkup() {
  if (state.scene === 'shop') return shopScene();
  if (state.scene === 'battle') return battleScene();
  return collectionScene();
}

function render() {
  checkAchievements();
  saveState();
  app.innerHTML = `<main class="app-shell">
    <section class="hero-card">
      <div>
        <p class="eyebrow">${icon('sparkles')} Paw Arena</p>
        <h1>Собери стаю, закрывай миссии и проходи лигу ботов</h1>
        <p class="hero-text">Теперь это не просто три экрана: у собак есть способности, у команды — комбо, у игрока — прогресс, миссии, достижения и автосохранение.</p>
      </div>
      <div class="stats-panel">
        <span>${icon('coins')} ${state.points} очков</span>
        <span>${icon('trophy')} сила ${Math.round(teamPower())}</span>
        <span>${icon('fire')} серия ${state.stats.streak}</span>
      </div>
    </section>

    <nav class="scene-tabs" aria-label="Сцены игры">
      <button class="${state.scene === 'collection' ? 'active' : ''}" data-scene="collection">${icon('bone')} Карты</button>
      <button class="${state.scene === 'shop' ? 'active' : ''}" data-scene="shop">${icon('shop')} Магазин</button>
      <button class="${state.scene === 'battle' ? 'active' : ''}" data-scene="battle">${icon('swords')} Бой</button>
    </nav>

    ${activeSceneMarkup()}
    ${progressPanel()}

    <aside class="log-panel">
      <h2>Журнал</h2>
      ${state.log.map((entry) => `<p>${entry}</p>`).join('')}
    </aside>
  </main>`;
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.scene) setScene(button.dataset.scene);
  if (button.dataset.upgrade) upgradeDog(Number(button.dataset.upgrade));
  if (button.dataset.pack) buyPack(button.dataset.pack);
  if (button.dataset.bot) setBot(Number(button.dataset.bot));
  if (button.dataset.fight) fight();
  if (button.dataset.quest) claimQuest(button.dataset.quest);
  if (button.dataset.reset) resetProgress();
});

render();

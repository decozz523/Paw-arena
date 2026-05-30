const rarityOrder = ['Обычная', 'Редкая', 'Эпическая', 'Легендарная'];
const rarityMeta = {
  Обычная: { className: 'common', packChance: 52, price: 30 },
  Редкая: { className: 'rare', packChance: 30, price: 65 },
  Эпическая: { className: 'epic', packChance: 14, price: 130 },
  Легендарная: { className: 'legendary', packChance: 4, price: 240 },
};

const baseDogs = [
  { id: 1, name: 'Барон', breed: 'Овчарка', rarity: 'Обычная', emoji: '🐕‍🦺', power: 16, hp: 68, speed: 13, role: 'Страж' },
  { id: 2, name: 'Молли', breed: 'Корги', rarity: 'Обычная', emoji: '🐶', power: 14, hp: 58, speed: 18, role: 'Скаут' },
  { id: 3, name: 'Рокки', breed: 'Боксер', rarity: 'Редкая', emoji: '🐕', power: 22, hp: 74, speed: 15, role: 'Боец' },
  { id: 4, name: 'Луна', breed: 'Хаски', rarity: 'Редкая', emoji: '🐺', power: 20, hp: 65, speed: 24, role: 'Рывок' },
  { id: 5, name: 'Акира', breed: 'Акита', rarity: 'Эпическая', emoji: '🦊', power: 30, hp: 84, speed: 21, role: 'Самурай' },
  { id: 6, name: 'Гром', breed: 'Доберман', rarity: 'Эпическая', emoji: '⚡', power: 33, hp: 78, speed: 25, role: 'Штурм' },
  { id: 7, name: 'Орион', breed: 'Тибетский мастиф', rarity: 'Легендарная', emoji: '🦁', power: 42, hp: 105, speed: 17, role: 'Титан' },
  { id: 8, name: 'Нова', breed: 'Самоед', rarity: 'Легендарная', emoji: '✨', power: 38, hp: 88, speed: 31, role: 'Звезда' },
];

const packs = [
  { id: 'mini', title: 'Малый бокс', price: 60, cards: 1, description: 'Быстрый шанс усилить стаю.' },
  { id: 'standard', title: 'Боевой пак', price: 150, cards: 3, description: 'Оптимальный набор для арены.' },
  { id: 'champion', title: 'Чемпионский ящик', price: 340, cards: 7, description: 'Больше карт и высокий шанс редкостей.' },
];

const botTeams = [
  { name: 'Тренер Макс', icon: '🧢', reward: 55, dogs: [1, 2, 3] },
  { name: 'Стая Севера', icon: '❄️', reward: 95, dogs: [4, 5, 2] },
  { name: 'Лига Альфа', icon: '👑', reward: 145, dogs: [6, 7, 8] },
];

const state = {
  scene: 'collection',
  points: 220,
  collection: baseDogs.map((dog) => ({ ...dog, level: dog.id <= 3 ? 1 : 0, copies: dog.id <= 3 ? 1 : 0 })),
  selectedBotIndex: 0,
  log: ['Добро пожаловать в Paw Arena! Собери собак, открой паки и побеждай ботов.'],
  lastPack: [],
};

const app = document.querySelector('#root');

function icon(name) {
  const icons = {
    bone: '🦴', box: '📦', coins: '🪙', heart: '❤️', shield: '🛡️', shop: '🛍️', sparkles: '✨', swords: '⚔️', trophy: '🏆', zap: '⚡',
  };
  return `<span class="icon" aria-hidden="true">${icons[name]}</span>`;
}

function dogScore(dog) {
  return dog.level ? dog.power + dog.hp * 0.34 + dog.speed * 0.8 + dog.level * 9 : 0;
}

function ownedDogs() {
  return state.collection.filter((dog) => dog.level > 0);
}

function teamPower() {
  return ownedDogs().sort((a, b) => dogScore(b) - dogScore(a)).slice(0, 3).reduce((sum, dog) => sum + dogScore(dog), 0);
}

function selectedBot() {
  return botTeams[state.selectedBotIndex];
}

function botPower() {
  const level = selectedBot().reward > 100 ? 3 : 2;
  return selectedBot().dogs.reduce((sum, id) => sum + dogScore({ ...baseDogs.find((dog) => dog.id === id), level }), 0);
}

function addLog(message) {
  state.log = [message, ...state.log].slice(0, 5);
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
  addLog(`${dog.name} повышен до уровня ${dog.level}!`);
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
  drops.forEach((drop) => {
    const dog = state.collection.find((item) => item.id === drop.id);
    dog.level = dog.level || 1;
    dog.copies += 1;
  });
  addLog(`Открыт ${pack.title}: ${drops.map((dog) => dog.name).join(', ')}.`);
  render();
}

function fight() {
  if (ownedDogs().length < 3) {
    addLog('Для боя нужно минимум 3 открытые собаки.');
    render();
    return;
  }
  const playerRoll = teamPower() * (0.85 + Math.random() * 0.35);
  const enemyRoll = botPower() * (0.85 + Math.random() * 0.35);
  if (playerRoll >= enemyRoll) {
    state.points += selectedBot().reward;
    addLog(`Победа над ${selectedBot().name}! +${selectedBot().reward} победных очков.`);
  } else {
    const consolation = Math.round(selectedBot().reward * 0.25);
    state.points += consolation;
    addLog(`${selectedBot().name} оказался сильнее. Утешительный бонус +${consolation} очков.`);
  }
  render();
}

function setScene(scene) {
  state.scene = scene;
  render();
}

function setBot(index) {
  state.selectedBotIndex = index;
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
          <div><h2>${dog.name}</h2><p>${dog.breed} · ${dog.role}</p></div>
          <span>${dog.rarity}</span>
        </div>
        <div class="level-row">Уровень ${dog.level || '???'} <small>копии: ${dog.copies}</small></div>
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
    </div>
  </section>`;
}

function battleScene() {
  return `<section class="battle-layout">
    <div class="bot-list">
      ${botTeams.map((bot, index) => `<button class="${index === state.selectedBotIndex ? 'active ' : ''}bot-button" data-bot="${index}">
        <span>${bot.icon}</span><strong>${bot.name}</strong><small>награда ${bot.reward}</small>
      </button>`).join('')}
    </div>
    <div class="arena-card">
      <div class="versus">
        <div><p>Твоя стая</p><strong>${Math.round(teamPower())}</strong></div>
        <span>VS</span>
        <div><p>${selectedBot().name}</p><strong>${Math.round(botPower())}</strong></div>
      </div>
      <div class="enemy-team">
        ${selectedBot().dogs.map((id) => {
          const dog = baseDogs.find((item) => item.id === id);
          return `<span>${dog.emoji} ${dog.name}</span>`;
        }).join('')}
      </div>
      <button class="fight-button" data-fight="true">${icon('swords')} Начать бой</button>
    </div>
  </section>`;
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
  app.innerHTML = `<main class="app-shell">
    <section class="hero-card">
      <div>
        <p class="eyebrow">${icon('sparkles')} Paw Arena</p>
        <h1>Собери легендарную стаю и побеждай на арене</h1>
        <p class="hero-text">Три сцены в одном адаптивном интерфейсе: карточки собак, магазин паков и бой с ботами.</p>
      </div>
      <div class="stats-panel">
        <span>${icon('coins')} ${state.points} очков</span>
        <span>${icon('trophy')} сила ${Math.round(teamPower())}</span>
      </div>
    </section>

    <nav class="scene-tabs" aria-label="Сцены игры">
      <button class="${state.scene === 'collection' ? 'active' : ''}" data-scene="collection">${icon('bone')} Карты</button>
      <button class="${state.scene === 'shop' ? 'active' : ''}" data-scene="shop">${icon('shop')} Магазин</button>
      <button class="${state.scene === 'battle' ? 'active' : ''}" data-scene="battle">${icon('swords')} Бой</button>
    </nav>

    ${activeSceneMarkup()}

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
});

render();

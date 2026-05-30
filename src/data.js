export const SAVE_KEY = 'paw-arena-save-v2';

export const rarityOrder = ['Обычная', 'Редкая', 'Эпическая', 'Легендарная'];

export const rarityMeta = {
  Обычная: { className: 'common', packChance: 52, price: 30 },
  Редкая: { className: 'rare', packChance: 30, price: 65 },
  Эпическая: { className: 'epic', packChance: 14, price: 130 },
  Легендарная: { className: 'legendary', packChance: 4, price: 240 },
};

export const baseDogs = [
  { id: 1, name: 'Барон', breed: 'Овчарка', rarity: 'Обычная', emoji: '🐕‍🦺', power: 16, hp: 68, speed: 13, role: 'Страж', element: 'Броня', ability: 'Закрывает союзников и даёт +5% к защите стаи.' },
  { id: 2, name: 'Молли', breed: 'Корги', rarity: 'Обычная', emoji: '🐶', power: 14, hp: 58, speed: 18, role: 'Скаут', element: 'Ловкость', ability: 'Находит слабое место врага и ускоряет первый раунд.' },
  { id: 3, name: 'Рокки', breed: 'Боксер', rarity: 'Редкая', emoji: '🐕', power: 22, hp: 74, speed: 15, role: 'Боец', element: 'Сила', ability: 'Наносит тяжёлый удар, если команда уступает по силе.' },
  { id: 4, name: 'Луна', breed: 'Хаски', rarity: 'Редкая', emoji: '🐺', power: 20, hp: 65, speed: 24, role: 'Рывок', element: 'Лёд', ability: 'Замедляет бота и повышает шанс критического рывка.' },
  { id: 5, name: 'Акира', breed: 'Акита', rarity: 'Эпическая', emoji: '🦊', power: 30, hp: 84, speed: 21, role: 'Самурай', element: 'Фокус', ability: 'Комбо-клинок усиливает следующий удар союзника.' },
  { id: 6, name: 'Гром', breed: 'Доберман', rarity: 'Эпическая', emoji: '⚡', power: 33, hp: 78, speed: 25, role: 'Штурм', element: 'Молния', ability: 'Молниеносный старт добавляет бонус к атаке.' },
  { id: 7, name: 'Орион', breed: 'Тибетский мастиф', rarity: 'Легендарная', emoji: '🦁', power: 42, hp: 105, speed: 17, role: 'Титан', element: 'Гора', ability: 'Титаническая стойкость снижает урон в решающем раунде.' },
  { id: 8, name: 'Нова', breed: 'Самоед', rarity: 'Легендарная', emoji: '✨', power: 38, hp: 88, speed: 31, role: 'Звезда', element: 'Свет', ability: 'Звёздное вдохновение увеличивает награду за победу.' },
];

export const packs = [
  { id: 'mini', title: 'Малый бокс', price: 60, cards: 1, description: 'Быстрый шанс усилить стаю.' },
  { id: 'standard', title: 'Боевой пак', price: 150, cards: 3, description: 'Оптимальный набор для арены.' },
  { id: 'champion', title: 'Чемпионский ящик', price: 340, cards: 7, description: 'Больше карт и высокий шанс редкостей.' },
];

export const botTeams = [
  { name: 'Тренер Макс', icon: '🧢', reward: 55, dogs: [1, 2, 3], trait: 'учебный бой', minWins: 0, level: 2, tactic: 'balance' },
  { name: 'Стая Севера', icon: '❄️', reward: 95, dogs: [4, 5, 2], trait: 'быстрые ледяные рывки', minWins: 1, level: 3, tactic: 'speed' },
  { name: 'Лига Альфа', icon: '👑', reward: 145, dogs: [6, 7, 8], trait: 'чемпионские легенды', minWins: 3, level: 4, tactic: 'burst' },
];

export const questDefinitions = [
  { id: 'first-win', title: 'Первая победа', target: 1, reward: 80, label: 'Победи любого бота', metric: 'wins' },
  { id: 'pack-hunter', title: 'Охотник за паками', target: 2, reward: 120, label: 'Открой 2 бокса или пака', metric: 'packsOpened' },
  { id: 'trainer', title: 'Наставник стаи', target: 3, reward: 150, label: 'Сделай 3 прокачки собак', metric: 'upgrades' },
  { id: 'collector', title: 'Коллекционер', target: 6, reward: 200, label: 'Открой 6 разных собак', metric: 'ownedDogs' },
  { id: 'streak', title: 'Горячая серия', target: 3, reward: 250, label: 'Собери серию из 3 побед', metric: 'bestStreak' },
];

export const achievementDefinitions = [
  { id: 'first-legendary', title: 'Легенда в будке', reward: 120, type: 'legendary' },
  { id: 'alpha-slayer', title: 'Победитель Альфы', reward: 180, type: 'defeatedBot', value: 'Лига Альфа' },
  { id: 'full-kennel', title: 'Полный питомник', reward: 300, type: 'ownedCount', value: baseDogs.length },
  { id: 'power-pack', title: 'Сила 300+', reward: 200, type: 'teamPower', value: 300 },
];

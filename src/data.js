export const SAVE_KEY = 'paw-arena-save-v2';

export const rarityOrder = ['Обычная', 'Редкая', 'Эпическая', 'Легендарная'];

export const rarityMeta = {
  Обычная: { className: 'common', packChance: 52, price: 30 },
  Редкая: { className: 'rare', packChance: 30, price: 65 },
  Эпическая: { className: 'epic', packChance: 14, price: 130 },
  Легендарная: { className: 'legendary', packChance: 4, price: 240 },
};

export const baseDogs = [
  { id: 1, name: 'Барон', breed: 'Овчарка', rarity: 'Обычная', emoji: '🐕‍🦺', power: 16, hp: 68, speed: 13, role: 'Страж', element: 'Броня', style: 'Фронтовой защитник', ability: 'Закрывает союзников и даёт +5% к защите стаи.', lore: 'Первым врывается на арену и держит линию, пока остальные готовят комбо.' },
  { id: 2, name: 'Молли', breed: 'Корги', rarity: 'Обычная', emoji: '🐶', power: 14, hp: 58, speed: 18, role: 'Скаут', element: 'Ловкость', style: 'Быстрый разведчик', ability: 'Находит слабое место врага и ускоряет первый раунд.', lore: 'Прыгает между лапами соперников и ставит метки для точных ударов.' },
  { id: 3, name: 'Рокки', breed: 'Боксер', rarity: 'Редкая', emoji: '🐕', power: 22, hp: 74, speed: 15, role: 'Боец', element: 'Сила', style: 'Контратакующий панчер', ability: 'Наносит тяжёлый удар, если команда уступает по силе.', lore: 'Чем тяжелее бой, тем громче его рывок и сильнее камбэк.' },
  { id: 4, name: 'Луна', breed: 'Хаски', rarity: 'Редкая', emoji: '🐺', power: 20, hp: 65, speed: 24, role: 'Рывок', element: 'Лёд', style: 'Ледяной дуэлянт', ability: 'Замедляет бота и повышает шанс критического рывка.', lore: 'Оставляет морозный след и ломает инициативу вражеской стаи.' },
  { id: 5, name: 'Акира', breed: 'Акита', rarity: 'Эпическая', emoji: '🦊', power: 30, hp: 84, speed: 21, role: 'Самурай', element: 'Фокус', style: 'Мастер комбо', ability: 'Комбо-клинок усиливает следующий удар союзника.', lore: 'Считывает темп боя и заряжает союзников точными командами.' },
  { id: 6, name: 'Гром', breed: 'Доберман', rarity: 'Эпическая', emoji: '⚡', power: 33, hp: 78, speed: 25, role: 'Штурм', element: 'Молния', style: 'Первый удар', ability: 'Молниеносный старт добавляет бонус к атаке.', lore: 'Любит заканчивать обмен ударами ещё до того, как соперник моргнул.' },
  { id: 7, name: 'Орион', breed: 'Тибетский мастиф', rarity: 'Легендарная', emoji: '🦁', power: 42, hp: 105, speed: 17, role: 'Титан', element: 'Гора', style: 'Непробиваемый якорь', ability: 'Титаническая стойкость снижает урон в решающем раунде.', lore: 'Стоит как скала и превращает последние HP в шанс на победу.' },
  { id: 8, name: 'Нова', breed: 'Самоед', rarity: 'Легендарная', emoji: '✨', power: 38, hp: 88, speed: 31, role: 'Звезда', element: 'Свет', style: 'Сияющий саппорт', ability: 'Звёздное вдохновение увеличивает награду за победу.', lore: 'Поднимает мораль стаи сиянием и возвращает союзников в бой.' },
];

export const packs = [
  { id: 'mini', title: 'Малый бокс', price: 60, cards: 1, description: 'Быстрый шанс усилить стаю.' },
  { id: 'standard', title: 'Боевой пак', price: 150, cards: 3, description: 'Оптимальный набор для арены.' },
  { id: 'champion', title: 'Чемпионский ящик', price: 340, cards: 7, description: 'Больше карт и высокий шанс редкостей.' },
];

export const botTeams = [
  { name: 'Тренер Макс', icon: '🧢', reward: 55, dogs: [1, 2, 3], trait: 'учебный бой', minWins: 0, level: 2, tactic: 'balance', arena: { name: 'Учебный двор', mood: 'безопасная разминка', description: 'Дружеская площадка даёт твоей стае небольшой стартовый щит.', playerShield: 6 } },
  { name: 'Стая Севера', icon: '❄️', reward: 95, dogs: [4, 5, 2], trait: 'быстрые ледяные рывки', minWins: 1, level: 3, tactic: 'speed', arena: { name: 'Снежная буря', mood: 'скользкий лёд', description: 'Не-ледяные бойцы начинают с замедлением, а Луна чувствует себя увереннее.', slowNonIce: true, icePower: 3 } },
  { name: 'Лига Альфа', icon: '👑', reward: 145, dogs: [6, 7, 8], trait: 'чемпионские легенды', minWins: 3, level: 4, tactic: 'burst', arena: { name: 'Королевский ринг', mood: 'давление трибун', description: 'Альфа начинает с фокусом, зато победа здесь даёт дополнительный престиж.', enemyFocus: 1, bonusReward: 25 } },
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

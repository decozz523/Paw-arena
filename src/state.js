import { baseDogs, SAVE_KEY } from './data.js';

export function createCollection() {
  return baseDogs.map((dog) => ({ ...dog, level: dog.id <= 3 ? 1 : 0, copies: dog.id <= 3 ? 1 : 0 }));
}

export function createDefaultState() {
  return {
    scene: 'collection',
    points: 220,
    collection: createCollection(),
    selectedBotIndex: 0,
    log: ['Добро пожаловать в Paw Arena! Теперь у стаи есть способности, миссии, серии побед и автосохранение.'],
    lastPack: [],
    battleReport: ['Выбери соперника и начни бой, чтобы увидеть пошаговую схватку с HP, критами и способностями.'],
    battleSummary: null,
    stats: { wins: 0, losses: 0, streak: 0, bestStreak: 0, packsOpened: 0, upgrades: 0, defeatedBots: [] },
    claimedQuests: [],
    claimedAchievements: [],
  };
}

export function loadState() {
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

export function saveState(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Не удалось сохранить прогресс Paw Arena.', error);
  }
}

export function resetSavedState() {
  localStorage.removeItem(SAVE_KEY);
}

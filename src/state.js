import { baseDogs, SAVE_KEY } from './data.js';

export function createCollection() {
  return baseDogs.map((dog) => ({ ...dog, level: dog.id <= 3 ? 1 : 0, copies: dog.id <= 3 ? 1 : 0 }));
}

export function createDefaultState() {
  return {
    scene: 'collection',
    points: 260,
    collection: createCollection(),
    selectedBotIndex: 0,
    playerTeamIds: [1, 2, 3],
    manualBattle: null,
    log: ['Добро пожаловать в Paw Arena 2.0! Ручные ходы, цели, суперспособности и pity-дропы уже активны.'],
    lastPack: [],
    packPity: 0,
    battleReport: ['Выбери соперника, собери тройку, затем выбирай собаку и цель: способности раскроются уже в бою.'],
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

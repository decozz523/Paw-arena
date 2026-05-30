import { achievementDefinitions, baseDogs, botTeams, packs, rarityMeta, rarityOrder } from './data.js';

export function dogScore(dog) {
  return dog.level ? dog.power + dog.hp * 0.34 + dog.speed * 0.8 + dog.level * 9 : 0;
}

export function ownedDogs(state) {
  return state.collection.filter((dog) => dog.level > 0);
}

export function teamLineup(state) {
  return [...ownedDogs(state)].sort((a, b) => dogScore(b) - dogScore(a)).slice(0, 3);
}

export function synergyInfo(lineup) {
  const bonuses = [];
  if (lineup.length < 3) return { multiplier: 1, bonuses: ['Нужно 3 собаки для командного бонуса'] };
  if (new Set(lineup.map((dog) => dog.element)).size === 3) bonuses.push({ label: 'Разные стихии', value: 0.08 });
  if (new Set(lineup.map((dog) => dog.rarity)).size === 1) bonuses.push({ label: 'Одна редкость', value: 0.07 });
  if (lineup.some((dog) => dog.rarity === 'Легендарная')) bonuses.push({ label: 'Легендарный лидер', value: 0.05 });
  if (lineup.some((dog) => dog.role === 'Страж') && lineup.some((dog) => dog.role === 'Штурм')) bonuses.push({ label: 'Страж + Штурм', value: 0.06 });
  const multiplier = 1 + bonuses.reduce((sum, bonus) => sum + bonus.value, 0);
  return { multiplier, bonuses: bonuses.map((bonus) => `${bonus.label} +${Math.round(bonus.value * 100)}%`) };
}

export function teamPower(state) {
  const lineup = teamLineup(state);
  return lineup.reduce((sum, dog) => sum + dogScore(dog), 0) * synergyInfo(lineup).multiplier;
}

export function selectedBot(state) {
  return botTeams[state.selectedBotIndex];
}

export function isBotLocked(state, bot) {
  return state.stats.wins < bot.minWins;
}

export function botLineup(bot) {
  return bot.dogs.map((id) => ({ ...baseDogs.find((dog) => dog.id === id), level: bot.level, copies: 1 }));
}

export function botPower(state) {
  const bot = selectedBot(state);
  const tacticBonus = bot.tactic === 'burst' ? 1.08 : bot.tactic === 'speed' ? 1.04 : 1;
  return botLineup(bot).reduce((sum, dog) => sum + dogScore(dog), 0) * tacticBonus;
}

export function addLog(state, message) {
  state.log = [message, ...state.log].slice(0, 6);
}

export function rollDog(packId) {
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

export function upgradeDog(state, id) {
  const dog = state.collection.find((item) => item.id === id);
  if (!dog || dog.level === 0) return false;
  const cost = dog.level * rarityMeta[dog.rarity].price;
  if (state.points < cost) {
    addLog(state, `Не хватает победных очков для прокачки ${dog.name}.`);
    return false;
  }
  state.points -= cost;
  dog.level += 1;
  dog.power += 4;
  dog.hp += 8;
  dog.speed += 2;
  state.stats.upgrades += 1;
  addLog(state, `${dog.name} повышен до уровня ${dog.level}! Способность стала сильнее.`);
  checkAchievements(state);
  return true;
}

export function buyPack(state, packId) {
  const pack = packs.find((item) => item.id === packId);
  if (!pack) return false;
  if (state.points < pack.price) {
    addLog(state, `Для покупки «${pack.title}» нужно ещё ${pack.price - state.points} очков.`);
    return false;
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
  addLog(state, `Открыт ${pack.title}: ${drops.map((dog) => `${dog.emoji} ${dog.name}`).join(', ')}.`);
  checkAchievements(state);
  return true;
}

function makeFighter(dog, side) {
  const level = dog.level || 1;
  return {
    ...dog,
    side,
    maxHp: Math.round(dog.hp + level * 10),
    currentHp: Math.round(dog.hp + level * 10),
    shield: 0,
    focus: 0,
    slowed: 0,
    marked: 0,
    alive: true,
  };
}

function alive(team) {
  return team.filter((fighter) => fighter.alive && fighter.currentHp > 0);
}

function pickTarget(attacker, enemies) {
  const candidates = alive(enemies);
  const marked = candidates.find((enemy) => enemy.marked > 0);
  if (marked) return marked;
  if (attacker.role === 'Штурм') return candidates.sort((a, b) => a.currentHp - b.currentHp)[0];
  if (attacker.role === 'Страж') return candidates.sort((a, b) => b.power - a.power)[0];
  return candidates[0];
}

function applyOpeningAbilities(playerTeam, enemyTeam, report) {
  const playerGuard = playerTeam.find((fighter) => fighter.role === 'Страж');
  if (playerGuard) {
    playerTeam.forEach((fighter) => { fighter.shield += 8 + playerGuard.level * 2; });
    report.push(`🛡️ ${playerGuard.name} поднимает щит стаи: каждый союзник получает защиту.`);
  }

  const scout = playerTeam.find((fighter) => fighter.role === 'Скаут');
  if (scout) {
    const target = enemyTeam.sort((a, b) => b.power - a.power)[0];
    target.marked = 2;
    report.push(`🎯 ${scout.name} помечает ${target.name}: первые атаки по цели сильнее.`);
  }

  const luna = playerTeam.find((fighter) => fighter.role === 'Рывок');
  if (luna) {
    enemyTeam.forEach((fighter) => { fighter.slowed = 2; });
    report.push(`❄️ ${luna.name} замедляет вражескую стаю на первые два раунда.`);
  }
}

function fighterInitiative(fighter, round) {
  const slowPenalty = fighter.slowed > 0 ? 8 : 0;
  const openingBonus = fighter.role === 'Штурм' && round === 1 ? 10 : 0;
  return fighter.speed + openingBonus - slowPenalty + Math.random() * 8;
}

function attack(attacker, defenders, allies, round) {
  const target = pickTarget(attacker, defenders);
  if (!target) return `${attacker.emoji} ${attacker.name} не находит цель.`;

  let multiplier = 0.78 + Math.random() * 0.34;
  const tags = [];
  if (attacker.role === 'Штурм' && round === 1) {
    multiplier += 0.22;
    tags.push('молниеносный старт');
  }
  if (attacker.role === 'Боец' && attacker.currentHp < attacker.maxHp * 0.45) {
    multiplier += 0.24;
    tags.push('камбэк');
  }
  if (attacker.focus > 0) {
    multiplier += 0.18;
    attacker.focus -= 1;
    tags.push('фокус Акиры');
  }
  if (target.marked > 0) {
    multiplier += 0.16;
    target.marked -= 1;
    tags.push('метка скаута');
  }
  const critical = Math.random() < Math.min(0.3, 0.06 + attacker.speed / 180);
  if (critical) {
    multiplier += 0.35;
    tags.push('крит');
  }
  if (target.role === 'Титан' && target.currentHp < target.maxHp * 0.35) {
    multiplier -= 0.18;
    tags.push('стойкость титана');
  }

  const shieldBlock = Math.min(target.shield, Math.round(attacker.power * 0.32));
  target.shield -= shieldBlock;
  const damage = Math.max(4, Math.round((attacker.power + attacker.level * 4) * multiplier - shieldBlock));
  target.currentHp = Math.max(0, target.currentHp - damage);
  if (target.currentHp === 0) target.alive = false;

  const akira = allies.find((fighter) => fighter.alive && fighter.role === 'Самурай' && fighter.id !== attacker.id);
  if (akira && Math.random() < 0.34) {
    attacker.focus += 1;
    tags.push('комбо-клинок заряжен');
  }

  const nova = allies.find((fighter) => fighter.alive && fighter.role === 'Звезда');
  if (nova && Math.random() < 0.22) {
    const wounded = alive(allies).sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0];
    const heal = Math.round(8 + nova.level * 3);
    wounded.currentHp = Math.min(wounded.maxHp, wounded.currentHp + heal);
    tags.push(`${nova.name} лечит ${wounded.name} на ${heal}`);
  }

  return `${attacker.emoji} ${attacker.name} бьёт ${target.emoji} ${target.name} на ${damage} HP${shieldBlock ? ` (щит -${shieldBlock})` : ''}. ${target.name}: ${target.currentHp}/${target.maxHp} HP${tags.length ? ` · ${tags.join(', ')}` : ''}.`;
}

function tickStatuses(team) {
  team.forEach((fighter) => {
    if (fighter.slowed > 0) fighter.slowed -= 1;
    if (fighter.marked > 0) fighter.marked -= 1;
  });
}

function teamHp(team) {
  return team.reduce((sum, fighter) => sum + Math.max(0, fighter.currentHp), 0);
}

function resolveBattle(state) {
  const playerTeam = teamLineup(state).map((dog) => makeFighter(dog, 'player'));
  const enemyTeam = botLineup(selectedBot(state)).map((dog) => makeFighter(dog, 'bot'));
  const report = [];
  const combo = synergyInfo(playerTeam);
  playerTeam.forEach((fighter) => {
    fighter.power = Math.round(fighter.power * combo.multiplier);
  });
  report.push(`🧬 Комбо стаи: ${combo.bonuses.join(' · ')}. Атака команды усилена до x${combo.multiplier.toFixed(2)}.`);
  applyOpeningAbilities(playerTeam, enemyTeam, report);

  for (let round = 1; round <= 5; round += 1) {
    if (!alive(playerTeam).length || !alive(enemyTeam).length) break;
    report.push(`— Раунд ${round} —`);
    const order = [...alive(playerTeam), ...alive(enemyTeam)].sort((a, b) => fighterInitiative(b, round) - fighterInitiative(a, round));
    order.forEach((fighter) => {
      if (!fighter.alive || !alive(playerTeam).length || !alive(enemyTeam).length) return;
      const defenders = fighter.side === 'player' ? enemyTeam : playerTeam;
      const allies = fighter.side === 'player' ? playerTeam : enemyTeam;
      report.push(attack(fighter, defenders, allies, round));
    });
    tickStatuses([...playerTeam, ...enemyTeam]);
  }

  const playerHp = teamHp(playerTeam);
  const enemyHp = teamHp(enemyTeam);
  const won = enemyHp === 0 || (playerHp > 0 && playerHp >= enemyHp);
  report.push(`${won ? '🏆' : '💥'} Итог: твоя стая ${playerHp} HP, бот ${enemyHp} HP.`);
  return { won, report, playerHp, enemyHp, playerTeam, enemyTeam };
}

export function fight(state) {
  if (ownedDogs(state).length < 3) {
    addLog(state, 'Для боя нужно минимум 3 открытые собаки.');
    return false;
  }
  const bot = selectedBot(state);
  if (isBotLocked(state, bot)) {
    addLog(state, `${bot.name} откроется после ${bot.minWins} побед.`);
    return false;
  }

  const result = resolveBattle(state);
  state.battleReport = result.report;
  state.battleSummary = { won: result.won, playerHp: result.playerHp, enemyHp: result.enemyHp };

  if (result.won) {
    const lineup = teamLineup(state);
    const novaBonus = lineup.some((dog) => dog.id === 8) ? 25 : 0;
    const cleanWinBonus = result.playerHp > result.enemyHp + 90 ? 20 : 0;
    const streakBonus = Math.min(state.stats.streak + 1, 5) * 10;
    const reward = bot.reward + novaBonus + streakBonus + cleanWinBonus;
    state.points += reward;
    state.stats.wins += 1;
    state.stats.streak += 1;
    state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    if (!state.stats.defeatedBots.includes(bot.name)) state.stats.defeatedBots.push(bot.name);
    addLog(state, `Победа над ${bot.name}! +${reward} очков (${streakBonus} серия${novaBonus ? ', 25 Нова' : ''}${cleanWinBonus ? ', 20 чистая победа' : ''}).`);
  } else {
    const consolation = Math.round(bot.reward * 0.25);
    state.points += consolation;
    state.stats.losses += 1;
    state.stats.streak = 0;
    addLog(state, `${bot.name} победил по HP. Утешительный бонус +${consolation} очков.`);
  }

  unlockNextBot(state);
  checkAchievements(state);
  return true;
}

export function unlockNextBot(state) {
  const lockedBot = botTeams.find((bot) => isBotLocked(state, bot));
  if (lockedBot && state.stats.wins >= lockedBot.minWins) addLog(state, `Открыт новый соперник: ${lockedBot.name}!`);
}

export function achievementUnlocked(state, achievement) {
  if (achievement.type === 'legendary') return ownedDogs(state).some((dog) => dog.rarity === 'Легендарная');
  if (achievement.type === 'defeatedBot') return state.stats.defeatedBots.includes(achievement.value);
  if (achievement.type === 'ownedCount') return ownedDogs(state).length >= achievement.value;
  if (achievement.type === 'teamPower') return teamPower(state) >= achievement.value;
  return false;
}

export function checkAchievements(state) {
  achievementDefinitions.forEach((achievement) => {
    if (!state.claimedAchievements.includes(achievement.id) && achievementUnlocked(state, achievement)) {
      state.claimedAchievements.push(achievement.id);
      state.points += achievement.reward;
      addLog(state, `Достижение «${achievement.title}»! +${achievement.reward} очков.`);
    }
  });
}

export function questProgress(state, quest) {
  if (quest.metric === 'ownedDogs') return ownedDogs(state).length;
  return state.stats[quest.metric] || 0;
}

export function claimQuest(state, id, questDefinitions) {
  const quest = questDefinitions.find((item) => item.id === id);
  if (!quest || state.claimedQuests.includes(id) || questProgress(state, quest) < quest.target) return false;
  state.claimedQuests.push(id);
  state.points += quest.reward;
  addLog(state, `Миссия «${quest.title}» выполнена! +${quest.reward} очков.`);
  return true;
}

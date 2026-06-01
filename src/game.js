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

export function selectedTeamDogs(state) {
  const ids = state.playerTeamIds || [];
  const picked = ids.map((id) => state.collection.find((dog) => dog.id === id && dog.level > 0)).filter(Boolean);
  if (picked.length >= 3) return picked.slice(0, 3);
  const fallback = teamLineup(state).filter((dog) => !picked.some((pickedDog) => pickedDog.id === dog.id));
  return [...picked, ...fallback].slice(0, 3);
}

export function toggleTeamDog(state, id) {
  const dog = state.collection.find((item) => item.id === id && item.level > 0);
  if (!dog) {
    addLog(state, 'Сначала открой эту собаку в паке.');
    return false;
  }
  const current = state.playerTeamIds || [];
  if (current.includes(id)) {
    if (current.length <= 3) {
      addLog(state, 'В боевой тройке должно остаться 3 собаки. Сначала добавь замену.');
      return false;
    }
    state.playerTeamIds = current.filter((dogId) => dogId !== id);
    return true;
  }
  state.playerTeamIds = [...current, id].slice(-3);
  addLog(state, `${dog.name} поставлен в боевую тройку.`);
  return true;
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
  const lineup = selectedTeamDogs(state);
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

export function arenaEffect(bot) {
  return bot.arena || {
    name: 'Нейтральная арена',
    mood: 'ровные условия',
    description: 'Без дополнительных модификаторов.',
  };
}

function applyArenaEffect(bot, playerTeam, enemyTeam, report) {
  const arena = arenaEffect(bot);
  report.push(`🏟️ Арена «${arena.name}»: ${arena.description}`);

  if (arena.playerShield) {
    playerTeam.forEach((fighter) => { fighter.shield += arena.playerShield; });
    report.push(`🧱 Декорации арены дают твоей стае стартовый щит ${arena.playerShield}.`);
  }

  if (arena.slowNonIce) {
    [...playerTeam, ...enemyTeam].forEach((fighter) => {
      if (fighter.element === 'Лёд') {
        fighter.power += arena.icePower || 0;
      } else {
        fighter.slowed = Math.max(fighter.slowed, 1);
      }
    });
    report.push('🌨️ Снежная буря замедляет всех без стихии Лёд, а ледяные бойцы получают бонус к атаке.');
  }

  if (arena.enemyFocus) {
    enemyTeam.forEach((fighter) => { fighter.focus += arena.enemyFocus; });
    report.push(`👑 Трибуны заряжают бота: враги получают фокус x${arena.enemyFocus}.`);
  }

  if (arena.superSurge) report.push('🌑 Лунный купол усиливает супер-ходы каждый второй раунд.');
  if (arena.shieldDrain) report.push(`🧪 Щиты нестабильны: в конце обменов они тают на ${arena.shieldDrain}.`);
}


export function addLog(state, message) {
  state.log = [message, ...state.log].slice(0, 6);
}

function rarityChance(packId, state) {
  const boost = packId === 'champion' ? 8 : packId === 'standard' ? 4 : 0;
  const pity = state?.packPity || 0;
  return rarityOrder.map((rarity) => {
    const rareBoost = rarity === 'Эпическая' ? Math.min(10, pity * 1.2) : rarity === 'Легендарная' ? Math.min(9, pity * 0.55) : 0;
    const penalty = rarity === 'Обычная' ? boost + rareBoost * 0.9 : rarity === 'Редкая' ? boost * 0.2 : 0;
    return { rarity, chance: Math.max(3, rarityMeta[rarity].packChance + (rarity === 'Эпическая' || rarity === 'Легендарная' ? boost + rareBoost : -penalty)) };
  });
}

export function rollDog(packId, state = null) {
  const table = rarityChance(packId, state);
  const total = table.reduce((sum, item) => sum + item.chance, 0);
  const roll = Math.random() * total;
  let cursor = 0;
  for (const item of table) {
    cursor += item.chance;
    if (roll <= cursor) {
      const pool = baseDogs.filter((dog) => dog.rarity === item.rarity);
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
  const drops = Array.from({ length: pack.cards }, () => rollDog(pack.id, state));
  state.points -= pack.price;
  state.lastPack = drops;
  state.stats.packsOpened += 1;
  const bestDropIndex = Math.max(...drops.map((drop) => rarityOrder.indexOf(drop.rarity)));
  state.packPity = bestDropIndex >= rarityOrder.indexOf('Эпическая') ? 0 : (state.packPity || 0) + 1 + (pack.pity || 0);
  drops.forEach((drop) => {
    const dog = state.collection.find((item) => item.id === drop.id);
    dog.level = dog.level || 1;
    dog.copies += 1;
  });
  addLog(state, `Открыт ${pack.title}: ${drops.map((dog) => `${dog.emoji} ${dog.name}`).join(', ')}. Pity: ${state.packPity}.`);
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
    stunned: 0,
    burn: 0,
    trap: 0,
    taunt: 0,
    evade: 0,
    silenced: 0,
    vulnerable: 0,
    speedBoost: 0,
    alive: true,
  };
}

function alive(team) {
  return team.filter((fighter) => fighter.alive && fighter.currentHp > 0);
}

function nextReadyFighterId(battle) {
  const ready = battle.playerTeam.find((fighter) => fighter.alive && !battle.actedIds.includes(fighter.id));
  return ready?.id || alive(battle.playerTeam)[0]?.id || null;
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
  return fighter.speed + fighter.speedBoost * 5 + openingBonus - slowPenalty + Math.random() * 8;
}

function attack(attacker, defenders, allies, round, forcedTarget = null, powerModifier = 1) {
  const target = forcedTarget && forcedTarget.alive ? forcedTarget : pickTarget(attacker, defenders);
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
  if (target.vulnerable > 0) {
    multiplier += 0.18;
    tags.push('уязвимость');
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

  if (target.evade > 0 && Math.random() < 0.35) {
    target.evade -= 1;
    return `${target.emoji} ${target.name} уходит от атаки ${attacker.name}: уклонение сработало.`;
  }
  const shieldBlock = Math.min(target.shield, Math.round(attacker.power * 0.32 * powerModifier));
  target.shield -= shieldBlock;
  const damage = Math.max(4, Math.round((attacker.power + attacker.level * 4) * multiplier * powerModifier - shieldBlock));
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

function tickStatuses(team, shieldDrain = 0) {
  team.forEach((fighter) => {
    if (fighter.slowed > 0) fighter.slowed -= 1;
    if (fighter.marked > 0) fighter.marked -= 1;
    if (fighter.taunt > 0) fighter.taunt -= 1;
    if (fighter.evade > 0) fighter.evade -= 1;
    if (fighter.silenced > 0) fighter.silenced -= 1;
    if (fighter.vulnerable > 0) fighter.vulnerable -= 1;
    if (fighter.speedBoost > 0) fighter.speedBoost -= 1;
    if (shieldDrain > 0 && fighter.shield > 0) fighter.shield = Math.max(0, fighter.shield - shieldDrain);
    if (fighter.burn > 0 && fighter.alive) {
      fighter.currentHp = Math.max(0, fighter.currentHp - (5 + fighter.level * 2));
      fighter.burn -= 1;
      if (fighter.currentHp === 0) fighter.alive = false;
    }
  });
}

function teamHp(team) {
  return team.reduce((sum, fighter) => sum + Math.max(0, fighter.currentHp), 0);
}

function resolveBattle(state) {
  const playerTeam = selectedTeamDogs(state).map((dog) => makeFighter(dog, 'player'));
  const enemyTeam = botLineup(selectedBot(state)).map((dog) => makeFighter(dog, 'bot'));
  const report = [];
  const combo = synergyInfo(playerTeam);
  playerTeam.forEach((fighter) => {
    fighter.power = Math.round(fighter.power * combo.multiplier);
  });
  report.push(`🧬 Комбо стаи: ${combo.bonuses.join(' · ')}. Атака команды усилена до x${combo.multiplier.toFixed(2)}.`);
  applyArenaEffect(selectedBot(state), playerTeam, enemyTeam, report);
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
    tickStatuses([...playerTeam, ...enemyTeam], arenaEffect(selectedBot(state)).shieldDrain || 0);
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
    const lineup = selectedTeamDogs(state);
    const novaBonus = lineup.some((dog) => dog.id === 8) ? 25 : 0;
    const cleanWinBonus = result.playerHp > result.enemyHp + 90 ? 20 : 0;
    const streakBonus = Math.min(state.stats.streak + 1, 5) * 10;
    const arenaBonus = arenaEffect(bot).bonusReward || 0;
    const reward = bot.reward + novaBonus + streakBonus + cleanWinBonus + arenaBonus;
    state.points += reward;
    state.stats.wins += 1;
    state.stats.streak += 1;
    state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    if (!state.stats.defeatedBots.includes(bot.name)) state.stats.defeatedBots.push(bot.name);
    addLog(state, `Победа над ${bot.name}! +${reward} очков (${streakBonus} серия${novaBonus ? ', 25 Нова' : ''}${cleanWinBonus ? ', 20 чистая победа' : ''}${arenaBonus ? `, ${arenaBonus} арена` : ''}).`);
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

export function startManualBattle(state) {
  const bot = selectedBot(state);
  if (ownedDogs(state).length < 3) {
    addLog(state, 'Для ручного боя нужно минимум 3 открытые собаки.');
    return false;
  }
  if (isBotLocked(state, bot)) {
    addLog(state, `${bot.name} откроется после ${bot.minWins} побед.`);
    return false;
  }
  const playerTeam = selectedTeamDogs(state).map((dog) => makeFighter(dog, 'player'));
  const enemyTeam = botLineup(bot).map((dog) => makeFighter(dog, 'bot'));
  const report = [];
  const combo = synergyInfo(playerTeam);
  playerTeam.forEach((fighter) => {
    fighter.power = Math.round(fighter.power * combo.multiplier);
  });
  report.push(`🧬 Комбо стаи: ${combo.bonuses.join(' · ')}. Выбери собаку и действие.`);
  applyArenaEffect(bot, playerTeam, enemyTeam, report);
  applyOpeningAbilities(playerTeam, enemyTeam, report);
  state.manualBattle = {
    active: true,
    round: 1,
    turn: 'player',
    playerTeam,
    enemyTeam,
    actedIds: [],
    usedSupers: [],
    botUsedSupers: [],
    selectedFighterId: playerTeam[0]?.id || null,
    selectedTargetId: enemyTeam[0]?.id || null,
    superSurge: Boolean(bot.arena?.superSurge),
    report,
    result: null,
  };
  state.battleReport = report;
  state.battleSummary = null;
  addLog(state, `Ручной бой против ${bot.name} начался. Выбирай действия собак.`);
  return true;
}

function fighterById(team, id) {
  return team.find((fighter) => fighter.id === id);
}

function preferredTarget(attacker, defenders, requestedTarget = null) {
  const taunting = alive(defenders).find((fighter) => fighter.taunt > 0);
  if (taunting) return taunting;
  return requestedTarget && requestedTarget.alive ? requestedTarget : pickTarget(attacker, defenders);
}

function hurt(target, amount) {
  target.currentHp = Math.max(0, target.currentHp - amount);
  if (target.currentHp === 0) target.alive = false;
}

function lowestAlly(allies) {
  return alive(allies).sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0];
}

function performManualMove(attacker, defenders, allies, battle, action, requestedTarget = null) {
  const target = preferredTarget(attacker, defenders, requestedTarget);
  const tags = [];
  if (!target && action !== 'guard') return `${attacker.name} не находит цель.`;

  if (attacker.trap > 0) {
    const trapDamage = 6 + attacker.level * 2;
    hurt(attacker, trapDamage);
    attacker.trap -= 1;
    tags.push(`капкан -${trapDamage} HP`);
  }

  if (action === 'guard') {
    const shield = Math.round(12 + attacker.level * 5 + attacker.hp * 0.08);
    if (attacker.role === 'Страж' || attacker.role === 'Бастион' || attacker.role === 'Звезда' || attacker.role === 'Алхимик' || attacker.role === 'Тактик') {
      alive(allies).forEach((ally) => { ally.shield += Math.round(shield * 0.72); });
      tags.push('щит стае');
    } else {
      attacker.shield += shield;
      attacker.evade += attacker.role === 'Ассасин' || attacker.role === 'Рывок' || attacker.role === 'Тень' ? 1 : 0;
      tags.push('личная защита');
    }
    if (attacker.role === 'Самурай' || attacker.role === 'Штурм' || attacker.role === 'Ассасин') attacker.focus += 1;
    if (attacker.role === 'Звезда' || attacker.role === 'Пиромант') {
      const ally = lowestAlly(allies);
      if (ally) ally.currentHp = Math.min(ally.maxHp, ally.currentHp + 10 + attacker.level * 3);
      tags.push('поддержка');
    }
    return `${attacker.emoji} ${attacker.name} выбирает защиту: ${tags.join(', ')}. Щит ${attacker.shield}.`;
  }

  if (action === 'tail') {
    let entry = attack(attacker, defenders, allies, battle.round, target, 0.72);
    target.marked = Math.max(target.marked, 2);
    if (attacker.role === 'Скаут' || attacker.role === 'Тактик' || attacker.role === 'Рывок') target.slowed = Math.max(target.slowed, 2);
    if (attacker.role === 'Капкан') target.trap = Math.max(target.trap, 2);
    if (attacker.role === 'Трикстер') {
      attacker.focus += Math.min(1, target.focus);
      target.focus = Math.max(0, target.focus - 1);
    }
    if (attacker.role === 'Пиромант') target.burn = Math.max(target.burn, 2);
    if (attacker.role === 'Тень') target.silenced = Math.max(target.silenced, 2);
    if (attacker.role === 'Бастион' || attacker.role === 'Страж') target.taunt = Math.max(target.taunt, 1);
    if (attacker.role === 'Ассасин') attacker.evade += 1;
    return `${entry} 🌀 Хвостовой эффект: ${target.name} получает контроль.`;
  }

  if (action === 'super') {
    if (attacker.silenced > 0) return `${attacker.name} пытается применить супер, но теневая блокировка гасит способность.`;
    const bonus = battle.round % 2 === 0 && battle.superSurge ? 1.15 : 1;
    if (attacker.role === 'Звезда' || attacker.role === 'Алхимик') {
      const heal = Math.round((24 + attacker.level * 6) * bonus);
      alive(allies).forEach((ally) => { ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal); ally.focus += 1; });
      return `✨ Супер ${attacker.name}: вся стая лечится на ${heal} HP и получает фокус.`;
    }
    if (attacker.role === 'Страж' || attacker.role === 'Бастион') {
      const shield = Math.round((22 + attacker.level * 6) * bonus);
      alive(allies).forEach((ally) => { ally.shield += shield; });
      target.taunt = Math.max(target.taunt, 2);
      return `🛡️ Супер ${attacker.name}: щит стае ${shield}, ${target.name} вынужден отвечать.`;
    }
    if (attacker.role === 'Самурай' || attacker.role === 'Тактик') {
      alive(allies).forEach((ally) => { ally.focus += 1; ally.speedBoost += 1; });
      return `🧠 Супер ${attacker.name}: вся стая получает фокус и темп.`;
    }
    if (attacker.role === 'Рывок' || attacker.role === 'Титан') {
      alive(defenders).forEach((enemy) => { enemy.slowed = Math.max(enemy.slowed, 2); enemy.vulnerable = Math.max(enemy.vulnerable, 1); });
      return `${attack(attacker, defenders, allies, battle.round, target, 1.25 * bonus)} ❄️ Супер-контроль задевает всю стаю.`;
    }
    if (attacker.role === 'Пиромант' || attacker.role === 'Капкан') {
      alive(defenders).forEach((enemy) => { enemy.burn = Math.max(enemy.burn, 2); enemy.trap = Math.max(enemy.trap, 1); });
      return `${attack(attacker, defenders, allies, battle.round, target, 1.35 * bonus)} 🔥 Арена становится опасной для каждого врага.`;
    }
    if (attacker.role === 'Тень' || attacker.role === 'Трикстер') {
      target.stunned = Math.max(target.stunned, 1);
      target.silenced = Math.max(target.silenced, 2);
      target.marked = Math.max(target.marked, 3);
      return `${attack(attacker, defenders, allies, battle.round, target, 1.45 * bonus)} 🌑 Цель теряет супер и следующий темп.`;
    }
    const beforeAlive = target.alive;
    const entry = attack(attacker, defenders, allies, battle.round, target, 1.65 * bonus);
    if (beforeAlive && !target.alive && (attacker.role === 'Ассасин' || attacker.role === 'Штурм')) {
      const next = pickTarget(attacker, defenders);
      if (next) return `${entry} ⚡ Нокаут даёт повтор: ${attack(attacker, defenders, allies, battle.round, next, 0.9)}.`;
    }
    return `💥 Супер ${attacker.name}: ${entry}`;
  }

  const power = attacker.role === 'Боец' && attacker.currentHp < attacker.maxHp * 0.45 ? 1.18 : 1;
  const entry = attack(attacker, defenders, allies, battle.round, target, power);
  attacker.focus += 1;
  return `${entry}${tags.length ? ` (${tags.join(', ')})` : ''}`;
}

function manualSpecial(attacker, defenders, allies, battle) {
  return performManualMove(attacker, defenders, allies, battle, 'super');
}

function applyPlayerAction(state, dogId, action) {
  const battle = state.manualBattle;
  if (!battle?.active || battle.turn !== 'player') return false;
  const attacker = fighterById(battle.playerTeam, dogId);
  if (!attacker || !attacker.alive) return false;
  if (battle.actedIds.includes(dogId)) {
    addLog(state, `${attacker.name} уже ходил в этом раунде.`);
    return false;
  }
  if (!['paw', 'tail', 'guard', 'super', 'basic'].includes(action)) return false;
  const normalizedAction = action === 'basic' ? 'paw' : action;
  if (normalizedAction === 'super' && battle.usedSupers.includes(dogId)) {
    addLog(state, `${attacker.name} уже использовал суперспособность в этом бою.`);
    return false;
  }
  if (attacker.stunned > 0) {
    attacker.stunned = 0;
    battle.actedIds.push(dogId);
    battle.selectedFighterId = null;
    battle.report.push(`⛔ ${attacker.emoji} ${attacker.name} заблокирован способностью соперника и пропускает действие.`);
    if (finishManualBattleIfNeeded(state)) return true;
    const readyForBot = alive(battle.playerTeam).every((fighter) => battle.actedIds.includes(fighter.id));
    if (readyForBot) {
      runBotTurn(state);
    } else {
      battle.selectedFighterId = nextReadyFighterId(battle);
    }
    state.battleReport = battle.report;
    return true;
  }
  const requestedTarget = fighterById(battle.enemyTeam, battle.selectedTargetId);
  const entry = performManualMove(attacker, battle.enemyTeam, battle.playerTeam, battle, normalizedAction, requestedTarget);
  if (normalizedAction === 'super') battle.usedSupers.push(dogId);
  battle.actedIds.push(dogId);
  battle.selectedFighterId = null;
  battle.report.push(entry);
  tickStatuses([...battle.playerTeam, ...battle.enemyTeam], arenaEffect(selectedBot(state)).shieldDrain || 0);
  if (finishManualBattleIfNeeded(state)) return true;
  const readyForBot = alive(battle.playerTeam).every((fighter) => battle.actedIds.includes(fighter.id));
  if (readyForBot) {
    runBotTurn(state);
  } else {
    battle.selectedFighterId = nextReadyFighterId(battle);
  }
  state.battleReport = battle.report;
  return true;
}

function botWantsSuper(bot, fighter, battle) {
  if (battle.botUsedSupers.includes(fighter.id)) return false;
  if (bot.tactic === 'burst' && battle.round <= 2) return true;
  if (bot.tactic === 'speed' && fighter.role === 'Рывок') return true;
  const lowHpAlly = alive(battle.enemyTeam).some((ally) => ally.currentHp < ally.maxHp * 0.45);
  return lowHpAlly && (fighter.role === 'Звезда' || fighter.role === 'Страж');
}

function runBotTurn(state) {
  const battle = state.manualBattle;
  const bot = selectedBot(state);
  battle.turn = 'bot';
  battle.report.push(`— Ответ бота: ${bot.name} —`);
  const order = alive(battle.enemyTeam).sort((a, b) => fighterInitiative(b, battle.round) - fighterInitiative(a, battle.round));
  order.forEach((fighter) => {
    if (!fighter.alive || !alive(battle.playerTeam).length) return;
    if (fighter.stunned > 0) {
      fighter.stunned = 0;
      battle.report.push(`🤖 ${fighter.name} заблокирован меткой и пропускает действие.`);
      return;
    }
    const useSuper = botWantsSuper(bot, fighter, battle);
    const entry = useSuper
      ? manualSpecial(fighter, battle.playerTeam, battle.enemyTeam, battle)
      : performManualMove(fighter, battle.playerTeam, battle.enemyTeam, battle, bot.tactic === 'control' ? 'tail' : 'paw');
    if (useSuper) battle.botUsedSupers.push(fighter.id);
    battle.report.push(`🤖 ${entry}`);
  });
  tickStatuses([...battle.playerTeam, ...battle.enemyTeam], arenaEffect(selectedBot(state)).shieldDrain || 0);
  if (finishManualBattleIfNeeded(state)) return;
  if (battle.round >= 5) {
    finishManualBattleIfNeeded(state, true);
    return;
  }
  battle.round += 1;
  battle.turn = 'player';
  battle.actedIds = [];
  battle.selectedFighterId = nextReadyFighterId(battle);
  battle.report.push(`— Раунд ${battle.round}: твой ход —`);
}

function finishManualBattleIfNeeded(state, forceByHp = false) {
  const battle = state.manualBattle;
  if (!battle?.active) return false;
  const playerHp = teamHp(battle.playerTeam);
  const enemyHp = teamHp(battle.enemyTeam);
  const mustFinish = forceByHp || !alive(battle.playerTeam).length || !alive(battle.enemyTeam).length;
  if (!mustFinish) return false;
  const won = enemyHp === 0 || (playerHp > 0 && playerHp >= enemyHp);
  battle.active = false;
  battle.turn = 'done';
  battle.selectedFighterId = null;
  battle.result = { won, playerHp, enemyHp };
  state.battleSummary = battle.result;
  battle.report.push(`${won ? '🏆' : '💥'} Финал ручного боя: твоя стая ${playerHp} HP, бот ${enemyHp} HP.`);
  state.battleReport = battle.report;
  applyBattleRewards(state, won, playerHp, enemyHp);
  return true;
}

function applyBattleRewards(state, won, playerHp, enemyHp) {
  const bot = selectedBot(state);
  if (won) {
    const lineup = selectedTeamDogs(state);
    const novaBonus = lineup.some((dog) => dog.id === 8) ? 25 : 0;
    const cleanWinBonus = playerHp > enemyHp + 90 ? 20 : 0;
    const streakBonus = Math.min(state.stats.streak + 1, 5) * 10;
    const arenaBonus = arenaEffect(bot).bonusReward || 0;
    const reward = bot.reward + novaBonus + streakBonus + cleanWinBonus + arenaBonus;
    state.points += reward;
    state.stats.wins += 1;
    state.stats.streak += 1;
    state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    if (!state.stats.defeatedBots.includes(bot.name)) state.stats.defeatedBots.push(bot.name);
    addLog(state, `Ручная победа над ${bot.name}! +${reward} очков${arenaBonus ? ` (арена +${arenaBonus})` : ''}.`);
  } else {
    const consolation = Math.round(bot.reward * 0.25);
    state.points += consolation;
    state.stats.losses += 1;
    state.stats.streak = 0;
    addLog(state, `${bot.name} победил в ручном бою. Утешительный бонус +${consolation} очков.`);
  }
  unlockNextBot(state);
  checkAchievements(state);
}

export function selectManualFighter(state, dogId) {
  const battle = state.manualBattle;
  if (!battle?.active || battle.turn !== 'player') return false;
  const fighter = fighterById(battle.playerTeam, dogId);
  if (!fighter || !fighter.alive || battle.actedIds.includes(dogId)) return false;
  battle.selectedFighterId = dogId;
  return true;
}

export function selectManualTarget(state, dogId) {
  const battle = state.manualBattle;
  if (!battle?.active || battle.turn !== 'player') return false;
  const fighter = fighterById(battle.enemyTeam, dogId);
  if (!fighter || !fighter.alive) return false;
  battle.selectedTargetId = dogId;
  return true;
}

export function playerManualAction(state, dogId, action) {
  return applyPlayerAction(state, dogId, action);
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

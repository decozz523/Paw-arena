import { achievementDefinitions, baseDogs, botTeams, packs, questDefinitions, rarityMeta, rarityOrder } from './data.js';
import { icon } from './icons.js';
import { arenaEffect, botPower, isBotLocked, ownedDogs, questProgress, selectedBot, selectedTeamDogs, synergyInfo, teamLineup, teamPower } from './game.js';

function statLine(iconName, label, value) {
  return `<div class="stat-line">${icon(iconName)}<span>${label}</span><strong>${value}</strong></div>`;
}

export function collectionScene(state) {
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
        <p class="style-tag">${locked ? 'Силуэт в питомнике' : dog.style}</p>
        <p class="lore-text">${locked ? 'Открой карту, чтобы узнать характер бойца и его роль в стае.' : dog.lore}</p>
        <p class="ability-text">${locked ? 'Карта не изучена: найди её в паке.' : dog.ability}</p>
        ${locked ? '' : `<div class="move-preview"><span>🐾 ${dog.moves.paw}</span><span>🌀 ${dog.moves.tail}</span><span>🛡 ${dog.moves.guard}</span><span>✨ ${dog.moves.super}</span></div>`}
        ${statLine('zap', 'Атака', dog.power)}
        ${statLine('heart', 'Здоровье', dog.hp)}
        ${statLine('shield', 'Скорость', dog.speed)}
        <button data-upgrade="${dog.id}" ${locked || state.points < cost ? 'disabled' : ''}>${locked ? 'Найди в паке' : `Прокачать · ${cost} очков`}</button>
      </article>`;
    }).join('')}
  </section>`;
}

export function shopScene(state) {
  return `<section class="shop-intro">
    <div>
      <p class="eyebrow">${icon('shop')} Питомник редкостей</p>
      <h2>Открывай боксы как мини-событие</h2>
      <p>Каждый пак подсвечивает добычу, пополняет коллекцию и даёт копии для будущих прокачек.</p>
    </div>
    <span>🎁</span>
  </section>
  <section class="shop-layout">
    <div class="pack-list">
      ${packs.map((pack) => `<article class="pack-card">
        <div class="pack-icon">📦</div><div class="pack-spark"></div>
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
        <small>Pity: ${state.packPity || 0}. Чем дольше нет эпика/легенды, тем выше их вес.</small>
      </div>
    </div>
  </section>`;
}

export function battleScene(state) {
  const bot = selectedBot(state);
  const selectedIds = selectedTeamDogs(state).map((dog) => dog.id);
  const synergy = synergyInfo(selectedTeamDogs(state));
  const battle = state.manualBattle;
  const arena = arenaEffect(bot);
  return `<section class="battle-layout">
    <div class="bot-list">
      ${botTeams.map((enemy, index) => `<button class="${index === state.selectedBotIndex ? 'active ' : ''}bot-button" data-bot="${index}" ${isBotLocked(state, enemy) ? 'aria-disabled="true"' : ''}>
        <span>${isBotLocked(state, enemy) ? '🔒' : enemy.icon}</span><strong>${enemy.name}</strong><small>${isBotLocked(state, enemy) ? `нужно побед: ${enemy.minWins}` : `награда ${enemy.reward} · ${enemy.trait}`}</small>
      </button>`).join('')}
    </div>
    <div class="arena-card">
      <div class="versus">
        <div><p>Твоя стая</p><strong>${Math.round(teamPower(state))}</strong></div>
        <span>VS</span>
        <div><p>${bot.name}</p><strong>${Math.round(botPower(state))}</strong></div>
      </div>
      <div class="arena-stage">
        <div>
          <strong>🏟️ ${arena.name}</strong>
          <p>${arena.description}</p>
        </div>
        <span>${arena.mood}</span>
      </div>
      <div class="synergy-card">
        <strong>${icon('combo')} Комбо стаи</strong>
        <p>${synergy.bonuses.join(' · ')}</p>
      </div>
      ${battle?.active ? activeArenaMarkup(state) : battleSetupMarkup(state, selectedIds, bot)}
      ${battleSummaryMarkup(state)}
      <div class="battle-report">
        <h3>${icon('scroll')} Ход боя</h3>
        ${state.battleReport.map((entry) => `<p class="${entry.startsWith('—') ? 'round-title' : ''}">${entry}</p>`).join('')}
      </div>
    </div>
  </section>`;
}


function hpBar(fighter) {
  const hp = Math.max(0, fighter.currentHp);
  const percent = Math.max(0, Math.min(100, (hp / fighter.maxHp) * 100));
  return `<div class="hp-bar" aria-label="${fighter.name}: ${hp} из ${fighter.maxHp} HP"><span style="width: ${percent}%"></span></div>`;
}

function statusBadges(fighter) {
  const statuses = [];
  if (fighter.shield > 0) statuses.push(`🛡 ${fighter.shield}`);
  if (fighter.focus > 0) statuses.push(`🎯 ${fighter.focus}`);
  if (fighter.slowed > 0) statuses.push('❄ замедлен');
  if (fighter.marked > 0) statuses.push('📍 метка');
  if (fighter.stunned > 0) statuses.push('⛔ блок');
  if (fighter.burn > 0) statuses.push('🔥 ожог');
  if (fighter.trap > 0) statuses.push('🪤 капкан');
  if (fighter.taunt > 0) statuses.push('📣 провокация');
  if (fighter.evade > 0) statuses.push('💨 уклонение');
  if (fighter.silenced > 0) statuses.push('🌑 супер-блок');
  if (fighter.vulnerable > 0) statuses.push('💢 уязвимость');
  if (fighter.speedBoost > 0) statuses.push('🌀 темп');
  return statuses.length ? `<small>${statuses.join(' · ')}</small>` : '<small>готов к обмену ударами</small>';
}

function battleSetupMarkup(state, selectedIds, bot) {
  return `<div class="manual-team-panel setup-panel">
    <h3>${icon('paw')} Собери тройку перед выходом на поле</h3>
    <div class="team-picker">
      ${ownedDogs(state).map((dog) => `<button class="team-chip ${selectedIds.includes(dog.id) ? 'active' : ''}" data-team-dog="${dog.id}">${dog.emoji} ${dog.name}</button>`).join('')}
    </div>
    <small>Сначала выбери тройку. В бою способности раскроются только у выбранной собаки — как в пошаговой RPG.</small>
    <div class="selected-kit">
      ${selectedIds.map((id) => {
        const dog = ownedDogs(state).find((item) => item.id === id);
        return dog ? `<article><strong>${dog.emoji} ${dog.name}</strong><span>${dog.role} · ${dog.element}</span><small>${dog.moves.super}</small></article>` : '';
      }).join('')}
    </div>
    <div class="enemy-team">
      ${bot.dogs.map((id) => {
        const dog = baseDogs.find((item) => item.id === id);
        return `<span>${dog.emoji} ${dog.name}</span>`;
      }).join('')}
    </div>
    <button class="fight-button" data-start-battle="true">${icon('swords')} Выйти на арену</button>
  </div>`;
}

function actionHint(battle, fighter) {
  if (!battle?.active) return 'Выбери бойца';
  if (battle.turn !== 'player') return 'Бот отвечает — держим оборону';
  if (!fighter) return 'Нажми на свою карту снизу';
  if (!fighter.alive) return `${fighter.name} выбыл из боя`;
  if (battle.actedIds.includes(fighter.id)) return `${fighter.name} уже ходил в этом раунде`;
  if (fighter.stunned > 0) return `${fighter.name} заблокирован способностью соперника: действие пропустится`;
  return `Выбран ${fighter.name}: атака доступна${battle.usedSupers.includes(fighter.id) ? ', супер уже потрачен' : ', супер готов'}`;
}

function fighterCard(fighter, battle, selected) {
  const acted = battle.actedIds.includes(fighter.id);
  const canSelect = battle.turn === 'player' && fighter.alive && !acted;
  return `<button class="field-card ${selected ? 'selected' : ''} ${acted ? 'acted' : ''} ${!fighter.alive ? 'down' : ''}" data-select-fighter="${fighter.id}" ${canSelect ? '' : 'disabled'}>
    <span class="field-emoji">${fighter.emoji}</span>
    <strong>${fighter.name}</strong>
    ${hpBar(fighter)}
    ${statusBadges(fighter)}
  </button>`;
}

function enemyToken(fighter, selected) {
  return `<button class="enemy-token ${selected ? 'selected' : ''} ${fighter.alive ? '' : 'down'}" data-select-target="${fighter.id}" ${fighter.alive ? '' : 'disabled'}>
    <span>${fighter.emoji}</span>
    <strong>${fighter.name}</strong>
    ${hpBar(fighter)}
    ${statusBadges(fighter)}
  </button>`;
}

function actionDock(battle) {
  const selected = battle.playerTeam.find((fighter) => fighter.id === battle.selectedFighterId)
    || battle.playerTeam.find((fighter) => fighter.alive && !battle.actedIds.includes(fighter.id));
  const target = battle.enemyTeam.find((fighter) => fighter.id === battle.selectedTargetId && fighter.alive)
    || battle.enemyTeam.find((fighter) => fighter.alive);
  const acted = selected ? battle.actedIds.includes(selected.id) : true;
  const dead = selected ? !selected.alive : true;
  const disabled = !selected || dead || acted || battle.turn !== 'player';
  const superUsed = selected ? battle.usedSupers.includes(selected.id) : true;
  const moves = selected?.moves || {};
  return `<div class="action-dock">
    <div>
      <strong>${selected ? `${selected.emoji} ${selected.name}` : 'Выбери карту'} ${target ? `→ ${target.emoji} ${target.name}` : ''}</strong>
      <p>${actionHint(battle, selected)}</p>
      ${selected ? `<div class="kit-reveal">
        <span>🐾 ${moves.paw}</span>
        <span>🌀 ${moves.tail}</span>
        <span>🛡 ${moves.guard}</span>
        <span>✨ ${moves.super}</span>
      </div>` : ''}
    </div>
    <div class="action-buttons">
      <button data-manual-action="paw" data-fighter="${selected?.id || ''}" ${disabled ? 'disabled' : ''}>🐾 Лапа</button>
      <button data-manual-action="tail" data-fighter="${selected?.id || ''}" ${disabled ? 'disabled' : ''}>🌀 Хвост</button>
      <button data-manual-action="guard" data-fighter="${selected?.id || ''}" ${disabled ? 'disabled' : ''}>🛡 Щит</button>
      <button data-manual-action="super" data-fighter="${selected?.id || ''}" ${disabled || superUsed ? 'disabled' : ''}>✨ Супер</button>
    </div>
  </div>`;
}

function activeArenaMarkup(state) {
  const battle = state.manualBattle;
  const selectedId = battle.selectedFighterId;
  return `<div class="clash-arena">
    <div class="arena-hud">
      <span>Раунд ${battle.round}/5</span>
      <strong>${battle.turn === 'player' ? 'Твой ход' : 'Ход бота'}</strong>
      <span>${battle.playerTeam.filter((fighter) => fighter.alive).length}v${battle.enemyTeam.filter((fighter) => fighter.alive).length}</span>
    </div>
    <div class="enemy-line">
      ${battle.enemyTeam.map((fighter) => enemyToken(fighter, fighter.id === battle.selectedTargetId)).join('')}
    </div>
    <div class="arena-lane">
      <div class="lane-glow"></div>
      <strong>${battle.turn === 'player' ? 'Выбери карту снизу и ударь' : 'Стая бота контратакует'}</strong>
      <p>${state.battleReport.at(-1) || 'Следи за HP и статусами прямо на поле.'}</p>
    </div>
    <div class="player-hand">
      ${battle.playerTeam.map((fighter) => fighterCard(fighter, battle, fighter.id === selectedId)).join('')}
    </div>
    ${actionDock(battle)}
  </div>`;
}

function battleSummaryMarkup(state) {
  if (!state.battleSummary) return '';
  const { won, playerHp, enemyHp } = state.battleSummary;
  return `<div class="battle-summary ${won ? 'won' : 'lost'}">
    <strong>${won ? 'Победа по итогам HP' : 'Поражение по итогам HP'}</strong>
    <span>Твоя стая: ${playerHp} HP</span>
    <span>Бот: ${enemyHp} HP</span>
  </div>`;
}

export function progressPanel(state) {
  const completedQuests = questDefinitions.filter((quest) => state.claimedQuests.includes(quest.id)).length;
  return `<section class="progress-layout">
    <article class="profile-card">
      <h2>${icon('paw')} Питомник тренера</h2>
      <div class="profile-stats">
        <span>${icon('trophy')} Победы: <strong>${state.stats.wins}</strong></span>
        <span>${icon('fire')} Серия: <strong>${state.stats.streak}</strong></span>
        <span>${icon('bone')} Собаки: <strong>${ownedDogs(state).length}/${baseDogs.length}</strong></span>
        <span>${icon('target')} Миссии: <strong>${completedQuests}/${questDefinitions.length}</strong></span>
      </div>
      <button class="ghost-button" data-reset="true">${icon('reset')} Сбросить прогресс</button>
    </article>
    <article class="quest-card">
      <h2>${icon('target')} Миссии</h2>
      ${questDefinitions.map((quest) => questMarkup(state, quest)).join('')}
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

function questMarkup(state, quest) {
  const progress = Math.min(questProgress(state, quest), quest.target);
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

export function activeSceneMarkup(state) {
  if (state.scene === 'shop') return shopScene(state);
  if (state.scene === 'battle') return battleScene(state);
  return collectionScene(state);
}

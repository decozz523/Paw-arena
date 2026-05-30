import { achievementDefinitions, baseDogs, botTeams, packs, questDefinitions, rarityMeta, rarityOrder } from './data.js';
import { icon } from './icons.js';
import { botPower, isBotLocked, ownedDogs, questProgress, selectedBot, selectedTeamDogs, synergyInfo, teamLineup, teamPower } from './game.js';

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
        <p class="ability-text">${locked ? 'Карта не изучена: найди её в паке.' : dog.ability}</p>
        ${statLine('zap', 'Атака', dog.power)}
        ${statLine('heart', 'Здоровье', dog.hp)}
        ${statLine('shield', 'Скорость', dog.speed)}
        <button data-upgrade="${dog.id}" ${locked || state.points < cost ? 'disabled' : ''}>${locked ? 'Найди в паке' : `Прокачать · ${cost} очков`}</button>
      </article>`;
    }).join('')}
  </section>`;
}

export function shopScene(state) {
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

export function battleScene(state) {
  const bot = selectedBot(state);
  const selectedIds = selectedTeamDogs(state).map((dog) => dog.id);
  const synergy = synergyInfo(selectedTeamDogs(state));
  const battle = state.manualBattle;
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
      <div class="synergy-card">
        <strong>${icon('combo')} Комбо стаи</strong>
        <p>${synergy.bonuses.join(' · ')}</p>
      </div>
      <div class="manual-team-panel">
        <h3>${icon('paw')} Твоя тройка</h3>
        <div class="team-picker">
          ${ownedDogs(state).map((dog) => `<button class="team-chip ${selectedIds.includes(dog.id) ? 'active' : ''}" data-team-dog="${dog.id}" ${battle?.active ? 'disabled' : ''}>${dog.emoji} ${dog.name}</button>`).join('')}
        </div>
        <small>Нажми на собаку, чтобы поставить её в тройку. Новая собака заменит самую старую выбранную.</small>
      </div>
      <div class="enemy-team">
        ${bot.dogs.map((id) => {
          const dog = baseDogs.find((item) => item.id === id);
          return `<span>${dog.emoji} ${dog.name}</span>`;
        }).join('')}
      </div>
      ${manualBattleControls(state)}
      ${battleSummaryMarkup(state)}
      <div class="battle-report">
        <h3>${icon('scroll')} Ход боя</h3>
        ${state.battleReport.map((entry) => `<p class="${entry.startsWith('—') ? 'round-title' : ''}">${entry}</p>`).join('')}
      </div>
    </div>
  </section>`;
}


function manualBattleControls(state) {
  const battle = state.manualBattle;
  if (!battle?.active) return `<button class="fight-button" data-start-battle="true">${icon('swords')} Начать ручной бой</button>`;
  if (battle.turn !== 'player') return '<div class="turn-banner">🤖 Бот думает...</div>';
  return `<div class="manual-actions">
    <h3>${icon('swords')} Раунд ${battle.round}: выбери действие</h3>
    ${battle.playerTeam.map((fighter) => {
      const acted = battle.actedIds.includes(fighter.id);
      const usedSuper = battle.usedSupers.includes(fighter.id);
      const disabled = !fighter.alive || acted;
      return `<article class="fighter-action ${!fighter.alive ? 'down' : ''}">
        <strong>${fighter.emoji} ${fighter.name}</strong>
        <span>${Math.max(0, fighter.currentHp)}/${fighter.maxHp} HP · щит ${fighter.shield}</span>
        <div>
          <button data-manual-action="basic" data-fighter="${fighter.id}" ${disabled ? 'disabled' : ''}>Атака</button>
          <button data-manual-action="super" data-fighter="${fighter.id}" ${disabled || usedSuper ? 'disabled' : ''}>Супер</button>
        </div>
      </article>`;
    }).join('')}
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

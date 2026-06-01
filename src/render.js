import { icon } from './icons.js';
import { teamPower } from './game.js';
import { activeSceneMarkup, progressPanel } from './scenes.js';

export function renderApp(state) {
  return `<main class="app-shell">
    <section class="hero-card">
      <div>
        <p class="eyebrow">${icon('sparkles')} Paw Arena 2.0</p>
        <h1>Paw Arena 2.0: выбери собаку, цель и ход</h1>
        <p class="hero-text">Бой стал ручным и менее очевидным: выбирай собаку, цель, лапу, хвост, щит или супер. Способности раскрываются после выбора бойца, а редкие собаки падают через честную pity-логику.</p>
        <div class="hero-badges">
          <span>🐾 4 действия у каждой собаки</span>
          <span>🎯 ручной выбор цели</span>
          <span>🎁 pity-дропы</span>
        </div>
      </div>
      <div class="stats-panel">
        <span>${icon('coins')} ${state.points} очков</span>
        <span>${icon('trophy')} сила ${Math.round(teamPower(state))}</span>
        <span>${icon('fire')} серия ${state.stats.streak}</span>
      </div>
    </section>

    <nav class="scene-tabs" aria-label="Сцены игры">
      <button class="${state.scene === 'collection' ? 'active' : ''}" data-scene="collection">${icon('bone')} Карты</button>
      <button class="${state.scene === 'shop' ? 'active' : ''}" data-scene="shop">${icon('shop')} Магазин</button>
      <button class="${state.scene === 'battle' ? 'active' : ''}" data-scene="battle">${icon('swords')} Арена</button>
    </nav>

    ${activeSceneMarkup(state)}
    ${progressPanel(state)}

    <aside class="log-panel">
      <h2>Журнал</h2>
      ${state.log.map((entry) => `<p>${entry}</p>`).join('')}
    </aside>
  </main>`;
}

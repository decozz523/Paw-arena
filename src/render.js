import { icon } from './icons.js';
import { teamPower } from './game.js';
import { activeSceneMarkup, progressPanel } from './scenes.js';

export function renderApp(state) {
  return `<main class="app-shell">
    <section class="hero-card">
      <div>
        <p class="eyebrow">${icon('sparkles')} Paw Arena</p>
        <h1>Собери стаю, закрывай миссии и проходи лигу ботов</h1>
        <p class="hero-text">Бой стал пошаговым: HP, инициатива, щиты, метки, криты, лечение и роли собак теперь влияют на результат.</p>
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
      <button class="${state.scene === 'battle' ? 'active' : ''}" data-scene="battle">${icon('swords')} Бой</button>
    </nav>

    ${activeSceneMarkup(state)}
    ${progressPanel(state)}

    <aside class="log-panel">
      <h2>Журнал</h2>
      ${state.log.map((entry) => `<p>${entry}</p>`).join('')}
    </aside>
  </main>`;
}

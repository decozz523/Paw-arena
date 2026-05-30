export function icon(name) {
  const icons = {
    bone: '🦴', box: '📦', coins: '🪙', heart: '❤️', shield: '🛡️', shop: '🛍️', sparkles: '✨', swords: '⚔️', trophy: '🏆', zap: '⚡', star: '⭐', target: '🎯', fire: '🔥', reset: '🔄', paw: '🐾', scroll: '📜', lock: '🔒', gift: '🎁', combo: '🧬', chart: '📈', skull: '💥', heal: '💚',
  };
  return `<span class="icon" aria-hidden="true">${icons[name]}</span>`;
}

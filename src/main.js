import { questDefinitions } from './data.js';
import { buyPack, checkAchievements, claimQuest, isBotLocked, playerManualAction, selectedBot, selectManualFighter, startManualBattle, toggleTeamDog, upgradeDog, addLog } from './game.js';
import { renderApp } from './render.js';
import { createDefaultState, loadState, resetSavedState, saveState } from './state.js';

let state = loadState();
const app = document.querySelector('#root');

function render() {
  checkAchievements(state);
  saveState(state);
  app.innerHTML = renderApp(state);
}

function setScene(scene) {
  state.scene = scene;
  render();
}

function setBot(index) {
  const previousIndex = state.selectedBotIndex;
  state.selectedBotIndex = index;
  const bot = selectedBot(state);
  if (isBotLocked(state, bot)) {
    state.selectedBotIndex = previousIndex;
    addLog(state, `${bot.name} закрыт: нужно побед ${bot.minWins}, сейчас ${state.stats.wins}.`);
  }
  render();
}

function resetProgress() {
  state = createDefaultState();
  resetSavedState();
  render();
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.scene) setScene(button.dataset.scene);
  if (button.dataset.upgrade) {
    upgradeDog(state, Number(button.dataset.upgrade));
    render();
  }
  if (button.dataset.pack) {
    buyPack(state, button.dataset.pack);
    render();
  }
  if (button.dataset.bot) setBot(Number(button.dataset.bot));
  if (button.dataset.startBattle) {
    startManualBattle(state);
    render();
  }
  if (button.dataset.selectFighter) {
    selectManualFighter(state, Number(button.dataset.selectFighter));
    render();
  }
  if (button.dataset.manualAction) {
    playerManualAction(state, Number(button.dataset.fighter), button.dataset.manualAction);
    render();
  }
  if (button.dataset.teamDog) {
    toggleTeamDog(state, Number(button.dataset.teamDog));
    render();
  }
  if (button.dataset.quest) {
    claimQuest(state, button.dataset.quest, questDefinitions);
    render();
  }
  if (button.dataset.reset) resetProgress();
});

render();

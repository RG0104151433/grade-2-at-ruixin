/* ============================================================================
 * The OASIS —— 启动入口
 * ----------------------------------------------------------------------------
 * 作用很简单：把 js/engine/ 下的游戏内核（引擎）和 story_config.js（剧情/
 * 地图数据）组装起来，初始化并启动游戏。通常不需要修改本文件。
 *
 * 注意：内核已从单个 engine.js 拆分为 js/engine/ 下的多个文件，由 index.html
 * 按依赖顺序加载；其中 class Game 定义在 js/engine/game.js，其余方法组通过
 * Object.assign 挂到它的 prototype 上。加载顺序不可打乱。
 * ==========================================================================*/
'use strict';

window.addEventListener('DOMContentLoaded', () => {
  if (typeof STORY_CONFIG === 'undefined') {
    console.error('未找到 STORY_CONFIG，请确认 js/story_config.js 已正确加载。');
    return;
  }
  if (typeof Game !== 'function') {
    console.error('未找到 Game 引擎，请确认 index.html 已按顺序加载 js/engine/ 下的全部脚本。');
    return;
  }

  window.game = new Game(STORY_CONFIG);
  window.game.boot();
});

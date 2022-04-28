
const SceneManager = require('./src/scene_manager');
const BattleScene = require('./src/battle');
const { Scene_Battle } = require('rmmz');

SceneManager.replaceSceneClass(Scene_Battle, BattleScene);
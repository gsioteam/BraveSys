const { SceneManager } = require("rmmz");

if (!SceneManager.replaceSceneClass) {
    let _sceneMap = {};
    function findClass(sceneClass) {
        return _sceneMap[sceneClass] || sceneClass;
    }
    
    let _old_goto = SceneManager.goto;
    SceneManager.goto = function(sceneClass) {
        return _old_goto.call(this, findClass(sceneClass));
    };
    
    let _old_run = SceneManager.run;
    SceneManager.run = function(sceneClass) {
        return _old_run.call(this, findClass(sceneClass));
    };
    
    let _old_push = SceneManager.push;
    SceneManager.push = function(sceneClass) {
        return _old_push.call(this, findClass(sceneClass));
    }
    
    let _old_isNextScene = SceneManager.isNextScene;
    SceneManager.isNextScene = function (sceneClass) {
        return _old_isNextScene.call(this, findClass(sceneClass));
    }
    
    let _old_isPreviousScene = SceneManager.isPreviousScene;
    SceneManager.isPreviousScene = function (sceneClass) {
        return _old_isPreviousScene.call(this, findClass(sceneClass));
    }
    
    SceneManager.replaceSceneClass = function (oldClass, newClass) {
        _sceneMap[oldClass] = newClass;
    };
}

module.exports = SceneManager;
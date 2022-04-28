const TWEEN = require("@tweenjs/tween.js");
const { Graphics } = require("rmmz");

let _tweenInit = false;
function _setup() {
    if (!_tweenInit) {
        _tweenInit = true;
        Graphics.app.ticker.add(function (time) {
            TWEEN.update(Graphics.app.ticker.lastTime);
        });
    }
}

class Tween extends TWEEN.Tween {

    run() {
        return new Promise((resolve, reject) => {
            let over = false;
            this.onComplete(function() {
                if (!over) {
                    over = true;
                    resolve();
                }
            });
            this.onStop(function() {
                if (!over) {
                    over = true;
                    resolve();
                }
            });
            this.start();
        });
    }
}

class TweenManager {
    constructor() {
        _setup();
        this._tweens = [];
    }

    _find(key) {
        for (let entry of this._tweens) {
            if (entry.key === key) {
                return entry;
            }
        } 
        return {
            key: key,
        };
    }

    _set(entry) {
        let index = this._tweens.indexOf(entry);
        if (index < 0) {
            this._tweens.push(entry);
        }
    }

    _remove(entry) {
        let index = this._tweens.indexOf(entry);
        if (index >= 0) {
            this._tweens.splice(index, 1);
        }
    }

    /**
     * 
     * @param {*} target 
     * @param {*} pros 
     * @returns {Tween}
     */
    tween(target) {
        let entry = this._find(target);
        let tween = entry.value;
        if (tween) {
            tween.stop();
        }
        tween = new Tween(target);
        entry.value = tween;
        this._set(entry);
        return tween;
    }

    stop(target) {
        let entry = this._find(target);
        let tween = entry.value;
        if (tween) {
            tween.stop();
            this._remove(entry);
        }
    }

    destroy() {
        for (let entry of this._tweens) {
            let tween = entry.value;
            tween.stop();
        }
        this._tweens = [];
    }
}

module.exports = TweenManager;
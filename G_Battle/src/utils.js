const EventEmitter = require("events");
const { Bitmap } = require("rmmz");
const YAML = require('js-yaml');

module.exports = {
    wait(time) {
        return new Promise((resolve, reject) => setTimeout(resolve, time));
    },
    /**
     * 
     * @param {EventEmitter} target 
     * @param {string} name 
     * @returns {Promise}
     */
    until(target, name) {
        return new Promise(function (resolve, reject) {
            target.once(name, resolve)
        });
    },
    /**
     * 
     * @param {Object} object 
     * @returns {EventEmitter}
     */
    ee(object) {
        if (!object._ee) {
            object._ee = new EventEmitter();
        }
        return object._ee;
    },
    /**
     * 
     * @param {Bitmap} bitmap 
     */
    bitmapReady(bitmap) {
        return new Promise(function (resolve, reject) {
            if (bitmap.isReady()) {
                resolve(bitmap);
            } else {
                bitmap.addLoadListener(function _ready(self) {
                    resolve(bitmap);
                });
            }
        });
    },
    noteData(obj) {
        if (!obj._noteData) {
            obj._noteData = YAML.load(obj.note) || {};
        }
        return obj._noteData;
    },
    /**
     * 
     * @param {String} formula 
     * @param {Array<String>} keys 
     * @returns 
     */
    formula(formula, keys) {
        let arr = [];
        for (let key of keys) {
            arr.push(`const ${key} = args[${JSON.stringify(key)}];`);
        }
        arr.push(`return (${formula})`);
        return new Function('args', arr.join('\n'));
    }
};
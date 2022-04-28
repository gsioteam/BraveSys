const { Input } = require("rmmz");
const EventEmitter = require('events');

class KeyEvent extends EventEmitter {
    constructor(keyName) {
        super();
        this.keyName = keyName;
        this.isPressed = false;

        if (keyName === 'cancel') {
            window.addEventListener('mousedown', (e) => {
                let rightclick;
                if (e.which) rightclick = (e.which == 3);
                else if (e.button) rightclick = (e.button == 2);
                if (rightclick) {
                    this.emit('down');
                }
            });
            window.addEventListener('mouseup', (e) => {
                let rightclick;
                if (e.which) rightclick = (e.which == 3);
                else if (e.button) rightclick = (e.button == 2);
                if (rightclick) {
                    this.emit('up');
                }
            });
        }
    }

    update() {
        let pressed = Input.isPressed(this.keyName);
        if (pressed !== this.isPressed) {
            this.isPressed = pressed;
            if (pressed) {
                this.emit('down');
            } else {
                this.emit('up');
            }
        }
        if (Input.isRepeated(this.keyName)) {
            this.emit('repeat');
        }
    }
}

let _eventMap = {};

let _Input_update = Input.update;
Input.update = function () {
    _Input_update.call(this);

    for (let key in _eventMap) {
        let event = _eventMap[key];
        event.update();
    }
}

/**
 * 
 * @param {string} keyName 
 * @returns {KeyEvent}
 */
Input.event = function(keyName) {
    let keyEvent = _eventMap[keyName];
    if (!keyEvent) {
        keyEvent = new KeyEvent(keyName);
        _eventMap[keyName] = keyEvent;
    }
    return keyEvent;
};

module.exports = Input;
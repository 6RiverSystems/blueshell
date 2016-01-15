/**
 * Created by josh on 1/15/16.
 */
'use strict';

var Composite = require('./Composite');

class LatchedComposite extends Composite {

	handleEvent(state, event) {

		let storage = this.getStorage(state);

		let firstChild = storage.running !== undefined ? storage.running : 0;

		// Reset running
		storage.running = undefined;

		return this.loop(storage, state, event, firstChild);
	}

	loop(storage, state, event, i) {
		throw new Error('This is an abstract method - please override.');
	}
}

module.exports = LatchedComposite;

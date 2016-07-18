/**
 * Created by josh on 1/10/16.
 */
'use strict';

let rc = require('./../utils/resultCodes');
let Composite = require('./Composite');

class Sequence extends Composite {

	// Recursively executes children until one of them returns
	// failure. If we call all the children successfully, return success.
	handleChild(state, event, i) {

		let storage = this.getNodeStorage(state);

		// If we finished all processing without failure return success.
		if (i >= this.children.length) {
			return Promise.resolve(rc.SUCCESS);
		}

		let child = this.children[i];
		let p = child.handleEvent(state, event);

		return p.then(res => {
			if (res === rc.SUCCESS) {
				// Call the next child
				return this.handleChild(state, event, ++i);
			} else {
				if (this.latched && res === rc.RUNNING) {
					storage.running = i;
				}

				return res;
			}
		});
	}
}

module.exports = Sequence;

/**
 * Created by josh on 1/18/16.
 */
'use strict';

var Composite = require('./Composite');

class Selector extends Composite {

	// Recursively sends the event to each child until one of them returns
	// success or running. If we exhaust all the children, return failure.
	handleChild(state, event, i) {

		let storage = this.getNodeStorage(state);

		// If we finished all processing without success return failure.
		if (i >= this.children.length) {
			return Promise.resolve({
				result: 'FAILURE',
				state
			});
		}

		let child = this.children[i];
		let p = child.handleEvent(state, event);

		return p.then(res => {
			if (res.result !== 'FAILURE') {

				if (this.latched && res.result === 'RUNNING') {
					storage.running = i;
				}

				return res;
			} else {
				return this.handleChild(state, event, ++i);
			}
		});
	}

}

module.exports = Selector;

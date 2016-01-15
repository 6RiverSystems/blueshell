/**
 * Created by josh on 1/10/16.
 */
'use strict';

var LatchedComposite = require('./LatchedComposite');

class Selector extends LatchedComposite {

	// Recursively sends the event to each child until one of them returns
	// success or running. If we exhaust all the children, return failure.
	loop(storage, state, event, i) {

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
				console.log(child.name, ' processed ', event);

				if (res.result === 'RUNNING') {
					storage.running = i;
				}

				return res;
			} else {
				return this.loop(storage, state, event, ++i);
			}
		});
	}
}

module.exports = Selector;
/**
 * Created by josh on 1/15/16.
 */
'use strict';

var LatchedComposite = require('./LatchedComposite');

class LatchedSequence extends LatchedComposite {

	// Recursively sends the event to each child until one of them returns
	// `FAILURE`, then return `FAILURE`
	// If all return SUCCESS, return SUCCESS
	loop(storage, state, event, i) {
		// If we finished all processing without failure return success.
		if (i >= this.children.length) {
			return Promise.resolve({
				result: 'SUCCESS',
				state
			});
		}

		let child = this.children[i];
		let p = child.handleEvent(state, event);

		return p.then(res => {
			console.log(child.path, ' => ', event, ' => ', res.result);

			if (res.result === 'SUCCESS') {
				return this.loop(storage, state, event, ++i);
			} else {
				if (res.result === 'RUNNING') {
					storage.running = i;
				}

				return res;
			}
		});
	}

}

module.exports = LatchedSequence;

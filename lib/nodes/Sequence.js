/**
 * Created by josh on 1/10/16.
 */
'use strict';

var Composite = require('./Composite');

class Sequence extends Composite {

	onEvent(state, event) {
		return this.handleChild(state, event, 0);
	}

	// Recursively executes children until one of them returns
	// failure. If we call all the children successfully, return success.
	handleChild(state, event, i) {

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
			if (res.result === 'SUCCESS') {
				// Call the next child
				return this.handleChild(state, event, ++i);
			} else {
				return res;
			}
		});
	}
}

module.exports = Sequence;

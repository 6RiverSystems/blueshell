/**
 * Created by josh on 1/10/16.
 */
'use strict';

var Composite = require('./Composite');

class Sequence extends Composite {

	handleEvent(state, event) {
		for (let child of this.children) {
			let res = child.handleEvent(state, event);

			if (res.result === 'SUCCESS') {
				console.log(child.name, ' processed ', event);
			} else {
				console.log('%s while processing %s with %s', res.result, child.name, event);
				return res;
			}

		}

		return {
			result: 'SUCCESS',
			state
		};
	}
}

module.exports = Sequence;

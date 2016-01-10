/**
 * Created by josh on 1/10/16.
 */
'use strict';

var CompositeNode = require('./CompositeNode');

class PriorityNode extends CompositeNode {

	handleEvent(state, event) {
		for (let child of this.children) {
			console.log(child.name, 'processing ', event);

			let res = child.handleEvent(state, event);

			if (res.result !== 'FAILURE') {
				console.log(child.name, ' processed ', event);
				return res;
			}

		}

		// If we finished the loop without success return failure.
		return {
			result: 'FAILURE',
			state
		};
	}
}

module.exports = PriorityNode;

/**
 * Created by josh on 1/10/16.
 */
'use strict';

class Node {

	constructor(name) {
		this.name = name;
	}

	handleEvent(state, event) {
		console.log(`${this.name} called with event`, event);

		return {
			result: 'SUCCESS',
			state
		};
	}
}

module.exports = Node;

/**
 * Created by josh on 1/12/16.
 */
'use strict';

let Decorator = require('../Decorator');

class RepeatWhen extends Decorator {

	constructor(desc, child, conditional) {
		super('RepeatWhen-' + desc, child);
		this.conditional = conditional;
	}

	onEvent(state, event) {
		let p = this.child.handleEvent(state, event);

		return p.then(res => {
			if (this.conditional(state, event, res)) {
				return this.handleEvent(state, event);
			} else {
				return res;
			}
		});
	}
}

module.exports = RepeatWhen;

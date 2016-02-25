/**
 * Created by josh on 1/12/16.
 */
'use strict';

var Decorator = require('../Decorator');

class RepeatWhen extends Decorator {

	constructor(desc, child, where) {
		super('RepeatWhen-' + desc, child);
		this._where = where;
	}

	onEvent(state, event) {
		let p = this.child.handleEvent(state, event);

		return p.then(res => {
			if (this._where(res)) {
				return this.handleEvent(state, event);
			} else {
				return res;
			}
		});
	}
}

module.exports = RepeatWhen;

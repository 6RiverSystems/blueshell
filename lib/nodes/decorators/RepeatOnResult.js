/**
 * Created by josh on 1/12/16.
 */
'use strict';

var Decorator = require('../Decorator');

class RepeatOnResult extends Decorator {

	constructor(result, child) {
		super('RepeatOn-' + result, child);
		this._result = result;
	}

	onEvent(state, event) {
		let p = this.child.handleEvent(state, event);

		return p.then(res => {
			if (res.result === this._result) {
				return this.handleEvent(state, event);
			} else {
				return res;
			}
		});
	}
}

module.exports = RepeatOnResult;

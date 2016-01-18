/**
 * Created by josh on 1/12/16.
 */
'use strict';

var Decorator = require('./Decorator');

class Not extends Decorator {

	onEvent(state, event) {
		let p = this.child.handleEvent(state, event);

		return p.then(res => {
			switch (res.result) {
			case 'SUCCESS':
				res.result = 'FAILURE';
				break;
			case 'FAILURE':
				res.result = 'SUCCESS';
				break;
			default:
				// no-op
			}

			return res;
		});
	}
}

module.exports = Not;

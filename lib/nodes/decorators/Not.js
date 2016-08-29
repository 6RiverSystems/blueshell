/**
 * Created by josh on 1/12/16.
 */
'use strict';

let rc = require('../../utils/ResultCodes');
let Decorator = require('../Decorator');

class Not extends Decorator {

	onEvent(state, event) {
		let p = this.child.handleEvent(state, event);

		return p.then(res => {
			switch (res) {
			case rc.SUCCESS:
				res = rc.FAILURE;
				break;
			case rc.FAILURE:
				res = rc.SUCCESS;
				break;
			default:
				// no-op
			}

			return res;
		});
	}
}

module.exports = Not;

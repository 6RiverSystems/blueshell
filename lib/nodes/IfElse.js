/**
 * Created by jpollak on 5/29/16.
 */
'use strict';

let rc = require('./../utils/resultCodes');
let Base = require('./Base');


/**
 * If-Else Conditional Composite Node.
 *
 * If conditional(state, event) returns true,
 * control is passed to the consequent node.
 *
 * If conditional(state, event) returns false,
 * control is passed to the alternative node, or
 * if one is not provided, 'FAILURE' is returned.
 *
 */
class IfElse extends Base {

	constructor(name, conditional, consequent, alternative) {
		super(name);

		this.conditional = conditional;
		this.consequent = consequent;
		this.alternative = alternative;
	}

	get children() {
		let children = [this.consequent];

		if (this.alternative) {
			children.push(this.alternative);
		}

		return children;
	}

	onEvent(state, event) {

		if (this.conditional(state, event)) {
			return this.consequent.handleEvent(state, event);
		} else if (this.alternative) {
			return this.alternative.handleEvent(state, event);
		} else {
			return rc.FAILURE;
		}
	}

}

module.exports = IfElse;

/**
 * Created by jpollak on 5/29/16.
 */
'use strict';

import ResultCodes = require('./../utils/ResultCodes');
import Base = require('./Base');
import Conditional = require('../Conditional');

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

	conditional: Conditional;
	consequent: Base;
	alternative: Base;

	constructor(name: string, conditional: Conditional, consequent: Base, alternative: Base) {
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

	onEvent(state: any, event: any): Promise<ResultCodes> {

		if (this.conditional(state, event)) {
			return this.consequent.handleEvent(state, event);
		} else if (this.alternative) {
			return this.alternative.handleEvent(state, event);
		} else {
			return Promise.resolve(ResultCodes.FAILURE);
		}
	}

}

export = IfElse;

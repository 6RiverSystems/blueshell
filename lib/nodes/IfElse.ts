'use strict';

import {ResultCodes} from '../utils/ResultCodes';
import {Event} from '../data/Event';
import {Action} from './Action';
import {Conditional} from '..//Conditional';

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
export class IfElse<State> extends Action<State> {

	conditional: Conditional<State>;
	consequent: Action<State>;
	alternative: Action<State>;

	constructor(name: string, conditional: Conditional<State>, consequent: Action<State>, alternative?: Action<State>) {
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

	onEvent(state: State, event: Event): Promise<ResultCodes> {

		if (this.conditional(state, event)) {
			return this.consequent.handleEvent(state, event);
		} else if (this.alternative) {
			return this.alternative.handleEvent(state, event);
		} else {
			return Promise.resolve(ResultCodes.FAILURE);
		}
	}

}

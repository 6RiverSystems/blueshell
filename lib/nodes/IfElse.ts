'use strict';

import {ResultCodes} from '../utils/ResultCodes';
import {Action} from './actions/Action';
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
export class IfElse<State, Event> extends Action<State, Event> {

	conditional: Conditional<State, Event>;
	consequent: Action<State, Event>;
	alternative: Action<State, Event>;

	constructor(name: string, conditional: Conditional<State, Event>, consequent: Action<State, Event>,
							alternative?: Action<State, Event>) {
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

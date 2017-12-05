'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Base} from '../Base';
import {Conditional} from './Conditional';

/**
 * If-Else Conditional Composite Node.
 *
 * If conditional(state) returns true,
 * control is passed to the consequent node.
 *
 * If conditional(state) returns false,
 * control is passed to the alternative node, or
 * if one is not provided, 'FAILURE' is returned.
 *
 */
export class IfElse<State> extends Base<State> {

	conditional: Conditional<State>;
	consequent: Base<State>;
	alternative: Base<State>;

	constructor(name: string, conditional: Conditional<State>, consequent: Base<State>,
							alternative?: Base<State>) {
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

	onRun(state: State): Promise<ResultCodes> {

		if (this.conditional(state)) {
			return this.consequent.run(state);
		} else if (this.alternative) {
			return this.alternative.run(state);
		} else {
			return Promise.resolve(ResultCodes.FAILURE);
		}
	}

}

/**
 * Created by jpollak on 5/29/16.
 */
'use strict';

import {Base} from './Base';
import {Conditional} from '../Conditional';
import {
	BehaviorCode
} from './../utils/ResultCodes';

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
export class IfElse extends Base {

	conditional: Conditional;
	consequent: Base;
	alternative: Base;

	constructor(name: string, conditional: Conditional, consequent: Base, alternative?: Base) {
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

	onRun(state: any): Promise<BehaviorCode> {
		if (this.conditional(state)) {
			return this.consequent.run(state);
		} else if (this.alternative) {
			return this.alternative.run(state);
		} else {
			return Promise.resolve(BehaviorCode.ERROR);
		}
	}

}


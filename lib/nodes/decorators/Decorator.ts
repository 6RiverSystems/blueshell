'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Base} from '../Base';
import {Composite} from '../composites/Composite';

export class Decorator<State> extends Composite<State> {

	constructor(name: string, child: Base<State>) {
		super(name, [child]);
	}

	get child(): Base<State> {
		return this.children[0];
	}

	onRun(state: State): Promise<ResultCodes> {
		// Passthrough
		return this.child.onRun(state);
	}

}

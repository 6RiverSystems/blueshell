'use strict';

import {ResultCodes} from '../utils/ResultCodes';
import {Action} from './actions/Action';
import {Composite} from './Composite';

export class Decorator<State> extends Composite<State> {

	constructor(name: string, child: Action<State>) {
		super(name, [child]);
	}

	get child(): Action<State> {
		return this.children[0];
	}

	onEvent(state: State): Promise<ResultCodes> {
		// Passthrough
		return this.child.handleEvent(state);
	}

}

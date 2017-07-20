'use strict';

import {ResultCodes} from '../utils/ResultCodes';
import {Action} from './actions/Action';
import {Composite} from './Composite';

export class Decorator<State, Event> extends Composite<State, Event> {

	constructor(name: string, child: Action<State, Event>) {
		super(name, [child]);
	}

	get child(): Action<State, Event> {
		return this.children[0];
	}

	onEvent(state: State, event: Event): Promise<ResultCodes> {
		// Passthrough
		return this.child.handleEvent(state, event);
	}

}

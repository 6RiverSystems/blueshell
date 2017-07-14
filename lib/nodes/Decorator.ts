'use strict';

import {Composite} from './Composite';
import {Action} from './Action';
import {ResultCodes} from '../utils/ResultCodes';

export class Decorator extends Composite {

	constructor(name: string, child: Action) {
		super(name, [child]);
	}

	get child(): Action {
		return this.children[0];
	}

	onEvent(state: any, event: any): Promise<ResultCodes> {
		// Passthrough
		return this.child.handleEvent(state, event);
	}

}

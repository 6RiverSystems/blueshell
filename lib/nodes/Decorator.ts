'use strict';

import {Composite} from './Composite';
import {Base} from './Base';
import {EventCode} from '../utils/ResultCodes';

export class Decorator extends Composite {

	constructor(name: string, child: Base) {
		super(name, [child]);
	}

	get child(): Base {
		return this.children[0];
	}

	onEvent(state: any, event: any): Promise<EventCode> {
		// Passthrough
		return this.child.handleEvent(state, event);
	}

}

'use strict';

import { Composite } from './Composite';
import { Base } from './Base';
import {ResultCodes} from '../utils/ResultCodes';

export class Decorator extends Composite {

	constructor(name: string, child: Base) {
		super(name, [child], undefined);
	}

	get child(): Base {
		return this.children[0];
	}

	onEvent(state: any, event: any): Promise<ResultCodes> {
		// Passthrough
		return this.child.handleEvent(state, event);
	}

}

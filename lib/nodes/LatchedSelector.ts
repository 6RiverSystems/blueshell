'use strict';

import {Selector} from './Selector';
import {Action} from './Action';

export class LatchedSelector extends Selector {

	constructor(name: string, children: Array<Action>) {
		super(name, children, true);
	}

}

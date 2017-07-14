'use strict';

import {Sequence} from './Sequence';
import {Action} from './Action';

export class LatchedSequence extends Sequence {

	constructor(name: string, children: Array<Action>) {
		super(name, children, true);
	}

}

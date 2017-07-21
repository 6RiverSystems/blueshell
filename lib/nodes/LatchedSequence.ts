'use strict';

import {Sequence} from './Sequence';
import {Action} from './actions/Action';

export class LatchedSequence<State> extends Sequence<State> {

	constructor(name: string, children: Array<Action<State>>) {
		super(name, children, true);
	}

}

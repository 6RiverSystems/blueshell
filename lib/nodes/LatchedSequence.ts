'use strict';

import {Sequence} from './Sequence';
import {Action} from './actions/Action';

export class LatchedSequence<State, Event> extends Sequence<State, Event> {

	constructor(name: string, children: Array<Action<State, Event>>) {
		super(name, children, true);
	}

}

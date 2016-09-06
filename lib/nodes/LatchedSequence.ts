/**
 * Created by josh on 1/15/16.
 */
'use strict';

import {Sequence} from './Sequence';
import {Base} from './Base';

export class LatchedSequence extends Sequence {

	constructor(name: string, children: Array<Base>) {
		super(name, children, true);
	}

}

/**
 * Created by josh on 1/15/16.
 */
'use strict';

import Sequence = require('./Sequence');
import Base = require('./Base');

class LatchedSequence extends Sequence {

	constructor(name: string, children: Array<Base>) {
		super(name, children, true);
	}

}

export = LatchedSequence;

/**
 * Created by josh on 1/15/16.
 */
'use strict';

var Sequence = require('./Sequence');

class LatchedSequence extends Sequence {

	constructor(name, children) {
		super(name, children, true);
	}

}

module.exports = LatchedSequence;

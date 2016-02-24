'use strict';

let Base = require('./nodes/Base');
let Composite = require('./nodes/Composite');
let Decorator = require('./nodes/Decorator');
let Selector = require('./nodes/Selector');
let Sequence = require('./nodes/Sequence');
let LatchedSelector = require('./nodes/LatchedSelector');
let LatchedSequence = require('./nodes/LatchedSequence');

let decorators = require('./nodes/decorators');

module.exports = {
	// Base types to be extended
	Action: Base,
	Composite,
	Condition: Base,
	Decorator,

	// Decorators
	decorators,

	// Composites
	Sequence,
	Selector,
	LatchedSelector,
	LatchedSequence

};

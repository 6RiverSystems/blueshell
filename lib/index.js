'use strict';

var Selector = require('./nodes/Selector');
var Sequence = require('./nodes/Sequence');
var Base = require('./nodes/Base');
var Decorator = require('./nodes/Decorator');
var Composite = require('./nodes/Composite');
var LogicalComponent = require('./LogicalComponent');

module.exports = {
	Selector,
	Priority: Selector, // Synonym
	Sequence,
	Action: Base,
	Condition: Base,
	Decorator,
	Composite,
	LogicalComponent

};

'use strict';

var Rx = require('rx');

/*
 * clazz must implement the following methods:
 *
 * - static publishedStateMapper - maps an instance of clazz (the state)
 * to a publicly visible form.
 */
function LogicalComponent(name, eventStream, node, Clazz) {
	var state = new Clazz();

	var publishedStateStream =
		// Publish the output of the inital state
		Rx.Observable.return(node.publishedStateMapper(state))
			// For each event, filter to make sure it is for us
			// then apply our current state and the current event
			// to eventProcessor, which returns the new state (for use with the
			// next event). Finally, return the public state for external consumption.
			.concat(eventStream
				//.filter(componentFilter.bind(this, name))
				.map(function(ev) {
					return ev.event;
				})
				.scan(node.handleEvent, state)
				.map(Clazz.publishedStateMapper));

	return {
		name: name,
		getStateStream: function() {
			return publishedStateStream;
		}
	};
}

/**
 * Created by jpollak on 3/23/16.
 */
import {Base} from '../nodes/Base';
import {BlueshellState} from '../nodes/BlueshellState';
import {serializeArchyTree} from './archyTree';
import {serializeDotTree} from './dotTree';
import {serializeD3Tree} from './d3Hierarchy';

export function toString<S extends BlueshellState, E>(
	tree: Base<S, E>, state?: S, contextDepth = Number.MAX_SAFE_INTEGER
): string {
	return serializeArchyTree(tree, state, contextDepth);
}

export function toConsole<S extends BlueshellState, E>(
	tree: Base<S, E>, state?: S, contextDepth = Number.MAX_SAFE_INTEGER
) {
	console.log(toString(tree, state, contextDepth)); // eslint-disable-line no-console
}

export function toDotString<S extends BlueshellState, E>(tree: Base<S, E>, state?: S) {
	return serializeDotTree(tree, state);
}

export function toDotConsole<S extends BlueshellState, E>(tree: Base<S, E>, state?: S) {
	console.log(toDotString(tree, state)); // eslint-disable-line no-console
}

export function toD3String<S extends BlueshellState, E>(tree: Base<S, E>, state?: S) {
	return serializeD3Tree(tree, state);
}

export function toD3Console<S extends BlueshellState, E>(tree: Base<S, E>, state?: S) {
	console.log(toD3String(tree, state)); // eslint-disable-line no-console
}

/**
 * Created by jpollak on 3/23/16.
 */
import {Base} from '../nodes/Base';
import {BlueshellState} from '../nodes/BlueshellState';
import {serializeArchyTree} from './archyTree';
import {serializeDotTree} from './dotTree';

export function toString<S extends BlueshellState, E>(tree: Base<S, E>, state?: S): string {
	return serializeArchyTree(tree, state);
}

export function toConsole<S extends BlueshellState, E>(tree: Base<S, E>, state?: S) {
	console.log(toString(tree, state)); // eslint-disable-line no-console
}

export function toDotString<S extends BlueshellState, E>(tree: Base<S, E>, state?: S) {
	return serializeDotTree(tree, state);
}

export function toDotConsole<S extends BlueshellState, E>(tree: Base<S, E>, state?: S) {
	console.log(toDotString(tree, state)); // eslint-disable-line no-console
}

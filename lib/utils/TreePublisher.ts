import {BlueshellState} from '../nodes/BlueshellState';

export interface TreePublisher<B extends BlueshellState, V> {
	publishResult(state: B, event: V, topLevel: boolean): void;
	configure(options: object): void;
}

export class TreeNonPublisher implements TreePublisher<any, any> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	publishResult(_state: BlueshellState, _event: any, _topLevel: boolean) {}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	configure(_options: object) {}
}

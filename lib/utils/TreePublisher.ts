import { BlueshellState } from '../models';

export interface TreePublisher<B extends BlueshellState, V> {
	publishResult(state: B, event: V, topLevel: boolean): void;
	configure(options: object): void;
}

export class TreeNonPublisher implements TreePublisher<any, any> {
	publishResult(_state: BlueshellState, _event: any, _topLevel: boolean): void {
		// no-op
		return;
	}
	configure(_options: object): void {
		// no-op
		return;
	}
}

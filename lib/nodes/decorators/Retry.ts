import {NodeStorage, BlueshellState, ResultCode, rc, BaseNode} from '../../models';
import {RepeatWhen} from './RepeatWhen';

export type RetryNodeStorage = NodeStorage & {repeats?: number};

export class Retry<S extends BlueshellState, E> extends RepeatWhen<S, E> {
	constructor(
		name: string,
		child: BaseNode<S, E>,
		private readonly numRepeats: number,
	) {
		super(
			`Retry-${name}-${numRepeats}`,
			child,
			(state: S, event: E, res: ResultCode) => {
				// Get the node storage
				const nodeStorage = this.getNodeStorage(state) as RetryNodeStorage;
				if (!nodeStorage.repeats) {
					nodeStorage.repeats = 0;
				}
				if (
					res === rc.FAILURE &&
					(this.numRepeats < 0 || nodeStorage.repeats < this.numRepeats)
				) {
					nodeStorage.repeats++;
					return true;
				} else {
					if (res === rc.SUCCESS) {
						nodeStorage.repeats = 0;
					}
					return false;
				}
			}
		);
	}

	// override getNodeStorage to explicitly return RetryNodeStorage so consumers don't need to cast types
	override getNodeStorage(state: S): RetryNodeStorage {
		return super.getNodeStorage(state);
	}
}

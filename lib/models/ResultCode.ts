/**
 * 5/30/16
 * @author Joshua Chaitin-Pollak
 */
export const resultCodes: {[K in ResultCode]: ResultCode} = {
	SUCCESS: 'SUCCESS',
	FAILURE: 'FAILURE',
	RUNNING: 'RUNNING',
	ERROR: 'ERROR',
	UNDO: 'UNDO'
};

export type ResultCode = 'SUCCESS' | 'FAILURE' | 'RUNNING' | 'ERROR' | 'UNDO';

export function isResultCode(res: any): res is ResultCode {
	return Object.values(resultCodes).includes(res);
}

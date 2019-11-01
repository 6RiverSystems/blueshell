/**
 * 5/30/16
 * @author Joshua Chaitin-Pollak
 */
export const resultCodes = {
	SUCCESS: 'SUCCESS' as 'SUCCESS',
	FAILURE: 'FAILURE' as 'FAILURE',
	RUNNING: 'RUNNING' as 'RUNNING',
	ERROR: 'ERROR' as 'ERROR',
};

export type ResultCode = 'SUCCESS' | 'FAILURE' | 'RUNNING' | 'ERROR';

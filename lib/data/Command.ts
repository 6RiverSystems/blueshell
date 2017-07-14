'use strict';

import * as uuid from 'uuid';

export class Command<CommandType, DataType> {
	id: uuid;

	channelType: string;

	channelId: string;

	command: string;

	taskType: string;

	action: string;

	location: string;

	data: DataType;

	constructor(channelType: string, channelId: string, command: string, taskType: string, action, location, data) {
		this.id = uuid.v4();

		this.channelType = channelType;
		this.channelId = channelId;
		this.command = command;
		this.taskType = taskType;
		this.action = action;
		this.location = location;
		this.data = data;
	}
}

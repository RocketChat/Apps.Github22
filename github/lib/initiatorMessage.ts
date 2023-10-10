import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ButtonStyle } from '@rocket.chat/apps-engine/definition/uikit';

export async function initiatorMessage({
	data,
	modify,
}: {
	data;
	read: IRead;
	persistence: IPersistence;
	modify: IModify;
	http: IHttp;
}) {
	const greetBuilder = await modify
		.getCreator()
		.startMessage()
		.setRoom(data.room)
		.setText(`Hey ${data.sender.username} !`);

	if (data.room.type !== 'l') {
		await modify
			.getNotifier()
			.notifyUser(data.sender, greetBuilder.getMessage());
	} else {
		await modify.getCreator().finish(greetBuilder);
	}

	const builder = await modify.getCreator().startMessage().setRoom(data.room);

	const block = modify.getCreator().getBlockBuilder();

	block.addSectionBlock({
		text: block.newPlainTextObject(
			`Choose Action for ${data.arguments[0]} 👇 ?`,
		),
	});

	block.addActionsBlock({
		blockId: 'githubdata',
		elements: [
			block.newButtonElement({
				actionId: 'githubDataSelect',
				text: block.newPlainTextObject('Overview'),
				value: `${data.arguments[0]}/repo`,
				style: ButtonStyle.PRIMARY,
			}),
			block.newButtonElement({
				actionId: 'githubDataSelect',
				text: block.newPlainTextObject('Issues'),
				value: `${data.arguments[0]}/issues`,
				style: ButtonStyle.DANGER,
			}),
			block.newButtonElement({
				actionId: 'githubDataSelect',
				text: block.newPlainTextObject('Contributors'),
				value: `${data.arguments[0]}/contributors`,
				style: ButtonStyle.PRIMARY,
			}),
			block.newButtonElement({
				actionId: 'githubDataSelect',
				text: block.newPlainTextObject('Pull Requests'),
				value: `${data.arguments[0]}/pulls`,
				style: ButtonStyle.PRIMARY,
			}),
		],
	});

	builder.setBlocks(block);

	await modify.getNotifier().notifyUser(data.sender, builder.getMessage());
}

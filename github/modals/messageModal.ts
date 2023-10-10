import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { ModalsEnum } from '../enum/Modals';
import { AppEnum } from '../enum/App';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';

export async function messageModal({
	message,
	modify,
}: {
	message: string;
	modify: IModify;
	read: IRead;
	persistence: IPersistence;
	http: IHttp;
	slashcommandcontext?: SlashCommandContext;
	uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
	const viewId = ModalsEnum.MESSAGE_MODAL_VIEW;

	const block = modify.getCreator().getBlockBuilder();

	block.addSectionBlock({
		text: {
			text: `*${message}*`,
			type: TextObjectType.MARKDOWN,
			emoji: true,
		},
	});

	return {
		id: viewId,
		title: {
			type: TextObjectType.PLAINTEXT,
			text: AppEnum.DEFAULT_TITLE,
		},
		close: block.newButtonElement({
			text: {
				type: TextObjectType.PLAINTEXT,
				text: 'Close',
			},
		}),
		blocks: block.getBlocks(),
	};
}

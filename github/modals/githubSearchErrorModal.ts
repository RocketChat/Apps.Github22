import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { ModalsEnum } from '../enum/Modals';
import { AppEnum } from '../enum/App';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';

export async function githubSearchErrorModal({
	errorMessage,
	modify,
}: {
	errorMessage?: string;
	modify: IModify;
	read: IRead;
	slashcommandcontext?: SlashCommandContext;
	uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
	const viewId = ModalsEnum.GITHUB_SEARCH_ERROR_VIEW;

	const block = modify.getCreator().getBlockBuilder();

	block.addSectionBlock({
		text: {
			text: `🤖 GitHub Search Error : ${errorMessage}`,
			type: TextObjectType.MARKDOWN,
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

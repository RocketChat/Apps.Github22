import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { BlockBuilder } from '@rocket.chat/apps-engine/definition/uikit';

export interface IButton {
	text: string;
	url?: string;
	actionId?: string;
}

export async function createSectionBlock(
	modify: IModify,
	sectionText: string,
	button?: IButton,
): Promise<BlockBuilder> {
	const blocks = modify.getCreator().getBlockBuilder();

	blocks.addSectionBlock({
		text: blocks.newMarkdownTextObject(sectionText),
	});

	if (button) {
		blocks.addActionsBlock({
			elements: [
				blocks.newButtonElement({
					actionId: button.actionId,
					text: blocks.newPlainTextObject(button.text),
					url: button.url,
				}),
			],
		});
	}

	return blocks;
}

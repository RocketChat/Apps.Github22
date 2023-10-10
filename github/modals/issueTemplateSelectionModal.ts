import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { ModalsEnum } from '../enum/Modals';
import { AppEnum } from '../enum/App';
// import { getRoomTasks, getUIData, persistUIData } from '../lib/persistence';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import {
	UIKitBlockInteractionContext,
	UIKitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';

export async function issueTemplateSelectionModal({
	data,
	modify,
	read,
	persistence,
	http,
	slashcommandcontext,
	uikitcontext,
}: {
	data?;
	modify: IModify;
	read: IRead;
	persistence: IPersistence;
	http: IHttp;
	slashcommandcontext?: SlashCommandContext;
	uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
	const viewId = ModalsEnum.ISSUE_TEMPLATE_SELECTION_VIEW;

	const block = modify.getCreator().getBlockBuilder();

	const room =
		slashcommandcontext?.getRoom() ||
		uikitcontext?.getInteractionData().room;
	const user =
		slashcommandcontext?.getSender() ||
		uikitcontext?.getInteractionData().user;

	if (user?.id && data?.repository && data?.templates?.length) {
		let repositoryName = data.repository as string;
		let templates = data.templates as Array<any>;
		block.addSectionBlock({
			text: {
				text: `Choose Issue Template for ${repositoryName}`,
				type: TextObjectType.PLAINTEXT,
			},
		});

		block.addDividerBlock();

		let index = 1;

		for (let template of templates) {
			block.addSectionBlock({
				text: {
					text: `${template.name}`,
					type: TextObjectType.PLAINTEXT,
				},
				accessory: block.newButtonElement({
					actionId: ModalsEnum.ISSUE_TEMPLATE_SELECTION_ACTION,
					text: {
						text: ModalsEnum.ISSUE_TEMPLATE_SELECTION_LABEL,
						type: TextObjectType.PLAINTEXT,
					},
					value: `${repositoryName} ${template.download_url}`,
				}),
			});
			index++;
		}
		block.addSectionBlock({
			text: {
				text: `Blank Template`,
				type: TextObjectType.PLAINTEXT,
			},
			accessory: block.newButtonElement({
				actionId: ModalsEnum.ISSUE_TEMPLATE_SELECTION_ACTION,
				text: {
					text: ModalsEnum.ISSUE_TEMPLATE_SELECTION_LABEL,
					type: TextObjectType.PLAINTEXT,
				},
				value: `${repositoryName} ${ModalsEnum.BLANK_GITHUB_TEMPLATE}`,
			}),
		});
	}

	return {
		id: viewId,
		title: {
			type: TextObjectType.PLAINTEXT,
			text: ModalsEnum.NEW_ISSUE_TITLE,
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

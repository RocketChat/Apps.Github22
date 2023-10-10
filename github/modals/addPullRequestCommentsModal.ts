import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { ModalsEnum } from '../enum/Modals';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import {
	storeInteractionRoomData,
	getInteractionRoomData,
} from '../persistance/roomInteraction';

export async function addPullRequestCommentsModal({
	data,
	modify,
	read,
	persistence,
	slashcommandcontext,
	uikitcontext,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: any;
	modify: IModify;
	read: IRead;
	persistence: IPersistence;
	http: IHttp;
	slashcommandcontext?: SlashCommandContext;
	uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
	const viewId = ModalsEnum.ADD_PULL_REQUEST_COMMENT_VIEW;
	const block = modify.getCreator().getBlockBuilder();
	const room =
		slashcommandcontext?.getRoom() ||
		uikitcontext?.getInteractionData().room;
	const user =
		slashcommandcontext?.getSender() ||
		uikitcontext?.getInteractionData().user;

	if (user?.id) {
		let roomId;

		if (room?.id) {
			roomId = room.id;
			await storeInteractionRoomData(persistence, user.id, roomId);
		} else {
			roomId = (
				await getInteractionRoomData(
					read.getPersistenceReader(),
					user.id,
				)
			).roomId;
		}

		let repoName = '';
		let pullRequestNumber = '';
		if (data?.repo?.length) {
			repoName = data?.repo;
		}
		if (data?.pullNumber?.length) {
			pullRequestNumber = data?.pullNumber;
		}
		// shows indentations in input blocks but not inn section block
		block.addInputBlock({
			blockId: ModalsEnum.REPO_NAME_INPUT,
			label: {
				text: ModalsEnum.REPO_NAME_LABEL,
				type: TextObjectType.PLAINTEXT,
			},
			element: block.newPlainTextInputElement({
				actionId: ModalsEnum.REPO_NAME_INPUT_ACTION,
				placeholder: {
					text: ModalsEnum.REPO_NAME_PLACEHOLDER,
					type: TextObjectType.PLAINTEXT,
				},
				initialValue: repoName,
			}),
		});

		block.addInputBlock({
			blockId: ModalsEnum.PULL_REQUEST_NUMBER_INPUT,
			label: {
				text: ModalsEnum.PULL_REQUEST_NUMBER_LABEL,
				type: TextObjectType.PLAINTEXT,
			},
			element: block.newPlainTextInputElement({
				actionId: ModalsEnum.PULL_REQUEST_NUMBER_INPUT_ACTION,
				placeholder: {
					text: ModalsEnum.PULL_REQUEST_NUMBER_INPUT_PLACEHOLDER,
					type: TextObjectType.PLAINTEXT,
				},
				initialValue: pullRequestNumber,
			}),
		});

		block.addInputBlock({
			blockId: ModalsEnum.PULL_REQUEST_COMMENT_INPUT,
			label: {
				text: ModalsEnum.PULL_REQUEST_COMMENT_INPUT_LABEL,
				type: TextObjectType.PLAINTEXT,
			},
			element: block.newPlainTextInputElement({
				actionId: ModalsEnum.PULL_REQUEST_COMMENT_INPUT_ACTION,
				placeholder: {
					text: ModalsEnum.PULL_REQUEST_COMMENT_INPUT_PLACEHOLDER,
					type: TextObjectType.PLAINTEXT,
				},
				multiline: true,
			}),
		});
	}

	block.addDividerBlock();

	return {
		id: viewId,
		title: {
			type: TextObjectType.PLAINTEXT,
			text: ModalsEnum.ADD_PULL_REQUEST_COMMENT_VIEW_TITLE,
		},
		close: block.newButtonElement({
			text: {
				type: TextObjectType.PLAINTEXT,
				text: 'Close',
			},
		}),
		submit: block.newButtonElement({
			actionId: ModalsEnum.ADD_SUBSCRIPTION_ACTION,
			text: {
				type: TextObjectType.PLAINTEXT,
				text: 'Comment',
			},
		}),
		blocks: block.getBlocks(),
	};
}

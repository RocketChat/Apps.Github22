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
import { IGitHubSearchResultData } from '../definitions/searchResultData';
import {
	getInteractionRoomData,
	storeInteractionRoomData,
} from '../persistance/roomInteraction';

export async function githubSearchResultShareModal({
	data,
	modify,
	read,
	persistence,
	http,
	slashcommandcontext,
	uikitcontext,
}: {
	data: IGitHubSearchResultData;
	modify: IModify;
	read: IRead;
	persistence: IPersistence;
	http: IHttp;
	slashcommandcontext?: SlashCommandContext;
	uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
	const viewId = ModalsEnum.SEARCH_RESULT_SHARE_VIEW;

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
		let finalString = `${data.search_query}  \n`;
		if (data.search_results?.length) {
			for (let searchResult of data.search_results) {
				if (searchResult.share) {
					let searchResultString = `${searchResult.result}  `;
					finalString = `${finalString} \n${searchResultString}`;
				}
			}
		}

		block.addInputBlock({
			blockId: ModalsEnum.MULTI_SHARE_SEARCH_INPUT,
			label: {
				text: ModalsEnum.MULTI_SHARE_SEARCH_INPUT_LABEL,
				type: TextObjectType.MARKDOWN,
			},
			element: block.newPlainTextInputElement({
				initialValue: `${finalString}`,
				multiline: true,
				actionId: ModalsEnum.MULTI_SHARE_SEARCH_INPUT_ACTION,
			}),
		});
	}

	block.addDividerBlock();
	return {
		id: viewId,
		title: {
			type: TextObjectType.PLAINTEXT,
			text: ModalsEnum.SEARCH_RESULT_SHARE_VIEW_TITLE,
		},
		submit: block.newButtonElement({
			text: {
				type: TextObjectType.PLAINTEXT,
				text: 'Send',
			},
		}),
		close: block.newButtonElement({
			text: {
				type: TextObjectType.PLAINTEXT,
				text: 'Close',
			},
		}),
		blocks: block.getBlocks(),
	};
}

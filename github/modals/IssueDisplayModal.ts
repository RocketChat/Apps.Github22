import {
	IModify,
	IRead,
	IPersistence,
	IHttp,
} from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import {
	TextObjectType,
	UIKitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { IGitHubIssue } from '../definitions/githubIssue';
import { ModalsEnum } from '../enum/Modals';
import { OcticonIcons } from '../enum/OcticonIcons';
import { getIssueData } from '../helpers/githubSDK';
import { CreateIssueStatsBar } from '../lib/CreateIssueStatsBar';
import { CreateReactionsBar } from '../lib/CreateReactionsBar';
import {
	getInteractionRoomData,
	storeInteractionRoomData,
} from '../persistance/roomInteraction';
import { BodyMarkdownRenderer } from '../processors/bodyMarkdowmRenderer';

export async function IssueDisplayModal({
	repoName,
	issueNumber,
	access_token,
	modify,
	read,
	persistence,
	http,
	slashcommandcontext,
	uikitcontext,
}: {
	repoName: string;
	issueNumber: string;
	access_token: string;
	modify: IModify;
	read: IRead;
	persistence: IPersistence;
	http: IHttp;
	slashcommandcontext?: SlashCommandContext;
	uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
	const viewId = ModalsEnum.USER_ISSUE_VIEW;
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
	}

	const issueInfo: IGitHubIssue = await getIssueData(
		repoName,
		issueNumber,
		access_token,
		http,
	);

	if (issueInfo.issue_id == 0) {
		block.addSectionBlock({
			text: {
				text: 'Sorry there is some issue fetching this issue, try again later',
				type: TextObjectType.PLAINTEXT,
			},
		});
		return {
			id: viewId,
			title: {
				text: 'Error',
				type: TextObjectType.PLAINTEXT,
			},
			blocks: block.getBlocks(),
		};
	}

	const lastUpdated = new Date(issueInfo.last_updated_at ?? '');

	block.addContextBlock({
		elements: [
			block.newImageElement({
				imageUrl: OcticonIcons.PENCIL,
				altText: 'Last Update At',
			}),
			block.newPlainTextObject(
				`Last Updated at ${lastUpdated.toISOString()}`,
			),
		],
	});

	CreateIssueStatsBar(issueInfo, block);

	block.addSectionBlock({
		text: {
			text: `*${issueInfo.title}*` ?? '',
			type: TextObjectType.MARKDOWN,
		},
	});
	block.addDividerBlock();

	issueInfo.reactions && CreateReactionsBar(issueInfo.reactions, block);

	issueInfo.body &&
		BodyMarkdownRenderer({ body: issueInfo.body, block: block });

	block.addActionsBlock({
		elements: [
			block.newButtonElement({
				actionId: ModalsEnum.SHARE_ISSUE_ACTION,
				value: `${repoName}, ${issueNumber}`,
				text: {
					text: 'Share Issue',
					type: TextObjectType.PLAINTEXT,
				},
			}),
			block.newButtonElement({
				actionId: ModalsEnum.ADD_GITHUB_ISSUE_ASSIGNEE,
				value: `${repoName}, ${issueNumber}`,
				text: {
					text: 'Assign Issue',
					type: TextObjectType.PLAINTEXT,
				},
			}),
		],
	});

	return {
		id: viewId,
		title: {
			text: `${repoName} \`#${issueNumber}\``,
			type: TextObjectType.MARKDOWN,
		},
		blocks: block.getBlocks(),
	};
}

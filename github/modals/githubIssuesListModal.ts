import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	AccessoryElements,
	ITextObject,
	TextObjectType,
} from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { ModalsEnum } from '../enum/Modals';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import {
	UIKitBlockInteractionContext,
	UIKitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import {
	storeInteractionRoomData,
	getInteractionRoomData,
} from '../persistance/roomInteraction';

export async function githubIssuesListModal({
	data,
	modify,
	read,
	persistence,
	http,
	slashcommandcontext,
	uikitcontext,
}: {
	data: any;
	modify: IModify;
	read: IRead;
	persistence: IPersistence;
	http: IHttp;
	slashcommandcontext?: SlashCommandContext;
	uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
	const viewId = ModalsEnum.ISSUE_LIST_VIEW;

	const block = modify.getCreator().getBlockBuilder();

	const room =
		slashcommandcontext?.getRoom() ||
		uikitcontext?.getInteractionData().room;
	const user =
		slashcommandcontext?.getSender() ||
		uikitcontext?.getInteractionData().user ||
		(await read.getUserReader().getById(data?.user_id as string));

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

		block.addSectionBlock({
			text: {
				text: `*${data.repo}*`,
				type: TextObjectType.MARKDOWN,
			},
		});

		block.addDividerBlock();
		let issueList = data?.issues;
		let index = 1;
		if (issueList && Array.isArray(issueList)) {
			for (let issue of issueList) {
				block.addSectionBlock({
					text: {
						text: `#${issue.number} ${issue.title}`,
						type: TextObjectType.PLAINTEXT,
					},
				});
				let contextBlockElementsArray = [
					block.newPlainTextObject(`User : ${issue.user_login} | `),
					block.newPlainTextObject(`Status: ${issue.state} | `),
				];
				if (issue?.labels && Array.isArray(issue.labels)) {
					let labelString = '';
					for (let label of issue.labels) {
						labelString += `${label} `;
					}
					if (labelString.length) {
						contextBlockElementsArray.push(
							block.newPlainTextObject(`labels: ${labelString} `),
						);
					}
				}
				block.addContextBlock({
					elements: contextBlockElementsArray,
				});
				let contextBlockElementAssigneesArray: Array<ITextObject> = [];
				let assigneesString = '';
				if (issue?.assignees && Array.isArray(issue.assignees)) {
					for (let assignee of issue.assignees) {
						assigneesString += `${assignee} `;
					}
					if (assigneesString.length) {
						contextBlockElementAssigneesArray.push(
							block.newPlainTextObject(
								`assignees: ${assigneesString} `,
							),
						);
					}
				}
				block.addContextBlock({
					elements: contextBlockElementAssigneesArray,
				});
				//button click actions can only detected `value:string` hence search results object must be parsed to string and stored in `value` and then reparsed to javascript object in `blockActionHandler`
				let actionBlockElementsArray = [
					block.newButtonElement({
						actionId: ModalsEnum.OPEN_GITHUB_RESULT_ACTION,
						text: {
							text: ModalsEnum.OPEN_GITHUB_RESULT_LABEL,
							type: TextObjectType.PLAINTEXT,
						},
						url: issue?.html_url?.toString(),
					}),
				];
				if (data.pushRights) {
					actionBlockElementsArray.push(
						block.newButtonElement({
							actionId: ModalsEnum.ADD_GITHUB_ISSUE_ASSIGNEE,
							text: {
								text: ModalsEnum.ADD_GITHUB_ISSUE_ASSIGNEE_LABEL,
								type: TextObjectType.PLAINTEXT,
							},
							value: `${data?.repo} ${issue.number} ${assigneesString}`,
						}),
					);
				}
				if (issue.share) {
					actionBlockElementsArray.push(
						block.newButtonElement({
							actionId:
								ModalsEnum.MULTI_SHARE_REMOVE_GITHUB_ISSUE_ACTION,
							text: {
								text: ModalsEnum.MULTI_SHARE_REMOVE_GITHUB_ISSUE_LABEL,
								type: TextObjectType.PLAINTEXT,
							},
							value: issue.issue_id as string,
						}),
					);
				} else {
					actionBlockElementsArray.push(
						block.newButtonElement({
							actionId:
								ModalsEnum.MULTI_SHARE_ADD_GITHUB_ISSUE_ACTION,
							text: {
								text: ModalsEnum.MULTI_SHARE_ADD_GITHUB_ISSUE_LABEL,
								type: TextObjectType.PLAINTEXT,
							},
							value: issue.issue_id as string,
						}),
					);
				}
				actionBlockElementsArray.push(
					block.newButtonElement({
						actionId: ModalsEnum.ISSUE_COMMENT_LIST_ACTION,
						text: {
							text: ModalsEnum.ISSUE_COMMENT_LIST_LABEL,
							type: TextObjectType.PLAINTEXT,
						},
						value: `${data?.repo} ${issue?.number}`,
					}),
				);
				block.addActionsBlock({
					elements: actionBlockElementsArray,
				});
				index++;
				block.addDividerBlock();
			}
		}
	}
	return {
		id: viewId,
		title: {
			type: TextObjectType.PLAINTEXT,
			text: ModalsEnum.GITHUB_ISSUES_TITLE,
		},
		submit: block.newButtonElement({
			text: {
				type: TextObjectType.PLAINTEXT,
				text: 'Share',
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

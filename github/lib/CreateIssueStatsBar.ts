import { BlockBuilder } from '@rocket.chat/apps-engine/definition/uikit';
import { IGitHubIssue } from '../definitions/githubIssue';
import { OcticonIcons } from '../enum/OcticonIcons';

export async function CreateIssueStatsBar(
	issueInfo: IGitHubIssue,
	block: BlockBuilder,
) {
	block.addContextBlock({
		elements: [
			block.newImageElement({
				imageUrl: OcticonIcons.COMMENTS,
				altText: 'Comments',
			}),
			block.newPlainTextObject(`${issueInfo.comments}`, false),
			block.newImageElement({
				imageUrl: OcticonIcons.ISSUE_OPEN,
				altText: 'Assignees Icon',
			}),
			block.newPlainTextObject(
				issueInfo.assignees
					? issueInfo.assignees.length == 0
						? 'No Assignees'
						: `${issueInfo.assignees.length} Assignees`
					: '',
			),
			block.newImageElement({
				imageUrl:
					issueInfo.state == 'open'
						? OcticonIcons.ISSUE_OPEN
						: OcticonIcons.ISSUE_CLOSED,
				altText: 'State',
			}),
			block.newPlainTextObject(`${issueInfo.state}`),
			block.newImageElement({
				imageUrl: issueInfo.user_avatar ?? '',
				altText: 'User Image',
			}),
			block.newPlainTextObject(
				issueInfo.user_login
					? `Created by ${issueInfo.user_login}`
					: 'Failed to Load Creator',
			),
		],
	});
}

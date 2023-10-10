/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';

export async function hasGitHubCodeSegmentLink(
	message: IMessage,
): Promise<boolean> {
	const lineNo =
		/https?:\/\/github\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+\/blob\/[A-Za-z0-9_-]+\/.+/;

	if (lineNo.test(message.text!)) {
		return true;
	}
	return false;
}

export async function isGithubLink(message: IMessage) {
	const githubLink = /(?:https?:\/\/)?(?:www\.)?github\.com\//;
	if (githubLink.test(message.text!)) {
		return true;
	}
	return false;
}

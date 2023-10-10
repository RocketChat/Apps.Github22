import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import {
	IMessage,
	IMessageAttachment,
} from '@rocket.chat/apps-engine/definition/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IMessageExtender } from '@rocket.chat/apps-engine/definition/accessors';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { GitHubURLEnum } from '../enum/GitHubURL';

async function extractCodeSnippetFromURL(
	content: string,
	url: string,
): Promise<string> {
	const lineRangeRegex: RegExp = /(?:L(\d+)+-L(\d+)|L(\d+))/;
	const lineRangeMatch: RegExpMatchArray | null = url.match(lineRangeRegex);

	if (lineRangeMatch) {
		return extractCodeSnippetByLineRange(content, lineRangeMatch);
	}

	return '';
}

function extractCodeSnippetByLineRange(
	content: string,
	lineRangeMatch: RegExpMatchArray,
): string {
	const [_, startLine, endLine, singleLine] = lineRangeMatch;

	const lineOffset = singleLine
		? parseInt(singleLine)
		: parseInt(startLine) - 1;
	const lineCount = singleLine
		? 1
		: parseInt(endLine) - parseInt(startLine) + 1;

	const linesRegex = `(?:.*\n){${lineOffset}}(.*(?:\n.*){${lineCount}})`;
	const lines = new RegExp(linesRegex);
	const match = content.match(lines);

	return match?.[1] ?? '';
}

async function fetchGitHubContent(
	http: IHttp,
	modifiedUrl: string,
): Promise<string> {
	const response: any = await http.get(modifiedUrl);
	const { content } = response;
	return content;
}

function buildCodeSnippetAttachment(
	codeSnippet: string,
	url: string,
): IMessageAttachment {
	const attachment: IMessageAttachment = {
		text: `\`\`\`\n${codeSnippet}\n\`\`\` \n[Show more...](${url})`,
		type: TextObjectType.MARKDOWN,
	};
	return attachment;
}

export async function handleGitHubCodeSegmentLink(
	message: IMessage,
	read: IRead,
	http: IHttp,
	user: IUser,
	room: IRoom,
	extend: IMessageExtender,
) {
	const urlRegex: RegExp = /\bhttps?:\/\/github\.com\/\S+\b/;
	const messageText: string = message.text!;
	const urlMatch: RegExpMatchArray | null = messageText.match(urlRegex);
	const url: string | undefined = urlMatch?.[0];
	let modifiedUrl: string = url?.replace(GitHubURLEnum.PREFIX, '')!;
	modifiedUrl = modifiedUrl.replace(
		GitHubURLEnum.HOST,
		GitHubURLEnum.RAW_HOST,
	);

	const content: string = await fetchGitHubContent(http, modifiedUrl);
	const codeSnippet = await extractCodeSnippetFromURL(content, modifiedUrl);

	if (codeSnippet) {
		const attachment: IMessageAttachment = buildCodeSnippetAttachment(
			codeSnippet,
			url!,
		);
		extend.addAttachment(attachment);
	}
}

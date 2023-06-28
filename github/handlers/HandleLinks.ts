import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IMessage, IMessageAttachment } from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IMessageExtender } from "@rocket.chat/apps-engine/definition/accessors";
import { TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { URLEnums } from "../enum/URLmodifications";

async function extractCodeSnippet(content: string, url: string): Promise<string> {
  const lineRangeRegex: RegExp = /(?:L(\d+)+-L(\d+)|L(\d+))/;
  const lineRangeMatch: RegExpMatchArray | null = url.match(lineRangeRegex);

  if (lineRangeMatch?.[2]) {
    const startLine = parseInt(lineRangeMatch[1]);
    const endLine = parseInt(lineRangeMatch[2]);
    const linesRegex = `(?:.*\n){${startLine - 1}}(.*(?:\n.*){${endLine - startLine + 1}})`;
    const lines = new RegExp(linesRegex);
    const match = content.match(lines);
    return match?.[1] ?? "";
  } else if (lineRangeMatch?.[3]) {
    const line = parseInt(lineRangeMatch[3]);
    const linesRegex = `(?:.*\n){${line - 1}}(.*(?:\n.*){5})`;
    const lines = new RegExp(linesRegex);
    const match = content.match(lines);
    return match?.[1] ?? "";
  } else {
    const linesRegex = `(?:.*\n){0}(.*(?:\n.*){5})`;
    const lines = new RegExp(linesRegex);
    const match = content.match(lines);
    return match?.[1] ?? "";
  }
}

export async function handleGitHubCodeSegmentLink(
  message: IMessage,
  read: IRead,
  http: IHttp,
  user: IUser,
  room: IRoom,
  extend: IMessageExtender
) {
  const urlRegex: RegExp = /\bhttps?:\/\/github\.com\/\S+\b/;
  const messageText: string = message.text!;
  const urlMatch: RegExpMatchArray | null = messageText.match(urlRegex);
  const url: string | undefined = urlMatch?.[0];
  let modifiedUrl: string = url?.replace(URLEnums.REPLACE_PREFIX, "")!;
  modifiedUrl = modifiedUrl.replace(URLEnums.REPLACE_HOST, URLEnums.NEW_HOST);

  const response: any = await http.get(modifiedUrl);
  const { content } = response;
  const codeSnippet = await extractCodeSnippet(content, modifiedUrl);

  const attachment: IMessageAttachment = {
    text: `\`\`\`\n${codeSnippet}\n\`\`\` \n[Show more...](${url})`,
    type: TextObjectType.MARKDOWN,
  };
  extend.addAttachment(attachment);
}

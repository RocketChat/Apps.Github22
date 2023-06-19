import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import {
    IMessage,
    IMessageAttachment,
} from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IMessageExtender } from "@rocket.chat/apps-engine/definition/accessors";
import { TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";

async function checkLines(content, url) {
    const regex: RegExp = /(?:L(\d+)+-L(\d+)|L(\d+))/;
    const match: RegExpMatchArray = url.match(regex);
    if (match[2]) {
        const endLine = parseInt(match[2]) - parseInt(match[1]);
        const lines = new RegExp(
            `(?:.*\n){${parseInt(match[1]) - 1}}(.*(?:\n.*){${endLine}})`
        );
        const text = await content.match(lines);
        return text[1];
    } else if (match[3]) {
        const lines = new RegExp(
            `(?:.*\n){${parseInt(match[3]) - 1}}(.*(?:\n.*){5})`
        );
        const text = await content.match(lines);
        return text[1];
    } else {
        const lines = new RegExp(`(?:.*\n){0}(.*(?:\n.*){5})`);
        const text = await content.match(lines);
        return text[1];
    }
}

export async function handleCodeLink(
    message: IMessage,
    read: IRead,
    http: IHttp,
    user: IUser,
    room: IRoom,
    extend: IMessageExtender
) {
    const regex: RegExp = /\bhttps?:\/\/github\.com\/\S+\b/;
    let text = message.text!;
    const match: RegExpMatchArray | null = text.match(regex);
    const result: string | undefined = match?.[0];
    let url: string = result?.replace("blob/", "")!;
    url = url.replace("github.com", "raw.githubusercontent.com");
    let response: any = await http.get(url);
    const { content } = response;
    let code = await checkLines(content, url);

    let attachment: IMessageAttachment = {
        text: `\`\`\`\n${code}\n\`\`\` \n[Show more...](${result})`,
        type: TextObjectType.MARKDOWN,
    };
    extend.addAttachment(attachment);
}
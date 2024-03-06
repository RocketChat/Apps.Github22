import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IHttp, IMessageBuilder, IMessageExtender, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IMessage, IMessageAttachment, MessageActionButtonsAlignment, MessageActionType } from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

export async function handleGithubPRLinks(
    message: IMessage,
    read: IRead,
    http: IHttp,
    user: IUser,
    room: IRoom,
    extend: IMessageExtender
) {
    const githubPRLinkRegex = /https?:\/\/github\.com\/(\S+)\/(\S+)\/pull\/(\d+)/g;
    const text = message.text!;
    let prLinkMatches: RegExpExecArray | null;
    const matches: RegExpExecArray[] = [];

    while ((prLinkMatches = githubPRLinkRegex.exec(text)) !== null) {
        matches.push(prLinkMatches);
    }

    if (matches.length > 3) {
        return;
    }

    for (const match of matches) {
        const username = match[1];
        const repositoryName = match[2];
        const pullNumber = match[3];

        const attachment: IMessageAttachment = {
            actionButtonsAlignment: MessageActionButtonsAlignment.VERTICAL,
            actions: [
                {
                    type: MessageActionType.BUTTON,
                    text: `PR Actions in ${repositoryName} #${pullNumber}`,
                    msg: `/github ${username}/${repositoryName} pulls ${pullNumber}`,
                    msg_in_chat_window: true,
                },
            ],
        };
        extend.addAttachment(attachment);
    }
}

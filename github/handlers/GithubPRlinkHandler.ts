import { IMessage, IMessageAttachment, MessageActionButtonsAlignment, MessageActionType } from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IMessageExtender, IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export async function handleGithubPRLink(
    message: IMessage,
    read: IRead,
    http: IHttp,
    user: IUser,
    room: IRoom,
    extend: IMessageExtender
) {
    const url = extractGithubPRLink(message.text!);
    if (url) {
        const prDetails = extractPRDetails(url);
        if (prDetails) {
            const attachment = createAttachment(prDetails.username, prDetails.repositoryName, prDetails.pullNumber);
            extend.addAttachment(attachment);
        }
    }
}

function extractGithubPRLink(text: string): string | undefined {
    const regex = /\bhttps?:\/\/github\.com\/\S+\/pull\/\d+\b/;
    const match = text.match(regex);
    return match?.[0];
}

function extractPRDetails(url: string): { username: string, repositoryName: string, pullNumber: string } | undefined {
    const regex = /(?:https?:\/\/github\.com\/)(\S+)\/(\S+)\/pull\/(\d+)/;
    const match = url.match(regex);
    if (match) {
        const [, username, repositoryName, pullNumber] = match;
        return { username, repositoryName, pullNumber };
    }
    return undefined;
}

function createAttachment(username: string, repositoryName: string, pullNumber: string): IMessageAttachment {
    return {
        actionButtonsAlignment: MessageActionButtonsAlignment.HORIZONTAL,
        actions: [
            {
                type: MessageActionType.BUTTON,
                text: "Manage PR",
                msg: `/github ${username}/${repositoryName} pulls ${pullNumber}`,
                msg_in_chat_window: true,
            }
        ],
    };
}

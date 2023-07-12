import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import {
    IMessage,
    IMessageAction,
    IMessageAttachment,
    MessageActionButtonsAlignment,
    MessageActionType,
} from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IMessageExtender } from "@rocket.chat/apps-engine/definition/accessors";

export async function handleGithubPRLink(
    message: IMessage,
    read: IRead,
    http: IHttp,
    user: IUser,
    room: IRoom,
    extend: IMessageExtender
) {
    const regex: RegExp = /\bhttps?:\/\/github\.com\/\S+\/pull\/\d+\b/;
    let text = message.text!;

    const match: RegExpMatchArray | null = text.match(regex);
    const result: string | undefined = match?.[0];
    const url = result;


    const regex2: RegExp = /(?:https?:\/\/github\.com\/)(\S+)\/(\S+)\/pull\/(\d+)/;
    const match2: RegExpMatchArray | undefined | null = url?.match(regex2);
    const username = match2?.[1];
    const repositoryName = match2?.[2];
    const pullNumber = match2?.[3];

    let attachment: IMessageAttachment = {
        actionButtonsAlignment: MessageActionButtonsAlignment.HORIZONTAL,
        actions: [
            {
                type: MessageActionType.BUTTON,
                text: "More Actions",
                msg: `/github ${username}/${repositoryName} pulls ${pullNumber}`,
                msg_in_chat_window: true,
            }
        ],
    };

    extend.addAttachment(attachment);
}

import {
    IMessage,
    IMessageAttachment,
    MessageActionButtonsAlignment,
    MessageActionType,
} from "@rocket.chat/apps-engine/definition/messages";
import { IRead, IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IMessageExtender } from "@rocket.chat/apps-engine/definition/accessors";

export async function handleRepoLink(
    message: IMessage,
    read: IRead,
    http: IHttp,
    user: IUser,
    room: IRoom,
    extend: IMessageExtender
) {

    const regex = /github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9-_.]+)/;
    const url = message.text!;
    const matches = url.match(regex)!;
    const owner = matches[1];
    const repo = matches[2];
    const attachment: IMessageAttachment = {
        actionButtonsAlignment: MessageActionButtonsAlignment.HORIZONTAL,
        actions: [
            {
                type: MessageActionType.BUTTON,
                text: "Issues",
                msg: `/github ${owner}/${repo} issues`,
                msg_in_chat_window: true,
            },
            {
                type: MessageActionType.BUTTON,
                text: "Contributors",
                msg: `/github ${owner}/${repo} contributors`,
                msg_in_chat_window: true,
            },
            {
                type: MessageActionType.BUTTON,
                text: "Pull Requests",
                msg: `/github ${owner}/${repo} pulls`,
                msg_in_chat_window: true,
            },

        ],
    };
    extend.addAttachment(attachment);
}
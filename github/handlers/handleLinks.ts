import { IMessage, IMessageAttachment, MessageActionButtonsAlignment, MessageActionType } from "@rocket.chat/apps-engine/definition/messages";
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
    console.log("Here");
    const regex =
    /github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9-_]+)/;
    const url = message.text!;
    console.log("Here");

    const matches = url.match(regex)!;
    console.log("Here");
    console.log(matches);
    const owner = matches[0];
    const repo = matches[1];
    console.log("here");
    console.log(owner+repo);
    const attachment:IMessageAttachment={
        actionButtonsAlignment:MessageActionButtonsAlignment.HORIZONTAL,
        actions:[{
            type:MessageActionType.BUTTON,
            text:"Overview",
            msg:`/github ${owner}/${repo}`,
            msg_in_chat_window:false
        }]
    }
    extend.addAttachment(attachment);
}

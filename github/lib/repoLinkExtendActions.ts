import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { BlockBuilder } from "@rocket.chat/apps-engine/definition/uikit";
import { ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";
export async function repoLinkExtendActions(
    message: IMessage,
    read: IRead,
    http: IHttp,
    user: IUser,
    room: IRoom
): Promise<void> {
    const appId = user.appId as string;
    const block = new BlockBuilder(appId);
    block.addActionsBlock({
        blockId: "repo-link",
        elements: [
            block.newButtonElement({
                actionId: "repo-link-star",
                text: block.newPlainTextObject("Star"),
                value: `star`,
                style: ButtonStyle.PRIMARY,
            }),
            block.newButtonElement({
                actionId: "repo-link-issue",
                text: block.newPlainTextObject("Open Issue"),
                value: `open-issue`,
                style: ButtonStyle.PRIMARY,
            }),
            block.newButtonElement({
                actionId: "issues",
                text: block.newPlainTextObject("Issues"),
                value: `issues`,
                style: ButtonStyle.PRIMARY,
            }),
            block.newButtonElement({
                actionId: "repo-link-pullrequest",
                text: block.newPlainTextObject("Pull Requests"),
                value: `pull request`,
                style: ButtonStyle.PRIMARY,
            }),
        ],
    });

    await read.getNotifier().notifyRoom(room, {
        room,
        sender: user,
        blocks: block.getBlocks(),
        text: message.text,
    });
}

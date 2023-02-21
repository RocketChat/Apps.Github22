import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { BlockBuilder } from "@rocket.chat/apps-engine/definition/uikit";
import { ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";
import { ModalsEnum } from "../enum/Modals";
export async function repoLinkExtendActions(
    message: IMessage,
    read: IRead,
    http: IHttp,
    user: IUser,
    room: IRoom
): Promise<void> {
    const appId = user.appId as string;
    const block = new BlockBuilder(appId);

    const repositoryName: string | undefined = message?.customFields?.["repo_name"];
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
                actionId: "repo-link-open",
                text: block.newPlainTextObject("Open Issue"),
                value: repositoryName,
                style: ButtonStyle.PRIMARY,
            }),
            block.newButtonElement({
                actionId: "issues",
                text: block.newPlainTextObject("Issues"),
                value: `issues`,
                style: ButtonStyle.PRIMARY,
                url: `https://github.com/${repositoryName}/issues`,
            }),
            block.newButtonElement({
                actionId: "repo-link-pullrequest",
                text: block.newPlainTextObject("Pull Requests"),
                value: `pull request`,
                style: ButtonStyle.PRIMARY,
                url: `https://github.com/${repositoryName}/pulls`,
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

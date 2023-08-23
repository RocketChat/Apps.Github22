import {
    IHttp,
    IMessageBuilder,
    IModify,
    IModifyCreator,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";
import { ModalsEnum } from "../enum/Modals";

export async function PullMessage({
    data,
    read,
    persistence,
    modify,
    http,
}: {
    data;
    read: IRead;
    persistence: IPersistence;
    modify: IModify;
    http: IHttp;
}) {

    const builder = await modify.getCreator().startMessage().setRoom(data.room);

    const block = modify.getCreator().getBlockBuilder();

    block.addSectionBlock({
        text: block.newMarkdownTextObject(
            `[${data.repository} Pull Request ${data.number}](https://github.com/${data.repository}/pull/${data.number})`
        ),
    });

    block.addActionsBlock({
        blockId: "githubdata",
        elements: [
            block.newButtonElement({
                actionId:ModalsEnum.MERGE_PULL_REQUEST_ACTION,
                text: block.newPlainTextObject("Merge"),
                value:`${data.repository} ${data?.number}`,
                style: ButtonStyle.PRIMARY,
            }),
            block.newButtonElement({
                actionId:ModalsEnum.PR_COMMENT_LIST_ACTION,
                text:block.newPlainTextObject("Comment"),
                value:`${data.repository} ${data.number}`,
                style:ButtonStyle.PRIMARY,
            }),

        ],
    });

    builder.setBlocks(block);
    
     await modify.getCreator().finish(builder);
}

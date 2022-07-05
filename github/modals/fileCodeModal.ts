import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { TextObjectType } from "@rocket.chat/apps-engine/definition/uikit/blocks";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { ModalsEnum } from "../enum/Modals";
import { AppEnum } from "../enum/App";
// import { getRoomTasks, getUIData, persistUIData } from '../lib/persistence';
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    UIKitBlockInteractionContext,
    UIKitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { type } from "os";

export async function fileCodeModal({
    data,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
}: {
    data;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.CODE_VIEW;

    const block = modify.getCreator().getBlockBuilder();

    const room =
        slashcommandcontext?.getRoom() ||
        uikitcontext?.getInteractionData().room;
    const user =
        slashcommandcontext?.getSender() ||
        uikitcontext?.getInteractionData().user;

    if (user?.id) {
        let roomId;
        const pullRawData = await http.get(data.value);
        const pullData = pullRawData.content;
        block.addSectionBlock({
            text: { text: `${pullData}`, type: TextObjectType.MARKDOWN },
        });

        // shows indentations in input blocks but not inn section block
        // block.addInputBlock({
        //     blockId: ModalsEnum.CODE_VIEW,
        //     label: { text: ModalsEnum.CODE_VIEW_LABEL, type: TextObjectType.PLAINTEXT },
        //     element: block.newPlainTextInputElement({
        //         initialValue : `${pullData}`,
        //         multiline:true,
        //         actionId: ModalsEnum.CODE_INPUT,
        //     })
        // });
    }

    block.addDividerBlock();

    block.addActionsBlock({
        elements: [
            block.newButtonElement({
                actionId: ModalsEnum.MERGE_PULL_REQUEST_ACTION,
                text: {
                    text: ModalsEnum.MERGE_PULL_REQUEST_LABEL,
                    type: TextObjectType.PLAINTEXT,
                },
                value: room?.id,
            }),
            block.newButtonElement({
                actionId: ModalsEnum.COMMENT_PR_ACTION,
                text: {
                    text: ModalsEnum.COMMENT_PR_LABEL,
                    type: TextObjectType.PLAINTEXT,
                },
                value: room?.id,
            }),
        ],
    });

    return {
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: AppEnum.DEFAULT_TITLE,
        },
        close: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Close",
            },
        }),
        blocks: block.getBlocks(),
    };
}

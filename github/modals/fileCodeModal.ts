import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
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
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { LayoutBlock } from "@rocket.chat/ui-kit";

export async function fileCodeModal({
    data,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
    id,
}: {
    data;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
    id: string;
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = ModalsEnum.CODE_VIEW;

    const room =
        slashcommandcontext?.getRoom() ||
        uikitcontext?.getInteractionData().room;
    const user =
        slashcommandcontext?.getSender() ||
        uikitcontext?.getInteractionData().user;

    const modal: IUIKitSurfaceViewParam = {
        id: viewId,
        type: UIKitSurfaceType.MODAL,
        title: {
            text: AppEnum.DEFAULT_TITLE,
            type: "plain_text",
        },
        blocks: [],
        close: {
            type: "button",
            text: {
                type: "plain_text",
                emoji: true,
                text: "Close",
            },
            appId: id,
            blockId: "submit_block",
            actionId: "",
        },
    };

    let blocks: LayoutBlock[] = [];
    if (user?.id) {
        let roomId;
        const pullRawData = await http.get(data.value);
        const pullData = pullRawData.content;

        blocks.push(
            {
                type: "section",
                text: { text: `${pullData}`, type: TextObjectType.MARKDOWN },
            },
            { type: "divider" },
        );

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

    modal.blocks = blocks;
    return modal;
}

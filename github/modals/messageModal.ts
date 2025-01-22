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
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    UIKitBlockInteractionContext,
    UIKitInteractionContext,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import {
    storeInteractionRoomData,
    getInteractionRoomData,
} from "../persistance/roomInteraction";

export async function messageModal({
    message,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
    id
}: {
    message: string;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
    id: string
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = ModalsEnum.MESSAGE_MODAL_VIEW;

    const modal: IUIKitSurfaceViewParam = {
        type: UIKitSurfaceType.MODAL,
        title: {
            type: "plain_text",
            text: AppEnum.DEFAULT_TITLE,
        },
        blocks: [
            {
                type: "section",
                text: {
                    text: `*${message}*`,
                    type: TextObjectType.MARKDOWN,
                },
            },
        ],
        close: {
            appId: id,
            type: "button",
            text: {
                type: 'plain_text',
                text: "Close",
            },
            blockId: 'close_block',
            actionId: 'close_action',
        }
    };
    return modal;
}

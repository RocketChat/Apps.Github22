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

export async function githubSearchErrorModal({
    errorMessage,
    modify,
    read,
    slashcommandcontext,
    uikitcontext,
    id,
}: {
    errorMessage?: string;
    modify: IModify;
    read: IRead;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
    id: string;
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = ModalsEnum.GITHUB_SEARCH_ERROR_VIEW;

    const modal: IUIKitSurfaceViewParam = {
        id: viewId,
        type: UIKitSurfaceType.MODAL,
        title: {
            text: AppEnum.DEFAULT_TITLE,
            type: TextObjectType.MARKDOWN,
        },
        blocks: [{
            type: 'section',
            text: {
                type: TextObjectType.MARKDOWN,
                text: `🤖 GitHub Search Error : ${errorMessage}`
            }
        }],
        close: {
            type: 'button',
            text: {
                type: 'plain_text',
                text: "Close",
            },
            actionId: '',
            blockId: '',
            appId: id,
        }
    };

    return modal;
}

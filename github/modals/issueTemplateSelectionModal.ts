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

export async function issueTemplateSelectionModal({
    data,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
    id,
}: {
    data?;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
    id: string;
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = ModalsEnum.ISSUE_TEMPLATE_SELECTION_VIEW;

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
            type: TextObjectType.PLAINTEXT,
            text: ModalsEnum.NEW_ISSUE_TITLE,
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
            blockId: "",
            actionId: "",
        },
    };

    let blocks: LayoutBlock[] = [];

    if (user?.id && data?.repository && data?.templates?.length) {
        let repositoryName = data.repository as string;
        let templates = data.templates as Array<any>;

        blocks.push(
            {
                type: "section",
                text: {
                    text: `Choose Issue Template for ${repositoryName}`,
                    type: TextObjectType.PLAINTEXT,
                },
            },
            {
                type: "divider",
            },
        );

        let index = 1;

        for (let template of templates) {

            blocks.push({
                type: 'section',
                text: {
                    text: `${template.name}`,
                    type: TextObjectType.PLAINTEXT,
                },
                accessory : {
                    type: 'button',
                    text: {
                        text: ModalsEnum.ISSUE_TEMPLATE_SELECTION_LABEL,
                        type: TextObjectType.PLAINTEXT,
                    },
                    value: `${repositoryName} ${template.download_url}`,
                    actionId: ModalsEnum.ISSUE_TEMPLATE_SELECTION_ACTION,
                    blockId: '',
                    appId: id,
                }
            })
            index++;
        }

        blocks.push({
            type: 'section',
            text: {
                text: 'Blank Template',
                type: TextObjectType.PLAINTEXT,
            },
            accessory : {
                type: 'button',
                text: {
                    text: ModalsEnum.ISSUE_TEMPLATE_SELECTION_LABEL,
                    type: TextObjectType.PLAINTEXT,
                },
                value: `${repositoryName} ${ModalsEnum.BLANK_GITHUB_TEMPLATE}`,
                actionId: ModalsEnum.ISSUE_TEMPLATE_SELECTION_ACTION,
                blockId: '',
                appId: id,
            }
        })
    }

    modal.blocks = blocks;

    return modal;
}

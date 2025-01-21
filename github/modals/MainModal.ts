import {
    IModify,
    IRead,
    IPersistence,
    IHttp,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    TextObjectType,
    UIKitInteractionContext,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { ModalsEnum } from "../enum/Modals";
import { LayoutBlock } from "@rocket.chat/ui-kit";

export async function MainModal({
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
    id,
}: {
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
    id: string;
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = ModalsEnum.MAIN_MODAL_VIEW;
    const user =
        slashcommandcontext?.getSender() ||
        uikitcontext?.getInteractionData().user;

    const modal: IUIKitSurfaceViewParam = {
        id: viewId,
        type: UIKitSurfaceType.MODAL,
        title: {
            text: ModalsEnum.MAIN_MODAL_TITLE,
            type: "plain_text",
        },
        blocks: [
            {
                type: 'context',
                blockId: ModalsEnum.MAIN_MODAL_VIEW,
                elements: [
                    {
                        type: 'plain_text',
                        text: `Hey 👋 Welcome ${user?.username}`,
                    }
                ]
            },
            {
                type: 'divider',
            },
            {
                type: 'section',
                blockId: ModalsEnum.MAIN_MODAL_VIEW,
                text: {
                    type: TextObjectType.MARKDOWN,
                    text: ModalsEnum.MAIN_MODAL_GITHUB_SEARCH_LABLE
                },
                accessory: {
                    type: 'button',
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: ModalsEnum.MAIN_MODAL_OPEN_LABLE,
                    },
                    actionId: ModalsEnum.TRIGGER_SEARCH_MODAL,
                    appId: id,
                    blockId: '',
                }
            },
            {
                type: 'context',
                blockId: ModalsEnum.MAIN_MODAL_VIEW,
                elements: [
                    {
                        type: TextObjectType.MARKDOWN,
                        text: ModalsEnum.MAIN_MODAL_GITHUB_SEARCH_DESCRIPTION,
                    }
                ]
            },
            {
                type: 'divider',
            },
            {
                type: 'section',
                blockId: ModalsEnum.MAIN_MODAL_VIEW,
                text: {
                    type: 'mrkdwn',
                    text: ModalsEnum.MAIN_MODAL_NEW_ISSUE_LABLE,
                },
                accessory: {
                    type: 'button',
                    actionId: ModalsEnum.TRIGGER_NEW_ISSUE_MODAL,
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: ModalsEnum.MAIN_MODAL_OPEN_LABLE,
                    },
                    appId: id,
                    blockId: '',
                }
            },
            {
                type: 'context',
                blockId: ModalsEnum.MAIN_MODAL_VIEW,
                elements: [
                    {
                        type: 'mrkdwn',
                        text: ModalsEnum.MAIN_MODAL_NEW_ISSUE_DESCRIPTION
                    }
                ]
            },
            {
                type: 'divider',
            },
            {
                type: 'section',
                blockId: ModalsEnum.MAIN_MODAL_VIEW,
                text: {
                    type: 'mrkdwn',
                    text: ModalsEnum.MAIN_MODAL_REPOSITORY_SUBSCRIPTIONS_LABLE,
                },
                accessory: {
                    type: 'button',
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: ModalsEnum.MAIN_MODAL_OPEN_LABLE,
                    },
                    actionId: ModalsEnum.TRIGGER_SUBSCRIPTIONS_MODAL,
                    blockId: '',
                    appId: id,
                }
            },
            {
                type: 'context',
                blockId: ModalsEnum.MAIN_MODAL_VIEW,
                elements: [
                    {
                        type: 'mrkdwn',
                        text: ModalsEnum.MAIN_MODAL_REPOSITORY_SUBSCRIPTIONS_DESCRIPTION
                    }
                ]
            },
            {
                type: 'divider',
            },
            {
                blockId: ModalsEnum.MAIN_MODAL_VIEW,
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: ModalsEnum.MAIN_MODAL_ASSIGN_ISSUES_LABLE,
                },
                accessory: {
                    type: 'button',
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: ModalsEnum.MAIN_MODAL_OPEN_LABLE,
                    },
                    actionId: ModalsEnum.TRIGGER_ASSIGN_ISSUES_MODAL,
                    blockId: '',
                    appId: id,
                }
            },
            {
                type: 'context',
                blockId: ModalsEnum.MAIN_MODAL_VIEW,
                elements: [
                    {
                        type: 'mrkdwn',
                        text: ModalsEnum.MAIN_MODAL_ASSIGN_ISSUES_DESCRIPTION,
                    }
                ]
            },
            {
                type: 'divider',
            }
        ],
        close: {
            type: "button",
            text: {
                type: "plain_text",
                emoji: true,
                text: "Close",
            },
            appId: id,
            actionId: '',
            blockId: '',
        },
    };

    return modal;
}

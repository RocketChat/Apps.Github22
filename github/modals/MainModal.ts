import { IModify, IRead, IPersistence, IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { TextObjectType, UIKitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { ModalsEnum } from "../enum/Modals";

export async function MainModal(
    {
        modify,
        read,
        persistence,
        http,
        slashcommandcontext,
        uikitcontext,
    }: {
        modify: IModify;
        read: IRead;
        persistence: IPersistence;
        http: IHttp;
        slashcommandcontext?: SlashCommandContext;
        uikitcontext?: UIKitInteractionContext;
    }): Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.MAIN_MODAL_VIEW;
    const block = modify.getCreator().getBlockBuilder();

    const room = slashcommandcontext?.getRoom() || uikitcontext?.getInteractionData().room;
    const user = slashcommandcontext?.getSender() || uikitcontext?.getInteractionData().user;

    block.addContextBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        elements: [
            block.newMarkdownTextObject(`Hey 👋 Welcome ${user?.username}`),
        ],

    });

    block.addDividerBlock();


    // Github Search
    block.addSectionBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        text: block.newMarkdownTextObject("Github Search"),
    })
    block.addContextBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        elements: [
            block.newMarkdownTextObject("Search Github and share your resources on the channel"),
        ],
    });

    block.addActionsBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        elements: [
            block.newButtonElement({
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: "Open",
                },
                actionId: ModalsEnum.TRIGGER_SEARCH_MODAL,
                value: "search",
            }),
        ],
    });

    block.addDividerBlock();

    // New Issues 
    block.addSectionBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        text: block.newMarkdownTextObject("New Issues"),
    })
    block.addContextBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        elements: [
            block.newMarkdownTextObject("Create new issues on Github"),
        ],
    });
    block.addActionsBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        elements: [
            block.newButtonElement({
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: "Open",
                },
                actionId: ModalsEnum.TRIGGER_NEW_ISSUE_MODAL,
                value: "search",
            }),
        ],
    });
    block.addDividerBlock();


    // Repository Subscriptions
    block.addSectionBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        text: block.newMarkdownTextObject("Repsoitory Subscriptions"),
    })
    block.addContextBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        elements: [
            block.newMarkdownTextObject("Subscribe to repositories Events"),
        ],
    });

    block.addActionsBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        elements: [
            block.newButtonElement({
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: "Open",
                },
                actionId: ModalsEnum.TRIGGER_SUBSCRIPTIONS_MODAL,
                value: "search",
            }),
        ],
    });

    block.addDividerBlock();


    //  Assign Issues
    block.addSectionBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        text: block.newMarkdownTextObject("Assign Issues"),
    })
    block.addContextBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        elements: [
            block.newMarkdownTextObject("Assign Issues to your team members"),
        ],
    });

    block.addActionsBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        elements: [
            block.newButtonElement({
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: "Open",
                },
                actionId: ModalsEnum.TRIGGER_ASSIGN_ISSUES_MODAL,
                value: "assign",
            }),
        ],
    });

    block.addDividerBlock();

    return {
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: ModalsEnum.MAIN_MODAL_TITLE
        },
        close: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Close",
            }
        }),
        blocks: block.getBlocks(),

    };
}
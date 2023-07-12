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

    const user = slashcommandcontext?.getSender() || uikitcontext?.getInteractionData().user;

    block.addContextBlock(
        {
             blockId: ModalsEnum.MAIN_MODAL_VIEW,
             elements: [
                 block.newMarkdownTextObject(`Hey 👋 Welcome ${user?.username}`),
             ],
         }
     );

    block.addDividerBlock();

    block.addSectionBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        text: block.newMarkdownTextObject(ModalsEnum.MAIN_MODAL_GITHUB_SEARCH_LABLE),
        accessory: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: ModalsEnum.MAIN_MODAL_OPEN_LABLE,
            },
            actionId: ModalsEnum.TRIGGER_SEARCH_MODAL,
        }),
    })

    block.addContextBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        elements: [
            block.newMarkdownTextObject(ModalsEnum.MAIN_MODAL_GITHUB_SEARCH_DESCRIPTION),
        ],
    });

    block.addDividerBlock();

    block.addSectionBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        text: block.newMarkdownTextObject(ModalsEnum.MAIN_MODAL_NEW_ISSUE_LABLE),
        accessory: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: ModalsEnum.MAIN_MODAL_OPEN_LABLE,
            },
            actionId: ModalsEnum.TRIGGER_NEW_ISSUE_MODAL,
        }),
    });

    block.addContextBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        elements: [
            block.newMarkdownTextObject(ModalsEnum.MAIN_MODAL_NEW_ISSUE_DESCRIPTION),
        ],
    });

    block.addDividerBlock();

    block.addSectionBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        text: block.newMarkdownTextObject(ModalsEnum.MAIN_MODAL_REPOSITORY_SUBSCRIPTIONS_LABLE),
        accessory: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: ModalsEnum.MAIN_MODAL_OPEN_LABLE,
            },
            actionId: ModalsEnum.TRIGGER_SUBSCRIPTIONS_MODAL,
        }),
    })

    block.addContextBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        elements: [
            block.newMarkdownTextObject(ModalsEnum.MAIN_MODAL_REPOSITORY_SUBSCRIPTIONS_DESCRIPTION),
        ],
    });

    block.addDividerBlock();

    block.addSectionBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        text: block.newMarkdownTextObject(ModalsEnum.MAIN_MODAL_ASSIGN_ISSUES_LABLE),
        accessory: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: ModalsEnum.MAIN_MODAL_OPEN_LABLE,
            },
            actionId: ModalsEnum.TRIGGER_ASSIGN_ISSUES_MODAL,
        }),
    })

    block.addContextBlock({
        blockId: ModalsEnum.MAIN_MODAL_VIEW,
        elements: [
            block.newMarkdownTextObject(ModalsEnum.MAIN_MODAL_ASSIGN_ISSUES_DESCRIPTION),
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
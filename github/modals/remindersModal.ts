import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ITextObject, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { ModalsEnum } from '../enum/Modals';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UIKitBlockInteractionContext, UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { getUserReminder } from '../persistance/remind';
import { IReminder } from '../definitions/Reminder';

export async function reminderModal({ modify, read, persistence, http, slashcommandcontext, uikitcontext }: { modify: IModify, read: IRead, persistence: IPersistence, http: IHttp, slashcommandcontext?: SlashCommandContext, uikitcontext?: UIKitInteractionContext }): Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.REMINDER_LIST_MODAL_VIEW;

    const block = modify.getCreator().getBlockBuilder();

    const room = slashcommandcontext?.getRoom() || uikitcontext?.getInteractionData().room;
    const user = slashcommandcontext?.getSender() || uikitcontext?.getInteractionData().user;

    block.addDividerBlock();

    if (user?.id) {
        const reminders: IReminder = await getUserReminder(read, user);

        if (reminders && reminders.repos.length > 0) {
            for (let repository of reminders.repos) {
                block.addSectionBlock({
                    text: { text: `${repository}`, type: TextObjectType.PLAINTEXT },
                    accessory: block.newButtonElement({
                        actionId: ModalsEnum.OPEN_REPO_ACTION,
                        text: {
                            text: ModalsEnum.OPEN_REPO_LABEL,
                            type: TextObjectType.PLAINTEXT
                        },
                        url: `https://github.com/${repository}`
                    })
                });

                block.addDividerBlock();
            }
        } else {
            block.addSectionBlock({
                text: { text: "You have no reminders.", type: TextObjectType.PLAINTEXT }
            });
        }
    }

    return {
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: "Reminder List",
        },
        close: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: 'Close',
            },
        }),
        blocks: block.getBlocks(),
    };
}
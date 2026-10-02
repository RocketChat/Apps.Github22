import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IButtonElement, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit/blocks";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { ModalsEnum } from "../enum/Modals";
import { AppEnum } from "../enum/App";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    UIKitBlockInteractionContext,
    UIKitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { storeInteractionRoomData, getInteractionRoomData } from "../persistance/roomInteraction";
import { AppSettingsEnum, isActionOn } from "../settings/settings";

export async function pullDetailsModal({
    data,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
}: {
    data?;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.PULL_VIEW;

    const block = modify.getCreator().getBlockBuilder();
    const showChanges = await isActionOn(read, AppSettingsEnum.PRViewChangesID);
    let pullHtmlUrl: string | undefined;

    const room =
        slashcommandcontext?.getRoom() ||
        uikitcontext?.getInteractionData().room;
    const user =
        slashcommandcontext?.getSender() ||
        uikitcontext?.getInteractionData().user;

    if (user?.id) {
        let roomId;
        if (room?.id) {
            roomId = room.id;
            await storeInteractionRoomData(persistence, user.id, roomId);
        } else {
            roomId = (await getInteractionRoomData(read.getPersistenceReader(), user.id)).roomId;
        }

        const pullRawData = await http.get(
            `https://api.github.com/repos/${data?.repository}/pulls/${data?.number}`
        );

        // If pullsNumber doesn't exist, notify the user
        if (pullRawData.statusCode === 404) {
            block.addSectionBlock({
                text: {
                    text: `Pull request #${data?.number} doesn't exist.`,
                    type: TextObjectType.PLAINTEXT,
                },
            });

            return {
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

        const pullData = pullRawData.data;
        pullHtmlUrl = pullData?.html_url;

        const pullRequestFilesRaw = await http.get(
            `https://api.github.com/repos/${data?.repository}/pulls/${data?.number}/files`
        );

        const pullRequestFiles = pullRequestFilesRaw.data;

        block.addSectionBlock({
            text: {
                text: `*[${pullData?.title}](${pullData?.html_url})*`,
                type: TextObjectType.MARKDOWN,
            },
            accessory: showChanges
                ? block.newButtonElement({
                      actionId: ModalsEnum.VIEW_FILE_ACTION,
                      text: {
                          text: ModalsEnum.VIEW_DIFFS_ACTION_LABEL,
                          type: TextObjectType.PLAINTEXT,
                      },
                      value: pullData["diff_url"],
                  })
                : undefined,
        });
        block.addContextBlock({
            elements: [
                block.newPlainTextObject(`Author: ${pullData?.user?.login} | `),
                block.newPlainTextObject(`State : ${pullData?.state} | `),
                block.newPlainTextObject(`Mergeable : ${pullData?.mergeable}`),
            ],
        });

        block.addDividerBlock();

        let index = 1;

        for (let file of pullRequestFiles) {
            let fileName = file["filename"];
            let rawUrl = file["raw_url"];
            let status = file["status"];
            let addition = file["additions"];
            let deletions = file["deletions"];
            block.addSectionBlock({
                text: {
                    text: `${index} ${fileName}`,
                    type: TextObjectType.PLAINTEXT,
                },
                accessory: showChanges
                    ? block.newButtonElement({
                          actionId: ModalsEnum.VIEW_FILE_ACTION,
                          text: {
                              text: ModalsEnum.VIEW_FILE_ACTION_LABEL,
                              type: TextObjectType.PLAINTEXT,
                          },
                          value: rawUrl,
                      })
                    : undefined,
            });
            block.addContextBlock({
                elements: [
                    block.newPlainTextObject(`Status: ${status} | `),
                    block.newPlainTextObject(`Additions : ${addition} | `),
                    block.newPlainTextObject(`Deletions : ${deletions}`),
                ],
            });

            index++;
        }
    }

    const actions = [
        { setting: AppSettingsEnum.PRViewMergeID, actionId: ModalsEnum.MERGE_PULL_REQUEST_ACTION, label: ModalsEnum.MERGE_PULL_REQUEST_LABEL },
        { setting: AppSettingsEnum.PRViewCommentsID, actionId: ModalsEnum.PR_COMMENT_LIST_ACTION, label: ModalsEnum.PR_COMMENT_LIST_LABEL },
        { setting: AppSettingsEnum.PRViewApproveID, actionId: ModalsEnum.APPROVE_PULL_REQUEST_ACTION, label: ModalsEnum.APPROVE_PULL_REQUEST_LABEL },
    ];
    const elements: IButtonElement[] = [];
    for (const action of actions) {
        if (await isActionOn(read, action.setting)) {
            elements.push(
                block.newButtonElement({
                    actionId: action.actionId,
                    text: {
                        text: action.label,
                        type: TextObjectType.PLAINTEXT,
                    },
                    value: `${data?.repository} ${data?.number}`,
                })
            );
        }
    }
    if (pullHtmlUrl) {
        elements.push(
            block.newButtonElement({
                actionId: ModalsEnum.VIEW_PULL_REQUEST_ON_GITHUB_ACTION,
                text: {
                    text: ModalsEnum.VIEW_PULL_REQUEST_ON_GITHUB_LABEL,
                    type: TextObjectType.PLAINTEXT,
                },
                url: pullHtmlUrl,
            })
        );
    }
    if (elements.length) {
        block.addActionsBlock({ elements });
    }

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

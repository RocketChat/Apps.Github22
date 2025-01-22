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
import { LayoutBlock } from "@rocket.chat/ui-kit";
import { getRepoData } from "../helpers/githubSDK";
import { AppSettingsEnum } from "../settings/settings";
import { GitHubApi } from "../helpers/githubSDKclass";

export async function pullDetailsModal({
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
    const viewId = ModalsEnum.PULL_VIEW;
    const room =
        slashcommandcontext?.getRoom() ||
        uikitcontext?.getInteractionData().room;
    const user =
        slashcommandcontext?.getSender() ||
        uikitcontext?.getInteractionData().user;
    let repoDetails: any;
    let pushRights: boolean = false;

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
                text: "Close",
            },
            appId: id,
            blockId: "close_block",
            actionId: "close_action",
        },
    };

    let blocks: LayoutBlock[] = [];
    if (user?.id) {
        let roomId;

        if (room?.id) {
            roomId = room.id;
            await storeInteractionRoomData(persistence, user.id, roomId);
        } else {
            roomId = (
                await getInteractionRoomData(
                    read.getPersistenceReader(),
                    user.id,
                )
            ).roomId;
        }

        let userInfo: any;
        try {
            let BaseHost = await read
                .getEnvironmentReader()
                .getSettings()
                .getValueById(AppSettingsEnum.BaseHostID);
            let BaseApiHost = await read
                .getEnvironmentReader()
                .getSettings()
                .getValueById(AppSettingsEnum.BaseApiHostID);
            const gitHubApiClient = new GitHubApi(
                http,
                data?.accessToken.token,
                BaseHost,
                BaseApiHost,
            );
            userInfo = await gitHubApiClient.getBasicUserInfo();
        } catch (error) {
            console.log("Error occurred while fetching user info:", error);
        }

        const pullRawData = await http.get(
            `https://api.github.com/repos/${data?.repository}/pulls/${data?.number}`,
        );

        if (data?.accessToken) {
            repoDetails = await getRepoData(
                http,
                data?.repository,
                data?.accessToken.token,
            );
            pushRights =
                repoDetails?.permissions?.push ||
                repoDetails?.permissions?.admin;
        }

        // If pullsNumber doesn't exist, notify the user
        if (pullRawData.statusCode === 404) {
            blocks.push({
                type: "section",
                text: {
                    text: `Pull request #${data?.number} doesn't exist.`,
                    type: TextObjectType.PLAINTEXT,
                },
            });

            modal.blocks = blocks;

            return modal;
        }

        const pullData = pullRawData.data;

        const pullRequestFilesRaw = await http.get(
            `https://api.github.com/repos/${data?.repository}/pulls/${data?.number}/files`,
        );

        const pullRequestFiles = pullRequestFilesRaw.data;

        blocks.push({
            type: "section",
            text: {
                text: `*${pullData?.title}*`,
                type: TextObjectType.MARKDOWN,
            },
            accessory: {
                type: "button",
                actionId: ModalsEnum.VIEW_FILE_ACTION,
                text: {
                    text: ModalsEnum.VIEW_DIFFS_ACTION_LABEL,
                    type: TextObjectType.PLAINTEXT,
                },
                appId: id,
                blockId: "view-diffs-block",
                value: pullData["diff_url"],
            },
        });

        blocks.push({
            type: "context",
            elements: [
                {
                    type: "plain_text",
                    text: `Author: ${pullData?.user?.login} | `,
                },
                {
                    type: "plain_text",
                    text: `State : ${pullData?.state} | `,
                },
                {
                    type: "plain_text",
                    text: `Mergeable : ${pullData?.mergeable}`,
                },
            ],
        });

        blocks.push({
            type: "divider",
        });

        let actionElements: any = [];

        // Display the button based on merge access and whether the pull request is mergeable or not.
        if (pullData?.mergeable && pushRights) {
            actionElements.push({
                appId: id,
                type: "button",
                actionId: ModalsEnum.MERGE_PULL_REQUEST_ACTION,
                text: {
                    text: ModalsEnum.MERGE_PULL_REQUEST_LABEL,
                    type: TextObjectType.PLAINTEXT,
                },
                value: `${data?.repository} ${data?.number}`,
                blockId: "MERGE_PULL_REQUEST_BLOCK",
            });
        }

        actionElements.push({
            appId: id,
            type: "button",
            actionId: ModalsEnum.PR_COMMENT_LIST_ACTION,
            text: {
                text: ModalsEnum.PR_COMMENT_LIST_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            value: `${data?.repository} ${data?.number}`,
            blockId: "PR_COMMENT_LIST_BLOCK",
        });

        // Display the approve button if the user is not attempting self-approval and if the pull request has not already been merged.
        if (!pullData?.merged && (userInfo?.username !== pullData.head.user.login)) {
            actionElements.push({
                appId: id,
                type: "button",
                actionId: ModalsEnum.APPROVE_PULL_REQUEST_ACTION,
                text: {
                    text: ModalsEnum.APPROVE_PULL_REQUEST_LABEL,
                    type: TextObjectType.PLAINTEXT,
                },
                value: `${data?.repository} ${data?.number}`,
                blockId: "APPROVE_PULL_REQUEST_BLOCK",
            });
        }
        let index = 1;

        for (let file of pullRequestFiles) {
            let fileName = file["filename"];
            let rawUrl = file["raw_url"];
            let status = file["status"];
            let addition = file["additions"];
            let deletions = file["deletions"];

            blocks.push({
                type: "section",
                text: {
                    text: `${index} ${fileName}`,
                    type: TextObjectType.PLAINTEXT,
                },
                accessory: {
                    type: "button",
                    actionId: ModalsEnum.VIEW_FILE_ACTION,
                    text: {
                        text: ModalsEnum.VIEW_DIFFS_ACTION_LABEL,
                        type: TextObjectType.PLAINTEXT,
                    },
                    appId: id,
                    blockId: "view-diffs-block",
                    value: rawUrl,
                },
            });

            blocks.push({
                type: "context",
                elements: [
                    {
                        type: "plain_text",
                        text: `Status: ${status} | `,
                    },
                    {
                        type: "plain_text",
                        text: `Additions : ${addition} | `,
                    },
                    {
                        type: "plain_text",
                        text: `Deletions : ${deletions}`,
                    },
                ],
            });

            index++;
        }
        blocks.push({
            type: "actions",
            elements: actionElements,
        });
    }

    modal.blocks = blocks;
    return modal;
}

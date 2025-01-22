import {
    IModify,
    IRead,
    IPersistence,
    IHttp,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    ButtonStyle,
    TextObjectType,
    UIKitInteractionContext,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { ModalsEnum } from "../enum/Modals";
import { OcticonIcons } from "../enum/OcticonIcons";
import { getBasicUserInfo, getUserAssignedIssues } from "../helpers/githubSDK";
import {
    getInteractionRoomData,
    storeInteractionRoomData,
} from "../persistance/roomInteraction";
import { LayoutBlock } from "@rocket.chat/ui-kit";

export async function userIssuesModal({
    filter,
    access_token,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
    id,
}: {
    filter: {
        filter: string;
        state: string;
        sort: string;
    };
    access_token: String;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
    id: string;
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = ModalsEnum.USER_ISSUE_VIEW;
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
            type: "plain_text",
            text: "Your Issues",
        },
        blocks: [],
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
    }

    const userInfo = await getBasicUserInfo(http, access_token);

    const repoInfo = await getUserAssignedIssues(
        http,
        userInfo.username,
        access_token,
        filter,
    );

    blocks.push({
        type: "actions",
        elements: [
            {
                type: "static_select",
                placeholder: {
                    text: "Select an Issue Filter",
                    type: TextObjectType.PLAINTEXT,
                },
                initialValue: filter.filter,
                actionId: ModalsEnum.SWITCH_ISSUE_FILTER,
                options: [
                    {
                        value: ModalsEnum.ASSIGNED_ISSUE_FILTER,
                        text: {
                            text: "Assigned",
                            type: TextObjectType.PLAINTEXT,
                        },
                    },
                    {
                        value: ModalsEnum.CREATED_ISSUE_FILTER,
                        text: {
                            text: "Created",
                            type: TextObjectType.PLAINTEXT,
                        },
                    },
                    {
                        value: ModalsEnum.MENTIONED_ISSUE_FILTER,
                        text: {
                            text: "Mentioned",
                            type: TextObjectType.PLAINTEXT,
                        },
                    },
                ],
                blockId: "",
                appId: id,
            },
        ],
    });

    blocks.push({
        type: "actions",
        elements: [
            {
                type: "static_select",
                placeholder: {
                    text: "Select Issues State",
                    type: TextObjectType.PLAINTEXT,
                },
                initialValue: filter.state,
                actionId: ModalsEnum.SWITCH_ISSUE_STATE,
                blockId: "",
                appId: id,
                options: [
                    {
                        value: ModalsEnum.ISSUE_STATE_OPEN,
                        text: {
                            text: "Open Issues",
                            type: TextObjectType.PLAINTEXT,
                        },
                    },
                    {
                        value: ModalsEnum.ISSUE_STATE_CLOSED,
                        text: {
                            text: "Closed Issues",
                            type: TextObjectType.PLAINTEXT,
                        },
                    },
                ],
            },
            {
                type: "static_select",
                placeholder: {
                    text: "Sort Issues By...",
                    type: TextObjectType.PLAINTEXT,
                },
                initialValue: filter.state,
                actionId: ModalsEnum.SWITCH_ISSUE_STATE,
                blockId: "",
                appId: id,
                options: [
                    {
                        value: ModalsEnum.ISSUE_SORT_UPDATED,
                        text: {
                            text: "Updated",
                            type: TextObjectType.PLAINTEXT,
                        },
                    },
                    {
                        value: ModalsEnum.ISSUE_STATE_CLOSED,
                        text: {
                            text: "Closed Issues",
                            type: TextObjectType.PLAINTEXT,
                        },
                    },
                    {
                        value: ModalsEnum.ISSUE_SORT_COMMENTS,
                        text: {
                            text: "Comments",
                            type: TextObjectType.PLAINTEXT,
                        },
                    },
                ],
            },
        ],
    });

    if (repoInfo.length == 0) {
        blocks.push({
            type: "context",
            elements: [
                {
                    type: "plain_text",
                    text: "Sorry, there are no issues to display",
                },
            ],
        });
    } else {
        repoInfo.map((value) => {
            const repoURL = value.repo_url ?? "";
            const repoName = repoURL.substring(29, repoURL.length);

            blocks.push({
                type: "context",
                elements: [
                    {
                        type: "image",
                        imageUrl: OcticonIcons.REPOSITORY,
                        altText: "REPO_ICON",
                    },
                    {
                        type: "plain_text",
                        text: repoName,
                    },
                    {
                        type: "image",
                        imageUrl: value.user_avatar ?? "",
                        altText: "User Image",
                    },
                    {
                        type: "plain_text",
                        text: value.user_login ?? "",
                    },
                ],
            });

            blocks.push({
                type: "section",
                text: {
                    text: `\`#${value.number}\` ${value.title}` ?? "None",
                    type: TextObjectType.MARKDOWN,
                },
            });
            const lastUpdated = new Date(value.last_updated_at ?? "");

            blocks.push({
                type: "context",
                elements: [
                    {
                        type: "image",
                        imageUrl: OcticonIcons.COMMENTS,
                        altText: "Comments",
                    },
                    {
                        type: "plain_text",
                        text: `${value.comments}`,
                    },
                    {
                        type: "image",
                        imageUrl: OcticonIcons.ISSUE_OPEN,
                        altText: "Assignees Icon",
                    },
                    {
                        type: "plain_text",
                        text: value.assignees
                            ? value.assignees.length == 0
                                ? "No Assignees"
                                : `${value.assignees.length} Assignees`
                            : "",
                    },
                    {
                        type: "image",
                        imageUrl:
                            value.state == "open"
                                ? OcticonIcons.ISSUE_OPEN
                                : OcticonIcons.ISSUE_CLOSED,
                        altText: "State",
                    },
                    {
                        type: 'plain_text',
                        text: `${value.state}`,
                    },
                    {
                        type: 'image',
                        imageUrl: OcticonIcons.PENCIL,
                        altText: "Last Update At",
                    },
                    {
                        type: 'plain_text',
                        text: `Last Updated at ${lastUpdated.toUTCString()}`,
                    }
                ],
            });

            blocks.push({
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        actionId: ModalsEnum.SHARE_ISSUE_ACTION,
                        value: `${repoName}, ${value.number}`,
                        text: {
                            text: "Share Issue",
                            type: TextObjectType.PLAINTEXT,
                        },
                        style: ButtonStyle.PRIMARY,
                        blockId: '',
                        appId: id,
                    },
                    {
                        type: 'button',
                        actionId: ModalsEnum.TRIGGER_ISSUE_DISPLAY_MODAL,
                        value: `${repoName}, ${value.number}`,
                        text: {
                            text: "Open Issue",
                            type: TextObjectType.PLAINTEXT,
                        },
                        style: ButtonStyle.PRIMARY,
                        blockId: '',
                        appId: id,
                    },
                    {
                        type: 'button',
                        actionId: ModalsEnum.ADD_GITHUB_ISSUE_ASSIGNEE_PROFILE,
                        value: `${repoName}, ${value.number}`,
                        text: {
                            text: "Assign Issue",
                            type: TextObjectType.PLAINTEXT,
                        },
                        style: ButtonStyle.PRIMARY,
                        blockId: '',
                        appId: id,
                    },
                ]
            })
            blocks.push({
                type: 'divider',
            })
        });
    }

    modal.blocks = blocks;
    return modal;
}

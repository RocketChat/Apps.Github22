import { IModify, IRead, IPersistence, IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { ButtonStyle, TextObjectType, UIKitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { ModalsEnum } from "../enum/Modals";
import { OcticonIcons } from "../enum/OcticonIcons";
import { getBasicUserInfo, getUserAssignedIssues } from "../helpers/githubSDK";
import { getInteractionRoomData, storeInteractionRoomData } from "../persistance/roomInteraction";

export async function userIssuesModal ({
    filter = {
        filter : ModalsEnum.ALL_ISSUE_FILTER,
        state : ModalsEnum.ISSUE_STATE_OPEN,
        sort : ModalsEnum.ISSUE_SORT_CREATED
    },
    access_token,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext
} : {
    filter?: {
        filter : String,
        state : String,
        sort : String
    },
    access_token: String,
    modify : IModify,
    read: IRead,
    persistence: IPersistence,
    http: IHttp,
    slashcommandcontext?: SlashCommandContext,
    uikitcontext?: UIKitInteractionContext
}) : Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.USER_ISSUE_VIEW;
    const block = modify.getCreator().getBlockBuilder();
    const room = slashcommandcontext?.getRoom() || uikitcontext?.getInteractionData().room;
    const user = slashcommandcontext?.getSender() || uikitcontext?.getInteractionData().user;

    if (user?.id){
        let roomId;
        if (room?.id){
            roomId = room.id;
            await storeInteractionRoomData(persistence, user.id, roomId);
        }
        else {
            roomId = (await getInteractionRoomData(read.getPersistenceReader(), user.id)).roomId;
        }
    }

    const userInfo = await getBasicUserInfo(http, access_token);

    const repoInfo = await getUserAssignedIssues(http,userInfo.username, access_token, filter);


    block.addActionsBlock({
        elements : [
            block.newStaticSelectElement({
                actionId : ModalsEnum.SWITCH_ISSUE_FILTER,
                placeholder : {
                    text : "Select an Issue Filter",
                    type : TextObjectType.PLAINTEXT
                },
                initialValue : ModalsEnum.ASSIGNED_ISSUE_FILTER,
                options : [
                   {
                    value : ModalsEnum.ASSIGNED_ISSUE_FILTER,
                    text : {
                        text : "Assigned",
                        type : TextObjectType.PLAINTEXT
                    }
                   },
                   {
                    value : ModalsEnum.CREATED_ISSUE_FILTER,
                    text : {
                        text : "Created",
                        type : TextObjectType.PLAINTEXT
                    }
                   },
                   {
                    value : ModalsEnum.MENTIONED_ISSUE_FILTER,
                    text : {
                        text : "Mentioned",
                        type : TextObjectType.PLAINTEXT
                    }
                   }
                ]
            })
        ]
    });

    block.addActionsBlock({
        elements : [
            block.newStaticSelectElement({
                actionId : ModalsEnum.SWITCH_ISSUE_STATE,
                placeholder : {
                    text : "Select Issues State",
                    type : TextObjectType.PLAINTEXT
                },
                initialValue : ModalsEnum.ISSUE_STATE_OPEN,
                options : [
                    {
                        value : ModalsEnum.ISSUE_STATE_OPEN,
                        text : {
                            text : "Open Issues",
                            type : TextObjectType.PLAINTEXT
                        },
                    },
                    {
                        value : ModalsEnum.ISSUE_STATE_CLOSED,
                        text : {
                            text: "Closed Issues",
                            type : TextObjectType.PLAINTEXT
                        }
                    },
                    {
                        value : ModalsEnum.ISSUE_STATE_ALL,
                        text : {
                            text : "All Issues",
                            type : TextObjectType.PLAINTEXT
                        }
                    }
                ]
            }),
            block.newStaticSelectElement({
                actionId : ModalsEnum.SWITCH_ISSUE_SORT,
                placeholder : {
                    text : "Sort Issues By...",
                    type : TextObjectType.PLAINTEXT
                },
                initialValue : ModalsEnum.ISSUE_SORT_CREATED,
                options : [
                    {
                        value : ModalsEnum.ISSUE_SORT_CREATED,
                        text : {
                            text : "Created",
                            type : TextObjectType.PLAINTEXT
                        }
                    },
                    {
                        value : ModalsEnum.ISSUE_SORT_UPDATED,
                        text : {
                            text : "Updated",
                            type : TextObjectType.PLAINTEXT
                        }
                    },
                    {
                        value : ModalsEnum.ISSUE_SORT_COMMENTS,
                        text : {
                            text : "Comments",
                            type : TextObjectType.PLAINTEXT
                        }
                    }
                ]
            }),

        ]
    });

    if (repoInfo.items.length == 0){
        block.addContextBlock({
            elements : [
                block.newPlainTextObject("Sorry, there are no issues to display")
            ]
        })
    }
    else {
        repoInfo.items.map((value) => {
            if (value.pull_request == undefined){
                const repoURL = value.repository_url as string;
                const repoName = repoURL.substring(29, repoURL.length);
                block.addContextBlock({
                    elements : [
                        block.newImageElement({
                            imageUrl : OcticonIcons.REPOSITORY,
                            altText : "REPO_ICON"
                        }),
                        block.newPlainTextObject(repoName, false),
                        block.newImageElement({
                            imageUrl : value.user.avatar_url as string,
                            altText : "User Image"
                        }),
                        block.newPlainTextObject(value.user.login)
                    ]
                })
                block.addSectionBlock({
                    text : {
                        text : `\`#${value.number}\` ${value.title}` ?? "None",
                        type : TextObjectType.MARKDOWN
                    },
                })
                const lastUpdated = new Date(value.updated_at);
                block.addContextBlock({
                    elements : [
                        block.newImageElement({
                            imageUrl : OcticonIcons.COMMENTS,
                            altText : "Comments"
                        }),
                        block.newPlainTextObject(value.comments as string, false),
                        block.newImageElement({
                            imageUrl : OcticonIcons.ISSUE_OPEN,
                            altText : "Assignees Icon"
                        }),
                        block.newPlainTextObject(value.assignees.length == 0 ? "No Assignees" : `${value.assignees.length} Assignees`),
                        block.newImageElement({
                            imageUrl : value.state == "open" ? OcticonIcons.ISSUE_OPEN : OcticonIcons.ISSUE_CLOSED,
                            altText : "State"
                        }),
                        block.newPlainTextObject(`${value.state}`),
                        block.newImageElement({
                            imageUrl : OcticonIcons.PENCIL,
                            altText : "Last Update At"
                        }),
                        block.newPlainTextObject(`Last Updated at ${lastUpdated.toUTCString()}`)

                    ]
                })

                block.addActionsBlock({
                    elements : [
                        block.newButtonElement({
                            text : {
                                text : "Share Issue",
                                type : TextObjectType.PLAINTEXT
                            },
                            style : ButtonStyle.PRIMARY
                        }),
                        block.newButtonElement({
                            text : {
                                text : "Open Issue",
                                type : TextObjectType.PLAINTEXT
                            },
                            style : ButtonStyle.PRIMARY
                        })
                    ]
                })


                block.addDividerBlock();
            }
        })
    }

    return {
        id : viewId,
        title : {
            text : "Your Issues",
            type : TextObjectType.PLAINTEXT
        },
        blocks : block.getBlocks()
    }
}

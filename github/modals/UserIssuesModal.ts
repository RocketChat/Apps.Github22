import { IModify, IRead, IPersistence, IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { TextObjectType, UIKitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { ModalsEnum } from "../enum/Modals";
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

    block.addSectionBlock({
        text : {
            text : "Issues",
            type : TextObjectType.PLAINTEXT
        },
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
                block.addSectionBlock({
                    text : {
                        text : value.title ?? "None",
                        type : TextObjectType.MARKDOWN
                    }
                })
                block.addDividerBlock();
            }
        })
    }

    // if (filter == "By Repository"){
    //     block.addSectionBlock({
    //         text : {
    //             text : "By Repository Added",
    //             type : TextObjectType.PLAINTEXT
    //         }
    //     })
    // }

    return {
        id : viewId,
        title : {
            text : "Your Issues",
            type : TextObjectType.PLAINTEXT
        },
        blocks : block.getBlocks()
    }

}

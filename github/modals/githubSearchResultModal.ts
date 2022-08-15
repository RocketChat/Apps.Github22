import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { AccessoryElements, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit/blocks";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { ModalsEnum } from "../enum/Modals";
import { AppEnum } from "../enum/App";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    UIKitBlockInteractionContext,
    UIKitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import {
    storeInteractionRoomData,
    getInteractionRoomData,
} from "../persistance/roomInteraction";
import { IGitHubSearchResult } from "../definitions/searchResult";
import { IGitHubSearchResultData } from "../definitions/searchResultData";

export async function githubSearchResultModal({
    data,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
}: {
    data:IGitHubSearchResultData;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.SEARCH_RESULT_VIEW;

    const block = modify.getCreator().getBlockBuilder();

    const room =
        slashcommandcontext?.getRoom() ||
        uikitcontext?.getInteractionData().room;
    const user =
        slashcommandcontext?.getSender() ||
        uikitcontext?.getInteractionData().user ||
        await read.getUserReader().getById(data?.user_id as string);

    if (user?.id) {
        let roomId;
        if (room?.id) {
            roomId = room.id;
            await storeInteractionRoomData(persistence, user.id, roomId);
        } else {
            roomId = (
                await getInteractionRoomData(
                    read.getPersistenceReader(),
                    user.id
                )
            ).roomId;
        }

        block.addSectionBlock({
            text: {
                text: `Total Search Results : ${data?.total_count}`,
                type: TextObjectType.PLAINTEXT,
            },
        });

        block.addDividerBlock();
        let searchItems = data?.search_results;
        let index = 1;

        if(searchItems && Array.isArray(searchItems)){
            for (let item of searchItems) {
                let title = item.title;
              
                block.addSectionBlock({
                    text: {
                        text: `#${item.number} ${title}`,
                        type: TextObjectType.PLAINTEXT,
                    },
                });
                
                //context block should only have labels section if labels exist on a resource
                let contextBlockElementsArray = [
                    block.newPlainTextObject(`User : ${item.user_login} | `),
                    block.newPlainTextObject(`Status: ${item.state} | `),
                ]
                if(item?.labels && Array.isArray(item.labels)){
                    let labelString = "";
                    for(let label of item.labels){
                        labelString += `${label.name} `
                    }
                    if(labelString.length){
                        contextBlockElementsArray.push(block.newPlainTextObject(`labels: ${labelString} `),)
                    }
                }
                block.addContextBlock({
                    elements: contextBlockElementsArray
                });
                //button click actions can only detected `value:string` hence search results object must be parsed to string and stored in `value` and then reparsed to javascript object in `blockActionHandler` 
                let actionBlockElementsArray = [
                    block.newButtonElement({
                        actionId: ModalsEnum.OPEN_GITHUB_RESULT_ACTION,
                        text: {
                            text: ModalsEnum.OPEN_GITHUB_RESULT_LABEL,
                            type: TextObjectType.PLAINTEXT,
                        },
                        url: item?.html_url?.toString()
                    }),
                    block.newButtonElement({
                        actionId: ModalsEnum.SHARE_SEARCH_RESULT_ACTION,
                        text: {
                            text: ModalsEnum.SHARE_SEARCH_RESULT_LABEL,
                            type: TextObjectType.PLAINTEXT,
                        },
                        value:`[ #${item.number} ](${item?.html_url?.toString()}) *${item.title?.toString()?.trim()}* : ${item?.html_url}`,
                    }),
                ]
                //if item is already is selected to to be shared, we rendered `remove` button, else we render `add` button
                if(item.share){
                    actionBlockElementsArray.push(
                        block.newButtonElement({
                            actionId: ModalsEnum.MULTI_SHARE_REMOVE_SEARCH_RESULT_ACTION,
                            text: {
                                text: ModalsEnum.MULTI_SHARE_REMOVE_SEARCH_RESULT_LABEL,
                                type: TextObjectType.PLAINTEXT,
                            },
                            value: item.result_id as string,
                        }),
                    );
                }else{
                    actionBlockElementsArray.push(
                        block.newButtonElement({
                            actionId: ModalsEnum.MULTI_SHARE_ADD_SEARCH_RESULT_ACTION,
                            text: {
                                text: ModalsEnum.MULTI_SHARE_ADD_SEARCH_RESULT_LABEL,
                                type: TextObjectType.PLAINTEXT,
                            },
                            value: item.result_id as string,
                        }),
                    );
                }
                //if resource is PR we need to show a code changes option and for that we need to destructure the url to find the repository and PR details
                if(item.pull_request){
                    let url = item.pull_request_url as string;
                    if(url){
                        let urlParams = url.split("/");
                        if(urlParams.length>=4){
                            let pullNumber = urlParams[urlParams.length-1]?.toString()?.trim();
                            let repoName = urlParams[urlParams.length-3]?.toString()?.trim();
                            let ownerName = urlParams[urlParams.length-4]?.toString()?.trim();
                            actionBlockElementsArray.push(
                                block.newButtonElement({
                                    actionId: ModalsEnum.VIEW_GITHUB_SEARCH_RESULT_PR_CHANGES,
                                    text: {
                                        text: ModalsEnum.VIEW_GITHUB_SEARCH_RESULT_PR_CHANGES_LABEL,
                                        type: TextObjectType.PLAINTEXT,
                                    },
                                    value:`${ownerName}/${repoName} ${pullNumber}`
                                }),
                            )
                        }
                    }
                }
                block.addActionsBlock({
                    elements: actionBlockElementsArray,
                });
    
                index++;
                block.addDividerBlock();
            }
        }
    }
    return {
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: ModalsEnum.SEARCH_VIEW_TITLE,
        },
        submit: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Share",
            },
        }),
        close: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Close",
            },
        }),
        blocks: block.getBlocks(),
    };
}

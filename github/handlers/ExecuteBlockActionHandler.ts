import {
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IApp } from "@rocket.chat/apps-engine/definition/IApp";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { basicQueryMessage } from "../helpers/basicQueryMessage";
import { ModalsEnum } from "../enum/Modals";
import { fileCodeModal } from "../modals/fileCodeModal";
import {
    IUIKitResponse,
    UIKitBlockInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { AddSubscriptionModal } from "../modals/addSubscriptionsModal";
import { deleteSubsciptionsModal } from "../modals/deleteSubscriptions";
import { deleteSubscription, updateSubscription, getIssueTemplateCode } from "../helpers/githubSDK";
import { Subscription } from "../persistance/subscriptions";
import { getAccessTokenForUser } from "../persistance/auth";
import { GithubApp } from "../GithubApp";
import { IAuthData } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";
import { storeInteractionRoomData, getInteractionRoomData } from "../persistance/roomInteraction";
import { sendMessage, sendNotification } from "../lib/message";
import { subsciptionsModal } from "../modals/subscriptionsModal";
import { pullDetailsModal } from "../modals/pullDetailsModal";
import { IGitHubSearchResult } from "../definitions/searchResult";
import { GithubSearchResultStorage } from "../persistance/searchResults";
import { IGitHubSearchResultData } from "../definitions/searchResultData";
import { githubSearchResultModal } from "../modals/githubSearchResultModal";
import { NewIssueModal } from "../modals/newIssueModal";
export class ExecuteBlockActionHandler {
    constructor(
        private readonly app: GithubApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) { }

    public async run(
        context: UIKitBlockInteractionContext
    ): Promise<IUIKitResponse> {
        const data = context.getInteractionData();

        try {
            const { actionId } = data;
            switch (actionId) {
                case "githubDataSelect": {
                    try {
                        const param = data.value;
                        let query: String = "";
                        let lengthOfRepoString: number = 0;
                        if (param && param.length) {
                            let i = param.length - 1;
                            for (
                                ;
                                i >= 0 && data.value && data.value[i] != "/";
                                i--
                            ) {
                                query = data.value[i] + query;
                            }
                            lengthOfRepoString = i;
                        }
                        const repository = param?.substring(
                            0,
                            lengthOfRepoString
                        ) as String;

                        const room: IRoom = context.getInteractionData()
                            .room as IRoom;
                        await basicQueryMessage({
                            query,
                            repository,
                            room,
                            read: this.read,
                            persistence: this.persistence,
                            modify: this.modify,
                            http: this.http,
                        });

                        return {
                            success: true,
                        };
                    } catch (err) {
                        console.error(err);
                        return {
                            success: false,
                        };
                    }
                    break;
                }
                case ModalsEnum.VIEW_FILE_ACTION: {
                    const codeModal = await fileCodeModal({
                        data,
                        modify: this.modify,
                        read: this.read,
                        persistence: this.persistence,
                        http: this.http,
                        uikitcontext: context,
                    });
                    return context
                        .getInteractionResponder()
                        .openModalViewResponse(codeModal);
                }
                case ModalsEnum.OPEN_ADD_SUBSCRIPTIONS_MODAL: {
                    const addSubscriptionModal = await AddSubscriptionModal({
                        modify: this.modify,
                        read: this.read,
                        persistence: this.persistence,
                        http: this.http,
                        uikitcontext: context
                    })
                    return context
                        .getInteractionResponder()
                        .openModalViewResponse(addSubscriptionModal);
                }
                case ModalsEnum.OPEN_DELETE_SUBSCRIPTIONS_MODAL: {
                    const addSubscriptionModal = await deleteSubsciptionsModal({
                        modify: this.modify,
                        read: this.read,
                        persistence: this.persistence,
                        http: this.http,
                        uikitcontext: context
                    })
                    return context
                        .getInteractionResponder()
                        .openModalViewResponse(addSubscriptionModal);
                }
                case ModalsEnum.DELETE_SUBSCRIPTION_ACTION: {

                    let { user, room } = await context.getInteractionData();
                    let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config) as IAuthData;
                    let value: string = context.getInteractionData().value as string;
                    let splitted = value.split(',');
                    if (splitted.length == 2 && accessToken.token) {
                        let repoName = splitted[0];
                        let hookId = splitted[1];
                        let roomId;
                        if (room?.id) {
                            roomId = room.id;
                            await storeInteractionRoomData(this.persistence, user.id, roomId);
                        } else {
                            roomId = (await getInteractionRoomData(this.read.getPersistenceReader(), user.id)).roomId;
                        }
                        //delete the susbscriptions for persistance 
                        let subscriptionStorage = new Subscription(this.persistence, this.read.getPersistenceReader());
                        let oldSubscriptions = await subscriptionStorage.getSubscriptionsByRepo(repoName, user.id);
                        await subscriptionStorage.deleteSubscriptionsByRepoUser(repoName, roomId, user.id);
                        //check if any subscription events of the repo is left in any other room
                        let eventSubscriptions = new Map<string, boolean>;
                        for (let subsciption of oldSubscriptions) {
                            eventSubscriptions.set(subsciption.event, false);
                        }
                        let updatedsubscriptions = await subscriptionStorage.getSubscriptionsByRepo(repoName, user.id);
                        if (updatedsubscriptions.length == 0) {
                            await deleteSubscription(this.http, repoName, accessToken.token, hookId);
                        } else {
                            for (let subsciption of updatedsubscriptions) {
                                eventSubscriptions.set(subsciption.event, true);
                            }
                            let updatedEvents: Array<string> = [];
                            let sameEvents = true;
                            for (let [event, present] of eventSubscriptions) {
                                sameEvents = sameEvents && present;
                                if (present) {
                                    updatedEvents.push(event);
                                }
                            }
                            if (updatedEvents.length && !sameEvents) {
                                let response = await updateSubscription(this.http, repoName, accessToken.token, hookId, updatedEvents);
                            }
                        }
                        let userRoom = await this.read.getRoomReader().getById(roomId) as IRoom;
                        await sendNotification(this.read, this.modify, user, userRoom, `Unsubscribed to ${repoName} 🔕`);
                    }

                    const modal = await deleteSubsciptionsModal({ modify: this.modify, read: this.read, persistence: this.persistence, http: this.http, uikitcontext: context });
                    await this.modify.getUiController().updateModalView(modal, { triggerId: context.getInteractionData().triggerId }, context.getInteractionData().user);
                    break;
                }
                case ModalsEnum.SUBSCRIPTION_REFRESH_ACTION:{
                    const modal = await subsciptionsModal({ modify: this.modify, read: this.read, persistence: this.persistence, http: this.http, uikitcontext: context });
                    await this.modify.getUiController().updateModalView(modal, { triggerId: context.getInteractionData().triggerId }, context.getInteractionData().user);
                    break;
                }
                case ModalsEnum.ISSUE_TEMPLATE_SELECTION_ACTION:{
                    let { user } = await context.getInteractionData();
                    let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config) as IAuthData;
                    let value: string = context.getInteractionData().value as string;
                    let actionDetailsArray = value?.trim()?.split(" ");
                    if(accessToken && actionDetailsArray?.length == 2){

                        if(actionDetailsArray[1] !== ModalsEnum.BLANK_GITHUB_TEMPLATE){

                            let templateResponse = await getIssueTemplateCode(this.http,actionDetailsArray[1],accessToken.token);
                            // console.log(templateResponse);
                            let data = {};
                            if(templateResponse?.template){
                                data = {
                                    template : templateResponse.template,
                                    repository:actionDetailsArray[0]
                                };
                            }else{
                                data = {
                                    template : "",
                                    repository:actionDetailsArray[0]
                                };
                            }
                            const newIssueModal = await NewIssueModal({
                                data,
                                modify: this.modify,
                                read: this.read,
                                persistence: this.persistence,
                                http: this.http,
                                uikitcontext: context,
                            });
                            return context
                                .getInteractionResponder()
                                .openModalViewResponse(newIssueModal);

                        }else{
                            let data = {
                                repository:actionDetailsArray[0]
                            };
                            const newIssueModal = await NewIssueModal({
                                data,
                                modify: this.modify,
                                read: this.read,
                                persistence: this.persistence,
                                http: this.http,
                                uikitcontext: context,
                            });
                            return context
                                .getInteractionResponder()
                                .openModalViewResponse(newIssueModal);
                        }
                    }
                    break;
                }
                case ModalsEnum.SHARE_SEARCH_RESULT_ACTION:{
                    let { user, room } = await context.getInteractionData();
                    let value: string = context.getInteractionData().value as string;
                    if(user?.id){
                        if(room?.id){
                            await sendMessage(this.modify,room,user,`${value}`);
                        }else{
                            let roomId = (
                                await getInteractionRoomData(
                                    this.read.getPersistenceReader(),
                                    user.id
                                )
                            ).roomId;
                            room = await this.read.getRoomReader().getById(roomId) as IRoom;
                            await sendMessage(this.modify,room,user,`${value}`);
                        }
                    }
                    break;
                }
                case ModalsEnum.VIEW_GITHUB_SEARCH_RESULT_PR_CHANGES:{
                    let { user, room } = await context.getInteractionData();
                    let value: string = context.getInteractionData().value as string;
                    let PullRequestDetails = value.split(" ");
                    if(PullRequestDetails.length==2){
                        const triggerId= context.getInteractionData().triggerId;
                        const data = {
                            repository:PullRequestDetails[0],
                            query:"pulls",
                            number:PullRequestDetails[1]
                        }
                        if(triggerId && data){
                            const resultsModal = await pullDetailsModal({
                                data,
                                modify: this.modify,
                                read: this.read,
                                persistence: this.persistence,
                                http: this.http,
                                uikitcontext: context
                            });
                            return context
                                    .getInteractionResponder()
                                    .openModalViewResponse(resultsModal);
                        }else{
                            console.log("Inavlid Trigger ID !");
                        }
                    }
                    if(user?.id){
                        if(room?.id){
                            await sendMessage(this.modify,room,user,`${value}`);
                        }else{
                            let roomId = (
                                await getInteractionRoomData(
                                    this.read.getPersistenceReader(),
                                    user.id
                                )
                            ).roomId;
                            room = await this.read.getRoomReader().getById(roomId) as IRoom;
                            await sendMessage(this.modify,room,user,`${value}`);
                        }
                    }
                    break;
                }
                case ModalsEnum.MULTI_SHARE_ADD_SEARCH_RESULT_ACTION:{
                    let { user, room } = await context.getInteractionData();
                    let searchResultId: string = context.getInteractionData().value as string;
                    let roomId:string="";
                    if(user?.id){
                        if(room?.id){
                            roomId = room.id;
                        }else{
                            roomId = (
                                await getInteractionRoomData(
                                    this.read.getPersistenceReader(),
                                    user.id
                                )
                            ).roomId;
                            room = await this.read.getRoomReader().getById(roomId) as IRoom;
                        }
                        let githubSearchStorage = new GithubSearchResultStorage(this.persistence,this.read.getPersistenceReader());
                            let searchResultData: IGitHubSearchResultData = await githubSearchStorage.getSearchResults(room?.id as string,user);
                            if(searchResultData?.search_results?.length){
                                let index = -1;
                                let currentIndex = 0;
                                for(let searchResult of searchResultData.search_results){
                                    if(searchResult.result_id == searchResultId ){
                                        index=currentIndex;
                                        break;
                                    }
                                    currentIndex++;
                                }
                                if(index !== -1){
                                    searchResultData.search_results[index].share=true;
                                    await githubSearchStorage.updateSearchResult(room as IRoom,user,searchResultData);
                                }
                                const resultsModal = await githubSearchResultModal({
                                    data: searchResultData,
                                    modify: this.modify,
                                    read: this.read,
                                    persistence: this.persistence,
                                    http: this.http,
                                })
                                await this.modify.getUiController().updateModalView(resultsModal, { triggerId: context.getInteractionData().triggerId }, context.getInteractionData().user);
                            }
                    }
                    break;
                }
                case ModalsEnum.MULTI_SHARE_REMOVE_SEARCH_RESULT_ACTION:{
                    let { user, room } = await context.getInteractionData();
                    let searchResultId: string = context.getInteractionData().value as string;
                    let roomId="";
                    if(user?.id && searchResultId){
                        if(room?.id){
                            roomId = room.id;
                        }else{
                            roomId = (
                                await getInteractionRoomData(
                                    this.read.getPersistenceReader(),
                                    user.id
                                )
                            ).roomId;
                            room = await this.read.getRoomReader().getById(roomId) as IRoom;
                        }
                        let githubSearchStorage = new GithubSearchResultStorage(this.persistence,this.read.getPersistenceReader());
                            let searchResultData: IGitHubSearchResultData = await githubSearchStorage.getSearchResults(room?.id as string,user);
                            if(searchResultData?.search_results?.length){
                                let index = -1;
                                let currentIndex = 0;
                                for(let searchResult of searchResultData.search_results){
                                    if(searchResult.result_id == searchResultId){
                                        index=currentIndex;
                                        break;
                                    }
                                    currentIndex++;
                                }
                                if(index !== -1){
                                    searchResultData.search_results[index].share=false;
                                    await githubSearchStorage.updateSearchResult(room as IRoom,user,searchResultData);
                                }
                                const resultsModal = await githubSearchResultModal({
                                    data: searchResultData,
                                    modify: this.modify,
                                    read: this.read,
                                    persistence: this.persistence,
                                    http: this.http,
                                })
                                await this.modify.getUiController().updateModalView(resultsModal, { triggerId: context.getInteractionData().triggerId }, context.getInteractionData().user);
                            }
                    }
                    break;
                }
            }

        } catch (error) {
            console.log(error);
        }

        return context.getInteractionResponder().successResponse();
    }
}

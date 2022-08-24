import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { ModalsEnum } from '../enum/Modals';
import { sendMessage, sendNotification } from '../lib/message';
import { getInteractionRoomData } from '../persistance/roomInteraction';
import { Subscription } from '../persistance/subscriptions';
import { GithubApp } from '../GithubApp';
import { getWebhookUrl } from '../helpers/getWebhookURL';
import { getAccessTokenForUser } from '../persistance/auth';
import { subsciptionsModal } from '../modals/subscriptionsModal';
import { githubSearchResultModal } from '../modals/githubSearchResultModal';
import { IGitHubSearchResult } from '../definitions/searchResult';
import { IGitHubSearchResultData } from '../definitions/searchResultData';
import { githubSearchErrorModal } from '../modals/githubSearchErrorModal';
import { GithubSearchResultStorage } from '../persistance/searchResults';
import { githubSearchResultShareModal } from '../modals/githubSearchResultsShareModal';
import { addSubscribedEvents, createSubscription, updateSubscription, createNewIssue, getIssueTemplates,githubSearchIssuesPulls } from '../helpers/githubSDK';
import { NewIssueModal } from '../modals/newIssueModal';
import { issueTemplateSelectionModal } from '../modals/issueTemplateSelectionModal';

export class ExecuteViewSubmitHandler {
    constructor(
        private readonly app: GithubApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence,
    ) { }

    public async run(context: UIKitViewSubmitInteractionContext) {
        const { user, view } = context.getInteractionData();

        try {
            switch (view.id) {
                case ModalsEnum.ADD_SUBSCRIPTION_VIEW:
                    if (user.id) {
                        const { roomId } = await getInteractionRoomData(this.read.getPersistenceReader(), user.id);
                        if (roomId) {
                            let room = await this.read.getRoomReader().getById(roomId) as IRoom;
                            const repository = view.state?.[ModalsEnum.REPO_NAME_INPUT]?.[ModalsEnum.REPO_NAME_INPUT_ACTION];
                            const events = view.state?.[ModalsEnum.ADD_SUBSCRIPTION_EVENT_INPUT]?.[ModalsEnum.ADD_SUBSCRIPTION_EVENT_OPTIONS];

                            if (typeof (repository) == undefined || typeof (events) == undefined) {

                                await sendNotification(this.read, this.modify, user, room, "Invalid Input !");
                            } else {
                                let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config);
                                if (!accessToken) {

                                    await sendNotification(this.read, this.modify, user, room, "Login To Github !");
                                } else {
                                    //if we have a webhook for the repo and our room requires the same event,we just make our entries to the apps storage instead of making a new hook
                                    //if we have a hook but we dont have all the events, we send in a patch request,

                                    let url = await getWebhookUrl(this.app);

                                    let subsciptionStorage = new Subscription(this.persistence, this.read.getPersistenceReader());
                                    let subscribedEvents = new Map<string, boolean>;
                                    let hookId = "";


                                    let subscriptions = await subsciptionStorage.getSubscriptionsByRepo(repository, user.id);
                                    if (subscriptions && subscriptions.length) {
                                        for (let subscription of subscriptions) {
                                            subscribedEvents.set(subscription.event, true);
                                            if (hookId == "") {
                                                hookId = subscription.webhookId;
                                            }
                                        }
                                    }
                                    let additionalEvents = 0;
                                    for (let event of events) {
                                        if (!subscribedEvents.has(event)) {
                                            additionalEvents++;
                                            subscribedEvents.set(event, true);
                                        }
                                    }
                                    let response: any;
                                    //if hook is null we create a new hook, else we add more events to the new hook
                                    if (hookId == "") {
                                        response = await createSubscription(this.http, repository, url, accessToken.token, events);
                                    } else {
                                        //if hook is already present, we just need to send a patch request to add new events to existing hook
                                        let newEvents: Array<string> = [];
                                        for (let [event, present] of subscribedEvents) {
                                            newEvents.push(event);
                                        }
                                        if (additionalEvents && newEvents.length) {
                                            response = await updateSubscription(this.http, repository, accessToken.token, hookId, newEvents);
                                        }
                                    }
                                    let createdEntry = false;
                                    //subscribe rooms to hook events
                                    for (let event of events) {
                                        createdEntry = await subsciptionStorage.createSubscription(repository, event, response?.id, room, user);
                                    }
                                    if (!createdEntry) {
                                        throw new Error("Error creating new subscription entry");
                                    }
                                    await sendNotification(this.read, this.modify, user, room, `Subscibed to ${repository} ✔️`);
                                }

                            }
                            const modal = await subsciptionsModal({ modify: this.modify, read: this.read, persistence: this.persistence, http: this.http, uikitcontext: context });
                            await this.modify.getUiController().updateModalView(modal, { triggerId: context.getInteractionData().triggerId }, context.getInteractionData().user);
                            return context.getInteractionResponder().successResponse();
                        }
                    }
                    break;
                    case ModalsEnum.NEW_ISSUE_VIEW: {
                        const { roomId } = await getInteractionRoomData(this.read.getPersistenceReader(), user.id);
                        if (roomId) {
                            let room = await this.read.getRoomReader().getById(roomId) as IRoom;
                            let repository = view.state?.[ModalsEnum.REPO_NAME_INPUT]?.[ModalsEnum.REPO_NAME_INPUT_ACTION] as string;
                            let title = view.state?.[ModalsEnum.ISSUE_TITLE_INPUT]?.[ModalsEnum.ISSUE_TITLE_ACTION] as string;
                            let issueBody =  view.state?.[ModalsEnum.ISSUE_BODY_INPUT]?.[ModalsEnum.ISSUE_BODY_INPUT_ACTION];
                            let issueLabels = view.state?.[ModalsEnum.ISSUE_LABELS_INPUT]?.[ModalsEnum.ISSUE_LABELS_INPUT_ACTION] as string;
                            let issueAssignees = view.state?.[ModalsEnum.ISSUE_ASSIGNEES_INPUT]?.[ModalsEnum.ISSUE_ASSIGNEES_INPUT_ACTION] as string;
                            issueLabels = issueLabels?.trim() || "";
                            issueAssignees = issueAssignees?.trim() || "" ;
                            let issueLabelsArray:Array<string> = [];
                            let issueAssigneesArray:Array<string> = [];
                            if(issueLabels?.length > 0){
                                issueLabelsArray = issueLabels.split(" ");
                            }
                            if(issueAssignees?.length > 0){
                                issueAssigneesArray = issueAssignees.split(" ");
                            }
                            if(repository && repository?.trim()?.length && title && title?.trim()?.length){
                            repository = repository?.trim();
                            title = title?.trim() || "";
                                let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config);
                                if (!accessToken) {
                                    await sendNotification(this.read, this.modify, user, room, "Login To Github !");
                                } else {
                                    let reponse = await createNewIssue(this.http,repository,title,issueBody,issueLabelsArray,issueAssigneesArray,accessToken?.token);
                                    if(reponse && reponse?.id){
                                        await sendNotification(this.read,this.modify,user,room,`Created New Issue | [#${reponse.number} ](${reponse.html_url})  *[${reponse.title}](${reponse.html_url})*`)
                                    }else{
                                        await sendNotification(this.read,this.modify,user,room,`Invalid Issue !`);
                                    }
                                }
                            }else{
                                await sendNotification(this.read,this.modify,user,room,`Invalid Issue !`);
                            }
                        } 
                        break;
                    }
                    case ModalsEnum.NEW_ISSUE_STARTER_VIEW:{
                        const { roomId } = await getInteractionRoomData(this.read.getPersistenceReader(), user.id);
        
                        if (roomId) {
                            let room = await this.read.getRoomReader().getById(roomId) as IRoom;
                            let repository = view.state?.[ModalsEnum.REPO_NAME_INPUT]?.[ModalsEnum.REPO_NAME_INPUT_ACTION] as string;
                            let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config);
                            if (!accessToken) {
                                await sendNotification(this.read, this.modify, user, room, `Login To Github ! -> /github login`);
                            }else{
                                
                                repository=repository?.trim();
                                let response = await getIssueTemplates(this.http,repository,accessToken.token);
                                if((!response.template_not_found) && response?.templates?.length){
                                    const issueTemplateSelection = await issueTemplateSelectionModal({ data: response, modify: this.modify, read: this.read, persistence: this.persistence, http: this.http, uikitcontext: context });
                                    return context
                                    .getInteractionResponder()
                                    .openModalViewResponse(issueTemplateSelection);
                                }else{
                                    let data = {
                                        repository: repository
                                    }
                                    const createNewIssue = await NewIssueModal({ data: data, modify: this.modify, read: this.read, persistence: this.persistence, http: this.http, uikitcontext: context });
                                    return context
                                    .getInteractionResponder()
                                    .openModalViewResponse(createNewIssue);
                                }
                            }
                        } 
                        break;
                    }
                    case ModalsEnum.SEARCH_VIEW: {
                    if (user.id) {
                        const { roomId } = await getInteractionRoomData(this.read.getPersistenceReader(), user.id);
                        if (roomId) {
                            let room = await this.read.getRoomReader().getById(roomId) as IRoom;
                            let repository: string|undefined = view.state?.[ModalsEnum.REPO_NAME_INPUT]?.[ModalsEnum.REPO_NAME_INPUT_ACTION];
                            let resource: string|undefined = view.state?.[ModalsEnum.ADD_MAIN_SEARCH_PARAMATER_INPUT]?.[ModalsEnum.ADD_MAIN_SEARCH_PARAMATER_OPTION];
                            let authors: string|undefined = view.state?.[ModalsEnum.AUTHOR_NAMES_INPUT]?.[ModalsEnum.AUTHOR_NAMES_INPUT_ACTION];
                            let labels: string|undefined = view.state?.[ModalsEnum.RESOURCE_LABELS_INPUT]?.[ModalsEnum.RESOURCE_LABELS_INPUT_ACTION];
                            let milestones: string|undefined = view.state?.[ModalsEnum.RESOURCE_MILESTONES_INPUT]?.[ModalsEnum.RESOURCE_LABELS_INPUT_ACTION];
                            let resourceState: string|undefined = view.state?.[ModalsEnum.ADD_SEARCH_STATE_PARAMATER_INPUT]?.[ModalsEnum.ADD_SEARCH_STATE_PARAMATER_INPUT_OPTION];
                            let labelsArray:Array<string>=[];
                            let milestonesArray:Array<string>=[];
                            let authorsArray:Array<string>=[];

                            if(typeof authors == 'string' && authors.length){
                                authorsArray = authors.trim().split(" ");
                            }
                            if(typeof labels == 'string' && labels.length){
                                labelsArray = labels.trim().split(" ");
                            }
                            if(typeof milestones == 'string' && milestones.length){
                                milestonesArray = milestones.trim().split(" ");
                            }
                            if(repository == undefined){
                                repository = "";
                            }else{
                                repository=repository?.trim();
                            }
                            if(resource == undefined){
                                resource = "";
                            }else{
                                resource = resource?.trim();
                            }
                            if(resourceState == undefined){
                                resourceState = "";
                            }else{
                                resourceState = resourceState?.trim();
                            }
 
                            let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config);
                            if(repository?.length == 0 && labelsArray?.length == 0 && authorsArray?.length == 0){
                                await sendNotification(this.read, this.modify, user, room, "*Invalid Search Query !*");
                            }else if (!accessToken) {
                                await sendNotification(this.read, this.modify, user, room, "Login To Github !");
                            } else {
                                let resultResponse = await githubSearchIssuesPulls(this.http,repository,accessToken.token,resource,resourceState,labelsArray,authorsArray,milestonesArray);
                                const triggerId= context.getInteractionData().triggerId;
                                if(triggerId && resultResponse?.server_error === false){

                                    let total_count = resultResponse?.total_count;
                                    let searchItems = resultResponse?.items;
                                    let searchResultsList : Array<IGitHubSearchResult> = [];
                                    if(searchItems && Array.isArray(searchItems)){
                                        for (let item of searchItems) {
                                            let resultId = item?.id
                                            let title = item?.title;
                                            let number = item?.number;
                                            let html_url = item?.html_url;
                                            let user_login = item?.user?.login;
                                            let state = item?.state;
                                            let labelString = "";
                                            if(item?.labels && Array.isArray(item.labels)){
                                                for(let label of item.labels){
                                                    labelString += `${label.name} `
                                                }
                                            }
                                            let resultString = `[ #${item.number} ](${item?.html_url?.toString()}) *${item.title?.toString()?.trim()}* : ${item?.html_url}`;
                                            let pull_request = (item?.pull_request) ? true : false;
                                            let pull_request_url = item.pull_request?.url as string;
                                            let searchResultItem: IGitHubSearchResult = {
                                                result_id:resultId,
                                                title:title,
                                                html_url:html_url,
                                                number:number,
                                                result:resultString,
                                                state:state,
                                                share:false,
                                                user_login:user_login,
                                                labels:labelString,
                                                pull_request:pull_request,
                                                pull_request_url:pull_request_url
                                            }
                                            searchResultsList.push(searchResultItem);
                                        }
                                        let githubSearchResult: IGitHubSearchResultData={
                                            room_id:room.id,
                                            user_id:user.id,
                                            search_query:resultResponse.search_query,
                                            total_count:total_count,
                                            search_results:searchResultsList
                                        }
                                        let githubSearchStorage = new GithubSearchResultStorage(this.persistence,this.read.getPersistenceReader());
                                        await githubSearchStorage.updateSearchResult(room,user,githubSearchResult);
                                        const resultsModal = await githubSearchResultModal({
                                            data: githubSearchResult,
                                            modify: this.modify,
                                            read: this.read,
                                            persistence: this.persistence,
                                            http: this.http,
                                            uikitcontext: context});
                                        return context
                                            .getInteractionResponder()
                                            .openModalViewResponse(resultsModal);
                                    }
                                }else{
                                    const searchErrorModal =await githubSearchErrorModal({
                                        errorMessage:resultResponse.message,
                                        modify:this.modify,
                                        read:this.read,
                                        uikitcontext:context
                                    })
                                    return context
                                            .getInteractionResponder()
                                            .openModalViewResponse(searchErrorModal);
                                }
                            }
                        }
                    }
                    break;
                }
                case ModalsEnum.SEARCH_RESULT_VIEW:{
                    if (user.id) {
                        const { roomId } = await getInteractionRoomData(this.read.getPersistenceReader(), user.id);
                        if (roomId) {
                            let room = await this.read.getRoomReader().getById(roomId) as IRoom;
                            let githubSearchStorage = new GithubSearchResultStorage(this.persistence,this.read.getPersistenceReader());
                            let searchResults = await githubSearchStorage.getSearchResults(roomId,user);
                            if(searchResults){
                                const searchResultShareModal = await githubSearchResultShareModal({
                                    data: searchResults,
                                    modify: this.modify,
                                    read: this.read,
                                    persistence: this.persistence,
                                    http: this.http,
                                    uikitcontext: context
                                });
                                return context
                                .getInteractionResponder()
                                .openModalViewResponse(searchResultShareModal);
                            }
                        }
                    }
                }
                case ModalsEnum.SEARCH_RESULT_SHARE_VIEW:{
                    if (user.id) {
                        const { roomId } = await getInteractionRoomData(this.read.getPersistenceReader(), user.id);
                        if (roomId) {
                            let room = await this.read.getRoomReader().getById(roomId) as IRoom;
                            let searchResult: string|undefined = view.state?.[ ModalsEnum.MULTI_SHARE_SEARCH_INPUT]?.[ModalsEnum.MULTI_SHARE_SEARCH_INPUT_ACTION];
                            await sendMessage(this.modify,room,user,searchResult as string);
                        }
                    }
                }
                case ModalsEnum.GITHUB_ISSUES_STARTER_VIEW:{
                    const { roomId } = await getInteractionRoomData(this.read.getPersistenceReader(), user.id);
                        if (roomId) {
                            let repository = view.state?.[ModalsEnum.REPO_NAME_INPUT]?.[ModalsEnum.REPO_NAME_INPUT_ACTION] as string;
                            let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config);
                            if (!accessToken) {
                                
                                

                            }else{
                                
                                repository=repository?.trim();
                                let response = await getIssueTemplates(this.http,repository,accessToken.token);
                                if((!response.template_not_found) && response?.templates?.length){
                                    const issueTemplateSelection = await issueTemplateSelectionModal({ data: response, modify: this.modify, read: this.read, persistence: this.persistence, http: this.http, uikitcontext: context });
                                    return context
                                    .getInteractionResponder()
                                    .openModalViewResponse(issueTemplateSelection);
                                }else{
                                    let data = {
                                        repository: repository
                                    }
                                    const createNewIssue = await NewIssueModal({ data: data, modify: this.modify, read: this.read, persistence: this.persistence, http: this.http, uikitcontext: context });
                                    return context
                                    .getInteractionResponder()
                                    .openModalViewResponse(createNewIssue);
                                }
                            }
                        } 
                    break;
                }
                default:
                    break;
            }

        } catch (error) {
            console.log('error : ', error);
        }

        return {
            success: true,
        };
    }
}
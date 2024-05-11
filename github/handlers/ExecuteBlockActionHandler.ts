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
    ButtonStyle,
    IUIKitResponse,
    TextObjectType,
    UIKitBlockInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { AddSubscriptionModal } from "../modals/addSubscriptionsModal";
import { deleteSubscriptionsModal } from "../modals/deleteSubscriptions";
import { deleteSubscription, updateSubscription, getPullRequestComments, getPullRequestData, getRepositoryIssues, getIssuesComments, approvePullRequest } from "../helpers/githubSDK";
import { Subscription } from "../persistance/subscriptions";
import { getAccessTokenForUser } from "../persistance/auth";
import { GithubApp } from "../GithubApp";
import { IAuthData } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";
import { storeInteractionRoomData, getInteractionRoomData } from "../persistance/roomInteraction";
import { sendMessage, sendNotification } from "../lib/message";
import { subscriptionsModal } from "../modals/subscriptionsModal";
import { mergePullRequestModal } from "../modals/mergePullReqeustModal";
import { messageModal } from "../modals/messageModal";
import { getRepoData } from "../helpers/githubSDK";
import { addPullRequestCommentsModal } from "../modals/addPullRequestCommentsModal";
import { pullRequestCommentsModal } from "../modals/pullRequestCommentsModal";
import { pullDetailsModal } from "../modals/pullDetailsModal";
import { IGitHubSearchResult } from "../definitions/searchResult";
import { GithubSearchResultStorage } from "../persistance/searchResults";
import { IGitHubSearchResultData } from "../definitions/searchResultData";
import { githubSearchResultModal } from "../modals/githubSearchResultModal";
import { NewIssueModal } from "../modals/newIssueModal";
import { addIssueAssigneeModal } from "../modals/addIssueAssigneeModal";
import { githubIssuesListModal } from "../modals/githubIssuesListModal";
import { GithubRepoIssuesStorage } from "../persistance/githubIssues";
import { IGitHubIssueData } from "../definitions/githubIssueData";
import { shareProfileModal } from "../modals/profileShareModal";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";
import { userIssuesModal } from "../modals/UserIssuesModal";
import { IssueDisplayModal } from "../modals/IssueDisplayModal";
import { IGitHubIssue } from "../definitions/githubIssue";
import { BodyMarkdownRenderer } from "../processors/bodyMarkdowmRenderer";
import { CreateIssueStatsBar } from "../lib/CreateIssueStatsBar";
import { issueCommentsModal } from "../modals/issueCommentsModal";
import { addIssueCommentsModal } from "../modals/addIssueCommentModal";
import { GitHubIssuesStarterModal } from "../modals/getIssuesStarterModal";
import { githubSearchModal } from "../modals/githubSearchModal";
import { NewIssueStarterModal } from "../modals/newIssueStarterModal";
import { removeRepoReminder, unsubscribedPR } from "../persistance/remind";
import { reminderModal } from "../modals/remindersModal";
import { GitHubApi } from "../helpers/githubSDKclass";

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
        const gitHubApiClient = await GitHubApi.getInstance(
            this.http,
            this.read,
            data.user,
            this.app
        );

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
                        let { user, room } = await context.getInteractionData();
                        let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config) as IAuthData;
                        if(room && user){
                            await basicQueryMessage({
                                query,
                                repository,
                                room,
                                read: this.read,
                                persistence: this.persistence,
                                modify: this.modify,
                                http: this.http,
                                accessToken: accessToken,
                            });
                        }
                        return {
                            success: true,
                        };
                    } catch (err) {
                        console.error(err);
                        return {
                            success: false,
                        };
                    }
                }
                case ModalsEnum.SHARE_ISSUE_ACTION : {
                    let {user, value, room} = context.getInteractionData();
                    const access_token = await getAccessTokenForUser(this.read, user, this.app.oauth2Config) as IAuthData;

                    const repoName = value?.split(",")[0] ?? "";
                    const issueNumber = value?.split(",")[1] ?? "";

                    const issueInfo : IGitHubIssue = await gitHubApiClient.getIssueData(repoName, issueNumber);

                    const block = this.modify.getCreator().getBlockBuilder();

                    CreateIssueStatsBar(issueInfo, block);

                    block.addSectionBlock({
                        text : {
                            text : `*${issueInfo.title}*` ?? "",
                            type : TextObjectType.MARKDOWN
                        }
                    }),
                    block.addActionsBlock({
                        elements : [
                            block.newButtonElement({
                                text : {
                                    text : "Open Issue in Browser",
                                    type : TextObjectType.PLAINTEXT
                                },
                                url : issueInfo.html_url,
                                style : ButtonStyle.PRIMARY
                            })
                        ]
                    })
                    issueInfo.body && BodyMarkdownRenderer({body : issueInfo.body, block : block});

                    if(user?.id){
                        if(room?.id){
                            await sendMessage(this.modify, room!, user, `Issue`, block)
                        }else{
                            let roomId = (
                                await getInteractionRoomData(
                                    this.read.getPersistenceReader(),
                                    user.id
                                )
                            ).roomId;
                            room = await this.read.getRoomReader().getById(roomId) as IRoom;
                            await sendMessage(this.modify, room, user, `Issue`, block)
                        }
                    }
                    break;
                }
                case ModalsEnum.TRIGGER_ISSUE_DISPLAY_MODAL : {
                    const {user, value} = context.getInteractionData();
                    const access_token = await getAccessTokenForUser(this.read, user, this.app.oauth2Config) as IAuthData;

                    const repoInfo = value?.split(",")[0] ?? "";
                    const issueNumber = value?.split(",")[1] ?? "";

                    const issueDisplayModal = await IssueDisplayModal({
                        repoName : repoInfo,
                        issueNumber : issueNumber,
                        app: this.app,
                        modify : this.modify,
                        read : this.read,
                        persistence : this.persistence,
                        http : this.http,
                        uikitcontext : context
                    })

                    return context.getInteractionResponder().updateModalViewResponse(issueDisplayModal);
                }
                case ModalsEnum.SWITCH_ISSUE_SORT :
                case ModalsEnum.SWITCH_ISSUE_STATE :
                case ModalsEnum.SWITCH_ISSUE_FILTER : {
                    const record = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, "ISSUE_MAIN_FILTER");

                    const issueFilterArray = await this.read.getPersistenceReader().readByAssociation(record) as {filter : string, state : string, sort: string, order: string}[];

                    const {user, value} = context.getInteractionData();

                    let filter : {filter : string, state : string, sort: string, order: string} | undefined;

                    const prev_sort = issueFilterArray.length == 0 ? ModalsEnum.ISSUE_SORT_CREATED : issueFilterArray[0].sort;
                    const prev_filter = issueFilterArray.length == 0 ? ModalsEnum.ASSIGNED_ISSUE_FILTER : issueFilterArray[0].filter;
                    const prev_state = issueFilterArray.length == 0 ? ModalsEnum.ISSUE_STATE_OPEN : issueFilterArray[0].state;

                    switch (value as string) {
                        case ModalsEnum.ASSIGNED_ISSUE_FILTER:
                        case ModalsEnum.MENTIONED_ISSUE_FILTER:
                        case ModalsEnum.CREATED_ISSUE_FILTER:
                            filter = {
                                filter : value as string,
                                sort : prev_sort,
                                state : prev_state,
                                order : ModalsEnum.ISSUES_DESCENDING
                            }
                            break;
                        case ModalsEnum.ISSUE_SORT_CREATED :
                        case ModalsEnum.ISSUE_SORT_COMMENTS :
                        case ModalsEnum.ISSUE_SORT_UPDATED :
                            filter = {
                                filter : prev_filter,
                                sort : value as string,
                                state : prev_state,
                                order : ModalsEnum.ISSUES_DESCENDING
                            }
                            break;
                        case ModalsEnum.ISSUE_STATE_OPEN :
                        case ModalsEnum.ISSUE_STATE_CLOSED :
                            filter = {
                                filter : prev_filter,
                                sort : prev_sort,
                                state : value as string,
                                order : ModalsEnum.ISSUES_DESCENDING
                            }
                            break;
                        default:
                            filter = {
                                filter : ModalsEnum.ASSIGNED_ISSUE_FILTER,
                                sort : ModalsEnum.ISSUE_SORT_CREATED,
                                state : ModalsEnum.ISSUE_STATE_OPEN,
                                order : ModalsEnum.ISSUES_DESCENDING
                            }
                    }

                    let access_token = await getAccessTokenForUser(this.read, user, this.app.oauth2Config) as IAuthData;
                    const issueModal = await userIssuesModal({
                        app: this.app,
                        filter : filter,
                        modify : this.modify,
                        read : this.read,
                        persistence : this.persistence,
                        http : this.http
                    })

                    await this.persistence.updateByAssociation(record, filter);

                    return context.getInteractionResponder().updateModalViewResponse(issueModal);
                }
                case ModalsEnum.TRIGGER_ISSUES_MODAL : {

                    const {user} = context.getInteractionData();

                    let access_token = await getAccessTokenForUser(this.read, user, this.app.oauth2Config) as IAuthData;

                    const filter = {
                        filter : ModalsEnum.ASSIGNED_ISSUE_FILTER,
                        state : ModalsEnum.ISSUE_STATE_OPEN,
                        sort : ModalsEnum.ISSUE_SORT_CREATED
                    }

                    const issuesModal = await userIssuesModal({
                        filter : filter,
                        app: this.app,
                        modify: this.modify,
                        read : this.read,
                        persistence : this.persistence,
                        http : this.http,
                        uikitcontext : context
                    });

                    return context.getInteractionResponder().openModalViewResponse(issuesModal);
                }
                case ModalsEnum.TRIGGER_REPOS_MODAL : {
                    break;
                }
                case ModalsEnum.TRIGGER_ACTIVITY_MODAL : {
                    break;
                }
                case ModalsEnum.SHARE_PROFILE_PARAMS : {
                    const profileInteractionData = context.getInteractionData().value;
                    if(Array.isArray(profileInteractionData)) {
                        const storeData = {
                            profileParams: profileInteractionData as string[]
                        }
                    await this.persistence.updateByAssociation(new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, "ProfileShareParam"), storeData);
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
                    const addSubscriptionModal = await deleteSubscriptionsModal({
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
                        for (let subscription of oldSubscriptions) {
                            eventSubscriptions.set(subscription.event, false);
                        }
                        let updatedsubscriptions = await subscriptionStorage.getSubscriptionsByRepo(repoName, user.id);
                        if (updatedsubscriptions.length == 0) {
                            await deleteSubscription(this.http, repoName, accessToken.token, hookId);
                        } else {
                            for (let subscription of updatedsubscriptions) {
                                eventSubscriptions.set(subscription.event, true);
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

                    const modal = await deleteSubscriptionsModal({ modify: this.modify, read: this.read, persistence: this.persistence, http: this.http, uikitcontext: context });
                    await this.modify.getUiController().updateModalView(modal, { triggerId: context.getInteractionData().triggerId }, context.getInteractionData().user);
                    break;
                }
                case ModalsEnum.SUBSCRIPTION_REFRESH_ACTION:{
                    const modal = await subscriptionsModal({ modify: this.modify, read: this.read, persistence: this.persistence, http: this.http, uikitcontext: context });
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
                            let templateResponse = await gitHubApiClient.getIssueTemplateCode(actionDetailsArray[1]);
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
                            console.log("invalid Trigger ID !");
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
                case ModalsEnum.MERGE_PULL_REQUEST_ACTION:{
                    let value: string = context.getInteractionData().value as string;
                    let splittedValues = value?.split(" ");
                    let { user } = await context.getInteractionData();
                    let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config) as IAuthData;
                    if(splittedValues.length==2 && accessToken?.token){
                        let data={
                            "repo" : splittedValues[0],
                            "pullNumber": splittedValues[1]
                        }
                        let repoDetails = await getRepoData(this.http,splittedValues[0],accessToken.token);

                        if(repoDetails?.permissions?.admin || repoDetails?.permissions?.push || repoDetails?.permissions?.maintain ){
                            const mergePRModal = await mergePullRequestModal({
                                data:data,
                                modify: this.modify,
                                read: this.read,
                                persistence: this.persistence,
                                http: this.http,
                                uikitcontext: context
                            })
                            return context
                                .getInteractionResponder()
                                .openModalViewResponse(mergePRModal);
                        }else{
                            const unauthorizedMessageModal = await messageModal({
                                message:"Unauthorized Action 🤖 You dont have push rights ⚠️",
                                modify: this.modify,
                                read: this.read,
                                persistence: this.persistence,
                                http: this.http,
                                uikitcontext: context
                            })
                            return context
                                .getInteractionResponder()
                                .openModalViewResponse(unauthorizedMessageModal);
                        }

                    }
                    break;
                }
                case ModalsEnum.COMMENT_PR_ACTION:{
                    let value: string = context.getInteractionData().value as string;
                    let splittedValues = value?.split(" ");
                    let { user } = await context.getInteractionData();
                    let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config) as IAuthData;
                    if(splittedValues.length==2 && accessToken?.token){
                        let data={
                            "repo" : splittedValues[0],
                            "pullNumber": splittedValues[1]
                        }
                        const addPRCommentModal = await addPullRequestCommentsModal({
                            data:data,
                            modify:this.modify,
                            read:this.read,
                            persistence: this.persistence,
                            http: this.http,
                            uikitcontext: context
                        })
                        return context
                                .getInteractionResponder()
                                .openModalViewResponse(addPRCommentModal);
                    }
                    break;
                }
                case ModalsEnum.SHARE_PROFILE : {

                    const shareProfileMod = await shareProfileModal({
                        modify:this.modify,
                        read:this.read,
                        persistence: this.persistence,
                        http: this.http,
                        uikitcontext: context
                    })

                    return context.getInteractionResponder().openModalViewResponse(shareProfileMod);
                }
                case ModalsEnum.APPROVE_PULL_REQUEST_ACTION:{

                    let value: string = context.getInteractionData().value as string;
                    let splittedValues = value?.split(" ");
                    let { user } = await context.getInteractionData();
                    let { room} = await context.getInteractionData();
                    let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config) as IAuthData;

                    if(splittedValues.length==2 && accessToken?.token){
                        let data={
                            "repo" : splittedValues[0],
                            "pullNumber": splittedValues[1]
                        }
                        let repoDetails = await getRepoData(this.http,splittedValues[0],accessToken.token);

                        if(repoDetails?.permissions?.admin || repoDetails?.permissions?.push || repoDetails?.permissions?.maintain ){
                            const response  = await approvePullRequest(this.http,data.repo,accessToken.token,data.pullNumber);

                            let message = `🤖 Pull Request successfully Approved ✔️ : https://github.com/${data.repo}/pull/${data.pullNumber}`

                            if(response.state == "APPROVED" && room ){
                                sendMessage(this.modify,room,user,message)
                            }

                            if(response.errors && room){
                                sendNotification(this.read,this.modify,user,room,response.errors[0]);
                            }

                        }else{
                            const unauthorizedMessageModal = await messageModal({
                                message:"Unauthorized Action 🤖 You dont have push rights ⚠️",
                                modify: this.modify,
                                read: this.read,
                                persistence: this.persistence,
                                http: this.http,
                                uikitcontext: context
                            })
                            return context
                                .getInteractionResponder()
                                .openModalViewResponse(unauthorizedMessageModal);
                        }
                    }
                    break;
                }
                case ModalsEnum.ISSUE_COMMENT_LIST_ACTION:{
                    let value: string = context.getInteractionData().value as string;
                    let splittedValues = value?.split(" ");
                    let { user } = await context.getInteractionData();
                    let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config) as IAuthData;
                    if(splittedValues.length==2){
                        let repoName = splittedValues[0];
                        let issueNumber = splittedValues[1];
                        let issueComments = await gitHubApiClient.getIssuesComments(repoName, issueNumber);
                        let issueData = await gitHubApiClient.getIssueData(repoName, issueNumber);
                        if(issueData?.issue_compact === "Error Fetching Issue" || issueComments?.issueData){
                            if(issueData?.issue_compact === "Error Fetching Issue"){
                                const unauthorizedMessageModal = await messageModal({
                                    message:`🤖 Error Fetching Issue Data ⚠️`,
                                    modify: this.modify,
                                    read: this.read,
                                    persistence: this.persistence,
                                    http: this.http,
                                    uikitcontext: context
                                })
                                return context
                                    .getInteractionResponder()
                                    .openModalViewResponse(unauthorizedMessageModal);
                            }
                            if(issueComments?.serverError){
                                const unauthorizedMessageModal = await messageModal({
                                    message:`🤖 Error Fetching Comments ⚠️`,
                                    modify: this.modify,
                                    read: this.read,
                                    persistence: this.persistence,
                                    http: this.http,
                                    uikitcontext: context
                                })
                                return context
                                    .getInteractionResponder()
                                    .openModalViewResponse(unauthorizedMessageModal);
                            }
                        }
                        let data={
                            repo: repoName,
                            issueNumber: issueNumber,
                            issueData: issueData,
                            issueComments: issueComments?.data
                        }
                        const addIssueCommentModal = await issueCommentsModal({
                            data:data,
                            modify:this.modify,
                            read:this.read,
                            persistence: this.persistence,
                            http: this.http,
                            uikitcontext: context
                        })
                        return context
                                .getInteractionResponder()
                                .openModalViewResponse(addIssueCommentModal);
                    }
                    break;
                }

                case ModalsEnum.COMMENT_ISSUE_ACTION:{
                    let value: string = context.getInteractionData().value as string;
                    let splittedValues = value?.split(" ");
                    let { user } = await context.getInteractionData();
                    let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config) as IAuthData;
                    if(splittedValues.length==2 && accessToken?.token){
                        let data={
                            "repo" : splittedValues[0],
                            "issueNumber": splittedValues[1]
                        }
                        const addIssueCommentModal = await addIssueCommentsModal({
                            data:data,
                            modify:this.modify,
                            read:this.read,
                            persistence: this.persistence,
                            http: this.http,
                            uikitcontext: context
                        })
                        return context
                                .getInteractionResponder()
                                .openModalViewResponse(addIssueCommentModal);
                    }else{
                        const unauthorizedMessageModal = await messageModal({
                            message:`🤖 Error in adding comments, make sure you are logged in`,
                            modify: this.modify,
                            read: this.read,
                            persistence: this.persistence,
                            http: this.http,
                            uikitcontext: context
                        })
                        return context
                            .getInteractionResponder()
                            .openModalViewResponse(unauthorizedMessageModal);
                    }
                    break;
                }

                case ModalsEnum.PR_COMMENT_LIST_ACTION:{
                    let value: string = context.getInteractionData().value as string;
                    let splittedValues = value?.split(" ");
                    let { user } = await context.getInteractionData();
                    let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config) as IAuthData;
                    if(splittedValues.length==2 && accessToken?.token){
                        let repoName = splittedValues[0];
                        let pullNumber = splittedValues[1];
                        let pullRequestComments = await getPullRequestComments(this.http,repoName,accessToken.token,pullNumber);
                        let pullRequestData = await getPullRequestData(this.http,repoName,accessToken.token,pullNumber);
                        if(pullRequestData?.serverError || pullRequestComments?.pullRequestData){
                            if(pullRequestData?.serverError){
                                const unauthorizedMessageModal = await messageModal({
                                    message:`🤖 Error Fetching Repository Data: ⚠️ ${pullRequestData?.message}`,
                                    modify: this.modify,
                                    read: this.read,
                                    persistence: this.persistence,
                                    http: this.http,
                                    uikitcontext: context
                                })
                                return context
                                    .getInteractionResponder()
                                    .openModalViewResponse(unauthorizedMessageModal);
                            }
                            if(pullRequestComments?.serverError){
                                const unauthorizedMessageModal = await messageModal({
                                    message:`🤖 Error Fetching Comments: ⚠️ ${pullRequestData?.message}`,
                                    modify: this.modify,
                                    read: this.read,
                                    persistence: this.persistence,
                                    http: this.http,
                                    uikitcontext: context
                                })
                                return context
                                    .getInteractionResponder()
                                    .openModalViewResponse(unauthorizedMessageModal);
                            }
                        }
                        let data={
                            repo: repoName,
                            pullNumber: pullNumber,
                            pullData: pullRequestData,
                            pullRequestComments: pullRequestComments?.data
                        }
                        const addPRCommentModal = await pullRequestCommentsModal({
                            data:data,
                            modify:this.modify,
                            read:this.read,
                            persistence: this.persistence,
                            http: this.http,
                            uikitcontext: context
                        })
                        return context
                                .getInteractionResponder()
                                .openModalViewResponse(addPRCommentModal);
                    }
                    break;
                }
                case ModalsEnum.ADD_GITHUB_ISSUE_ASSIGNEE_PROFILE :
                case ModalsEnum.ADD_GITHUB_ISSUE_ASSIGNEE: {
                    let value: string = context.getInteractionData().value as string;
                    let splittedValues = value?.split(" ");
                    if(splittedValues?.length>=3){
                        let repository = splittedValues[0];
                        let issueNumber = splittedValues[1];
                        let assignees: string = "";
                        for(let i = 2;i<splittedValues.length;i++){
                            if(splittedValues[i].length>0){
                                assignees += `${splittedValues[i]} `;
                            }
                        }
                        let data = {
                            repository,
                            issueNumber,
                            assignees
                        };
                        const addIssueAssignee = await addIssueAssigneeModal({
                            data,
                            modify: this.modify,
                            read: this.read,
                            persistence: this.persistence,
                            http: this.http,
                            uikitcontext: context
                        })
                        return context
                            .getInteractionResponder()
                            .openModalViewResponse(addIssueAssignee);
                    }
                    break;
                }
                case ModalsEnum.REFRESH_GITHUB_ISSUES_ACTION: {
                    let repository: string = context.getInteractionData().value as string;
                    repository=repository?.trim();
                    let { user } = await context.getInteractionData();
                    let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config);
                    if (!accessToken) {
                        let response = await gitHubApiClient.getRepositoryIssues(repository);
                        let data = {
                            issues: response.issues,
                            pushRights : false, //no access token, so user has no pushRights to the repo,
                            repo: repository
                        }
                        const issuesListModal = await githubIssuesListModal( {data: data, modify: this.modify, read: this.read, persistence: this.persistence, http: this.http, uikitcontext: context} );
                        await this.modify.getUiController().updateModalView(issuesListModal, { triggerId: context.getInteractionData().triggerId }, context.getInteractionData().user);
                    }else{
                        let repoDetails = await getRepoData(this.http,repository,accessToken.token);
                        let response = await gitHubApiClient.getRepositoryIssues(repository);
                        let data = {
                            issues: response.issues,
                            pushRights : repoDetails?.permissions?.push || repoDetails?.permissions?.admin,
                            repo: repository
                        }
                        const issuesListModal = await githubIssuesListModal( {data: data, modify: this.modify, read: this.read, persistence: this.persistence, http: this.http, uikitcontext: context} );
                        await this.modify.getUiController().updateModalView(issuesListModal, { triggerId: context.getInteractionData().triggerId }, context.getInteractionData().user);
                    }
                    break;
                }
                case ModalsEnum.MULTI_SHARE_ADD_GITHUB_ISSUE_ACTION:{
                    let { user, room } = await context.getInteractionData();
                    let issueId: string = context.getInteractionData().value as string;
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
                        let githubissueStorage = new GithubRepoIssuesStorage(this.persistence,this.read.getPersistenceReader());
                        let repoIssuesData: IGitHubIssueData = await githubissueStorage.getIssueData(room?.id as string,user);
                            if(repoIssuesData?.issue_list?.length){
                                let index = -1;
                                let currentIndex = 0;
                                for(let issue of repoIssuesData.issue_list){
                                    if(issue.issue_id == issueId ){
                                        index=currentIndex;
                                        break;
                                    }
                                    currentIndex++;
                                }
                                if(index !== -1){
                                    repoIssuesData.issue_list[index].share=true;
                                    await githubissueStorage.updateIssueData(room as IRoom,user,repoIssuesData);
                                }
                                let data = {
                                    issues: repoIssuesData.issue_list,
                                    pushRights : repoIssuesData.push_rights, //no access token, so user has no pushRights to the repo,
                                    repo: repoIssuesData.repository,
                                    user_id: user.id
                                }
                                const githubIssuesModal = await githubIssuesListModal({
                                    data: data,
                                    modify: this.modify,
                                    read: this.read,
                                    persistence: this.persistence,
                                    http: this.http,
                                })
                                await this.modify.getUiController().updateModalView(githubIssuesModal, { triggerId: context.getInteractionData().triggerId }, context.getInteractionData().user);
                            }
                    }
                    break;
                }
                case ModalsEnum.MULTI_SHARE_REMOVE_GITHUB_ISSUE_ACTION:{
                    let { user, room } = await context.getInteractionData();
                    let issueId: string = context.getInteractionData().value as string;
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
                        let githubissueStorage = new GithubRepoIssuesStorage(this.persistence,this.read.getPersistenceReader());
                        let repoIssuesData: IGitHubIssueData = await githubissueStorage.getIssueData(room?.id as string,user);
                            if(repoIssuesData?.issue_list?.length){
                                let index = -1;
                                let currentIndex = 0;
                                for(let issue of repoIssuesData.issue_list){
                                    if(issue.issue_id == issueId ){
                                        index=currentIndex;
                                        break;
                                    }
                                    currentIndex++;
                                }
                                if(index !== -1){
                                    repoIssuesData.issue_list[index].share=false;
                                    await githubissueStorage.updateIssueData(room as IRoom,user,repoIssuesData);
                                }
                                 let data = {
                                    issues: repoIssuesData.issue_list,
                                    pushRights : repoIssuesData.push_rights, //no access token, so user has no pushRights to the repo,
                                    repo: repoIssuesData.repository,
                                    user_id: user.id
                                }
                                const githubIssuesModal = await githubIssuesListModal({
                                    data: data,
                                    modify: this.modify,
                                    read: this.read,
                                    persistence: this.persistence,
                                    http: this.http,
                                })
                                await this.modify.getUiController().updateModalView(githubIssuesModal, { triggerId: context.getInteractionData().triggerId }, context.getInteractionData().user);
                            }
                    }
                    break;
                }

                case ModalsEnum.GITHUB_LOGIN_ACTION :{
                    const {user, room} = context.getInteractionData();
                    if(room){
                        await storeInteractionRoomData(
                            this.persistence,
                            user.id,
                            room.id
                        );
                    }
                    break;
                }

                case ModalsEnum.TRIGGER_ASSIGN_ISSUES_MODAL: {
                    const assignIssuesModal = await GitHubIssuesStarterModal({
                        modify: this.modify,
                        read: this.read,
                        persistence: this.persistence,
                        http: this.http,
                        uikitcontext: context
                    })
                    return context.getInteractionResponder().openModalViewResponse(assignIssuesModal);
                }

                case ModalsEnum.TRIGGER_SUBSCRIPTIONS_MODAL: {
                    const opensubscriptionsModal = await subscriptionsModal({
                        modify: this.modify,
                        read: this.read,
                        persistence: this.persistence,
                        http: this.http,
                        uikitcontext: context
                    });

                    return context.getInteractionResponder().openModalViewResponse(opensubscriptionsModal);
                }

                case ModalsEnum.TRIGGER_NEW_ISSUE_MODAL: {
                    const newIssueModal = await NewIssueStarterModal({
                        modify: this.modify,
                        read: this.read,
                        persistence: this.persistence,
                        http: this.http,
                        uikitcontext: context
                    });
                    return context.getInteractionResponder().openModalViewResponse(newIssueModal);
                }

                case ModalsEnum.TRIGGER_SEARCH_MODAL: {
                    const searchModal = await githubSearchModal({
                        modify: this.modify,
                        read: this.read,
                        persistence: this.persistence,
                        http: this.http,
                        uikitcontext: context
                    });

                    return context.getInteractionResponder().openModalViewResponse(searchModal);
                }

                case ModalsEnum.UNSUBSCRIBE_REMINDER_ACTION:{
                    const param:string[] = data.value?.split('|') as string[];
                    let { user, room } = await context.getInteractionData();
                    const repo = param[0];
                    const number  = param[1];

                    await unsubscribedPR(this.read,this.persistence,repo,Number(number),user);

                    const message = `You have unsubscribed from repository [${repo} Pull Request #${number}](https://github.com/${repo}/pull/${number})`;
                    await sendNotification(this.read, this.modify, user, room as IRoom, message);

                }

                case ModalsEnum.REMINDER_REMOVE_REPO_ACTION : {
                   const {value, user} = context.getInteractionData();
                    await removeRepoReminder(this.read, this.persistence, value as string, user);

                   const updatedReminderModal = await reminderModal({modify: this.modify, read:this.read, persistence: this.persistence, http: this.http, uikitcontext: context});

                   return context.getInteractionResponder().updateModalViewResponse( updatedReminderModal);
                }
            }
        } catch (error) {
            console.log(error);
        }

        return context.getInteractionResponder().successResponse();
    }
}

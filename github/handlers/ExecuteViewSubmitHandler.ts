import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { ModalsEnum } from '../enum/Modals';
import { sendMessage, sendNotification } from '../lib/message';
import { getInteractionRoomData } from '../persistance/roomInteraction';
import { Subscription } from '../persistance/subscriptions';
import { GithubApp } from '../GithubApp';
import { getWebhookUrl } from '../helpers/getWebhookURL';
import { addSubscribedEvents, createSubscription, updateSubscription } from '../helpers/githubSDK';
import { getAccessTokenForUser } from '../persistance/auth';
import { subsciptionsModal } from '../modals/subscriptionsModal';
import { mergePullRequest } from '../helpers/githubSDK';
import { messageModal } from '../modals/messageModal';

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
                case ModalsEnum.MERGE_PULL_REQUEST_VIEW:{
                    if (user.id) {
                        const { roomId } = await getInteractionRoomData(this.read.getPersistenceReader(), user.id);
                        if (roomId) {
                            let room = await this.read.getRoomReader().getById(roomId) as IRoom;
                            const repository = view.state?.[ModalsEnum.REPO_NAME_INPUT]?.[ModalsEnum.REPO_NAME_INPUT_ACTION];
                            const pullNumber = view.state?.[ModalsEnum.PULL_REQUEST_NUMBER_INPUT]?.[ModalsEnum.PULL_REQUEST_NUMBER_INPUT_ACTION];
                            const commitTitle = view.state?.[ModalsEnum.PULL_REQUEST_COMMIT_TITLE_INPUT]?.[ModalsEnum.PULL_REQUEST_COMMIT_TITLE_ACTION];
                            const commitMessage = view.state?.[ModalsEnum.PULL_REQUEST_COMMIT_MESSAGE_INPUT]?.[ModalsEnum.PULL_REQUEST_COMMIT_MESSAGE_ACTION];
                            const mergeMethod = view.state?.[ModalsEnum.PULL_REQUEST_MERGE_METHOD_INPUT]?.[ModalsEnum.PULL_REQUEST_MERGE_METHOD_OPTION];
                            let accessToken = await getAccessTokenForUser(this.read, user, this.app.oauth2Config);
                            if(accessToken?.token){
                                let mergeResponse = await mergePullRequest(this.http,repository,accessToken.token,pullNumber,commitTitle,commitMessage,mergeMethod);
                                if(mergeResponse?.serverError){
                                    let errorMessage = mergeResponse?.message;
                                    const unauthorizedMessageModal = await messageModal({
                                        message:`🤖 Unable to merge pull request : ⚠️ ${errorMessage}`,
                                        modify: this.modify,
                                        read: this.read,
                                        persistence: this.persistence,
                                        http: this.http,
                                        uikitcontext: context
                                    })
                                    return context
                                        .getInteractionResponder()
                                        .openModalViewResponse(unauthorizedMessageModal);
                                }else{
                                    let succesMessage = mergeResponse?.message;
                                    const succesMessageModal = await messageModal({
                                        message:`🤖 Merged Pull Request  : ✔️ ${succesMessage}`,
                                        modify: this.modify,
                                        read: this.read,
                                        persistence: this.persistence,
                                        http: this.http,
                                        uikitcontext: context
                                    })
                                    return context
                                        .getInteractionResponder()
                                        .openModalViewResponse(succesMessageModal);
                                }
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
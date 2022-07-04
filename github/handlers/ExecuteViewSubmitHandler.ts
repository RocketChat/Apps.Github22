import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { ModalsEnum } from '../enum/Modals';
import { sendMessage, sendNotification } from '../lib/message';
import { getInteractionRoomData } from '../persistance/roomInteraction';
import { Subscription } from '../persistance/subscriptions';
import { GithubApp } from '../GithubApp';
import { getWebhookUrl } from '../helpers/getWebhookURL';
import { createSubscription } from '../helpers/githubSDK';
import { getAccessTokenForUser } from '../persistance/auth';
import { subsciptionsModal } from '../modals/subscriptionsModal';


export class ExecuteViewSubmitHandler {
	constructor(
		private readonly app: GithubApp,
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly modify: IModify,
		private readonly persistence: IPersistence,
	) {}

	public async run(context: UIKitViewSubmitInteractionContext) {
		const { user, view } = context.getInteractionData();

        try {
            switch (view.id) {
                case ModalsEnum.ADD_SUBSCRIPTION_VIEW:
                    if (user.id) {
                        const { roomId } = await getInteractionRoomData(this.read.getPersistenceReader(),user.id);
                        if (roomId) {
                            let room = await this.read.getRoomReader().getById(roomId) as IRoom;
                            const repository = view.state?.[ModalsEnum.REPO_NAME_INPUT]?.[ModalsEnum.REPO_NAME_INPUT_ACTION];
                            const events = view.state?.[ModalsEnum.ADD_SUBSCRIPTION_EVENT_INPUT]?.[ModalsEnum.ADD_SUBSCRIPTION_EVENT_OPTIONS];
                            
                            if(typeof(repository) == undefined  || typeof(events) == undefined){
                                
                                await sendNotification(this.read,this.modify,user,room,"Invalid Input !");
                            }else{
                                let accessToken = await getAccessTokenForUser(this.read,user,this.app.oauth2Config);
                                if(!accessToken){
                                  
                                    await sendNotification(this.read,this.modify,user,room,"Login To Github !");
                                }else{
                                    let url = await getWebhookUrl(this.app);
                                    let response = await createSubscription(this.http,repository,url,accessToken.token,events);
                                    let subsciptionStorage = new Subscription(this.persistence,this.read.getPersistenceReader())
                                    
                                    let createdEntry = false ;
                                    for(let event of events){
                                        createdEntry= await subsciptionStorage.createSubscription(repository,event,response?.id,room,user);
                                    }
                                    if(!createdEntry){
                                        throw new Error("Error creating new subscription entry");
                                    }
                                    await sendNotification(this.read,this.modify,user,room,`Subscibed to ${repository} ✔️`);
                                }
                           
                            }
                            return context.getInteractionResponder().successResponse();
                        }
                    }
                    break;
                default:
                    break;
            }
            
        } catch (error) {
            console.log('error : ',error);   
        }

		return {
			success: true,
		};
	}
}
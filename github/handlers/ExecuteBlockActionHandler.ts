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
import { deleteSubscription } from "../helpers/githubSDK";
import { Subscription } from "../persistance/subscriptions";
import { getAccessTokenForUser } from "../persistance/auth";
import { GithubApp } from "../GithubApp";
import { IAuthData } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";
import { storeInteractionRoomData, getInteractionRoomData } from "../persistance/roomInteraction";
export class ExecuteBlockActionHandler {
    constructor(
        private readonly app: GithubApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

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
                        console.log("PRESS",query);
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
            case ModalsEnum.OPEN_ADD_SUBSCRIPTIONS_MODAL:{
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
            case ModalsEnum.OPEN_DELETE_SUBSCRIPTIONS_MODAL:{
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
            case ModalsEnum.DELETE_SUBSCRIPTION_ACTION:{
                
                
                let {user,room} = await context.getInteractionData();
                let accessToken = await getAccessTokenForUser(this.read,user,this.app.oauth2Config) as IAuthData;
                let value :string= context.getInteractionData().value as string;
                let splitted = value.split(',');
                if(splitted.length == 2 && accessToken.token){
                    let repoName = splitted[0];
                    let hookId = splitted[1];
                    let roomId;
                    if (room?.id) {
                        roomId = room.id;
                        await storeInteractionRoomData(this.persistence, user.id, roomId);
                    } else {
                        roomId = (await getInteractionRoomData(this.read.getPersistenceReader(), user.id)).roomId;
                    }
                    // await deleteSubscription(this.http,repoName,accessToken.token,hookId);
                    let subsciptionStorage = new Subscription(this.persistence,this.read.getPersistenceReader());
                    await subsciptionStorage.deleteSubscriptionsByRepoUser(repoName,roomId,user.id);
                }
                
        
                const modal = await deleteSubsciptionsModal({ modify: this.modify, read: this.read, persistence: this.persistence,http : this.http, uikitcontext: context });
                await this.modify.getUiController().updateModalView(modal, { triggerId: context.getInteractionData().triggerId }, context.getInteractionData().user);
                break;
            }
        }

        } catch (error) {
             console.log(error);
        }
        
        return context.getInteractionResponder().successResponse();
    }
}

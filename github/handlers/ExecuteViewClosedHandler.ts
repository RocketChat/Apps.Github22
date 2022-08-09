import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IApp } from "@rocket.chat/apps-engine/definition/IApp";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { UIKitViewCloseInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { ModalsEnum } from "../enum/Modals";
import { pullDetailsModal } from "../modals/pullDetailsModal";
import { storeInteractionRoomData, clearInteractionRoomData, getInteractionRoomData } from "../persistance/roomInteraction";
import { GithubSearchResultStorage } from "../persistance/searchResults";

export class ExecuteViewClosedHandler {
    constructor(
        private readonly app: IApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async run(context: UIKitViewCloseInteractionContext) {
        const { view } = context.getInteractionData();
        switch (view.id) {
            case ModalsEnum.PULL_VIEW ||
                 ModalsEnum.CODE_VIEW:
                const modal = await pullDetailsModal({
                    modify: this.modify,
                    read: this.read,
                    persistence: this.persistence,
                    http: this.http,
                    uikitcontext: context,
                });
                await this.modify.getUiController().updateModalView(
                    modal,
                    {
                        triggerId: context.getInteractionData()
                            .triggerId as string,
                    },
                    context.getInteractionData().user
                );
                break;
            case ModalsEnum.SEARCH_RESULT_VIEW:{
                const room = context.getInteractionData().room;
                const user = context.getInteractionData().user;
        
                if (user?.id) {
                    let roomId;
            
                    if (room?.id) {
                        roomId = room.id;
                        await storeInteractionRoomData(this.persistence, user.id, roomId);
                    } else {
                        roomId = (
                            await getInteractionRoomData(
                                this.read.getPersistenceReader(),
                                user.id
                            )
                        ).roomId;
                    }
                    let githubSearchStorage = new GithubSearchResultStorage(this.persistence,this.read.getPersistenceReader());
                    await githubSearchStorage.deleteSearchResults(roomId,user);
                }
                break;
            }
        }
        return { success: true } as any;
    }
}

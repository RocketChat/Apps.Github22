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

export class ExecuteBlockActionHandler {
    constructor(
        private readonly app: IApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async run(
        context: UIKitBlockInteractionContext
    ): Promise<IUIKitResponse> {
        const data = context.getInteractionData();

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
        }

        return context.getInteractionResponder().successResponse();
    }
}

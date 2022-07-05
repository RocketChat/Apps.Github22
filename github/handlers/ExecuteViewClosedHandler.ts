import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IApp } from "@rocket.chat/apps-engine/definition/IApp";
import { UIKitViewCloseInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { ModalsEnum } from "../enum/Modals";
import { pullDetailsModal } from "../modals/pullDetailsModal";

export class ExecuteViewClosedHandler {
    constructor(
        private readonly app: IApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) { }

    public async run(context: UIKitViewCloseInteractionContext) {
        const { view } = context.getInteractionData();
        switch (view.id) {
            case ModalsEnum.PULL_VIEW || ModalsEnum.CODE_VIEW || ModalsEnum.ADD_SUBSCRIPTION_VIEW || ModalsEnum.SUBSCRIPTION_VIEW:
                const modal = await pullDetailsModal({
                    modify: this.modify,
                    read: this.read,
                    persistence: this.persistence,
                    http: this.http,
                    uikitcontext: context,
                });
                await this.modify
                    .getUiController()
                    .updateModalView(
                        modal,
                        {
                            triggerId: context.getInteractionData()
                                .triggerId as string,
                        },
                        context.getInteractionData().user
                    );
                break;
        }
        return { success: true } as any;
    }
}

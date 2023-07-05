import { IRead, IHttp, IModify, IPersistence } from "@rocket.chat/apps-engine/definition/accessors";
import { BlockType, IImageBlock, IImageElement, IUIKitResponse, UIKitActionButtonInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { ModalsEnum } from "../enum/Modals";
import { GithubApp } from "../GithubApp";
import { NewIssueModal } from "../modals/newIssueModal";

export class ExecuteButtonActionHandler {
    constructor(
        private readonly app: GithubApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) { }

    public async run(
        context: UIKitActionButtonInteractionContext
    ): Promise<IUIKitResponse>{
        const data = context.getInteractionData();

        try {
            const { actionId } = data;
            switch (actionId) {
                case ModalsEnum.NEW_ISSUE_ACTION: {
                    const { message, user, room } = data;

                    let modalData;
                    if (message && (message.text || message.attachments)){

                        // TODO We need to download and upload the files to github first, else rocket.chat won't allow accessing images like below
                        // const attachmentImageURLs: String[] = []
                        // const attachmentVideoURLs: String[] = []
                        // const settings = this.read.getEnvironmentReader().getServerSettings();
                        // const Site_Url = await settings.getValueById("Site_Url");
                        // if (message.attachments){
                        //     message.attachments.map((attachment) => {
                        //         if (attachment.imageUrl){
                        //             attachmentImageURLs.push(`### ${attachment.description?.split("|").pop()}\n![image](${Site_Url}/${attachment.imageUrl})`)
                        //         }
                        //         if (attachment.videoUrl){
                        //             attachmentVideoURLs.push(`### ${attachment.description?.split("|").pop()}\n` + `${Site_Url}/${attachment.videoUrl}`)
                        //         }
                        //     })
                        // }

                        // if (message.blocks){
                        //     message.blocks.map((element) => {
                        //         if (element.type === BlockType.IMAGE){
                        //             element = element as IImageElement
                        //             attachmentImageURLs.push(`### ${element.altText}\n![image](${element.imageUrl})`)
                        //         }
                        //     })
                        // }

                        // Taking Repository and Body Seperated By Pipe Operator
                        let pieces = message.text ? message.text.split("|") : [""]

                        if (message.text === '' && message.attachments){
                            if (message.attachments[0].description){
                                pieces = message.attachments[0].description.split("|")
                            }
                        }
                        

                        modalData = {
                            repository: pieces.length === 2 ? pieces[0] : undefined,
                            template : pieces.length === 2 ? pieces[1] : pieces[0]
                            // template : (pieces.length === 2 ? pieces[1] : pieces[0]) + (attachmentImageURLs.length !== 0 ? "\n## Screenshots\n" + attachmentImageURLs.join("\n") : "") + (attachmentVideoURLs.length !== 0 ? "\n## Videos\n" + attachmentVideoURLs.join("\n") : "" )
                        }
                    }

                    const modal = await NewIssueModal({
                        data: modalData,
                        modify: this.modify,
                        read: this.read,
                        persistence: this.persistence,
                        http: this.http,
                        user: user,
                        room: room,
                    })

                    return context.getInteractionResponder().openModalViewResponse(modal)
                }

            }
        } catch (error){
            console.log(error)
        }

        return context.getInteractionResponder().successResponse()
    }
}

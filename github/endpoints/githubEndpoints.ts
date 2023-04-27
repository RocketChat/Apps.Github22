import { ApiEndpoint } from "@rocket.chat/apps-engine/definition/api";
import {
    IRead,
    IHttp,
    IModify,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    IApiEndpointInfo,
    IApiEndpoint,
    IApiRequest,
    IApiResponse,
} from "@rocket.chat/apps-engine/definition/api";
import { Subscription } from "../persistance/subscriptions";
import { ISubscription } from "../definitions/subscription";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
export class githubWebHooks extends ApiEndpoint {
    public path = "githubwebhook";

    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<IApiResponse> {
        let event: string = request.headers["x-github-event"] as string;
        let payload: any;
        if (
            request.headers["content-type"] ===
            "application/x-www-form-urlencoded"
        ) {
            payload = JSON.parse(request.content.payload);
        } else {
            payload = request.content;
        }

        let subscriptionStorage = new Subscription(
            persis,
            read.getPersistenceReader()
        );

        const subscriptions: Array<ISubscription> =
            await subscriptionStorage.getSubscribedRooms(
                payload.repository.full_name,
                event
            );
        if (!subscriptions || subscriptions.length == 0) {
            return this.success();
        }
        const eventCaps = event.toUpperCase();
        let messageText = "newEvent !";

        if (event == "push") {
            messageText = `*New Commits to* *[${payload.repository.full_name}](${payload.repository.html_url}) by ${payload.pusher.name}*`;
        } else if (event == "pull_request") {
            if(payload.action == "opened"){
                messageText = `*[New Pull Request](${payload.pull_request.html_url})*  *|* *#${payload.pull_request.number} ${payload.pull_request.title}* by *[${payload.user.login}](${payload.user.html_url})* *|* *[${payload.repository.full_name}]*`;
            }else if(payload.action == "closed" && payload.pull_request.merged ){
                messageText = `*[Merged Pull Request](${payload.pull_request.html_url})*  *|* *#${payload.pull_request.number} ${payload.pull_request.title}* by *[${payload.user.login}](${payload.user.html_url})* *|* *[${payload.repository.full_name}]*`;
            }else if(payload.action == "closed" && !payload.pull_request.merged){
                messageText = `*[Closed Pull Request](${payload.pull_request.html_url})*  *|* *#${payload.pull_request.number} ${payload.pull_request.title}* by *[${payload.user.login}](${payload.user.html_url})* *|* *[${payload.repository.full_name}]*`;
            }else if(payload.action =="reopened"){
                messageText = `*[ReOpened Pull Request](${payload.pull_request.html_url})*  *|* *#${payload.pull_request.number} ${payload.pull_request.title}* by *[${payload.user.login}](${payload.user.html_url})* *|* *[${payload.repository.full_name}]*`;
            }else{
                return this.success();
            }
        } else if (event == "issues") {
            if(payload.action == "opened"){
                messageText = `*[New Issue](${payload.issue.html_url})* *|*  *#${payload.issue.number}* *${payload.issue.title}* *|* *[${payload.repository.full_name}](${payload.repository.html_url})*  `;
            }else if(payload.action == "closed"){
                messageText = `*[Issue Closed](${payload.issue.html_url})* *|*  *#${payload.issue.number}* *${payload.issue.title}* *|* *[${payload.repository.full_name}](${payload.repository.html_url})*  `;
            }else if(payload.action == "reopened"){
                messageText = `*[ReOpened Issue](${payload.issue.html_url})* *|*  *#${payload.issue.number}* *${payload.issue.title}* *|* *[${payload.repository.full_name}](${payload.repository.html_url})*  `;
            }else{
                return this.success();
            }
        } else if (event == "deployment_status") {
            messageText = `*Deployment Status ${payload.deployment_status.state}* *|*  *${payload.repository.full_name}*`;
        } else if (event == "star"){
            if(payload?.action == "created"){
                messageText = `*New Stars on* *${payload.repository.full_name}*  *|* *${payload.repository.stargazers_count}* ⭐`;
            }else{
                return this.success();
            }
        }
        for (let subscription of subscriptions) {
            let roomId = subscription.room;
            if (!roomId) {
                continue;
            }
            const room: IRoom = (await read
                .getRoomReader()
                .getById(roomId)) as IRoom;
            const textSender = await modify
                .getCreator()
                .startMessage()
                .setText(messageText);
            if (room) {
                textSender.setRoom(room);
            }
            await modify.getCreator().finish(textSender);
        }

        return this.success();
    }
}

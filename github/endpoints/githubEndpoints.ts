import { ApiEndpoint } from "@rocket.chat/apps-engine/definition/api"
import { IRead, IHttp, IModify,IPersistence } from "@rocket.chat/apps-engine/definition/accessors";
import { IApiEndpointInfo,IApiEndpoint, IApiRequest,IApiResponse } from "@rocket.chat/apps-engine/definition/api";
export class githubWebHooks extends ApiEndpoint{
    public path = 'githubwebhook'
    
    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponse> {
        // await this.handleEvent(request, read, modify);
        console.log(request.content.toString());
        return this.success();
    }

}
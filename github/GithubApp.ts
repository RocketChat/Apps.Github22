import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
    IAppInstallationContext,
    IConfigurationModify,
    IEnvironmentRead
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { GithubCommand } from "./commands/GithubCommand";
import { IUIKitResponse, UIKitBlockInteractionContext, UIKitViewCloseInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { ExecuteViewClosedHandler } from "./handlers/ExecuteViewClosedHandler";
import { ExecuteBlockActionHandler } from "./handlers/ExecuteBlockActionHandler";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IAuthData, IOAuth2Client, IOAuth2ClientOptions } from '@rocket.chat/apps-engine/definition/oauth2/IOAuth2';
import { createOAuth2Client } from '@rocket.chat/apps-engine/definition/oauth2/OAuth2';
import { create as registerAuthorizedUser } from "./persistance/users";
import { createSectionBlock } from "./lib/blocks";
import { sendDirectMessage } from "./lib/message";
import { OAuth2Client } from "@rocket.chat/apps-engine/server/oauth2/OAuth2Client";

export class GithubApp extends App {

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

 
    private oauth2ClientInstance: IOAuth2Client;
    
    public oauth2Config: IOAuth2ClientOptions = {
        alias: 'github-app',
        accessTokenUri: 'https://github.com/login/oauth/access_token',
        authUri: 'https://github.com/login/oauth/authorize',
        refreshTokenUri: 'https://github.com/login/oauth/access_token',
        revokeTokenUri: 'https://github.com/login/oauth/access_token',
        authorizationCallback: this.autorizationCallback.bind(this),
        defaultScopes:['users','repo'],
        
        };
    
    private async autorizationCallback(
        token: IAuthData,
        user: IUser,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence,
    ) {

        if (token) {
            await registerAuthorizedUser(read, persistence, user);
        }  
      
        const text =`Authentication Succesfull !`

        await sendDirectMessage(read, modify, user, text, persistence);   
    }

    public getOauth2ClientInstance(): IOAuth2Client {
        if (!this.oauth2ClientInstance) {
            this.oauth2ClientInstance = createOAuth2Client(this, this.oauth2Config);
        }
        return this.oauth2ClientInstance;
    }

    public async executeBlockActionHandler(context: UIKitBlockInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<IUIKitResponse> {
        const handler = new ExecuteBlockActionHandler(this, read, http, modify, persistence);
        return await handler.run(context);
    }

    public async executeViewClosedHandler(context: UIKitViewCloseInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {
        const handler = new ExecuteViewClosedHandler(this, read, http, modify, persistence);
        return await handler.run(context);
    }

    public async extendConfiguration(
        configuration: IConfigurationExtend
    ): Promise<void> {
        const gitHubCommand: GithubCommand = new GithubCommand(this);
        await Promise.all([
            configuration.slashCommands.provideSlashCommand(gitHubCommand),
            this.getOauth2ClientInstance().setup(configuration)
        ]) 
    }
}

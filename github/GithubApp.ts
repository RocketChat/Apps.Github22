import {
    IAppAccessors,
    IAppInstallationContext,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IMessageBuilder,
    IMessageExtender,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { GithubCommand } from "./commands/GithubCommand";
import {
    ButtonStyle,
    IUIKitResponse,
    UIKitBlockInteractionContext,
    UIKitViewCloseInteractionContext,
    UIKitViewSubmitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { ExecuteViewClosedHandler } from "./handlers/ExecuteViewClosedHandler";
import { ExecuteBlockActionHandler } from "./handlers/ExecuteBlockActionHandler";
import { ExecuteViewSubmitHandler } from "./handlers/ExecuteViewSubmitHandler";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import {
    IAuthData,
    IOAuth2Client,
    IOAuth2ClientOptions,
} from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";
import { createOAuth2Client } from "@rocket.chat/apps-engine/definition/oauth2/OAuth2";
import { createSectionBlock } from "./lib/blocks";
import {
    sendDirectMessage,
    sendDirectMessageOnInstall,
    sendMessage,
    sendNotification,
} from "./lib/message";
import { OAuth2Client } from "@rocket.chat/apps-engine/server/oauth2/OAuth2Client";
import { deleteOathToken } from "./processors/deleteOAthToken";
import { ProcessorsEnum } from "./enum/Processors";
import {
    ApiSecurity,
    ApiVisibility,
} from "@rocket.chat/apps-engine/definition/api";
import { githubWebHooks } from "./endpoints/githubEndpoints";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { clearInteractionRoomData, getInteractionRoomData } from "./persistance/roomInteraction";
import { GHCommand } from "./commands/GhCommand";
import { IPreMessageSentExtend, IMessage,IPreMessageSentModify, IPostMessageSent } from "@rocket.chat/apps-engine/definition/messages";
import { handleGitHubCodeSegmentLink } from "./handlers/GitHubCodeSegmentHandler";
import { isGithubLink, hasGitHubCodeSegmentLink, hasGithubPRLink } from "./helpers/checkLinks";
import { handleGithubPRLink } from "./handlers/GithubPRlinkHandler";

export class GithubApp extends App implements IPreMessageSentExtend,IPostMessageSent{
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    async checkPostMessageSent?(message: IMessage, read: IRead, http: IHttp): Promise<boolean> {
      if (await hasGithubPRLink(message)){
        return true
      }
      return false; 
    }
    
    async executePostMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
        
        await handleGithubPRLink(message,read,http,persistence,modify)
        
    }

    public async checkPreMessageSentExtend(
        message: IMessage,
        read: IRead,
        http: IHttp
    ): Promise<boolean> {
        if (await isGithubLink(message)) {
            return true;
        }
        return false;
    }

    public async executePreMessageSentExtend(
        message: IMessage,
        extend: IMessageExtender,
        read: IRead,
        http: IHttp,
        persistence: IPersistence
    ): Promise<IMessage> {

        if (await hasGitHubCodeSegmentLink(message)) {
            await handleGitHubCodeSegmentLink(message, read, http, message.sender, message.room, extend);
        }
        
        return extend.getMessage();
    }
    
    public async authorizationCallback(
        token: IAuthData,
        user: IUser,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence
    ) {
        const deleteTokenTask = {
            id: ProcessorsEnum.REMOVE_GITHUB_LOGIN,
            when: "7 days",
            data: {
                user: user,
                config: this.oauth2Config,
            },
        };
        let text = `GitHub Authentication Succesfull 🚀`;
        let interactionData = await getInteractionRoomData(
            read.getPersistenceReader(),
            user.id
        );

        if (token) {
            // await registerAuthorizedUser(read, persistence, user);
            await modify.getScheduler().scheduleOnce(deleteTokenTask);
        } else {
            text = `Authentication Failure 😔`;
        }
        if (interactionData && interactionData.roomId) {
            let roomId = interactionData.roomId as string;
            let room = (await read.getRoomReader().getById(roomId)) as IRoom;
            await clearInteractionRoomData(persistence, user.id);
            await sendNotification(read, modify, user, room, text);
        } else {
            await sendDirectMessage(read, modify, user, text, persistence);
        }
    }
    public oauth2ClientInstance: IOAuth2Client;
    public oauth2Config: IOAuth2ClientOptions = {
        alias: "github-app",
        accessTokenUri: "https://github.com/login/oauth/access_token",
        authUri: "https://github.com/login/oauth/authorize",
        refreshTokenUri: "https://github.com/login/oauth/access_token",
        revokeTokenUri: `https://api.github.com/applications/client_id/token`,
        authorizationCallback: this.authorizationCallback.bind(this),
        defaultScopes: ["users", "repo"],
    };
    public getOauth2ClientInstance(): IOAuth2Client {
        if (!this.oauth2ClientInstance) {
            this.oauth2ClientInstance = createOAuth2Client(
                this,
                this.oauth2Config
            );
        }
        return this.oauth2ClientInstance;
    }

    public async executeBlockActionHandler(
        context: UIKitBlockInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<IUIKitResponse> {
        const handler = new ExecuteBlockActionHandler(
            this,
            read,
            http,
            modify,
            persistence
        );
        return await handler.run(context);
    }

    public async executeViewClosedHandler(
        context: UIKitViewCloseInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        const handler = new ExecuteViewClosedHandler(
            this,
            read,
            http,
            modify,
            persistence
        );
        return await handler.run(context);
    }

    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        const handler = new ExecuteViewSubmitHandler(
            this,
            read,
            http,
            modify,
            persistence
        );
        return await handler.run(context);
    }

    public async extendConfiguration(
        configuration: IConfigurationExtend
    ): Promise<void> {
        const gitHubCommand: GithubCommand = new GithubCommand(this);
        const ghCommand: GHCommand = new GHCommand(this);
        await Promise.all([
            configuration.slashCommands.provideSlashCommand(gitHubCommand),
            configuration.slashCommands.provideSlashCommand(ghCommand),
            this.getOauth2ClientInstance().setup(configuration),
        ]);
        configuration.scheduler.registerProcessors([
            {
                id: ProcessorsEnum.REMOVE_GITHUB_LOGIN,
                processor: async (jobContext, read, modify, http, persis) => {
                    let user = jobContext.user as IUser;
                    let config = jobContext.config as IOAuth2ClientOptions;
                    try {
                        await deleteOathToken({
                            user,
                            config,
                            read,
                            modify,
                            http,
                            persis,
                        });
                    } catch (e) {
                        await sendDirectMessage(
                            read,
                            modify,
                            user,
                            e.message,
                            persis
                        );
                    }
                },
            },
        ]);
        configuration.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [new githubWebHooks(this)],
        });
    }
    public async onInstall(
        context: IAppInstallationContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        const user = context.user;
        await sendDirectMessageOnInstall(read, modify, user, persistence);
    }
}

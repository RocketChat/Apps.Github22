import {
    IAppAccessors,
    IAppInstallationContext,
    IConfigurationExtend,
    IConfigurationModify,
    IEnvironmentRead,
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
import {
    sendDirectMessage,
    sendDirectMessageOnInstall,
    sendMessage,
    sendNotification,
} from "./lib/message";
import { deleteOathToken } from "./processors/deleteOAthToken";
import { ProcessorsEnum } from "./enum/Processors";
import {
    ApiSecurity,
    ApiVisibility,
} from "@rocket.chat/apps-engine/definition/api";
import { githubWebHooks } from "./endpoints/githubEndpoints";
import { IJobContext, StartupType } from "@rocket.chat/apps-engine/definition/scheduler";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { clearInteractionRoomData, getInteractionRoomData } from "./persistance/roomInteraction";
import { GHCommand } from "./commands/GhCommand";
import { IPreMessageSentExtend, IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { handleGitHubCodeSegmentLink } from "./handlers/GitHubCodeSegmentHandler";
import { isGithubLink, hasGitHubCodeSegmentLink, hasGithubPRLink } from "./helpers/checkLinks";
import { SendReminder } from "./handlers/SendReminder";
import { AppSettingsEnum, settings } from "./settings/settings";
import { ISetting } from "@rocket.chat/apps-engine/definition/settings";

import { handleGithubPRLinks } from "./handlers/GithubPRlinkHandler";
import { UpdateSetting } from "./persistance/setting";

export class GithubApp extends App implements IPreMessageSentExtend {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
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
        if (await hasGithubPRLink(message)) {
            await handleGithubPRLinks(message, read, http, message.sender, message.room, extend);
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
        await Promise.all(
            settings.map((setting) =>
                configuration.settings.provideSetting(setting)
            )
        );
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
            {
                id:ProcessorsEnum.PR_REMINDER,
                processor:async(jobData,read,modify,http,persis) =>{
                    await SendReminder(jobData,read,modify,http,persis,this)
                },
                startupSetting:{
                    type:StartupType.RECURRING,
                    interval:"0 9 * * *"
                }
            },
            {
                id:ProcessorsEnum.SETTING_UPDATE,
                processor:async(jobContext, read, modify, http, persis)=>{
                    await UpdateSetting(read, persis, this.getAccessors().environmentReader.getSettings())
                },
            }
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

    public async onEnable(environment: IEnvironmentRead, configurationModify: IConfigurationModify): Promise<boolean> {
        await configurationModify.scheduler.scheduleOnce({id:ProcessorsEnum.SETTING_UPDATE,when:"one second"});
        return true;
    }

    public async onSettingUpdated(setting: ISetting, configurationModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
        const interval: string = await this.getAccessors().environmentReader.getSettings().getValueById(AppSettingsEnum.ReminderCRONjobID);
        await configurationModify.scheduler.cancelJob(ProcessorsEnum.PR_REMINDER);
        await configurationModify.scheduler.scheduleRecurring({
            id: ProcessorsEnum.PR_REMINDER,
            interval: interval,
        })
        await configurationModify.scheduler.scheduleOnce({id:ProcessorsEnum.SETTING_UPDATE,when:"one second"});
    }
}

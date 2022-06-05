import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { GithubCommand } from "./commands/GithubCommand";
import {
    UIKitBlockInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { pullRequestListMessage } from "./lib/pullReqeustListMessage";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { issueListMessage } from "./lib/issuesListMessage";
import { contributorListMessage } from "./lib/contributorListMessage";
import { repoDataMessage } from "./lib/repoDataMessage";

export class GithubApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async executeBlockActionHandler(
        context: UIKitBlockInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        const data = context.getInteractionData();

        const { actionId } = data;
        console.log(data);
        switch (actionId) {
            case "githubDataSelect": {
                try {
                    const param = data.value;
                    let paramVal = "";
                    let lengthOfRepoString: number = 0;
                    if (param && param.length) {
                        let i = param.length - 1;
                        for (
                            ;
                            i >= 0 && data.value && data.value[i] != "/";
                            i--
                        ) {
                            paramVal = data.value[i] + paramVal;
                        }
                        lengthOfRepoString = i;
                    }
                    const repository = param?.substring(
                        0,
                        lengthOfRepoString
                    ) as String;

                    const room: IRoom = context.getInteractionData()
                        .room as IRoom;

                    if (paramVal === "pulls") {
                        await pullRequestListMessage({
                            repository,
                            room,
                            read,
                            persistence,
                            modify,
                            http,
                        });
                    } else if (paramVal === "issues") {
                        await issueListMessage({
                            repository,
                            room,
                            read,
                            persistence,
                            modify,
                            http,
                        });
                    } else if (paramVal === "contributors") {
                        await contributorListMessage({
                            repository,
                            room,
                            read,
                            persistence,
                            modify,
                            http,
                        });
                    } else {
                        await repoDataMessage({
                            repository,
                            room,
                            read,
                            persistence,
                            modify,
                            http,
                        });
                    }

                    return {
                        success: true,
                    };
                } catch (err) {
                    console.error(err);
                    return {
                        success: false,
                    };
                }
            }
        }

        return {
            success: false,
        };
    }

    public async extendConfiguration(
        configuration: IConfigurationExtend
    ): Promise<void> {
        const gitHubCommand: GithubCommand = new GithubCommand(this);
        await configuration.slashCommands.provideSlashCommand(gitHubCommand);
    }
}

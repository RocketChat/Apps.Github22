import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    IHttp,
    IMessageBuilder,
    IModify,
    IModifyCreator,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";

import { GithubApp } from "../GithubApp";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { initiatorMessage } from "../lib/initiatorMessage";
import { issueListMessage } from "../lib/issuesListMessage";
import { contributorListMessage } from "../lib/contributorListMessage";
import { pullRequestListMessage } from "../lib/pullReqeustListMessage";
import { repoDataMessage } from "../lib/repoDataMessage";
import { helperMessage } from "../lib/helperMessage";


export class GithubCommand implements ISlashCommand {
    public constructor(private readonly app: GithubApp) {}
    public command = "github";
    public i18nDescription = "fetching githup data";
    public providesPreview = false;
    public i18nParamsExample = "";

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence
    ): Promise<void> {
       
        const command = context.getArguments();
        const sender = context.getSender();
        const room = context.getRoom();

        const data = {
            room: room,
            sender: sender,
            arguments: command,
        };
        
        if(Array.isArray(command) && command.length === 0 ){

            await helperMessage({room,read, persistence, modify, http});

        }else if (Array.isArray(command) && command.length === 1) {

            await initiatorMessage({ data, read, persistence, modify, http });
            
        } else if (Array.isArray(command) && command.length === 2) {
           
            const repository = command[0]; 
            const subcommand2 = command[1];

            switch (subcommand2) {
                case "issues": {
                    await issueListMessage({repository,room,read,persistence,modify,http});
                    break;
                }
                case "contributors": {
                   await contributorListMessage({repository,room,read,persistence,modify,http});
                    break;
                }
                case "pulls": {
                    await pullRequestListMessage({repository,room,read,persistence,modify,http});
                    break;
                }
                case "repo": {
                    await repoDataMessage({repository,room,read,persistence,modify,http})
                    break;
                }
                default: 
                    throw new Error("Error!");
            }
        }

        
    }
}
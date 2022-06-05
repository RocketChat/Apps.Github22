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
import { initiatorMessage } from "../lib/initiatorMessage";
import { helperMessage } from "../lib/helperMessage";
import { basicQueryMessage } from "../helpers/basicQueryMessage";


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
            const query = command[1];

            await basicQueryMessage ({query,repository,room,read,persistence,modify,http});
        }

        
    }
}
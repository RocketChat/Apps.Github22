import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";

import { GithubApp } from "../GithubApp";
import { initiatorMessage } from "../lib/initiatorMessage";
import { helperMessage } from "../lib/helperMessage";
import { basicQueryMessage } from "../helpers/basicQueryMessage";
import { pullDetailsModal } from "../modals/pullDetailsModal";


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

        if(!Array.isArray(command)){
            return;
        }
        
        switch (command?.length) {
            case 0:{
                await helperMessage({room,read, persistence, modify, http});
                break;      
            }
            case 1 : {
                const data = {
                    room: room,
                    sender: sender,
                    arguments: command,
                };
                await initiatorMessage({ data, read, persistence, modify, http });
                break;
            }
            case 2 : {
                const repository = command[0]; 
                const query = command[1];
                await basicQueryMessage ({query,repository,room,read,persistence,modify,http});
                break;
            }
            case 3 :{
                const data = {
                    repository:command[0],
                    query:command[1],
                    number:command[2]
                }
                const triggerId= context.getTriggerId();
                if(triggerId){
                    console.log(triggerId);
                    const modal = await pullDetailsModal({data,modify,read,persistence,http,slashcommandcontext:context});
                    await modify.getUiController().openModalView(modal,{triggerId},context.getSender());
                }else{
                    console.log("Inavlid Trigger ID !");
                }
                break;
            }
            default:{
                await helperMessage({room,read, persistence, modify, http});
                break;
            }
            
        }
    
    }
}
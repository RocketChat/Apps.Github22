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
import { CommandUtility } from "../lib/commandUtility";


export class GithubCommand implements ISlashCommand {
    public constructor(private readonly app: GithubApp) {}
    public command = "github";
    public i18nDescription = "fetching github data";
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

        const commandUtility = new CommandUtility(
            {
                sender: sender,
                room: room,
                command: command,
                context: context,
                read: read,
                modify: modify,
                http: http,
                persistence: persistence,
                app: this.app
            }
        );

        await commandUtility.resolveCommand();
    }}


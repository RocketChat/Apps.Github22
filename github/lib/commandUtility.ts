import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { helperMessage } from "./helperMessage";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { initiatorMessage } from "./initiatorMessage";
import { SubcommandEnum } from "../enum/Subcommands";
import { GithubApp } from "../GithubApp";
import { basicQueryMessage } from "../helpers/basicQueryMessage";
import { pullDetailsModal } from "../modals/pullDetailsModal";
import { ExecutorProps } from "../definitions/ExecutorProps";
import { handleLogin, handleLogout } from "../handlers/AuthenticationHandler";
import {
    SubscribeAllEvents,
    UnsubscribeAllEvents,
    ManageSubscriptions,
} from "../handlers/EventHandler";
import { handleSearch } from "../handlers/SearchHandler";
import { handleNewIssue } from "../handlers/HandleNewIssue";
import { handleUserProfileRequest } from "../handlers/UserProfileHandler";
import { handleIssuesList } from "../handlers/HandleIssueList";

export class CommandUtility implements ExecutorProps {
    sender: IUser;
    room: IRoom;
    command: string[];
    context: SlashCommandContext;
    read: IRead;
    modify: IModify;
    http: IHttp;
    persistence: IPersistence;
    app: GithubApp;

    constructor(props: ExecutorProps) {
        this.sender = props.sender;
        this.room = props.room;
        this.command = props.command;
        this.context = props.context;
        this.read = props.read;
        this.modify = props.modify;
        this.http = props.http;
        this.persistence = props.persistence;
        this.app = props.app;
    }

    private async handleSingularParamCommands() {
        const data = {
            room: this.room,
            sender: this.sender,
            arguments: this.command,
        };
        if (this.command[0].includes("/")) {
            await initiatorMessage({
                data,
                read: this.read,
                persistence: this.persistence,
                modify: this.modify,
                http: this.http,
            });
        } else {
            switch (this.command[0]) {
                case SubcommandEnum.LOGIN: {
                    await handleLogin(
                        this.app,
                        this.read,
                        this.modify,
                        this.context,
                        this.room,
                        this.persistence
                    );
                    break;
                }
                case SubcommandEnum.LOGOUT: {
                    await handleLogout(
                        this.app,
                        this.read,
                        this.modify,
                        this.context,
                        this.room,
                        this.persistence,
                        this.sender,
                        this.http
                    );
                    break;
                }
                case SubcommandEnum.TEST: {
                    break;
                }
                case SubcommandEnum.SUBSCRIBE: {
                    ManageSubscriptions(
                        this.read,
                        this.context,
                        this.app,
                        this.persistence,
                        this.http,
                        this.room,
                        this.modify
                    );
                    break;
                }
                case SubcommandEnum.NEW_ISSUE: {
                    handleNewIssue(
                        this.read,
                        this.context,
                        this.app,
                        this.persistence,
                        this.http,
                        this.room,
                        this.modify
                    );
                    break;
                }
                case SubcommandEnum.SEARCH: {
                    handleSearch(
                        this.read,
                        this.context,
                        this.app,
                        this.persistence,
                        this.http,
                        this.room,
                        this.modify
                    );
                    break;
                }
                case SubcommandEnum.PROFILE: {
                    await handleUserProfileRequest(
                        this.read,
                        this.context,
                        this.app,
                        this.persistence,
                        this.http,
                        this.room,
                        this.modify
                    );
                    break;
                }
                case SubcommandEnum.ISSUES: {
                    await handleIssuesList(
                        this.read,
                        this.context,
                        this.app,
                        this.persistence,
                        this.http,
                        this.room,
                        this.modify
                    );
                    break;
                }
                default: {
                    await helperMessage({
                        room: this.room,
                        read: this.read,
                        persistence: this.persistence,
                        modify: this.modify,
                        http: this.http,
                    });
                    break;
                }
            }
        }
    }

    private async handleDualParamCommands() {
        const query = this.command[1];
        const repository = this.command[0];
        switch (query) {
            case SubcommandEnum.SUBSCRIBE: {
                SubscribeAllEvents(
                    this.read,
                    this.context,
                    this.app,
                    this.command,
                    this.persistence,
                    this.http,
                    this.room,
                    this.modify
                );
                break;
            }
            case SubcommandEnum.UNSUBSCRIBE: {
                UnsubscribeAllEvents(
                    this.read,
                    this.context,
                    this.app,
                    this.command,
                    this.persistence,
                    this.http,
                    this.room,
                    this.modify
                );
                break;
            }
            default: {
                await basicQueryMessage({
                    query,
                    repository,
                    room: this.room,
                    read: this.read,
                    persistence: this.persistence,
                    modify: this.modify,
                    http: this.http,
                });
                break;
            }
        }
    }

    private async handleTriParamCommand() {
        const data = {
            repository: this.command[0],
            query: this.command[1],
            number: this.command[2],
        };
        const triggerId = this.context.getTriggerId();
        if (triggerId) {
            const modal = await pullDetailsModal({
                data,
                modify: this.modify,
                read: this.read,
                persistence: this.persistence,
                http: this.http,
                slashcommandcontext: this.context,
            });
            await this.modify
                .getUiController()
                .openModalView(modal, { triggerId }, this.context.getSender());
        } else {
            console.log("Inavlid Trigger ID !");
        }
    }

    public async resolveCommand() {
        switch (this.command.length) {
            case 0: {
                await helperMessage({
                    room: this.room,
                    read: this.read,
                    persistence: this.persistence,
                    modify: this.modify,
                    http: this.http,
                });
                break;
            }
            case 1: {
                this.handleSingularParamCommands();
                break;
            }
            case 2: {
                this.handleDualParamCommands();
                break;
            }
            case 3: {
                this.handleTriParamCommand();
                break;
            }
            default: {
                await helperMessage({
                    room: this.room,
                    read: this.read,
                    persistence: this.persistence,
                    modify: this.modify,
                    http: this.http,
                });
                break;
            }
        }
    }
}

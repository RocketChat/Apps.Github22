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
import { handleIssues, handleNewIssue } from "../handlers/HandleIssues";
import { handleUserProfileRequest } from "../handlers/UserProfileHandler";
import { HandleInvalidRepoName } from "../handlers/HandleInvalidRepoName";
import { handleMainModal } from "../handlers/MainModalHandler";
import { createReminder } from "../handlers/CreateReminder";
import { ManageReminders, handleReminder } from "../handlers/HandleRemider";
import { commandsEnum } from "../enum/commands";
import { AddAnalyticData } from "../persistance/analytics";

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
            const repoName = this.command[0];
            const isValidRepoName = await HandleInvalidRepoName(
                repoName,
                this.http,
                this.app,
                this.modify,
                this.sender,
                this.read,
                this.room
            );

            if (isValidRepoName) {
                await initiatorMessage({
                    data,
                    read: this.read,
                    persistence: this.persistence,
                    modify: this.modify,
                    http: this.http,
                });
            }
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
                    AddAnalyticData(this.read,this.persistence,commandsEnum.LoginToGitHub)

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
                    AddAnalyticData(this.read,this.persistence,commandsEnum.LogoutFromGitHub)

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
                    handleIssues(
                        this.read,
                        this.context,
                        this.app,
                        this.persistence,
                        this.http,
                        this.room,
                        this.modify
                    )
                    break;
                }
                default: {
                    await helperMessage({
                        room: this.room,
                        read: this.read,
                        persistence: this.persistence,
                        modify: this.modify,
                        http: this.http,
                        user: this.sender
                    });
                    break;
                }
            }
        }
    }

    private async handleDualParamCommands() {
        const query = this.command[1];
        const param = this.command[0];

        if (param === 'reminder') {
            this.handleReminderCommand(query);
        } else {
            this.handleSubscriptionCommands(query, param);
        }
    }

    private async handleReminderCommand(query: string) {
        switch (query) {
            case SubcommandEnum.CREATE:
                await handleReminder(
                    this.read,
                    this.context,
                    this.app,
                    this.persistence,
                    this.http,
                    this.room,
                    this.modify
                );
                break;
            case SubcommandEnum.LIST:
                await ManageReminders(
                    this.read,
                    this.context,
                    this.app,
                    this.persistence,
                    this.http,
                    this.room,
                    this.modify
                );
                break;
            default:
                break;
        }
    }

    private async handleSubscriptionCommands(query: string, repository: string) {
        switch (query) {
            case SubcommandEnum.SUBSCRIBE:
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
            case SubcommandEnum.UNSUBSCRIBE:
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
            default:
                await basicQueryMessage({
                    query: this.command[1],
                    repository,
                    room: this.room,
                    read: this.read,
                    persistence: this.persistence,
                    modify: this.modify,
                    http: this.http,
                    user: this.sender
                });
                break;
            }
        }

    private async handleTriParamCommand() {
        const data = {
            repository: this.command[0],
            query: this.command[1],
            number: this.command[2],
        };

        const isValidRepo = await HandleInvalidRepoName(
            data.repository,
            this.http,
            this.app,
            this.modify,
            this.sender,
            this.read,
            this.room
        );

        if (!isValidRepo) {
            return;
        }

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
            console.log("invalid Trigger ID !");
        }
    }

    public async resolveCommand() {
        switch (this.command.length) {
            case 0: {
                handleMainModal(
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
                    user: this.sender
                });
                break;
            }
        }
    }
}

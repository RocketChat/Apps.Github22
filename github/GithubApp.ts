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
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { IUIKitInteractionHandler,   UIKitViewCloseInteractionContext, UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit'

import {
    IMessage,
    IPostMessageSent,
} from "@rocket.chat/apps-engine/definition/messages";
import { initiatorMessage } from "./lib/initiatorMessage";

import {
    IUIKitResponse,
    UIKitLivechatBlockInteractionContext,
    UIKitBlockInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";



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
                    const gitResponse = await http.get(
                        `https://api.github.com/repos/${data.value}`
                    );

                    const param = data.value;
                    let paramVal = "";
                    if(param && param.length){
                        
                        for(let i = param.length-1; i>=0 && data.value && data.value[i]!='/' ;i--){
                            paramVal = data.value[i] + paramVal;
                        }
                    }

                    const resData = gitResponse.data;

                    const { room } = context.getInteractionData();

                    if (paramVal === "pulls") {

                        const textSender = await modify
                        .getCreator()
                        .startMessage()
                        .setText(`*PULL REQUESTS*`);

                    if (room) {
                        textSender.setRoom(room);
                    }

                    await modify.getCreator().finish(textSender);
                    resData.forEach(async (pull, ind) => {
                        if (ind < 10) {
                            const title = pull.title;
                            const url = pull.html_url;

                            const textSender = await modify
                                .getCreator()
                                .startMessage()
                                .setText(`[ #${pull.number} ](${url})  *${pull.title}*`);

                            if (room) {
                                textSender.setRoom(room);
                            }

                            await modify.getCreator().finish(textSender);
                        }
                    });
                        
                    } else if (paramVal === "issues") {
                        const textSender = await modify
                            .getCreator()
                            .startMessage()
                            .setText(`*ISSUES LIST*`);

                        if (room) {
                            textSender.setRoom(room);
                        }
                        let ind =0;
                        await modify.getCreator().finish(textSender);
                        resData.forEach(async (issue) => {
                            if (typeof issue.pull_request === "undefined" && ind < 10) {
                                const title = issue.title;
                                const url = issue.html_url;

                                const textSender = await modify
                                    .getCreator()
                                    .startMessage()
                                    .setText(`[ #${issue.number} ](${url})  *${issue.title}*`);

                                if (room) {
                                    textSender.setRoom(room);
                                }

                                await modify.getCreator().finish(textSender);
                                ind++;
                            }
                        });
                    } else if(paramVal==='contributors'){
                        const textSender = await modify
                            .getCreator()
                            .startMessage()
                            .setText(`*CONTRIBUTOR LIST*`);

                        if (room) {
                            textSender.setRoom(room);
                        }

                        await modify.getCreator().finish(textSender);
                        resData.forEach(async (contributor, ind) => {
                            if (ind < 20) {
                                const login = contributor.login;
                                const html_url = contributor.html_url;

                                const textSender = await modify
                                    .getCreator()
                                    .startMessage()
                                    .setText(`[ ${login} ](${html_url})`);

                                if (room) {
                                    textSender.setRoom(room);
                                }

                                await modify.getCreator().finish(textSender);
                            }
                        });
                    }else{
                        
                        const fullName =
                            "[" +
                            resData.full_name +
                            "](" +
                            resData.html_url +
                            ")" +
                            " ▫️ ";
                        const stars =
                            "` ⭐ Stars " + resData.stargazers_count + " ` ";
                        const issues =
                            "` ❗ Issues " + resData.open_issues + " ` ";
                        const forks = "` 🍴 Forks " + resData.forks_count + " ` ";
                        let tags = "";
                        if(resData && resData.topics && Array.isArray(resData.topics)){
                            resData.topics.forEach((topic : string) =>  {
                                let tempTopic = " ` ";
                                tempTopic+=topic;
                                tempTopic+= " ` ";
                                tags+= tempTopic;
                            })
                        }

                        const textSender = await modify
                            .getCreator()
                            .startMessage()
                            .setText(fullName + stars + issues + forks  + "```" + resData.description+ "```" + tags);
                        if (room) {
                            textSender.setRoom(room);
                        }
                            await modify.getCreator().finish(textSender);

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

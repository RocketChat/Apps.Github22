import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IHttp, IMessageBuilder, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import {IMessage} from "@rocket.chat/apps-engine/definition/messages";
import { BlockBuilder, ButtonStyle, IBlock, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { ModalsEnum } from "../enum/Modals";


export async function handleGithubPRLink(message:IMessage,read:IRead,http:IHttp,persistence:IPersistence,modify:IModify):Promise<String> {
    const githubPRLinkRegex = /\bhttps?:\/\/github\.com\/\S+\/pull\/\d+\b/;
    const text = message.text!;
    const prLinkMatch = text.match(githubPRLinkRegex);
    const prLink = prLinkMatch?.[0];
    const githubLinkPartsRegex = /(?:https?:\/\/github\.com\/)(\S+)\/(\S+)\/pull\/(\d+)/;
    const linkPartsMatch = prLink?.match(githubLinkPartsRegex);
    const username = linkPartsMatch?.[1];
    const repositoryName = linkPartsMatch?.[2];
    const pullNumber = linkPartsMatch?.[3];
    const messageBuilder = await modify.getCreator().startMessage()
        .setRoom(message.room)
        .setSender(message.sender)
        .setGroupable(true);
    
    const block = modify.getCreator().getBlockBuilder();

    block.addActionsBlock({
        blockId:"githubdata",
        elements:[
            block.newButtonElement({
                actionId:ModalsEnum.MERGE_PULL_REQUEST_ACTION,
                text:block.newPlainTextObject("Merge"),
                value:`${username}/${repositoryName} ${pullNumber}`,
                style:ButtonStyle.PRIMARY
            }),
            block.newButtonElement({
                actionId:ModalsEnum.PR_COMMENT_LIST_ACTION,
                text:block.newPlainTextObject("Comment"),
                value:`${username}/${repositoryName} ${pullNumber}`,
                style:ButtonStyle.PRIMARY
            }),
            block.newButtonElement({
                actionId:ModalsEnum.APPROVE_PULL_REQUEST_ACTION,
                text:block.newPlainTextObject("Approve"),
                value:`${username}/${repositoryName} ${pullNumber}`,
                style:ButtonStyle.PRIMARY
            })
        ]
    })

    messageBuilder.setBlocks(block);

    return await modify.getCreator().finish(messageBuilder);
}

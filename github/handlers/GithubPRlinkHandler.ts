import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IHttp, IMessageBuilder, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import {
    IMessage,
    IMessageAction,
    IMessageAttachment,
    MessageActionButtonsAlignment,
    MessageActionType,
} from "@rocket.chat/apps-engine/definition/messages";
import { BlockBuilder, ButtonStyle, IBlock, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { getActionsBlock, getButton, getDividerBlock, getSectionBlock,setText} from "../helpers/BlockBuilder";
import { Block } from "@rocket.chat/ui-kit";
import { basename } from "path";
import { ModalsEnum } from "../enum/Modals";

import { IButton, createSectionBlock } from "../lib/blocks";
import { sendMessage, sendNotification } from "../lib/message";

// export async function handleGithubPRLink(
//     message: IMessage,
//     read: IRead,
//     builder: IMessageBuilder,
//     persistence: IPersistence
// ): Promise<IMessage> {

    // const regex: RegExp = /\bhttps?:\/\/github\.com\/\S+\/pull\/\d+\b/;
    // let text = message.text!;
    // const match: RegExpMatchArray | null = text.match(regex);
    // const result: string | undefined = match?.[0];
    // const url = result;

    // const regex2: RegExp = /(?:https?:\/\/github\.com\/)(\S+)\/(\S+)\/pull\/(\d+)/;
    // const match2: RegExpMatchArray|undefined | null = url?.match(regex2);
    // const username = match2?.[1];
    // const repositoryName = match2?.[2];
    // const pullNumber = match2?.[3];

//     // `${data.repository} ${data?.number}`,
//     console.log(username,repositoryName,pullNumber)
    // let MergeButton = await getButton('Merge', 'githubdata', ModalsEnum.MERGE_PULL_REQUEST_ACTION, `${repositoryName} ${pullNumber}`, ButtonStyle.PRIMARY)
//     let CommentButton = await getButton('Comment', 'githubdata', ModalsEnum.PR_COMMENT_LIST_ACTION,`${repositoryName} ${pullNumber}` , ButtonStyle.PRIMARY)

//     let actionbutton = await getActionsBlock('', [MergeButton, CommentButton])

//     let dividerblock = await getDividerBlock();
    
//     let setmarkdownblock = await setText(text);

//     const block: Block[] = [];
//     block.push(setmarkdownblock)
//     block.push(dividerblock)
//     block.push(actionbutton)

//     console.log(text)


//     const msg = builder.addBlocks(block)
//     const msg = builder.
//     console.log(msg)
//     msg.setText(text)
//     console.log(msg)
    
//     return msg.getMessage();
// }

export async function handleGithubPRLink(message:IMessage,read:IRead,http:IHttp,persistence:IPersistence,modify:IModify):Promise<String> {

    const regex: RegExp = /\bhttps?:\/\/github\.com\/\S+\/pull\/\d+\b/;
    let text = message.text!;
    const match: RegExpMatchArray | null = text.match(regex);
    const result: string | undefined = match?.[0];
    const url = result;

    const regex2: RegExp = /(?:https?:\/\/github\.com\/)(\S+)\/(\S+)\/pull\/(\d+)/;
    const match2: RegExpMatchArray|undefined | null = url?.match(regex2);
    const username = match2?.[1];
    const repositoryName = match2?.[2];
    const pullNumber = match2?.[3];



    
    // const button: IButton = {
    //     text: "GitHub Login",
    //     actionId: ModalsEnum.MERGE_PULL_REQUEST_ACTION
    // };

    // let block:IBlock[] =[];
    // block.push(button)
    console.log('handler')

    
    // const msg = `${message}`;
    // const block = await createSectionBlock(modify, 'This is test', button);
    // await sendMessage(modify,message.room,message.sender,msg,block)
    // await sendMessage(modify,message.room,message.sender,'test') // worked 
    // await sendNotification(read, modify, message.sender, message.room, msg, block);

    const builder = await modify.getCreator().startMessage().setRoom(message.room).setSender(message.sender).setGroupable(true);

    const block = modify.getCreator().getBlockBuilder();
    console.log(`PR handler ${username} ${repositoryName} ${pullNumber}`)
    block.addSectionBlock({
        text: block.newPlainTextObject(
            `Choose Action for ${repositoryName} Pull Request ${pullNumber} 👇 ?`
        ),
    });
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

    builder.setBlocks(block);


    return await modify.getCreator().finish(builder);
    

}
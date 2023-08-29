import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IHttp, IMessageBuilder, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import {
    IMessage,
    IMessageAction,
    IMessageAttachment,
    MessageActionButtonsAlignment,
    MessageActionType,
} from "@rocket.chat/apps-engine/definition/messages";
import { BlockBuilder, ButtonStyle, IBlock, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { getActionsBlock, getButton, getDividerBlock, getSectionBlock} from "../helpers/BlockBuilder";
import { Block } from "@rocket.chat/ui-kit";
import { basename } from "path";
import { ModalsEnum } from "../enum/Modals";

export async function handleGithubPRLink(
    message: IMessage,
    read: IRead,
    builder: IMessageBuilder,
    persistence: IPersistence
): Promise<IMessage> {
    // const regex: RegExp = /\bhttps?:\/\/github\.com\/\S+\/pull\/\d+\b/;
    // let text = message.text!;

    // const match: RegExpMatchArray | null = text.match(regex);
    // const result: string | undefined = match?.[0];
    // const url = result;


    // const regex2: RegExp = /(?:https?:\/\/github\.com\/)(\S+)\/(\S+)\/pull\/(\d+)/;
    // const match2: RegExpMatchArray | undefined | null = url?.match(regex2);
    // const username = match2?.[1];
    // const repositoryName = match2?.[2];
    // const pullNumber = match2?.[3];

    // let attachment: IMessageAttachment = {
    //     actionButtonsAlignment: MessageActionButtonsAlignment.HORIZONTAL,
    //     actions: [
    //         {
    //             type: MessageActionType.BUTTON,
    //             text: "More Actions",
    //             msg: `/github ${username}/${repositoryName} pulls ${pullNumber}`,
    //             msg_in_chat_window: true,
    //         }
    //     ],
    // };

    // extend.addAttachment(attachment);

    // const url = await app.getOauth2ClientInstance().getUserAuthorizationUrl(user);
    // const block: Block[] = [];

    // let authButton = await getButton('Authorize', '', '', '', ButtonStyle.PRIMARY, url.toString());
    // let textsectionBlock = await getSectionBlock('Please click the button below to authorize access to your ClickUp account 👇',authButton);
    // block.push(textsectionBlock);

    // await sendDirectMessage(read, modify, user, '', persistence, block);

    // let button  = await getButton('Merge','','','',ButtonStyle.PRIMARY)
    // let textsectionBlock = await getSectionBlock('This is test for extend PR feature ',button);
    // const block : Block[] = [];
    // block.push(textsectionBlock);
    // // const msg = builder.addBlocks(block)    

    // message.blocks = block;
    // return message

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

    // `${data.repository} ${data?.number}`,
    console.log(username,repositoryName,pullNumber)
    let MergeButton = await getButton('Merge', 'githubdata', ModalsEnum.MERGE_PULL_REQUEST_ACTION, `${repositoryName} ${pullNumber}`, ButtonStyle.PRIMARY)
    let CommentButton = await getButton('Comment', 'githubdata', ModalsEnum.PR_COMMENT_LIST_ACTION,`${repositoryName} ${pullNumber}` , ButtonStyle.PRIMARY)

    let actionbutton = await getActionsBlock('', [MergeButton, CommentButton])

    let dividerblock = await getDividerBlock();

    // let textsectionBlock = await getSectionBlock(`${text}`);
    

    const block: Block[] = [];
    block.push(dividerblock)
    block.push(actionbutton)

    console.log(text)

// return await modify.getCreator().finish(msg);
    let msg_text = message.text as string;

    const msg = builder.addBlocks(block).setText(text)
    console.log(msg)
    return msg.getMessage();
}
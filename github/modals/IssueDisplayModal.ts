import { IModify, IRead, IPersistence, IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { TextObjectType, UIKitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { IGitHubIssue } from "../definitions/githubIssue";
import { IGithubReactions } from "../definitions/githubReactions";
import { ModalsEnum } from "../enum/Modals";
import { OcticonIcons } from "../enum/OcticonIcons";
import { getIssueData, getUserAssignedIssues } from "../helpers/githubSDK";
import { getInteractionRoomData, storeInteractionRoomData } from "../persistance/roomInteraction";
import { BodyMarkdownRenderer } from "../processors/bodyMarkdowmRenderer";

export async function IssueDisplayModal ({
    repoName,
    issueNumber,
    access_token,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext
} : {
    repoName : String,
    issueNumber : String,
    access_token: String,
    modify : IModify,
    read: IRead,
    persistence: IPersistence,
    http: IHttp,
    slashcommandcontext?: SlashCommandContext,
    uikitcontext?: UIKitInteractionContext
}) : Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.USER_ISSUE_VIEW;
    const block = modify.getCreator().getBlockBuilder();
    const room = slashcommandcontext?.getRoom() || uikitcontext?.getInteractionData().room;
    const user = slashcommandcontext?.getSender() || uikitcontext?.getInteractionData().user;

    if (user?.id){
        let roomId;
        if (room?.id){
            roomId = room.id;
            await storeInteractionRoomData(persistence, user.id, roomId);
        }
        else {
            roomId = (await getInteractionRoomData(read.getPersistenceReader(), user.id)).roomId;
        }
    }

    const issueInfo : IGitHubIssue = await getIssueData(repoName, issueNumber, access_token, http);

    if (issueInfo.issue_id == 0){
        block.addSectionBlock({
            text : {
                text : "Sorry there is some issue fetching this issue, try again later",
                type : TextObjectType.PLAINTEXT
            },
        })
        return {
            id : viewId,
            title : {
                text : "Error",
                type : TextObjectType.PLAINTEXT
            },
            blocks : block.getBlocks()
        }
    }

    const lastUpdated = new Date(issueInfo.last_updated_at ?? "");

    block.addContextBlock({
        elements : [
            block.newImageElement({
                imageUrl: OcticonIcons.PENCIL,
                altText: "Last Update At",
            }),
            block.newPlainTextObject(
                `Last Updated at ${ lastUpdated.toISOString() }`
            ),
        ]
    })

    block.addContextBlock({
        elements: [
            block.newImageElement({
                imageUrl: OcticonIcons.COMMENTS,
                altText: "Comments",
            }),
            block.newPlainTextObject(
                `${issueInfo.comments}`,
                false
            ),
            block.newImageElement({
                imageUrl: OcticonIcons.ISSUE_OPEN,
                altText: "Assignees Icon",
            }),
            block.newPlainTextObject(
                issueInfo.assignees ? (issueInfo.assignees.length == 0
                    ? "No Assignees"
                    : `${issueInfo.assignees.length} Assignees`) : ""
            ),
            block.newImageElement({
                imageUrl:
                    issueInfo.state == "open"
                        ? OcticonIcons.ISSUE_OPEN
                        : OcticonIcons.ISSUE_CLOSED,
                altText: "State",
            }),
            block.newPlainTextObject(`${issueInfo.state}`),
            block.newImageElement({
                imageUrl: issueInfo.user_avatar ?? "",
                altText: "User Image",
            }),
            block.newPlainTextObject(`Created by ${issueInfo.user_login}` ?? ""),
        ],
    });

    block.addSectionBlock({
        text : {
            text : `*${issueInfo.title}*` ?? "",
            type : TextObjectType.MARKDOWN
        }
    })
    block.addDividerBlock();

    // reactions

    const reactions = issueInfo.reactions

    block.addContextBlock({
        elements : [
            block.newPlainTextObject(`Total Reactions ${reactions?.total_count}`, true),
            block.newPlainTextObject(`➕ ${reactions?.plus_one} `, true),
            block.newPlainTextObject(`➖ ${reactions?.minus_one}`, true),
            block.newPlainTextObject(`😄 ${reactions?.laugh}`, true),
            block.newPlainTextObject(`🎉 ${reactions?.hooray}`, true),
            block.newPlainTextObject(`😕 ${reactions?.confused}`, true),
            block.newPlainTextObject(`♥️ ${reactions?.heart}`, true),
            block.newPlainTextObject(`🚀 ${reactions?.rocket}`, true),
            block.newPlainTextObject(`👀 ${reactions?.eyes}`, true),
        ]
    })

    issueInfo.body && BodyMarkdownRenderer({body : issueInfo.body, block : block})

    return {
        id : viewId,
        title : {
            text : `${repoName} \`#${issueNumber}\``,
            type : TextObjectType.PLAINTEXT
        },
        blocks : block.getBlocks()
    }
}

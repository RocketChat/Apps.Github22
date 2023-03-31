import { IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IUIKitContextualBarViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { TextObjectType } from "@rocket.chat/ui-kit";
import { IGithubActivity } from "../definitions/IGithubActivity";
import { ModalsEnum } from "../enum/Modals";
import { OcticonIcons } from "../enum/OcticonIcons";
import { CreateIssueStatsBar } from "../lib/CreateIssueStatsBar";
import { CreateReactionsBar } from "../lib/CreateReactionsBar";
import { BodyMarkdownRenderer } from "../processors/bodyMarkdowmRenderer";

export function UserIssueView(modify: IModify,activity: IGithubActivity): IUIKitContextualBarViewParam{

    const block = modify.getCreator().getBlockBuilder();

    if (activity.type == "IssuesEvent" && activity.payload.issue){
        const issueInfo = activity.payload.issue

        console.log(issueInfo)

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

        CreateIssueStatsBar(issueInfo, block);

        // block.addSectionBlock({
        //     text : {
        //         text : `*${issueInfo.title}*` ?? "",
        //         type: TextObjectType.PLAIN_TEXT
        //     }
        // })

        block.addDividerBlock();

        // issueInfo.reactions && CreateReactionsBar(issueInfo.reactions, block);

        issueInfo.body && BodyMarkdownRenderer({body : issueInfo.body, block : block})

        // block.addActionsBlock({
        //     elements : [
        //         block.newButtonElement({
        //             actionId : ModalsEnum.SHARE_ISSUE_ACTION,
        //             value : `${repoName}, ${issueNumber}`,
        //             text : {
        //                 text : "Share Issue",
        //                 type : TextObjectType.PLAINTEXT
        //             },
        //         }),
        //         block.newButtonElement({
        //             actionId : ModalsEnum.ADD_GITHUB_ISSUE_ASSIGNEE,
        //             value : `${repoName}, ${issueNumber}`,
        //             text : {
        //                 text : "Assign Issue",
        //                 type : TextObjectType.PLAINTEXT
        //             },
        //         })
        //     ]
        // })

        return {
            // [6]
            id: "userIssuesView",
            title: block.newPlainTextObject("User Issue View"),
            blocks: block.getBlocks(),
        };
    }

    return {
        // [6]
        id: "error",
        title: block.newPlainTextObject("Error View"),
        blocks: block.getBlocks(),
    };
}

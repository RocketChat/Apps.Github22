// this file contains the logic for checking issue reactions which needs to update in github

import { IMessageReactionContext } from "@rocket.chat/apps-engine/definition/messages";
import { IssueReactions, IssueReactionsAliases } from "../enum/OcticonIcons";

export function isAvailableReaction(context: IMessageReactionContext) {
    const content = context.reaction;
    const reaction = content.substring(1, content.length - 1);
    const includesEmoji = Object.values(IssueReactions).includes(
        reaction as IssueReactions
    );
    if (includesEmoji) {
        return {
            includes_emoji: true,
            emoji: IssueReactionsAliases[reaction],
        };
    }

    return {
        includes_emoji: false,
    };
}

import { BlockBuilder } from "@rocket.chat/apps-engine/definition/uikit";
import { IGithubReactions } from "../definitions/githubReactions";

export async function CreateReactionsBar(
    reactions : IGithubReactions,
    block : BlockBuilder
){
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
}

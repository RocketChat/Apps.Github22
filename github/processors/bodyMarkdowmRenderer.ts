import {
    BlockBuilder,
    TextObjectType,
} from "@rocket.chat/apps-engine/definition/uikit";

export async function BodyMarkdownRenderer({
    body,
    block,
}: {
    body: string;
    block: BlockBuilder;
}) {
    const patterns: { type: string; pattern: RegExp }[] = [
        {
            type: "ImageTag",
            pattern: RegExp(/(<img) (width=".*") (alt=".*") (src=".+">)/g, "g"),
        },
        {
            type: "ImageMarkdownLink",
            pattern: RegExp(/[!]\[([^\]]+)\]\(([^)]+(.png|jpg|svg|gif))\)/gim),
        },
    ];

    let matches: { beginningIndex: number; match: string; type: string }[] = [];
    var match;

    patterns.forEach((patObj) => {
        while ((match = patObj.pattern.exec(body)) != null) {
            matches.push({
                beginningIndex: match.index,
                match: match[0],
                type: patObj.type,
            });
        }
    });

    if (matches.length == 0) {
        block.addSectionBlock({
            text: {
                text: body,
                type: TextObjectType.MARKDOWN,
            },
        });
    } else {
        matches.sort((a, b) => a.beginningIndex - b.beginningIndex);
        matches.map((value, index) => {
            let start =
                index == 0
                    ? 0
                    : matches[index - 1].beginningIndex +
                      matches[index - 1].match.length;

            const rawURL = value.match.match(
                /(https:\/\/.*\.(png|jpg|gif|svg))/gim
            );
            const url = rawURL ? rawURL[0] : "";

            block.addSectionBlock({
                text: {
                    text: body.substring(start, value.beginningIndex - 1) ?? "",
                    type: TextObjectType.MARKDOWN,
                },
            }),
                block.addImageBlock({
                    imageUrl: url,
                    altText: "ImageURL",
                });

            if (
                index == matches.length - 1 &&
                value.beginningIndex + value.match.length < body.length
            ) {
                block.addSectionBlock({
                    text: {
                        text: body.substring(
                            value.beginningIndex + value.match.length,
                            body.length
                        ),
                        type: TextObjectType.MARKDOWN,
                    },
                });
            }
        });
    }

    // block.addSectionBlock({
    //     text : {
    //         text : body,
    //         type : TextObjectType.PLAINTEXT
    //     }
    // })
}

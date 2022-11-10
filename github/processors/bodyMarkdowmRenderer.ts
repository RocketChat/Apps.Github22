import {
    BlockBuilder,
    TextObjectType,
} from "@rocket.chat/apps-engine/definition/uikit";


function cleanHeadingSyntax(text: string) : string{
    try {
        text = text.replace(/(#{3}\s)(.*)/g, (val) => `*${val.substring(3, val.length).trim()}*`);
        text = text.replace(/(#{2}\s)(.*)/g, (val) => `*${val.substring(3, val.length).trim()}*`);
        text = text.replace(/(#{1}\s)(.*)/g, (val) => `*${val.substring(2, val.length).trim()}*`);
        text = text.replace(/\[ ] (?!\~|\[\^\d+])/g, (val) => `⭕ ${val.substring(3, val.length)}*`);
        text = text.replace(/\[X] (?!\~|\[\^\d+])/g, (val) => `✅ ${val.substring(3, val.length)}*`);
    }
    catch(e){
        console.log(e);
    }
    return text;
}


export async function BodyMarkdownRenderer({
    body,
    block,
}: {
    body: string;
    block: BlockBuilder;
}) {
    const imagePatterns: { type: string; pattern: RegExp }[] = [
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

    imagePatterns.forEach((patObj) => {
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
                text: cleanHeadingSyntax(body),
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

            block.addContextBlock({
                elements: [
                    block.newMarkdownTextObject(
                        cleanHeadingSyntax(body.substring(start, value.beginningIndex - 1) ?? "")
                    ),
                ],
            });

            block.addImageBlock({
                imageUrl: url,
                altText: "ImageURL",
            });

            if (
                index == matches.length - 1 &&
                value.beginningIndex + value.match.length < body.length
            ) {
                block.addContextBlock({
                    elements: [
                        block.newMarkdownTextObject(
                            cleanHeadingSyntax(body.substring(
                                value.beginningIndex + value.match.length,
                                body.length
                            ))
                        ),
                    ],
                });
            }
        });
    }
}

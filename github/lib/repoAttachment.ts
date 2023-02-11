import {
    IMessageAction,
    MessageActionButtonsAlignment,
    IMessageAttachment,
    IMessageAttachmentField,
} from "@rocket.chat/apps-engine/definition/messages";

export class RepoAttachment implements IMessageAttachment {
    /** The text to display for this attachment. */
    text?: string;
    /** Allows users to describe what the attachment is. */
    description?: string = "repo-links-actionbuttons";
    /** States how the action buttons are aligned. */
    actionButtonsAlignment = MessageActionButtonsAlignment.HORIZONTAL;
    /** Allows displaying action items, such as buttons, on the attachment. */
    actions?: Array<IMessageAction>;

    constructor(buttons: Array<IMessageAction>, text?: string) {
        this.text = text;
        this.actions = buttons;
    }
}

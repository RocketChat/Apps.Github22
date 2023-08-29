import { ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";
import { ActionsBlock, ButtonElement, ContextBlock, DividerBlock, InputBlock, Option, SectionBlock, StaticSelectElement} from "@rocket.chat/ui-kit";
import { AppEnum } from "../enum/App";

export async function getInputBox(labelText: string, placeholderText: string, blockId: string, actionId: string, initialValue?: string, multiline?: boolean): Promise<InputBlock> {
  const block: InputBlock = {
    type: "input",
    label: {
      type: "plain_text",
      text: labelText,
    },
    element: {
      type: "plain_text_input",
      placeholder: {
        type: "plain_text",
        text: placeholderText,
      },
      appId: AppEnum.APP_ID,
      blockId: blockId,
      actionId: actionId,
      initialValue: initialValue,
      multiline: multiline,
    },
  };
  return block;
}

export async function getInputBoxDate(labelText: string, placeholderText: string, blockId: string, actionId: string, initialDate?: string): Promise<InputBlock> {
  const block: InputBlock = {
    type: "input",
    label: {
      type: "plain_text",
      text: labelText,
    },
    element: {
      type: "datepicker",
      placeholder: {
        type: "plain_text",
        text: placeholderText,
      },
      appId: AppEnum.APP_ID,
      blockId: blockId,
      actionId: actionId,
      initialDate: initialDate,
    },
  };
  return block;
}

export async function getButton(labelText: string, blockId: string, actionId: string, value?: string, style?: ButtonStyle.PRIMARY | ButtonStyle.DANGER, url?: string): Promise<ButtonElement> {
  const button: ButtonElement = {
    type: "button",
    text: {
      type: "plain_text",
      text: labelText,
    },
    appId: AppEnum.APP_ID,
    blockId: blockId,
    actionId: actionId,
    url: url,
    value: value,
    style: style,
  };
  return button;
}

export async function getSectionBlock(labelText: string, accessory?: any): Promise<SectionBlock> {
  const block: SectionBlock = {
    type: "section",
    text: {
      type: "plain_text",
      text: labelText,
    },
    accessory: accessory,
  };
  return block;
}

export async function getDividerBlock(): Promise<DividerBlock> {
  const block: DividerBlock = {
    type: "divider",
  };
  return block;
}

export async function getContextBlock(elementText: string): Promise<ContextBlock> {
  const block: ContextBlock = {
    type: "context",
    elements: [
      {
        type: "plain_text",
        text: elementText,
      },
    ],
  };
  return block;
}

export async function getStaticSelectElement(placeholderText: string, options: Array<Option>, blockId: string, actionId: string, initialValue?: Option["value"]): Promise<StaticSelectElement> {
  const block: StaticSelectElement = {
    type: "static_select",
    placeholder: {
      type: "plain_text",
      text: placeholderText,
    },
    options: options,
    appId: AppEnum.APP_ID,
    blockId: blockId,
    actionId: actionId,
    initialValue: initialValue,
  };
  return block;
}

export async function getOptions(text: string, value: string): Promise<Option> {
  const block: Option = {
    text: { type: "plain_text", text: text },
    value: value,
  };
  return block;
}

export async function getActionsBlock(blockId: string, elements: Array<ButtonElement> | Array<StaticSelectElement>): Promise<ActionsBlock> {
  const block: ActionsBlock = {
    type: "actions",
    blockId: blockId,
    elements: elements,
  };
  return block;
}
import {
    IPersistence,
    IRead,
    ISettingRead
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord
} from '@rocket.chat/apps-engine/definition/metadata';
import { AppSettings } from '../settings/settings';

export interface ISetting {
    ReminderCron: string;
    BaseHost: string;
    BaseApiHost: string;
}

const assoc = new RocketChatAssociationRecord(
    RocketChatAssociationModel.MISC,
    'setting'
);

export async function UpdateSetting(
    read: IRead,
    persistence: IPersistence,
    settingReader: ISettingRead,
): Promise<void> {
    const ReminderCron = (await settingReader.getById(AppSettings.ReminderCRONjobID)).value as string;
    const BaseHost = (await settingReader.getById(AppSettings.BaseHostID)).value as string;
    const BaseApiHost = (await settingReader.getById(AppSettings.BaseApiHostID)).value as string;
    const Setting: ISetting = {
        ReminderCron,
        BaseHost,
        BaseApiHost
    };
    await persistence.updateByAssociation(assoc, Setting, true);
}

export async function GetSetting(
    read: IRead,
): Promise<ISetting | undefined> {
    const data = await read.getPersistenceReader().readByAssociation(assoc);
    const settingData = data[0] as ISetting;
    return settingData;
}

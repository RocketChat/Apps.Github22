import {
    IPersistence,
    IRead,
    ISettingRead
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord
} from '@rocket.chat/apps-engine/definition/metadata';
import { IAppSetting } from '../definitions/AppSetting';
import { AppSettingsEnum } from '../settings/settings';

const assoc = new RocketChatAssociationRecord(
    RocketChatAssociationModel.MISC,
    'setting'
);

export async function UpdateSetting(
    read: IRead,
    persistence: IPersistence,
    settingReader: ISettingRead,
): Promise<void> {
    const ReminderCron = (await settingReader.getValueById(AppSettingsEnum.ReminderCRONjobID)) as string;
    const BaseHost = (await settingReader.getValueById(AppSettingsEnum.BaseHostID)) as string;
    const BaseApiHost = (await settingReader.getValueById(AppSettingsEnum.BaseApiHostID)) as string;
    const Setting: IAppSetting = {
        ReminderCron,
        BaseHost,
        BaseApiHost
    };
    await persistence.updateByAssociation(assoc, Setting, true);
}

export async function GetSetting(
    read: IRead,
): Promise<IAppSetting> {
    const data = await read.getPersistenceReader().readByAssociation(assoc);
    const settingData = data[0] as IAppSetting;
    return settingData;
}

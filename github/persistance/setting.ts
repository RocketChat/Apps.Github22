import {
    IPersistence,
    IRead,
    ISettingRead
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord
} from '@rocket.chat/apps-engine/definition/metadata';
import { AppSettings } from '../enum/Setting';

const assoc = new RocketChatAssociationRecord(
    RocketChatAssociationModel.MISC,
    'setting'
);

export async function UpdateSetting(
    read: IRead,
    persistence: IPersistence,
    settingreader: ISettingRead,
): Promise<void> {
    const ReminderCron =  await settingreader.getById(AppSettings.ReminderCRONjobID);
    const BaseHost = await settingreader.getById(AppSettings.BaseHostID);
    const BaseApiHost = await settingreader.getById(AppSettings.BaseApiHostID);
    const Setting =  {
        ReminderCron,BaseHost,BaseApiHost
    }
    await persistence.updateByAssociation(assoc, Setting, true)
}


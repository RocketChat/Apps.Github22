import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { AppSettings } from '../enum/Setting';

export const settings: ISetting[] = [
    {
        id: AppSettings.ReminderCRONjobID,
        i18nLabel: 'cron-job-string-for-pr-reminders',
        type: SettingType.STRING,
        required: true,
        public: false,
        packageValue: '0 9 * * *',
    },
    {
        id: AppSettings.BaseHostID,
        i18nLabel: AppSettings.BaseHostLabel,
        type: SettingType.STRING,
        required: true,
        public: false,
        packageValue: 'https://github.com/',
    },
    {
        id: AppSettings.BaseApiHostID,
        i18nLabel: AppSettings.BaseApiHostLabel,
        type: SettingType.STRING,
        required: true,
        public: false,
        packageValue: 'https://api.github.com/',
    },
];

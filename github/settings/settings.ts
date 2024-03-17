import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSettings {
    ReminderCRONjobID = 'reminder_cron_job_id',
    ReminderCRONjobLabel = 'cron-job-string-for-pr-reminders',
    ReminderCRONjobPackageValue = '0 9 * * *',
    BaseHostID = "base_host",
    BaseHostLabel = "base-host",
    BaseHostPackageValue = "https://github.com/",
    BaseApiHostID = "base_api_host",
    BaseApiHostLabel = "base-api-host",
    BaseApiHostPackageValue = "https://api.github.com/"
}
export const settings: ISetting[] = [
    {
        id: AppSettings.ReminderCRONjobID,
        i18nLabel: 'cron-job-string-for-pr-reminders',
        type: SettingType.STRING,
        required: true,
        public: false,
        packageValue: AppSettings.ReminderCRONjobPackageValue,
    },
    {
        id: AppSettings.BaseHostID,
        i18nLabel: AppSettings.BaseHostLabel,
        type: SettingType.STRING,
        required: true,
        public: false,
        packageValue: AppSettings.BaseHostPackageValue,
    },
    {
        id: AppSettings.BaseApiHostID,
        i18nLabel: AppSettings.BaseApiHostLabel,
        type: SettingType.STRING,
        required: true,
        public: false,
        packageValue: AppSettings.BaseApiHostPackageValue,
    },
];

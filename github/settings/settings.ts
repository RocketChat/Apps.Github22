import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSettingsEnum {
    ReminderCRONjobID = 'reminder_cron_job_id',
    ReminderCRONjobLabel = 'cron_job_string_for_pr_reminders_label',
    ReminderCRONjobPackageValue = '0 9 * * *',
    BaseHostID = "base_host_id",
    BaseHostLabel = "base_host_label",
    BaseHostPackageValue = "https://github.com/",
    BaseApiHostID = "base_api_host_id",
    BaseApiHostLabel = "base_api_host_label",
    BaseApiHostPackageValue = "https://api.github.com/",
    PRLinkActionsID = "pr_link_actions_id",
    PRLinkActionsLabel = "pr_link_actions_label",
    PRAlertActionsID = "pr_alert_actions_id",
    PRAlertActionsLabel = "pr_alert_actions_label",
}
export const settings: ISetting[] = [
    {
        id: AppSettingsEnum.ReminderCRONjobID,
        i18nLabel: AppSettingsEnum.ReminderCRONjobLabel,
        type: SettingType.STRING,
        required: true,
        public: false,
        packageValue: AppSettingsEnum.ReminderCRONjobPackageValue,
    },
    {
        id: AppSettingsEnum.BaseHostID,
        i18nLabel: AppSettingsEnum.BaseHostLabel,
        type: SettingType.STRING,
        required: true,
        public: false,
        packageValue: AppSettingsEnum.BaseHostPackageValue,
    },
    {
        id: AppSettingsEnum.BaseApiHostID,
        i18nLabel: AppSettingsEnum.BaseApiHostLabel,
        type: SettingType.STRING,
        required: true,
        public: false,
        packageValue: AppSettingsEnum.BaseApiHostPackageValue,
    },
    {
        id: AppSettingsEnum.PRLinkActionsID,
        i18nLabel: AppSettingsEnum.PRLinkActionsLabel,
        type: SettingType.BOOLEAN,
        required: false,
        public: false,
        packageValue: true,
    },
    {
        id: AppSettingsEnum.PRAlertActionsID,
        i18nLabel: AppSettingsEnum.PRAlertActionsLabel,
        type: SettingType.BOOLEAN,
        required: false,
        public: false,
        packageValue: true,
    },
];

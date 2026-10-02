import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { IRead } from '@rocket.chat/apps-engine/definition/accessors';

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
    PRViewChangesID = "pr_view_changes_id",
    PRViewChangesLabel = "pr_view_changes_label",
    PRViewMergeID = "pr_view_merge_id",
    PRViewMergeLabel = "pr_view_merge_label",
    PRViewCommentsID = "pr_view_comments_id",
    PRViewCommentsLabel = "pr_view_comments_label",
    PRViewApproveID = "pr_view_approve_id",
    PRViewApproveLabel = "pr_view_approve_label",
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
        id: AppSettingsEnum.PRViewChangesID,
        i18nLabel: AppSettingsEnum.PRViewChangesLabel,
        type: SettingType.BOOLEAN,
        required: false,
        public: false,
        packageValue: true,
    },
    {
        id: AppSettingsEnum.PRViewMergeID,
        i18nLabel: AppSettingsEnum.PRViewMergeLabel,
        type: SettingType.BOOLEAN,
        required: false,
        public: false,
        packageValue: true,
    },
    {
        id: AppSettingsEnum.PRViewCommentsID,
        i18nLabel: AppSettingsEnum.PRViewCommentsLabel,
        type: SettingType.BOOLEAN,
        required: false,
        public: false,
        packageValue: true,
    },
    {
        id: AppSettingsEnum.PRViewApproveID,
        i18nLabel: AppSettingsEnum.PRViewApproveLabel,
        type: SettingType.BOOLEAN,
        required: false,
        public: false,
        packageValue: true,
    },
];

export async function isActionOn(read: IRead, id: AppSettingsEnum): Promise<boolean> {
    return !!(await read.getEnvironmentReader().getSettings().getValueById(id));
}

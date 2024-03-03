import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSettings{
    ReminderCRONjobString = 'reminderCronJobString'
}

export const settings: ISetting[] = [
	{
		id: AppSettings.ReminderCRONjobString,
		i18nLabel: 'cron-job-string-for-pr-reminders',
		type: SettingType.STRING,
		required: true,
		public: false,
		packageValue: '0 9 * * *',
	},
];

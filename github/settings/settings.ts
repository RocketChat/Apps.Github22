import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSettings{
    ReminderCORNjobString = 'reminderCornJobString'
}

export const settings: ISetting[] = [
	{
		id: AppSettings.ReminderCORNjobString,
		i18nLabel: 'corn-job-string-for-pr-reminders',
		type: SettingType.STRING,
		required: true,
		public: false,
		packageValue: '0 9 * * *',
	},
];

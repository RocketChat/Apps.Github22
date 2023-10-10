export const parseTime = (myDate) => {
	const time = new Date(myDate).toLocaleTimeString('en', {
		timeStyle: 'short',
		hour12: true,
		timeZone: 'UTC',
	});
	return time;
};

export const parseDate = (myDate) => {
	let date = new Date(myDate);
	let year: string = `${date.getFullYear()}`;
	let month: string = `${date.getMonth() + 1}`;
	let dt: string = `${date.getDate()}`;

	if (dt.length < 2) {
		dt = '0' + dt;
	}
	if (month.length < 2) {
		month = '0' + month;
	}

	return dt + '/' + month + '/' + year;
};

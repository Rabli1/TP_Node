function convertToFrenchDate(numericDate) {
    const date = new Date(numericDate);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const optWeekday = { weekday: 'long' };
    const weekday = toTitleCase(date.toLocaleDateString('fr-FR', optWeekday));
    return `${weekday} le ${date.toLocaleDateString('fr-FR', options)} @ ${date.toLocaleTimeString('fr-FR')}`;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function UTC_To_Local(utcNumericDate) {
    const utcOffset = new Date().getTimezoneOffset() / 60;
    const utcDate = new Date(utcNumericDate);
    utcDate.setHours(utcDate.getHours() - utcOffset);
    return utcDate.getTime();
}

function Local_to_UTC(localNumericDate) {
    const utcOffset = new Date().getTimezoneOffset() / 60;
    const localDate = new Date(localNumericDate);
    localDate.setHours(localDate.getHours() + utcOffset);
    return localDate.getTime();
}

window.DateUtils = {
    convertToFrenchDate,
    UTC_To_Local,
    Local_to_UTC
};

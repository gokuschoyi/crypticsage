export const shortenDate = (dateString) => {
    if (dateString === '') { return '' } else {
        const [date, time] = dateString.split(", ");
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        // eslint-disable-next-line no-unused-vars
        const [amPm, timeZone] = time.split(" ");
        const [day, month] = date.split("/");
        let MM = months[(parseInt(month) - 1)]
        const [hour, minute] = time.split(/:| /);
        const formattedDate = `${day} ${MM} : ${hour}:${minute} ${timeZone.toUpperCase()}`;
        return formattedDate;
    }
}

export const capitalizeFirstLetter = (string) => {
    return string[0].toUpperCase() + string.slice(1);
}
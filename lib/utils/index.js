const moment = require('moment-timezone');

function unixToIsoDuration(blockTimestamp) {
    // Get the current time in UTC
    const currentTime = moment.utc();
    console.log('current time (UTC): ' + currentTime.format());
    const currentUnixTime = currentTime.unix();
    
    // Calculate the time difference
    const timeDiff = blockTimestamp - currentUnixTime;
    
    // Calculate the duration components
    const duration = moment.duration(timeDiff, 'seconds');
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    console.log('duration is: ' + hours);
    
    const isoDuration = `P${days}DT${hours}H${minutes}M${seconds}S`;
    
    return isoDuration;
}


module.exports = {
    unixToIsoDuration,
}
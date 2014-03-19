exports.formatNumber = function formatNumber(num) {
    if(num === null || num === undefined) {
        return 0;
    } else if(num >= 1000000000) {
        return Math.round(num / 100000000) * 0.1 + 'b';
    } else if(num > 1000000) {
        return Math.round(num / 100000) * 0.1 + 'm';
    } else if(num > 1000) {
        return Math.round(num / 100) * 0.1 + 'k';
    } else {
        return num;
    }
};

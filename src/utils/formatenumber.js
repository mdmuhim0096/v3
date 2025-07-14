export function formatNumber(num) {
    const units = ["", "K", "M", "B", "T"];
    let unitIndex = 0;

    while (num >= 1000 && unitIndex < units.length - 1) {
        num /= 1000;
        unitIndex++;
    }
    return num.toFixed(1).replace(/\.0$/, '') + units[unitIndex];
}

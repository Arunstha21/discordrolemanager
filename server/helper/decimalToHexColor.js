function decimalToHexColor(decimalColor) {
    if (isNaN(decimalColor) || decimalColor < 0 || decimalColor > 16777215) {
        throw new Error("Invalid decimal color value");
    }
    const hexColor = decimalColor.toString(16).padStart(6, '0');
    return `#${hexColor}`;
}

module.exports = decimalToHexColor;
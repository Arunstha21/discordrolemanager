const { createCanvas } = require("canvas");

function createTable(data, title) {
    const headers = data.headers;
    const rows = data.rows;

    // Function to calculate the width of the text
    function getTextWidth(text, font) {
        const canvas = createCanvas(0, 0);
        const context = canvas.getContext("2d");
        context.font = font;
        return context.measureText(text).width;
    }

    // Calculate column widths
    const columnWidths = headers.map((header, colIndex) => {
        const headerWidth = getTextWidth(header, "bold 24px sans-serif");
        const maxCellWidth = Math.max(...rows.map(row => getTextWidth(row[colIndex], "24px sans-serif")));
        return Math.max(headerWidth, maxCellWidth) + 20; // Add padding
    });

    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0) + 100;
    const rowHeight = 50;
    const titleHeight = title ? 40 : 0; // Allocate height only if title exists
    const totalHeight = rowHeight * (rows.length + 1) + titleHeight + 50;

    const canvas = createCanvas(totalWidth, totalHeight);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (title) {
        ctx.font = "bold 32px sans-serif";
        ctx.fillText(title, totalWidth / 2, titleHeight / 1);
    }

    // Draw headers
    ctx.font = "bold 24px sans-serif";
    headers.forEach((header, index) => {
        const x = 50 + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0) + columnWidths[index] / 2;
        ctx.fillText(header, x, titleHeight + 50);
    });

    // Set text properties for rows
    ctx.font = "24px sans-serif";

    // Draw rows
    rows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const x = 50 + columnWidths.slice(0, colIndex).reduce((sum, width) => sum + width, 0) + columnWidths[colIndex] / 2;
            ctx.fillText(cell, x, titleHeight + 50 + (rowIndex + 1) * rowHeight);
        });
    });

    // Draw table borders
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    // Draw header bottom line
    ctx.beginPath();
    ctx.moveTo(50, titleHeight + 75);
    ctx.lineTo(totalWidth - 50, titleHeight + 75);
    ctx.stroke();

    // Draw vertical lines
    let x = 50;
    columnWidths.forEach(width => {
        ctx.beginPath();
        ctx.moveTo(x, titleHeight + 30);
        ctx.lineTo(x, totalHeight - 20);
        ctx.stroke();
        x += width;
    });
    ctx.beginPath();
    ctx.moveTo(x, titleHeight + 30);
    ctx.lineTo(x, totalHeight - 20);
    ctx.stroke();

    // Draw horizontal lines under each row
    for (let i = 1; i <= rows.length; i++) {
        ctx.beginPath();
        ctx.moveTo(50, titleHeight + 50 + i * rowHeight + 25);
        ctx.lineTo(totalWidth - 50, titleHeight + 50 + i * rowHeight + 25);
        ctx.stroke();
    }

    // Draw top border line
    ctx.beginPath();
    ctx.moveTo(50, titleHeight + 30);
    ctx.lineTo(totalWidth - 50, titleHeight + 30);
    ctx.stroke();

    // Draw bottom border line
    ctx.beginPath();
    ctx.moveTo(50, totalHeight - 20);
    ctx.lineTo(totalWidth - 50, totalHeight - 20);
    ctx.stroke();

    const buffer = canvas.toBuffer("image/png");
    return buffer;
}

module.exports = createTable;

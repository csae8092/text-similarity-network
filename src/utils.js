export const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
        // Convert HSL to hex
        const hue = (i * 360) / count;
        const h = hue / 360;
        const s = 0.7;
        const l = 0.5;

        // HSL to RGB conversion
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c/2;
        let r, g, b;
        
        if (h * 6 < 1) [r, g, b] = [c, x, 0];
        else if (h * 6 < 2) [r, g, b] = [x, c, 0];
        else if (h * 6 < 3) [r, g, b] = [0, c, x];
        else if (h * 6 < 4) [r, g, b] = [0, x, c];
        else if (h * 6 < 5) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];

        // Convert to hex
        const toHex = (n) => {
            const hex = Math.round((n + m) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        colors.push(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    }
    return colors;
};
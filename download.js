const https = require('https');
const fs = require('fs');

if (!fs.existsSync('fonts')){
    fs.mkdirSync('fonts');
}

const fonts = [
    { name: 'regular', weight: '400' },
    { name: 'semibold', weight: '600' },
    { name: 'bold', weight: '700' },
];

fonts.forEach(font => {
    let url = `https://raw.githubusercontent.com/fontsource/fontsource/main/packages/nunito/files/nunito-latin-${font.weight}-normal.woff2`;
    https.get(url, res => {
        let file = fs.createWriteStream(`fonts/nunito-${font.name}.woff2`);
        res.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${font.name}`);
        });
    }).on('error', err => {
        console.error(err);
    });
});

const fs = require('fs');
const path = 'client/src/pages/DashboardPage.tsx';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');

    let startLine = -1;
    let endLine = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('const handleGoalClick = (goalId: string) => {')) {
            startLine = i;
        }
        if (lines[i].trim().startsWith('const handleProgressLogClick = (logId: string) => {')) {
            // Find the closing brace for this function
            // Assuming it ends with }; and a newline
            // Let's just look for the next blank line or something
            // Or count braces.
            let braceCount = 0;
            for (let j = i; j < lines.length; j++) {
                braceCount += (lines[j].match(/{/g) || []).length;
                braceCount -= (lines[j].match(/}/g) || []).length;
                if (braceCount === 0) {
                    endLine = j;
                    break;
                }
            }
        }
    }

    if (startLine !== -1 && endLine !== -1) {
        console.log(`Removing lines ${startLine + 1} to ${endLine + 1}`);
        lines.splice(startLine, endLine - startLine + 1);
        fs.writeFileSync(path, lines.join('\n'));
        console.log('Successfully removed handlers.');
    } else {
        console.log('Handlers not found.');
    }

} catch (e) {
    console.error('Error:', e);
}

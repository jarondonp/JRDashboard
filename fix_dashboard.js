const fs = require('fs');
const path = 'client/src/pages/DashboardPage.tsx';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');

    // Find the start and end of the useEffect block
    let startLine = -1;
    let endLine = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('// Handle Dashboard Focus (Modal Opening)')) {
            startLine = i;
        }
        if (startLine !== -1 && lines[i].trim().startsWith('}, [dashboardFocus, dashboardFocusId')) {
            endLine = i;
            break;
        }
    }

    if (startLine !== -1 && endLine !== -1) {
        console.log(`Removing lines ${startLine + 1} to ${endLine + 1}`);
        lines.splice(startLine, endLine - startLine + 1);
        fs.writeFileSync(path, lines.join('\n'));
        console.log('Successfully removed useEffect block.');
    } else {
        console.log('useEffect block not found. It might have been already removed.');
    }

} catch (e) {
    console.error('Error:', e);
}

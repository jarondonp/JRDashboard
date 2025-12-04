const http = require('http');

function fetch(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => data += chunk);
            resp.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on("error", reject);
    });
}

async function run() {
    try {
        const projects = await fetch('http://localhost:5000/api/projects');
        console.log('Total projects:', projects.length);
        if (projects.length > 0) {
            console.log('Sample project:', JSON.stringify(projects[0], null, 2));
        } else {
            console.log('No projects found.');
        }

        const goals = await fetch('http://localhost:5000/api/goals');
        const withProject = goals.filter(g => g.project_id);
        console.log('Goals with project_id:', withProject.length);

    } catch (e) {
        console.error('Error:', e);
    }
}

run();

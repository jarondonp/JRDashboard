const http = require('http');

function request(method, path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function run() {
    try {
        console.log('--- Starting Verification ---');

        // 1. Get existing Area
        const areas = await request('GET', '/areas');
        if (!areas || areas.length === 0) {
            throw new Error('No areas found. Please create an area in the app first.');
        }
        const area = areas[0];
        console.log('Using Area:', area.id);

        // 2. Create Project A
        const projectA = await request('POST', '/projects', {
            title: 'Project A',
            area_id: area.id,
            status: 'active'
        });
        console.log('Created Project A:', projectA.id);

        // 3. Create Goal linked to Project A
        const goal = await request('POST', '/goals', {
            title: 'Goal 1',
            area_id: area.id,
            project_id: projectA.id,
            status: 'en_progreso',
            priority: 'alta'
        });
        if (!goal.id) {
            console.error('Failed to create goal:', goal);
        } else {
            console.log('Created Goal linked to Project A:', goal.id);
        }

        // 4. Create Task linked to Goal (NO Project ID)
        const task = await request('POST', '/tasks', {
            title: 'Task 1',
            area_id: area.id,
            goal_id: goal.id,
            status: 'pending'
        });
        if (!task.id) {
            console.error('Failed to create task:', task);
        } else {
            console.log('Created Task linked to Goal:', task.id);
        }

        // VERIFY 1: Task should have Project A ID
        const taskVerify1 = await request('GET', `/tasks/${task.id}`);
        if (taskVerify1.project_id === projectA.id) {
            console.log('SUCCESS: Task inherited Project A ID');
        } else {
            console.error('FAILURE: Task did NOT inherit Project A ID. Got:', taskVerify1.project_id);
        }

        // 5. Create Project B
        const projectB = await request('POST', '/projects', {
            title: 'Project B',
            area_id: area.id,
            status: 'active'
        });
        console.log('Created Project B:', projectB.id);

        // 6. Update Goal to Project B
        const updateResult = await request('PUT', `/goals/${goal.id}`, {
            ...goal,
            project_id: projectB.id
        });
        if (updateResult.error) {
            console.error('Failed to update goal:', updateResult);
        } else {
            console.log('Updated Goal to Project B. Result:', updateResult.id);
        }

        // VERIFY 2: Task should now have Project B ID
        const taskVerify2 = await request('GET', `/tasks/${task.id}`);
        if (taskVerify2.project_id === projectB.id) {
            console.log('SUCCESS: Task cascaded to Project B ID');
        } else {
            console.error('FAILURE: Task did NOT cascade to Project B ID. Got:', taskVerify2.project_id);
        }

        console.log('--- Verification Complete ---');

    } catch (e) {
        console.error('Error:', e);
    }
}

run();

async function testRoute() {
    const projectId = "b2144de5-59ee-45b9-a183-9511ecc91f78";

    // Test 0: Debug Hello
    console.log(`\nTesting Debug Hello...`);
    try {
        const res = await fetch('http://localhost:5000/api/planner/debug-hello');
        console.log(`[Debug] Status: ${res.status} ${res.statusText}`);
        if (res.ok) console.log(await res.json());
    } catch (e) { console.error(e); }

    const url1 = `http://localhost:5000/api/planner/project-baselines/${projectId}`;
    try {
        const res = await fetch(url1);
        console.log(`[Baselines] Status: ${res.status} ${res.statusText}`);
    } catch (e) { console.error(e); }

    // Test 2: Plans (Should work?)
    console.log(`\nTesting Plans Route...`);
    const url2 = `http://localhost:5000/api/planner/projects/${projectId}/plans`;
    try {
        const res = await fetch(url2);
        console.log(`[Plans] Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const json = await res.json();
            console.log(`[Plans] Found: ${json.length} plans`);
        }
    } catch (e) { console.error(e); }
}
testRoute();

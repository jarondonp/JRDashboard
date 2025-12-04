
import { insertProjectSchema } from '../shared/schema';

const BASE_URL = 'http://localhost:5000/api';

async function testProjectsApi() {
    console.log('🚀 Iniciando pruebas de API de Proyectos...\n');

    // 0. Obtener un Area ID existente (necesario para crear un proyecto)
    console.log('1. Obteniendo áreas existentes...');
    const areasRes = await fetch(`${BASE_URL}/areas`);
    const areas = await areasRes.json();

    if (!areas.length) {
        console.error('❌ No se encontraron áreas. Crea un área primero.');
        return;
    }
    const areaId = areas[0].id;
    console.log(`✅ Área encontrada: ${areas[0].name} (${areaId})\n`);

    // 1. Crear Proyecto
    console.log('2. Creando un nuevo proyecto...');
    const newProject = {
        area_id: areaId,
        title: 'Proyecto de Prueba API',
        description: 'Este es un proyecto creado automáticamente para verificar la API.',
        status: 'active',
        // start_date omitido para probar
    };

    const createRes = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
    });

    if (!createRes.ok) {
        console.error('❌ Error creando proyecto:', await createRes.text());
        return;
    }

    const createdProject = await createRes.json();
    console.log('✅ Proyecto creado:', createdProject);
    const projectId = createdProject.id;
    console.log(`🆔 ID del Proyecto: ${projectId}\n`);

    // 2. Leer Proyecto (Get By ID)
    console.log('3. Obteniendo proyecto por ID...');
    const getRes = await fetch(`${BASE_URL}/projects/${projectId}`);
    const fetchedProject = await getRes.json();

    if (fetchedProject.id === projectId) {
        console.log('✅ Proyecto obtenido correctamente.\n');
    } else {
        console.error('❌ Error obteniendo proyecto.\n');
    }

    // 3. Actualizar Proyecto
    console.log('4. Actualizando proyecto...');
    const updateData = {
        area_id: areaId,
        title: 'Proyecto de Prueba API (Actualizado)',
        status: 'completed'
    };

    const updateRes = await fetch(`${BASE_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
    });

    const updatedProject = await updateRes.json();
    if (updatedProject.title === updateData.title && updatedProject.status === 'completed') {
        console.log('✅ Proyecto actualizado correctamente:', updatedProject.title, updatedProject.status, '\n');
    } else {
        console.error('❌ Error actualizando proyecto.\n');
    }

    // 4. Listar Proyectos
    console.log('5. Listando todos los proyectos...');
    const listRes = await fetch(`${BASE_URL}/projects`);
    const list = await listRes.json();
    console.log(`✅ Total de proyectos encontrados: ${list.length}`);
    const foundInList = list.find((p: any) => p.id === projectId);
    if (foundInList) {
        console.log('✅ El proyecto creado aparece en la lista.\n');
    } else {
        console.error('❌ El proyecto creado NO aparece en la lista.\n');
    }

    // 5. Eliminar Proyecto
    console.log('6. Eliminando proyecto...');
    const deleteRes = await fetch(`${BASE_URL}/projects/${projectId}`, {
        method: 'DELETE',
    });

    if (deleteRes.ok) {
        console.log('✅ Proyecto eliminado correctamente.\n');
    } else {
        console.error('❌ Error eliminando proyecto.\n');
    }

    // Verificación final
    const verifyRes = await fetch(`${BASE_URL}/projects/${projectId}`);
    if (verifyRes.status === 404) {
        console.log('✅ Verificación final exitosa: El proyecto ya no existe.');
    } else {
        console.error('❌ El proyecto sigue existiendo después de eliminarlo.');
    }
}

testProjectsApi().catch(console.error);

import { useGlobalModal } from '../context/GlobalModalContext'
import { Modal } from './Modal'
import { AreaForm } from './forms/AreaForm'
import { GoalForm } from './forms/GoalForm'
import { TaskForm } from './forms/TaskForm'
import { DocumentForm } from './forms/DocumentForm'
import {
    useCreateArea, useUpdateArea,
    useCreateGoal, useUpdateGoal,
    useCreateTask, useUpdateTask,
    useCreateDocument, useUpdateDocument
} from '../hooks'
import { useToast } from './Toast'

export function GlobalModal() {
    const { modals, closeModal, removeModal } = useGlobalModal()
    const { showToast } = useToast()

    if (modals.length === 0) return null

    return (
        <>
            {modals.map((modal, index) => (
                <GlobalModalItem
                    key={modal.id}
                    modal={modal}
                    index={index}
                    onClose={closeModal}
                    onRemove={() => removeModal(modal.id)}
                    showToast={showToast}
                />
            ))}
        </>
    )
}

function GlobalModalItem({
    modal,
    index,
    onClose,
    onRemove,
    showToast
}: {
    modal: { id: string, type: any, mode: any, data: any, onSuccess?: (result: any) => void, isClosing?: boolean },
    index: number,
    onClose: () => void,
    onRemove: () => void,
    showToast: (msg: string, type: 'success' | 'error') => void
}) {
    const { type, mode, data: initialData, onSuccess, isClosing } = modal

    // Area Mutations
    const createArea = useCreateArea()
    const updateArea = useUpdateArea()

    // Goal Mutations
    const createGoal = useCreateGoal()
    const updateGoal = useUpdateGoal()

    // Task Mutations
    const createTask = useCreateTask()
    const updateTask = useUpdateTask()

    // Document Mutations
    const createDocument = useCreateDocument()
    const updateDocument = useUpdateDocument()

    const handleAreaSubmit = async (data: any) => {
        try {
            let result;
            if (mode === 'edit' && initialData?.id) {
                result = await updateArea.mutateAsync({ id: initialData.id, data })
                showToast('Área actualizada exitosamente', 'success')
            } else {
                result = await createArea.mutateAsync(data)
                showToast('Área creada exitosamente', 'success')
            }
            if (onSuccess) onSuccess(result)
            onClose()
        } catch (error) {
            console.error(error)
            showToast('Error al guardar área', 'error')
        }
    }

    const handleGoalSubmit = async (data: any) => {
        try {
            let result;
            if (mode === 'edit' && initialData?.id) {
                result = await updateGoal.mutateAsync({ id: initialData.id, data })
                showToast('Meta actualizada exitosamente', 'success')
            } else {
                result = await createGoal.mutateAsync(data)
                showToast('Meta creada exitosamente', 'success')
            }
            if (onSuccess) onSuccess(result)
            onClose()
        } catch (error) {
            console.error(error)
            showToast('Error al guardar meta', 'error')
        }
    }

    const handleTaskSubmit = async (data: any) => {
        try {
            let result;
            if (mode === 'edit' && initialData?.id) {
                result = await updateTask.mutateAsync({ id: initialData.id, data })
                showToast('Tarea actualizada exitosamente', 'success')
            } else {
                result = await createTask.mutateAsync(data)
                showToast('Tarea creada exitosamente', 'success')
            }
            if (onSuccess) onSuccess(result)
            onClose()
        } catch (error) {
            console.error(error)
            showToast('Error al guardar tarea', 'error')
        }
    }

    const handleDocumentSubmit = async (data: any) => {
        try {
            let result;
            if (mode === 'edit' && initialData?.id) {
                result = await updateDocument.mutateAsync({ id: initialData.id, data })
                showToast('Documento actualizado exitosamente', 'success')
            } else {
                result = await createDocument.mutateAsync(data)
                showToast('Documento creado exitosamente', 'success')
            }
            if (onSuccess) onSuccess(result)
            onClose()
        } catch (error) {
            console.error(error)
            showToast('Error al guardar documento', 'error')
        }
    }

    const getTitle = () => {
        const action = mode === 'create' ? 'Nueva' : 'Editar'
        switch (type) {
            case 'area': return `${action} Área`
            case 'goal': return `${action} Meta`
            case 'task': return `${action} Tarea`
            case 'document': return `${mode === 'create' ? 'Nuevo' : 'Editar'} Documento`
            default: return ''
        }
    }

    return (
        <Modal
            isOpen={!isClosing}
            onClose={onClose}
            onAfterClose={onRemove}
            title={getTitle()}
            size="lg"
            zIndex={40 + index * 10}
        >
            {type === 'area' && (
                <AreaForm
                    initialData={initialData}
                    onSubmit={handleAreaSubmit}
                    onCancel={onClose}
                    isLoading={createArea.isPending || updateArea.isPending}
                />
            )}
            {type === 'goal' && (
                <GoalForm
                    initialData={initialData}
                    onSubmit={handleGoalSubmit}
                    onCancel={onClose}
                    isLoading={createGoal.isPending || updateGoal.isPending}
                />
            )}
            {type === 'task' && (
                <TaskForm
                    initialData={initialData}
                    onSubmit={handleTaskSubmit}
                    onCancel={onClose}
                    isLoading={createTask.isPending || updateTask.isPending}
                />
            )}
            {type === 'document' && (
                <DocumentForm
                    initialData={initialData}
                    onSubmit={handleDocumentSubmit}
                    onCancel={onClose}
                    isLoading={createDocument.isPending || updateDocument.isPending}
                />
            )}
        </Modal>
    )
}

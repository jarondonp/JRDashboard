import { createContext, useContext, useState, type ReactNode } from 'react'

export type ModalType = 'area' | 'goal' | 'task' | 'document' | 'project' | null
export type ModalMode = 'create' | 'edit'

interface ModalState {
    id: string
    type: ModalType
    mode: ModalMode
    data: any
    onSuccess?: (result: any) => void
    isClosing?: boolean
}

interface GlobalModalContextType {
    modals: ModalState[]
    openModal: (type: ModalType, mode?: ModalMode, data?: any, onSuccess?: (result: any) => void) => void
    closeModal: () => void
    removeModal: (id: string) => void
    // Backward compatibility helpers (optional, but good for transition)
    isOpen: boolean
    type: ModalType
    mode: ModalMode
    initialData: any
}

const GlobalModalContext = createContext<GlobalModalContextType | undefined>(undefined)

export function GlobalModalProvider({ children }: { children: ReactNode }) {
    const [modals, setModals] = useState<ModalState[]>([])

    const openModal = (modalType: ModalType, modalMode: ModalMode = 'create', data: any = null, onSuccess?: (result: any) => void) => {
        const newModal: ModalState = {
            id: crypto.randomUUID(),
            type: modalType,
            mode: modalMode,
            data: data,
            onSuccess
        }
        setModals(prev => [...prev, newModal])
    }

    const closeModal = () => {
        setModals(prev => {
            if (prev.length === 0) return prev
            // Mark the last modal as closing
            const newStack = [...prev]
            newStack[newStack.length - 1] = { ...newStack[newStack.length - 1], isClosing: true }
            return newStack
        })
    }

    const removeModal = (id: string) => {
        setModals(prev => prev.filter(m => m.id !== id))
    }

    // Derived state for backward compatibility
    const activeModal = modals.length > 0 ? modals[modals.length - 1] : null
    const isOpen = modals.length > 0
    const type = activeModal?.type || null
    const mode = activeModal?.mode || 'create'
    const initialData = activeModal?.data || null

    return (
        <GlobalModalContext.Provider value={{
            modals,
            openModal,
            closeModal,
            removeModal,
            isOpen,
            type,
            mode,
            initialData
        }}>
            {children}
        </GlobalModalContext.Provider>
    )
}

export function useGlobalModal() {
    const context = useContext(GlobalModalContext)
    if (context === undefined) {
        throw new Error('useGlobalModal must be used within a GlobalModalProvider')
    }
    return context
}

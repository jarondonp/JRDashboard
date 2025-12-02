import { useGlobalModal, type ModalType } from '../context/GlobalModalContext'
import { Button } from './Button'

interface InlineCreateButtonProps {
    type: ModalType
    initialData?: any
    label?: string
    className?: string
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
}

export function InlineCreateButton({
    type,
    initialData,
    label = '+',
    className = '',
    variant = 'secondary',
    size = 'sm'
}: InlineCreateButtonProps) {
    const { openModal } = useGlobalModal()

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent triggering row clicks if used inside a clickable row
        openModal(type, 'create', initialData)
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            className={className}
            type="button"
        >
            {label}
        </Button>
    )
}

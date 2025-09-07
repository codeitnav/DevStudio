import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { useFocusTrap } from '../../hooks/useFocusManagement'
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation'
import { cn } from '../../lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'small' | 'large'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  small: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  large: 'max-w-4xl',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Focus trap
  useFocusTrap(isOpen, containerRef)

  // Keyboard shortcuts
  const shortcuts = closeOnEscape
    ? [
        {
          key: 'Escape',
          action: onClose,
          description: 'Close modal',
        },
      ]
    : []

  useKeyboardNavigation(shortcuts)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  // Announce modal opening to screen readers
  useEffect(() => {
    if (isOpen) {
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = `Dialog opened: ${title || 'Modal dialog'}`
      document.body.appendChild(announcement)

      return () => {
        document.body.removeChild(announcement)
      }
    }
  }, [isOpen, title])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy || (title ? 'modal-title' : undefined)}
      aria-describedby={ariaDescribedBy}
    >
      <Card
        ref={containerRef}
        className={cn(
          'max-h-[90vh] w-full overflow-auto',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            {title && (
              <h2
                id={ariaLabelledBy || 'modal-title'}
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="-mr-2 p-2"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </Card>
    </div>
  )

  return createPortal(modalContent, document.body)
}

'use client'
import { Fragment, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useModal } from '@/app/hooks/useModal'

type ModalProps = {
    children?: React.ReactNode
    className?: string
    open: boolean
    closeOnOutsideClick?: boolean
    disableFocusTrap?: boolean
}

const Modal: React.FC<ModalProps> = ({ children, className, open, closeOnOutsideClick, disableFocusTrap = false }) => {

    const { modal, setModal } = useModal()
    const panelRef = useRef<HTMLDivElement>(null)

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog 
                as="div" 
                className="relative z-10" 
                onClose={closeOnOutsideClick ? () => setModal('None') : () => {}}
                initialFocus={disableFocusTrap ? panelRef : undefined}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full justify-center text-center items-center p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 translate-y-0 scale-95"
                            enterTo="opacity-100 translate-y-0 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 translate-y-0 scale-95"
                        >
                            <Dialog.Panel 
                                ref={panelRef}
                                className={`relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all my-8 max-w-sm bg-secondary ${className}`}
                                tabIndex={disableFocusTrap ? 0 : undefined}
                            >
                                {children}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

export default Modal

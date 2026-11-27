import { createApp, h } from 'vue'
import ConfirmDialog from './ConfirmDialog.vue'

interface ConfirmOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}

export const confirm = (options: ConfirmOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const app = createApp({
      render() {
        return h(ConfirmDialog, {
          visible: true,
          title: options.title,
          message: options.message,
          confirmText: options.confirmText,
          cancelText: options.cancelText,
          onConfirm: () => {
            cleanup()
            resolve(true)
          },
          onCancel: () => {
            cleanup()
            resolve(false)
          },
        })
      },
    })

    const cleanup = () => {
      setTimeout(() => {
        app.unmount()
        document.body.removeChild(container)
      }, 250)
    }

    app.mount(container)
  })
}

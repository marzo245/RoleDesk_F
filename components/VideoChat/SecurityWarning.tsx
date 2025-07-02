import React from 'react'
import { useVideoChat } from '../../app/hooks/useVideoChat'

const SecurityWarning: React.FC = () => {
  const { webrtcAvailable, securityInfo } = useVideoChat()

  // Debug logs para entender el estado
  console.log('SecurityWarning: webrtcAvailable =', webrtcAvailable)
  console.log('SecurityWarning: securityInfo =', securityInfo)

  if (webrtcAvailable) {
    console.log('SecurityWarning: WebRTC disponible, no mostrando advertencia')
    return null // No mostrar nada si WebRTC está disponible
  }

  console.log('SecurityWarning: WebRTC NO disponible, mostrando advertencia')

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md mx-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Video Chat No Disponible
            </h3>
            <div className="mt-2 text-xs text-yellow-700">
              <p className="mb-2">
                Para usar video chat, necesitas una conexión segura:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Usa <strong>HTTPS</strong> en lugar de HTTP</li>
                <li>O accede desde <strong>localhost</strong></li>
              </ul>
              
              {securityInfo && (
                <div className="mt-3 p-2 bg-yellow-100 rounded text-xs">
                  <p><strong>Estado actual:</strong></p>
                  <p>• Protocolo: {securityInfo.isHTTPS ? 'HTTPS ✓' : 'HTTP ✗'}</p>
                  <p>• Localhost: {securityInfo.isLocalhost ? 'Sí ✓' : 'No ✗'}</p>
                  <p>• Contexto seguro: {securityInfo.isSecureContext ? 'Sí ✓' : 'No ✗'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecurityWarning

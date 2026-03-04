"use client"

import { logout } from "@/app/login/actions"
import { useState } from "react"

export function ProfileSettingsClient() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-secondary dark:text-white flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-primary">settings_account_box</span>
        Configuración de Cuenta
      </h3>
      <div className="space-y-4">
        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">lock</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-secondary dark:group-hover:text-white">Cambiar Contraseña</span>
          </div>
          <span className="material-symbols-outlined text-gray-300 text-sm">arrow_forward_ios</span>
        </button>
        <button 
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">notifications</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-secondary dark:group-hover:text-white">Notificaciones</span>
          </div>
          <div className="relative inline-block w-8 h-4 align-middle select-none transition duration-200 ease-in pointer-events-none">
            <input 
              className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none checked:right-0 right-4 checked:border-primary border-gray-300 transition-all duration-200" 
              type="checkbox" 
              checked={notificationsEnabled}
              readOnly
            />
            <div className={`block overflow-hidden h-4 rounded-full transition-colors duration-200 ${notificationsEnabled ? 'bg-primary' : 'bg-gray-300'}`}></div>
          </div>
        </button>
        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">language</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-secondary dark:group-hover:text-white">Idioma / Región</span>
          </div>
          <span className="text-xs text-gray-400">Español (MX)</span>
        </button>
        <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
          <form action={logout}>
            <button type="submit" className="w-full text-left text-sm text-red-500 hover:text-red-600 font-medium py-2 flex items-center gap-2">
              <span className="material-symbols-outlined">logout</span>
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

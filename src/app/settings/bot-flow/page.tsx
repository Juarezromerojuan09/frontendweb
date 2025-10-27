'use client'
//si
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Image from 'next/image'

interface ApiResponse {
  success: boolean
  user?: User
  message?: string
}

interface AxiosError {
  response?: {
    status: number
    data?: {
      message?: string
    }
  }
}

interface MenuItem {
  id: string
  label: string
  type: string
  actionKey?: string
  fixed?: boolean
  meta?: {
    table?: {
      columns: string[]
      rows: string[][]
    }
    list?: {
      options: string[]
    }
    location?: {
      address: string
    }
    services?: Array<{
      serviceType: string
      price?: string
      recommendations?: string[]
    }>
    formFields?: Array<{
      key: string
      label: string
      type: string
      required: boolean
    }>
  }
}


interface BotSettings {
  template: string
  greeting: string
  menuItems: MenuItem[]
  formFields: Array<{
    key: string
    label: string
    type: string
    required: boolean
    toModified: boolean
  }>
  messages: {
    scheduleConfirmation: string
    modificationConfirmation: string
    cancellationConfirmation: string
    orderAcknowledgement: string
  }
  reminders: {
    enabled: boolean
    time1Before: number
    time2Before: number
  }
  version: number
  businessHours?: {
    start: string
    end: string
  }
  workingDays?: string[]
  appointmentInterval?: number
  autoConfirmAppointments?: boolean
  scheduleMessage?: string
}

interface User {
  _id: string
  username: string
  email: string
  fullName: string
  personalPhone: string
  businessName: string
  businessType: string
  address?: string
  whatsappNumber: string
  whatsappDisplayName: string
  businessCategory: string
  businessDescription?: string
  website?: string
  profileImageUrl?: string
  status: 'pending_verification' | 'active' | 'suspended'
  createdAt: string
  updatedAt?: string
  botSettings?: BotSettings
}

export default function BotFlowSettings() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [botSettings, setBotSettings] = useState<BotSettings>({
    template: 'custom',
    greeting: 'Hola, soy el asistente virtual. ¿En qué puedo ayudarte hoy?',
    menuItems: [],
    formFields: [],
    messages: {
      scheduleConfirmation: 'Tu cita para {date} a las {time} ha sido agendada.',
      modificationConfirmation: 'Cita modificada exitosamente.',
      cancellationConfirmation: 'Cita cancelada.',
      orderAcknowledgement: 'Gracias. En breve un encargado le responderá.'
    },
    reminders: {
      enabled: false,
      time1Before: 3,
      time2Before: 24
    },
    version: 1,
    businessHours: {
      start: '09:00',
      end: '18:00'
    },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    appointmentInterval: 30,
    autoConfirmAppointments: false,
    scheduleMessage: "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')"
  })
  const [activeTab, setActiveTab] = useState('template')
  const [greetingEdit, setGreetingEdit] = useState('')
  const [scheduleMessageEdit, setScheduleMessageEdit] = useState("Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')")
  const [scheduleConfirmationEdit, setScheduleConfirmationEdit] = useState('Tu cita para {date} a las {time} ha sido agendada.')
  const [modificationConfirmationEdit, setModificationConfirmationEdit] = useState('Cita modificada exitosamente.')
  const [cancellationConfirmationEdit, setCancellationConfirmationEdit] = useState('Cita cancelada.')
  const [orderAcknowledgementEdit, setOrderAcknowledgementEdit] = useState('Gracias. En breve un encargado le responderá.')
  const [menuItemsEdit, setMenuItemsEdit] = useState<MenuItem[]>([])
  const [formFieldsEdit, setFormFieldsEdit] = useState<Array<{key: string, label: string, type: string, required: boolean, toModified: boolean}>>([])
  const [menuItemErrors, setMenuItemErrors] = useState<{[key: string]: string}>({})
  const [formFieldErrors, setFormFieldErrors] = useState<{[key: string]: string}>({})
  const [serviceErrors, setServiceErrors] = useState<{[key: string]: string}>({})
  const router = useRouter()

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return false
    }
    return true
  }, [router])

  const fetchUser = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')
      
      if (!userId) {
        setError('ID de usuario no encontrado')
        return
      }

      const response = await axios.get<ApiResponse>(`${apiUrl}/api/auth/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data.success && response.data.user) {
        setUser(response.data.user)
      }
    } catch (err) {
      const axiosErr = err as AxiosError
      if (axiosErr.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        localStorage.removeItem('userName')
        localStorage.removeItem('userEmail')
        router.push('/login')
      } else {
        setError('Error al obtener información del usuario')
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (checkAuth()) {
      fetchUser()
    }
  }, [checkAuth, fetchUser])

  useEffect(() => {
    if (user?.botSettings) {
      setBotSettings(user.botSettings)
      setGreetingEdit(user.botSettings.greeting || '')
      setScheduleMessageEdit(user.botSettings.scheduleMessage || "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')")
      setScheduleConfirmationEdit(user.botSettings.messages?.scheduleConfirmation || 'Tu cita para {date} a las {time} ha sido agendada.')
      setModificationConfirmationEdit(user.botSettings.messages?.modificationConfirmation || 'Cita modificada exitosamente.')
      setCancellationConfirmationEdit(user.botSettings.messages?.cancellationConfirmation || 'Cita cancelada.')
      setOrderAcknowledgementEdit(user.botSettings.messages?.orderAcknowledgement || 'Gracias. En breve un encargado le responderá.')
      
      // Asegurar que los elementos fijos tengan la propiedad fixed al cargar
      let menuItems = user.botSettings.menuItems || []
      if (user.botSettings.template === 'consultorio' || user.botSettings.template === 'barberia') {
        menuItems = menuItems.map((item, index) => {
          // Para las dos primeras opciones en consultorio/barberia, forzar fixed: true
          if (index === 0 && (item.label === 'Agendar cita' || item.id === 'agendar-cita-fixed')) {
            return { ...item, fixed: true, label: 'Agendar cita' }
          }
          if (index === 1 && (item.label.includes('Modificar') || item.label.includes('Cancelar') || item.id === 'modificar-cita-fixed')) {
            return { ...item, fixed: true, label: 'Modificar / Cancelar' }
          }
          return item
        })
      }
      
      setMenuItemsEdit(menuItems)
      
      // Procesar formFields para asegurar que al menos un campo tenga toModified: true
      let formFields = user.botSettings.formFields || []
      if (formFields.length > 0) {
        // Verificar si algún campo tiene toModified: true
        const hasToModifiedField = formFields.some(field => field.toModified === true)
        
        // Si no hay ningún campo con toModified: true, marcar el primer campo
        if (!hasToModifiedField) {
          formFields = formFields.map((field, index) => ({
            ...field,
            toModified: index === 0
          }))
        }
      }
      
      setFormFieldsEdit(formFields)
    }
  }, [user])

  const handleTemplateSelect = (template: string) => {
    const templates = {
      consultorio: {
        greeting: `Hola, soy el asistente virtual de ${user?.businessName}. ¿En qué puedo ayudarte hoy?`,
        menuItems: [
          {
            id: 'agendar-cita-fixed',
            label: 'Agendar cita',
            type: 'action',
            actionKey: 'schedule',
            fixed: true
          },
          {
            id: 'modificar-cita-fixed',
            label: 'Modificar / Cancelar',
            type: 'action',
            actionKey: 'modify',
            fixed: true
          },
          { id: '3', label: 'Información de servicios', type: 'action', actionKey: 'prices' },
          { id: '4', label: 'Ubicación y horarios', type: 'action', actionKey: 'location' }
        ],
        formFields: [
          { key: 'name', label: 'Nombre completo', type: 'text', required: true, toModified: true },
          { key: 'phone', label: 'Teléfono', type: 'tel', required: true, toModified: false },
          { key: 'date', label: 'Fecha preferida', type: 'date', required: true, toModified: false }
        ],
        scheduleMessage: "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')"
      },
      barberia: {
        greeting: `¡Hola! Bienvenido a ${user?.businessName}. ¿Qué servicio necesitas hoy?`,
        menuItems: [
          {
            id: 'agendar-cita-fixed',
            label: 'Agendar cita',
            type: 'action',
            actionKey: 'schedule',
            fixed: true
          },
          {
            id: 'modificar-cita-fixed',
            label: 'Modificar / Cancelar',
            type: 'action',
            actionKey: 'modify',
            fixed: true
          },
          { id: '3', label: 'Corte de cabello', type: 'action', actionKey: 'schedule' },
          { id: '4', label: 'Barba y bigote', type: 'action', actionKey: 'schedule' },
          { id: '5', label: 'Paquetes completos', type: 'action', actionKey: 'prices' }
        ],
        formFields: [
          { key: 'name', label: 'Nombre', type: 'text', required: true, toModified: true },
          { key: 'phone', label: 'Teléfono', type: 'tel', required: true, toModified: false },
          { key: 'service', label: 'Servicio', type: 'select', required: true, toModified: false }
        ],
        scheduleMessage: "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')"
      },
      servicios: {
        greeting: `Hola, soy el asistente de ${user?.businessName}. ¿Cómo puedo ayudarte?`,
        menuItems: [
          { id: '1', label: 'Solicitar servicio', type: 'action', actionKey: 'schedule' },
          { id: '2', label: 'Cotización', type: 'action', actionKey: 'prices' },
          { id: '3', label: 'Soporte técnico', type: 'action', actionKey: 'custom' }
        ],
        formFields: [
          { key: 'name', label: 'Nombre', type: 'text', required: true, toModified: true },
          { key: 'phone', label: 'Teléfono', type: 'tel', required: true, toModified: false },
          { key: 'description', label: 'Descripción del servicio', type: 'textarea', required: true, toModified: false }
        ],
        scheduleMessage: "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')"
      },
      custom: {
        greeting: 'Hola, soy el asistente virtual. ¿En qué puedo ayudarte hoy?',
        menuItems: [],
        formFields: [],
        scheduleMessage: "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')"
      }
    }

    const selectedTemplate = templates[template as keyof typeof templates] || templates.custom
    setBotSettings(prev => ({
      ...prev,
      template,
      greeting: selectedTemplate.greeting,
      menuItems: selectedTemplate.menuItems,
      formFields: selectedTemplate.formFields,
      scheduleMessage: selectedTemplate.scheduleMessage
    }))
    setGreetingEdit(selectedTemplate.greeting)
    setScheduleMessageEdit(selectedTemplate.scheduleMessage)
    setMenuItemsEdit(selectedTemplate.menuItems)
    setFormFieldsEdit(selectedTemplate.formFields)
  }

  const addMenuItem = () => {
    if (menuItemsEdit.length >= 5) {
      setError('Máximo 5 opciones de menú permitidas')
      return
    }
    const newItem = {
      id: Date.now().toString(),
      label: '',
      type: 'action'
    }
    setMenuItemsEdit([...menuItemsEdit, newItem])
  }

  const isItemFixed = (item: MenuItem | undefined) => {
    if (!item) return false
    if (item.fixed) return true
    if (botSettings.template === 'consultorio' || botSettings.template === 'barberia') {
      if (item.label === 'Agendar cita' || item.label === 'Modificar / Cancelar') {
        return true
      }
    }
    return false
  }

  const removeMenuItem = (id: string) => {
    const item = menuItemsEdit.find(item => item.id === id)
    if (isItemFixed(item)) {
      return // Don't remove fixed items
    }
    setMenuItemsEdit(menuItemsEdit.filter(item => item.id !== id))
  }

  const updateMenuItem = (id: string, field: string, value: string | object | undefined) => {
    const item = menuItemsEdit.find(item => item.id === id)
    if (isItemFixed(item)) {
      return // Don't update fixed items
    }
    
    // Validar longitud máxima para el campo label
    if (field === 'label' && typeof value === 'string') {
      if (value.length > 24) {
        setMenuItemErrors(prev => ({ ...prev, [id]: 'Máximo 24 caracteres permitidos' }))
        return // No actualizar si excede el límite
      } else {
        setMenuItemErrors(prev => ({ ...prev, [id]: '' }))
      }
    }

    // Manejar actionKey para que sea exclusivo
    let updatedValue = value;
    if (field === 'actionKey' && typeof value === 'string') {
      // Si se está estableciendo un actionKey, eliminar cualquier otro actionKey del mismo tipo
      if (value === 'schedule' || value === 'modify') {
        setMenuItemsEdit(menuItemsEdit.map(item =>
          item.id === id
            ? { ...item, [field]: value }
            : (item.actionKey === value ? { ...item, actionKey: undefined } : item)
        ))
        return;
      }
    }
    
    setMenuItemsEdit(menuItemsEdit.map(item =>
      item.id === id ? { ...item, [field]: updatedValue } : item
    ))
  }

  const generateUniqueKey = (baseKey: string, existingKeys: string[], excludeKey?: string): string => {
    let newKey = baseKey;
    let counter = 1;
    const keysToCheck = existingKeys.filter(key => key !== excludeKey);
    while (keysToCheck.includes(newKey)) {
      newKey = `${baseKey}${counter}`;
      counter++;
    }
    return newKey;
  }

  const addFormField = () => {
    if (formFieldsEdit.length >= 6) {
      setError('Máximo 6 campos de formulario permitidos')
      return
    }
    const defaultType = 'text';
    const existingKeys = formFieldsEdit.map(field => field.key);
    const newKey = generateUniqueKey(defaultType, existingKeys);
    
    // Si es el primer campo, toModified será true, de lo contrario false
    const isFirstField = formFieldsEdit.length === 0;
    
    const newField = {
      key: newKey,
      label: '',
      type: defaultType,
      required: false,
      toModified: isFirstField
    }
    
    // Si no es el primer campo, mantener la selección actual
    let updatedFields;
    if (isFirstField) {
      updatedFields = [newField];
    } else {
      updatedFields = [...formFieldsEdit, newField];
    }
    
    setFormFieldsEdit(updatedFields)
  }

  const removeFormField = (key: string) => {
    setFormFieldsEdit(formFieldsEdit.filter(field => field.key !== key))
  }

  const handleTableChange = (id: string, action: string, index?: number, value?: string, cellIndex?: number) => {
    setMenuItemsEdit(menuItemsEdit.map(item => {
      if (item.id !== id) return item
      
      const meta = item.meta?.table || { columns: [], rows: [] }
      
      switch(action) {
        case 'addColumn':
          if (meta.columns.length < 4) {
            meta.columns.push(`Columna ${meta.columns.length + 1}`)
            // Añadir columna a todas las filas existentes
            meta.rows.forEach(row => row.push(''))
          }
          break
          
        case 'addRow':
          if (meta.rows.length < 10) {
            meta.rows.push(Array(meta.columns.length).fill(''))
          }
          break
          
        case 'updateColumn':
          if (typeof index === 'number' && typeof value === 'string') {
            meta.columns[index] = value
          }
          break
          
        case 'updateCell':
          if (typeof index === 'number' && typeof cellIndex === 'number' && typeof value === 'string') {
            if (meta.rows[index]) {
              meta.rows[index][cellIndex] = value
            }
          }
          break
          
        case 'removeColumn':
          if (typeof index === 'number') {
            if (meta.columns.length > 2) {
              meta.columns.splice(index, 1)
              // Eliminar la columna de todas las filas
              meta.rows.forEach(row => row.splice(index, 1))
            }
          }
          break
          
        case 'removeRow':
          if (typeof index === 'number') {
            if (meta.rows.length > 1) {
              meta.rows.splice(index, 1)
            }
          }
          break
          
        default:
          break
      }
      
      return {
        ...item,
        meta: {
          ...item.meta,
          table: { ...meta }
        }
      }
    }))
  }

  const handleListChange = (id: string, index: number | string, value?: string) => {
    // Convertir string index a number si es necesario
    const idx = typeof index === 'string' ? parseInt(index) : index
    if (isNaN(idx) && idx !== -1) {
      console.error('Invalid index:', index)
      return
    }
    setMenuItemsEdit(menuItemsEdit.map(item => {
      if (item.id !== id) return item
      
      const options = item.meta?.list?.options || []
      
      if (idx === -1) { // Añadir nueva opción
        options.push('')
      } else if (value === undefined) { // Eliminar opción
        options.splice(idx, 1)
      } else { // Actualizar opción
        options[idx] = value
      }
      
      return {
        ...item,
        meta: {
          ...item.meta,
          list: { options: [...options] }
        }
      }
    }))
  }

  const updateFormField = (key: string, field: string, value: string | boolean) => {
    // Validar longitud máxima para el campo label
    if (field === 'label' && typeof value === 'string') {
      if (value.length > 40) {
        setFormFieldErrors(prev => ({ ...prev, [key]: 'Máximo 40 caracteres permitidos' }))
        return // No actualizar si excede el límite
      } else {
        setFormFieldErrors(prev => ({ ...prev, [key]: '' }))
      }
    }

    // Manejar la selección exclusiva de toModified
    if (field === 'toModified' && value === true) {
      setFormFieldsEdit(formFieldsEdit.map(item => {
        if (item.key === key) {
          return { ...item, toModified: true };
        } else {
          return { ...item, toModified: false };
        }
      }))
      return;
    }

    setFormFieldsEdit(formFieldsEdit.map(item => {
      if (item.key !== key) return item;
      
      const updatedItem = { ...item, [field]: value };
      
      // If type changes, update the key to match the new type
      if (field === 'type' && typeof value === 'string') {
        const existingKeys = formFieldsEdit.map(f => f.key).filter(k => k !== key);
        updatedItem.key = generateUniqueKey(value, existingKeys);
      }
      
      // If label changes to a common field name, update the key accordingly
      if (field === 'label' && typeof value === 'string') {
        const commonFieldNames: { [key: string]: string } = {
          'nombre': 'name',
          'teléfono': 'phone',
          'email': 'email',
          'correo': 'email',
          'fecha': 'date',
          'fecha de nacimiento': 'birthdate',
          'dirección': 'address',
          'ciudad': 'city',
          'país': 'country',
          'código postal': 'zipcode',
          'mensaje': 'message',
          'comentario': 'comment',
          'descripción': 'description',
          'servicio': 'service',
          'producto': 'product',
          'cantidad': 'quantity',
          'precio': 'price'
        };
        
        const normalizedLabel = value.toLowerCase().trim();
        const commonKey = commonFieldNames[normalizedLabel];
        
        if (commonKey) {
          const existingKeys = formFieldsEdit.map(f => f.key).filter(k => k !== key);
          updatedItem.key = generateUniqueKey(commonKey, existingKeys);
        }
      }
      
      return updatedItem;
    }))
  }

  // Funciones para manejar servicios de agendamiento dentro del primer menuItem
  const getScheduleItem = () => {
    return menuItemsEdit.find(item => item.actionKey === 'schedule') || menuItemsEdit[0];
  }

  const getScheduleServices = () => {
    const scheduleItem = getScheduleItem();
    return scheduleItem?.meta?.services || [];
  }

  const addSchedulingService = () => {
    const scheduleItem = getScheduleItem();
    if (!scheduleItem) return;

    const newService = {
      serviceType: '',
      price: '',
      recommendations: ['']
    }

    const updatedServices = [...getScheduleServices(), newService];
    
    setMenuItemsEdit(menuItemsEdit.map(item =>
      item.id === scheduleItem.id
        ? {
            ...item,
            meta: {
              ...item.meta,
              services: updatedServices
            }
          }
        : item
    ));
  }

  const removeSchedulingService = (index: number) => {
    const scheduleItem = getScheduleItem();
    if (!scheduleItem || getScheduleServices().length <= 1) return;

    const updatedServices = getScheduleServices().filter((_, i) => i !== index);
    
    setMenuItemsEdit(menuItemsEdit.map(item =>
      item.id === scheduleItem.id
        ? {
            ...item,
            meta: {
              ...item.meta,
              services: updatedServices
            }
          }
        : item
    ));
  }

  const updateSchedulingService = (index: number, field: string, value: string | string[]) => {
    const scheduleItem = getScheduleItem();
    if (!scheduleItem) return;

    // Validar longitud máxima para el campo serviceType
    if (field === 'serviceType' && typeof value === 'string') {
      if (value.length > 24) {
        setServiceErrors(prev => ({ ...prev, [index]: 'Máximo 24 caracteres permitidos' }))
        return // No actualizar si excede el límite
      } else {
        setServiceErrors(prev => ({ ...prev, [index]: '' }))
      }
    }

    const updatedServices = getScheduleServices().map((service, i) =>
      i === index ? { ...service, [field]: value } : service
    );
    
    setMenuItemsEdit(menuItemsEdit.map(item =>
      item.id === scheduleItem.id
        ? {
            ...item,
            meta: {
              ...item.meta,
              services: updatedServices
            }
          }
        : item
    ));
  }

  const addRecommendation = (serviceIndex: number) => {
    const scheduleItem = getScheduleItem();
    if (!scheduleItem) return;

    const updatedServices = getScheduleServices().map((service, i) =>
      i === serviceIndex
        ? {
            ...service,
            recommendations: [...(service.recommendations || []), '']
          }
        : service
    );
    
    setMenuItemsEdit(menuItemsEdit.map(item =>
      item.id === scheduleItem.id
        ? {
            ...item,
            meta: {
              ...item.meta,
              services: updatedServices
            }
          }
        : item
    ));
  }

  const removeRecommendation = (serviceIndex: number, recIndex: number) => {
    const scheduleItem = getScheduleItem();
    if (!scheduleItem) return;

    const updatedServices = getScheduleServices().map((service, i) =>
      i === serviceIndex
        ? {
            ...service,
            recommendations: (service.recommendations || []).filter((_, j) => j !== recIndex)
          }
        : service
    );
    
    setMenuItemsEdit(menuItemsEdit.map(item =>
      item.id === scheduleItem.id
        ? {
            ...item,
            meta: {
              ...item.meta,
              services: updatedServices
            }
          }
        : item
    ));
  }

  const updateRecommendation = (serviceIndex: number, recIndex: number, value: string) => {
    const scheduleItem = getScheduleItem();
    if (!scheduleItem) return;

    const updatedServices = getScheduleServices().map((service, i) =>
      i === serviceIndex
        ? {
            ...service,
            recommendations: (service.recommendations || []).map((rec, j) =>
              j === recIndex ? value : rec
            )
          }
        : service
    );
    
    setMenuItemsEdit(menuItemsEdit.map(item =>
      item.id === scheduleItem.id
        ? {
            ...item,
            meta: {
              ...item.meta,
              services: updatedServices
            }
          }
        : item
    ));
  }

  const saveBotSettings = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    // Validar longitud de las etiquetas del menú antes de guardar
    const invalidMenuItems = menuItemsEdit.filter(item =>
      !item.fixed && item.label && item.label.length > 24
    )
    
    // Validar longitud de las etiquetas de los campos del formulario antes de guardar
    const invalidFormFields = formFieldsEdit.filter(field =>
      field.label && field.label.length > 40
    )
    
    // Validar longitud de los tipos de servicio en servicios de agendamiento
    const scheduleItem = getScheduleItem()
    const invalidServices = scheduleItem?.meta?.services?.filter(service =>
      service.serviceType && service.serviceType.length > 24
    ) || []
    
    if (invalidMenuItems.length > 0 || invalidFormFields.length > 0 || invalidServices.length > 0) {
      setError('Algunas etiquetas exceden el límite de caracteres')
      setSaving(false)
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')

      if (!userId) {
        setError('ID de usuario no encontrado')
        setSaving(false)
        return
      }

      // Validar y limpiar los items del menú - Solo incluir meta con datos válidos
      const validatedMenuItems = menuItemsEdit.map(item => {
        const cleanedItem: MenuItem = {
          id: item.id || Date.now().toString(),
          label: item.label || '',
          type: item.type || 'action',
          actionKey: item.actionKey,
          fixed: item.fixed,
          meta: undefined
        };

        const meta: {
          services?: Array<{
            serviceType: string;
            price?: string;
            recommendations?: string[];
          }>;
          formFields?: Array<{
            key: string;
            label: string;
            type: string;
            required: boolean;
          }>;
          table?: {
            columns: string[];
            rows: string[][];
          };
          list?: {
            options: string[];
          };
          location?: {
            address: string;
          };
        } = {};

        // Incluir servicios solo si hay datos (para cualquier item)
        if (item.meta?.services && item.meta.services.length > 0) {
          meta.services = item.meta.services;
        }

        // Incluir formFields solo si hay datos (para cualquier item)
        if (item.meta?.formFields && item.meta.formFields.length > 0) {
          meta.formFields = item.meta.formFields;
        }

        // Para items no fijos, incluir table, list, location solo si tienen datos válidos
        if (!item.fixed) {
          // Tabla - solo si tiene contenido válido
          if (item.type === 'table' && item.meta?.table) {
            const tableData = {
              columns: item.meta.table.columns || [],
              rows: item.meta.table.rows || []
            };
            // Validar que tenga al menos 2 columnas y 1 fila
            if (tableData.columns.length >= 2 && tableData.rows.length >= 1) {
              meta.table = tableData;
            }
          }

          // Lista - solo si tiene al menos 2 opciones
          if (item.type === 'list' && item.meta?.list) {
            const options = item.meta.list.options || [];
            if (options.length >= 2) {
              meta.list = { options };
            }
          }

          // Ubicación - solo si tiene dirección
          if (item.type === 'location' && item.meta?.location?.address) {
            meta.location = {
              address: item.meta.location.address || user?.address || ''
            };
          }
        }

        // Limpieza exhaustiva: eliminar propiedades vacías dentro de meta
        const cleanedMeta: Record<string, unknown> = {};
        Object.keys(meta).forEach(key => {
          const value = (meta as Record<string, unknown>)[key];
          
          if (Array.isArray(value) && value.length > 0) {
            // Arrays no vacíos: services, formFields
            cleanedMeta[key] = value;
          } else if (typeof value === 'object' && value !== null) {
            // Objetos: table, list, location
            if (key === 'table') {
              const tableValue = value as { columns?: string[]; rows?: string[][] };
              if (tableValue.columns && tableValue.columns.length > 0 && tableValue.rows && tableValue.rows.length > 0) {
                cleanedMeta[key] = value as { columns: string[]; rows: string[][] };
              }
            } else if (key === 'list') {
              const listValue = value as { options?: string[] };
              if (listValue.options && listValue.options.length > 0) {
                cleanedMeta[key] = value as { options: string[] };
              }
            } else if (key === 'location') {
              const locationValue = value as { address?: string };
              if (locationValue.address && locationValue.address.trim() !== '') {
                cleanedMeta[key] = value as { address: string };
              }
            }
          }
        });

        // Solo asignar meta si hay datos válidos después de la limpieza
        if (Object.keys(cleanedMeta).length > 0) {
          cleanedItem.meta = cleanedMeta;
        }

        return cleanedItem;
      });

      const validatedFormFields = formFieldsEdit.map(field => ({
        key: field.key || `field_${Date.now()}`,
        label: field.label || '',
        type: field.type || 'text',
        required: field.required || false,
        toModified: field.toModified || false
      }))

      // Validar servicios de agendamiento (ahora dentro del meta del primer menuItem)
      // Los servicios ya están incluidos en validatedMenuItems a través del meta
      const updatedSettings = {
        ...botSettings,
        greeting: greetingEdit || 'Hola, soy el asistente virtual. ¿En qué puedo ayudarte hoy?',
        scheduleMessage: scheduleMessageEdit || "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')",
        messages: {
          scheduleConfirmation: scheduleConfirmationEdit,
          modificationConfirmation: modificationConfirmationEdit,
          cancellationConfirmation: cancellationConfirmationEdit,
          orderAcknowledgement: orderAcknowledgementEdit
        },
        menuItems: validatedMenuItems,
        formFields: validatedFormFields
      }

      console.log('Validated menuItems:', JSON.stringify(validatedMenuItems, null, 2))
      console.log('Enviando configuración:', JSON.stringify(updatedSettings, null, 2))

      const response = await axios.patch<ApiResponse>(
        `${apiUrl}/api/auth/user/${userId}`,
        { botSettings: updatedSettings },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        setSuccess('Configuración guardada exitosamente')
        setBotSettings(updatedSettings)
        
        // Actualizar también los estados de edición con los datos validados
        setMenuItemsEdit(validatedMenuItems)
        setFormFieldsEdit(validatedFormFields)
        console.log('Configuración guardada exitosamente en el backend:', response.data)
      } else {
        setError(response.data.message || 'Error al guardar la configuración')
        console.error('Error from backend:', response.data)
      }
    } catch (err) {
      const axiosErr = err as AxiosError
      if (axiosErr.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        localStorage.removeItem('userName')
        localStorage.removeItem('userEmail')
        router.push('/login')
      } else {
        console.error('Error detallado:', axiosErr.response?.data || err)
        setError(axiosErr.response?.data?.message || 'Error al guardar la configuración')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#000e24' }}>
        <div className="text-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90e2f8] mx-auto"></div>
          <p className="mt-4 text-[#B7C2D6]">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#000e24' }}>
        <div className="text-[#B7C2D6] z-10">Usuario no encontrado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#000e24' }}>
      {/* Circuit Pattern Background with longer lines and hollow circles - Behind everything */}
      <div className="absolute inset-0 opacity-40 z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Radial gradient for fading center */}
            <radialGradient id="fadeCenter" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#000e24" stopOpacity="0" />
              <stop offset="40%" stopColor="#000e24" stopOpacity="0" />
              <stop offset="100%" stopColor="#000e24" stopOpacity="1" />
            </radialGradient>
            
            <pattern id="circuitPattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              {/* Longer lines with direction changes and hollow circles */}
              <g stroke="#012f78" strokeWidth="0.8" fill="none" opacity="0.6">
                {/* Line 1 - from left to center with angle */}
                <path d="M0,40 L80,40 L100,60" />
                <circle cx="100" cy="60" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 2 - from top to center with angle */}
                <path d="M40,0 L40,80 L60,100" />
                <circle cx="60" cy="100" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 3 - from right to center with angle */}
                <path d="M200,60 L120,60 L100,80" />
                <circle cx="100" cy="80" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 4 - from bottom to center with angle */}
                <path d="M60,200 L60,120 L80,100" />
                <circle cx="80" cy="100" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 5 - from top-left to center */}
                <path d="M0,20 L60,20 L80,40" />
                <circle cx="80" cy="40" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 6 - from top-right to center */}
                <path d="M200,20 L140,20 L120,40" />
                <circle cx="120" cy="40" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 7 - from bottom-left to center */}
                <path d="M0,180 L60,180 L80,160" />
                <circle cx="80" cy="160" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 8 - from bottom-right to center */}
                <path d="M200,180 L140,180 L120,160" />
                <circle cx="120" cy="160" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 9 - diagonal from left */}
                <path d="M0,100 L50,100 L70,120" />
                <circle cx="70" cy="120" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 10 - diagonal from right */}
                <path d="M200,100 L150,100 L130,80" />
                <circle cx="130" cy="80" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 11 - diagonal from top */}
                <path d="M100,0 L100,50 L120,70" />
                <circle cx="120" cy="70" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 12 - diagonal from bottom */}
                <path d="M100,200 L100,150 L80,130" />
                <circle cx="80" cy="130" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
              </g>
            </pattern>
          </defs>
          
          {/* Background with pattern */}
          <rect width="100%" height="100%" fill="url(#circuitPattern)" />
          
          {/* Fade out center area */}
          <rect width="100%" height="100%" fill="url(#fadeCenter)" />
        </svg>
      </div>

      <div className="relative z-50 pt-4 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
            <div className="flex items-center space-x-3 lg:space-x-6">
              <Image
                src="/Logo.png"
                alt="SYNAPBOT"
                width={75}
                height={19}
                className="h-4 sm:h-5 lg:h-6 w-auto"
                priority
              />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#B7C2D6]">Configuración</h1>
            </div>
            <div className="flex items-center space-x-3 self-end sm:self-auto">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden hamburger-menu p-2"
              >
                <div className={`w-5 h-0.5 bg-[#B7C2D6] mb-1.5 transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <div className={`w-5 h-0.5 bg-[#B7C2D6] mb-1.5 transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                <div className={`w-5 h-0.5 bg-[#B7C2D6] transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-[#012f78] hover:bg-[#3ea0c9] text-[#B7C2D6] px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm lg:text-base whitespace-nowrap"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
            )}
            
            {/* Sidebar */}
            <div className={`
              ${mobileMenuOpen ? 'fixed left-0 top-0 h-full w-72 sm:w-80 z-50 transform translate-x-0' : 'fixed -translate-x-full lg:translate-x-0'}
              lg:static lg:w-72 xl:w-80 flex-shrink-0 bg-[#0b1e34] shadow-xl rounded-xl border-2 border-[#3ea0c9] p-4 sm:p-6 transition-transform duration-300 ease-in-out
            `}>
              {/* Close button for mobile */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden absolute top-3 right-3 sm:top-4 sm:right-4 text-[#B7C2D6] hover:text-[#90e2f8] text-xl"
              >
                ×
              </button>
              <div className="bg-[#0b1e34] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9] p-4 sm:p-6">
                <div className="text-center">
                  <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#90e2f8] mb-3 sm:mb-4 bg-[#012f78]">
                    {user.profileImageUrl ? (
                      <Image
                        src={user.profileImageUrl || ''}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.profile-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${user.profileImageUrl ? 'profile-fallback hidden' : ''}`}>
                      <span className="text-2xl sm:text-4xl text-[#B7C2D6] font-bold">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <h2 className="text-lg sm:text-xl font-semibold text-[#B7C2D6] mb-1 sm:mb-2">{user.fullName}</h2>
                  <p className="text-[#90e2f8] text-xs sm:text-sm mb-4 sm:mb-6">{user.businessName}</p>
                </div>

                {/* Navigation Menu */}
                <div className="mt-4 sm:mt-6 bg-[#012f78] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9] p-3 sm:p-4">
                  <div className="space-y-1 sm:space-y-2">
                    <button
                      onClick={() => router.push('/settings')}
                      className="w-full bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] py-1.5 sm:py-2 px-3 sm:px-4 rounded-md transition-colors cursor-pointer text-left text-sm sm:text-base"
                    >
                      Perfil
                    </button>
                    <button
                      onClick={() => router.push('/settings/bot')}
                      className="w-full bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] py-1.5 sm:py-2 px-3 sm:px-4 rounded-md transition-colors cursor-pointer text-left text-sm sm:text-base"
                    >
                      Configuración Bot
                    </button>
                    <button
                      onClick={() => router.push('/settings/bot-flow')}
                      className="w-full bg-[#0073ba] hover:bg-[#005a92] text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded-md transition-colors cursor-pointer text-left text-sm sm:text-base"
                    >
                      Flujo del Bot
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="bg-[#0b1e34] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9]">
                {/* Header */}
                <div className="bg-[#012f78] px-4 sm:px-6 py-3 sm:py-4 border-b border-[#3ea0c9]">
                  <h2 className="text-lg sm:text-xl font-semibold text-[#B7C2D6]">Flujo del Bot</h2>
                  <p className="text-[#90e2f8] text-xs sm:text-sm">Configura el flujo de conversación de tu bot</p>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-600 text-white px-3 py-2 rounded mb-3 text-sm sm:text-base">
                      {error}
                    </div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <div className="bg-green-600 text-white px-3 py-2 rounded mb-3 text-sm sm:text-base">
                      {success}
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-600 text-white px-4 py-2 rounded mb-4">
                      {error}
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="flex border-b border-[#3ea0c9] mb-4 sm:mb-6 overflow-x-auto">
                    {['template', 'saludo', 'menu', 'formulario', 'preview'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-2 py-1.5 sm:px-3 sm:py-2 font-medium transition-colors text-xs sm:text-sm whitespace-nowrap min-w-max ${
                          activeTab === tab
                            ? 'bg-[#0073ba] text-white border-b-2 border-[#90e2f8]'
                            : 'bg-[#012f78] text-[#B7C2D6] hover:bg-[#005a92]'
                        }`}
                      >
                        {tab === 'template' && 'Plantilla'}
                        {tab === 'saludo' && 'Saludo'}
                        {tab === 'menu' && 'Menú'}
                        {tab === 'formulario' && 'Formulario'}
                        {tab === 'preview' && 'Vista Previa'}
                      </button>
                    ))}
                  </div>

                  {/* Template Selection */}
                  {activeTab === 'template' && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-[#B7C2D6]">Selecciona una plantilla</h3>
                      <p className="text-xs sm:text-sm text-[#90e2f8] mb-3 sm:mb-4">
                        Selecciona una plantilla predeterminada que se acople a las necesidades de tu negocio.
                        Cada plantilla incluye un flujo de conversación preconfigurado con opciones de menú y
                        campos de formulario adecuados para tu tipo de negocio.
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        <div
                          onClick={() => handleTemplateSelect('consultorio')}
                          className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            botSettings.template === 'consultorio'
                              ? 'border-[#90e2f8] bg-[#012f78]'
                              : 'border-[#3ea0c9] bg-[#0b1e34] hover:bg-[#012f78]'
                          }`}
                        >
                          <h4 className="text-[#B7C2D6] font-semibold text-base sm:text-lg">Consultorio</h4>
                          <p className="text-[#90e2f8] text-xs sm:text-sm">Para salud, educación y finanzas</p>
                          <p className="text-[#B7C2D6] text-xs mt-1">Ideal para clínicas, consultorios médicos, asesorías financieras y servicios educativos. Incluye opciones para agendar citas, modificar citas y información de servicios.</p>
                        </div>
                        <div
                          onClick={() => handleTemplateSelect('barberia')}
                          className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            botSettings.template === 'barberia'
                              ? 'border-[#90e2f8] bg-[#012f78]'
                              : 'border-[#3ea0c9] bg-[#0b1e34] hover:bg-[#012f78]'
                          }`}
                        >
                          <h4 className="text-[#B7C2D6] font-semibold text-base sm:text-lg">Barbería/Estética</h4>
                          <p className="text-[#90e2f8] text-xs sm:text-sm">Para belleza y cuidado personal</p>
                          <p className="text-[#B7C2D6] text-xs mt-1">Perfecta para barberías, salones de belleza, spas y servicios de estética. Incluye opciones para agendar citas de diferentes servicios como cortes, barba, tratamientos faciales, etc.</p>
                        </div>
                        <div
                          onClick={() => handleTemplateSelect('servicios')}
                          className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            botSettings.template === 'servicios'
                              ? 'border-[#90e2f8] bg-[#012f78]'
                              : 'border-[#3ea0c9] bg-[#0b1e34] hover:bg-[#012f78]'
                          }`}
                        >
                          <h4 className="text-[#B7C2D6] font-semibold text-base sm:text-lg">Servicios</h4>
                          <p className="text-[#90e2f8] text-xs sm:text-sm">Para servicios generales y negocios</p>
                          <p className="text-[#B7C2D6] text-xs mt-1">Diseñada para servicios técnicos, reparaciones, mantenimiento y negocios generales. Incluye opciones para solicitar servicios, cotizaciones y soporte técnico.</p>
                        </div>
                        <div
                          onClick={() => handleTemplateSelect('custom')}
                          className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            botSettings.template === 'custom'
                              ? 'border-[#90e2f8] bg-[#012f78]'
                              : 'border-[#3ea0c9] bg-[#0b1e34] hover:bg-[#012f78]'
                          }`}
                        >
                          <h4 className="text-[#B7C2D6] font-semibold text-base sm:text-lg">Personalizado</h4>
                          <p className="text-[#90e2f8] text-xs sm:text-sm">Configuración manual completa</p>
                          <p className="text-[#B7C2D6] text-xs mt-1">Para crear el flujo completo tú mismo. Diseña cada aspecto del bot desde cero, incluyendo menús, formularios y mensajes personalizados según tus necesidades específicas.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Greeting Editor */}
                  {activeTab === 'saludo' && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-[#B7C2D6]">Mensajes del Bot</h3>
                      <p className="text-xs sm:text-sm text-[#90e2f8] mb-3 sm:mb-4">
                        Configura los mensajes que enviará el bot en diferentes situaciones.
                        Estos mensajes se mostrarán a los usuarios durante la conversación.
                      </p>
                      
                      {/* Greeting Message */}
                      <div className="space-y-3 sm:space-y-4">
                        <h4 className="text-[#90e2f8] font-medium text-sm sm:text-base">Mensaje de Saludo</h4>
                        <p className="text-xs sm:text-sm text-[#B7C2D6] mb-1 sm:mb-2">
                          Este es el primer mensaje que recibirán los usuarios al iniciar una conversación con tu bot.
                        </p>
                        <textarea
                          value={greetingEdit}
                          onChange={(e) => setGreetingEdit(e.target.value)}
                          placeholder="Escribe el mensaje de saludo que enviará el bot"
                          className="w-full p-2 sm:p-3 bg-[#0b1e34] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none text-xs sm:text-sm"
                          rows={3}
                          maxLength={320}
                        />
                        <div className="text-xs sm:text-sm text-[#90e2f8]">
                          {greetingEdit.length}/320 caracteres
                        </div>
                        <div className="bg-[#012f78] p-3 sm:p-4 rounded border border-[#3ea0c9]">
                          <h5 className="text-[#B7C2D6] font-semibold text-sm sm:text-base mb-1 sm:mb-2">Vista previa:</h5>
                          <p className="text-[#90e2f8] text-xs sm:text-sm">{greetingEdit}</p>
                        </div>
                      </div>

                      {/* Schedule Confirmation Message */}
                      <div className="space-y-3 sm:space-y-4">
                        <h4 className="text-[#90e2f8] font-medium text-sm sm:text-base">Confirmación de Cita</h4>
                        <p className="text-xs sm:text-sm text-[#B7C2D6] mb-1 sm:mb-2">
                          Mensaje que se enviará cuando un usuario agende una cita exitosamente.
                          Usa <code className="bg-[#012f78] px-1 rounded text-xs">{"{date}"}</code> y <code className="bg-[#012f78] px-1 rounded text-xs">{"{time}"}</code> para insertar la fecha y hora automáticamente.
                        </p>
                        <textarea
                          value={scheduleConfirmationEdit}
                          onChange={(e) => setScheduleConfirmationEdit(e.target.value)}
                          placeholder="Mensaje de confirmación de cita (usa {date} y {time} para variables)"
                          className="w-full p-2 sm:p-3 bg-[#0b1e34] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none text-xs sm:text-sm"
                          rows={3}
                          maxLength={320}
                        />
                        <div className="text-xs sm:text-sm text-[#90e2f8]">
                          {scheduleConfirmationEdit.length}/320 caracteres
                        </div>
                        <div className="bg-[#012f78] p-3 sm:p-4 rounded border border-[#3ea0c9]">
                          <h5 className="text-[#B7C2D6] font-semibold text-sm sm:text-base mb-1 sm:mb-2">Vista previa:</h5>
                          <p className="text-[#90e2f8] text-xs sm:text-sm">{scheduleConfirmationEdit}</p>
                        </div>
                      </div>

                      {/* Modification Confirmation Message */}
                      <div className="space-y-3 sm:space-y-4">
                        <h4 className="text-[#90e2f8] font-medium text-sm sm:text-base">Modificación de Cita</h4>
                        <p className="text-xs sm:text-sm text-[#B7C2D6] mb-1 sm:mb-2">
                          Mensaje que se enviará cuando un usuario modifique una cita exitosamente.
                        </p>
                        <textarea
                          value={modificationConfirmationEdit}
                          onChange={(e) => setModificationConfirmationEdit(e.target.value)}
                          placeholder="Mensaje de confirmación de modificación de cita"
                          className="w-full p-2 sm:p-3 bg-[#0b1e34] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none text-xs sm:text-sm"
                          rows={3}
                          maxLength={320}
                        />
                        <div className="text-xs sm:text-sm text-[#90e2f8]">
                          {modificationConfirmationEdit.length}/320 caracteres
                        </div>
                        <div className="bg-[#012f78] p-3 sm:p-4 rounded border border-[#3ea0c9]">
                          <h5 className="text-[#B7C2D6] font-semibold text-sm sm:text-base mb-1 sm:mb-2">Vista previa:</h5>
                          <p className="text-[#90e2f8] text-xs sm:text-sm">{modificationConfirmationEdit}</p>
                        </div>
                      </div>

                      {/* Cancellation Confirmation Message */}
                      <div className="space-y-3 sm:space-y-4">
                        <h4 className="text-[#90e2f8] font-medium text-sm sm:text-base">Cancelación de Cita</h4>
                        <p className="text-xs sm:text-sm text-[#B7C2D6] mb-1 sm:mb-2">
                          Mensaje que se enviará cuando un usuario cancele una cita exitosamente.
                        </p>
                        <textarea
                          value={cancellationConfirmationEdit}
                          onChange={(e) => setCancellationConfirmationEdit(e.target.value)}
                          placeholder="Mensaje de confirmación de cancelación de cita"
                          className="w-full p-2 sm:p-3 bg-[#0b1e34] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none text-xs sm:text-sm"
                          rows={3}
                          maxLength={320}
                        />
                        <div className="text-xs sm:text-sm text-[#90e2f8]">
                          {cancellationConfirmationEdit.length}/320 caracteres
                        </div>
                        <div className="bg-[#012f78] p-3 sm:p-4 rounded border border-[#3ea0c9]">
                          <h5 className="text-[#B7C2D6] font-semibold text-sm sm:text-base mb-1 sm:mb-2">Vista previa:</h5>
                          <p className="text-[#90e2f8] text-xs sm:text-sm">{cancellationConfirmationEdit}</p>
                        </div>
                      </div>

                      {/* Order Acknowledgement Message */}
                      <div className="space-y-3 sm:space-y-4">
                        <h4 className="text-[#90e2f8] font-medium text-sm sm:text-base">Atención por Humano</h4>
                        <p className="text-xs sm:text-sm text-[#B7C2D6] mb-1 sm:mb-2">
                          Mensaje que se enviará cuando el usuario sea transferido a un agente humano para atención personalizada.
                        </p>
                        <textarea
                          value={orderAcknowledgementEdit}
                          onChange={(e) => setOrderAcknowledgementEdit(e.target.value)}
                          placeholder="Mensaje cuando el usuario será atendido por un humano"
                          className="w-full p-2 sm:p-3 bg-[#0b1e34] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none text-xs sm:text-sm"
                          rows={3}
                          maxLength={320}
                        />
                        <div className="text-xs sm:text-sm text-[#90e2f8]">
                          {orderAcknowledgementEdit.length}/320 caracteres
                        </div>
                        <div className="bg-[#012f78] p-3 sm:p-4 rounded border border-[#3ea0c9]">
                          <h5 className="text-[#B7C2D6] font-semibold text-sm sm:text-base mb-1 sm:mb-2">Vista previa:</h5>
                          <p className="text-[#90e2f8] text-xs sm:text-sm">{orderAcknowledgementEdit}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Menu Editor */}
                  {activeTab === 'menu' && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-semibold text-[#B7C2D6]">Opciones de Menú</h3>
                        <button
                          onClick={addMenuItem}
                          disabled={menuItemsEdit.length >= 5}
                          className="bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] px-2 py-1 sm:px-3 sm:py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                        >
                          + Añadir Opción
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-[#90e2f8]">Máximo 5 opciones de menú</p>
                      <p className="text-xs sm:text-sm text-[#B7C2D6]">
                        Configura las opciones que aparecerán en el menú principal del bot.
                        Cada opción puede tener diferentes tipos de contenido que se mostrarán al usuario.
                      </p>
                      <p className="text-xs sm:text-sm text-[#B7C2D6]">
                        Tipos de opciones disponibles:
                      </p>
                      <ul className="text-xs sm:text-sm text-[#B7C2D6] list-disc list-inside space-y-1">
                        <li><strong>Acción</strong>: Ejecuta una acción específica (como agendar citas)</li>
                        <li><strong>Tabla</strong>: Muestra información en formato de tabla</li>
                        <li><strong>Lista</strong>: Presenta opciones en formato de lista numerada</li>
                        <li><strong>Ubicación</strong>: Muestra la dirección del negocio</li>
                        <li><strong>Transferencia</strong>: Transfiere la conversación a un agente humano</li>
                      </ul>
                      <p className="text-xs sm:text-sm text-[#90e2f8]">
                        Las opciones marcadas como &quot;Fijo&quot; no pueden ser modificadas o eliminadas ya que son esenciales para el funcionamiento del bot.
                      </p>
                      
                      {menuItemsEdit.length === 0 ? (
                        <p className="text-[#B7C2D6] text-xs sm:text-sm">No hay opciones de menú configuradas.</p>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {menuItemsEdit.map((item, index) => (
                            <div key={item.id} className="bg-[#0b1e34] p-3 sm:p-4 rounded border border-[#3ea0c9]">
                              <div className="flex justify-between items-start mb-2 sm:mb-3">
                                <div>
                                  <span className="text-[#90e2f8] text-xs sm:text-sm">Opción {index + 1}</span>
                                  {item.fixed && <span className="ml-2 text-green-400 text-xs sm:text-sm">Fijo</span>}
                                </div>
                                {!item.fixed && (
                                  <button
                                    onClick={() => removeMenuItem(item.id)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={item.label}
                                  onChange={(e) => updateMenuItem(item.id, 'label', e.target.value)}
                                  placeholder="Etiqueta de la opción, máximo 24 caracteres"
                                  className="w-full p-1.5 sm:p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                                  disabled={isItemFixed(item)}
                                  maxLength={24}
                                />
                                <div className="flex justify-between items-center mt-1">
                                  <div className="text-xs text-[#90e2f8]">
                                    {item.label?.length || 0}/24 caracteres
                                  </div>
                                  {menuItemErrors[item.id] && (
                                    <div className="text-red-400 text-xs">
                                      {menuItemErrors[item.id]}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Selector de tipo - Ahora justo debajo del nombre de la opción */}
                                <select
                                  value={item.type}
                                  onChange={(e) => updateMenuItem(item.id, 'type', e.target.value)}
                                  className="w-full p-1.5 sm:p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                                  disabled={isItemFixed(item)}
                                >
                                  <option value="action">Acción</option>
                                  <option value="table">Tabla</option>
                                  <option value="list">Lista</option>
                                  <option value="location">Ubicación</option>
                                  <option value="handoff">Transferencia</option>
                                </select>

                                {item.type === 'action' && (
                                  <div className="space-y-2 mt-2">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={item.actionKey === 'schedule'}
                                        onChange={(e) => updateMenuItem(item.id, 'actionKey', e.target.checked ? 'schedule' : undefined)}
                                        className="rounded"
                                        disabled={isItemFixed(item)}
                                      />
                                      <span className="text-[#B7C2D6] text-xs sm:text-sm">Usar para agendamiento</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={item.actionKey === 'modify'}
                                        onChange={(e) => updateMenuItem(item.id, 'actionKey', e.target.checked ? 'modify' : undefined)}
                                        className="rounded"
                                        disabled={isItemFixed(item)}
                                      />
                                      <span className="text-[#B7C2D6] text-xs sm:text-sm">Usar para modificar o cancelar agendamiento</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Controles específicos por tipo */}
                                {item.type === 'table' && (
                                  <div className="space-y-2">
                                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                      <button
                                        onClick={() => handleTableChange(item.id, 'addColumn')}
                                        className="bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] px-2 py-1 rounded text-xs sm:text-sm"
                                        disabled={(item.meta?.table?.columns?.length || 0) >= 4}
                                      >
                                        + Columna ({(item.meta?.table?.columns?.length || 0)}/4)
                                      </button>
                                      <button
                                        onClick={() => handleTableChange(item.id, 'addRow')}
                                        className="bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] px-2 py-1 rounded text-xs sm:text-sm"
                                        disabled={(item.meta?.table?.rows?.length || 0) >= 10}
                                      >
                                        + Fila ({(item.meta?.table?.rows?.length || 0)}/10)
                                      </button>
                                    </div>
                                    <p className="text-xs sm:text-sm text-[#90e2f8]">Mínimo 2 columnas, máximo 4</p>
                                    <p className="text-xs sm:text-sm text-[#90e2f8] mb-2">Mínimo 1 fila, máximo 10</p>
                                    
                                    {/* Encabezados de tabla con botones de eliminar */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
                                      {(item.meta?.table?.columns || []).map((col, colIndex) => (
                                        <div key={colIndex} className="flex gap-1 items-center">
                                          <input
                                            type="text"
                                            value={col}
                                            onChange={(e) => handleTableChange(item.id, 'updateColumn', colIndex, e.target.value)}
                                            placeholder={`Columna ${colIndex + 1}`}
                                            className="flex-1 p-1 bg-[#0b1e34] border border-[#3ea0c9] rounded text-[#B7C2D6] text-xs sm:text-sm"
                                          />
                                          <button
                                            onClick={() => handleTableChange(item.id, 'removeColumn', colIndex)}
                                            className="text-red-400 hover:text-red-300 text-xs sm:text-sm"
                                            disabled={(item.meta?.table?.columns?.length || 0) <= 2}
                                            title="Eliminar columna"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* Filas de tabla con botones de eliminar */}
                                    <div className="space-y-1">
                                      {item.meta?.table?.rows?.map((row, rowIndex) => (
                                        <div key={rowIndex} className="flex flex-col sm:flex-row gap-2 items-center">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
                                            {row.map((cell, cellIndex) => (
                                              <input
                                                key={cellIndex}
                                                type="text"
                                                value={cell}
                                                onChange={(e) => handleTableChange(item.id, 'updateCell', rowIndex, e.target.value, cellIndex)}
                                                placeholder={`Fila ${rowIndex + 1}, Col ${cellIndex + 1}`}
                                                className="p-1 bg-[#0b1e34] border border-[#3ea0c9] rounded text-[#B7C2D6] text-xs sm:text-sm"
                                              />
                                            ))}
                                          </div>
                                          <button
                                            onClick={() => handleTableChange(item.id, 'removeRow', rowIndex)}
                                            className="text-red-400 hover:text-red-300 text-xs sm:text-sm"
                                            disabled={(item.meta?.table?.rows?.length || 0) <= 1}
                                            title="Eliminar fila"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {item.type === 'list' && (
                                  <div className="space-y-2">
                                    {item.meta?.list?.options?.map((option, index) => (
                                      <div key={index} className="flex gap-2">
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) => handleListChange(item.id, index, e.target.value)}
                                          placeholder={`Opción ${index + 1}`}
                                          className="flex-1 p-1 bg-[#0b1e34] border border-[#3ea0c9] rounded text-[#B7C2D6] text-xs sm:text-sm"
                                        />
                                        <button
                                          onClick={() => handleListChange(item.id, index)}
                                          className="text-red-400 hover:text-red-300 disabled:text-gray-500 text-xs sm:text-sm"
                                          disabled={(item.meta?.list?.options?.length || 0) <= 2}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                    <p className="text-xs sm:text-sm text-[#90e2f8]">Mínimo 2 opciones requeridas</p>
                                    <button
                                      onClick={() => handleListChange(item.id, -1)}
                                      className="bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] px-2 py-1 rounded text-xs sm:text-sm"
                                    >
                                      + Añadir opción
                                    </button>
                                  </div>
                                )}

                                {item.type === 'location' && (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={user?.address || ''}
                                      readOnly
                                      className="w-full p-1 bg-[#0b1e34] border border-[#3ea0c9] rounded text-[#B7C2D6] text-xs sm:text-sm cursor-not-allowed"
                                    />
                                    <p className="text-xs sm:text-sm text-[#90e2f8]">
                                      Actualiza tu dirección en {' '}
                                      <button
                                        onClick={() => router.push('/settings')}
                                        className="text-[#90e2f8] hover:text-[#3ea0c9] underline text-xs sm:text-sm"
                                      >
                                        Configuración del perfil
                                      </button>
                                    </p>
                                  </div>
                                )}
                                <select
                                  value={item.type}
                                  onChange={(e) => updateMenuItem(item.id, 'type', e.target.value)}
                                  className="w-full p-1.5 sm:p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                                  disabled={isItemFixed(item)}
                                >
                                  <option value="action">Acción</option>
                                  <option value="table">Tabla</option>
                                  <option value="list">Lista</option>
                                  <option value="location">Ubicación</option>
                                  <option value="handoff">Transferencia</option>
                                </select>
                                {/* Interfaz para servicios de agendamiento cuando el tipo es Acción */}
                                {item.type === 'action' && item.actionKey === 'schedule' && (
                                  <div className="space-y-2 sm:space-y-3 mt-2 sm:mt-3 p-2 sm:p-3 bg-[#012f78] rounded border border-[#3ea0c9]">
                                    <h4 className="text-[#90e2f8] font-semibold text-sm sm:text-base">Servicios de Agendamiento</h4>
                                    <p className="text-xs sm:text-sm text-[#B7C2D6]">
                                      Configura los servicios que se pueden agendar.
                                      Si solo defines un servicio, el usuario no verá una lista de selección.
                                      Si defines múltiples servicios, el usuario podrá elegir entre ellos.
                                    </p>
                                    <p className="text-xs sm:text-sm text-[#B7C2D6]">
                                      <strong>Tipos de servicio comunes:</strong>
                                    </p>
                                    <ul className="text-xs sm:text-sm text-[#B7C2D6] list-disc list-inside space-y-1">
                                      <li>Barbería: &quot;Corte caballero&quot;, &quot;Barba y bigote&quot;, &quot;Paquete completo&quot;</li>
                                      <li>Consultorio: &quot;Cita básica&quot;, &quot;Apertura de expediente&quot;, &quot;Consulta especializada&quot;</li>
                                      <li>Servicios generales: &quot;Mantenimiento&quot;, &quot;Reparación&quot;, &quot;Instalación&quot;</li>
                                    </ul>
                                    
                                    {getScheduleServices().length === 0 ? (
                                      <p className="text-[#B7C2D6] text-xs sm:text-sm">No hay servicios configurados.</p>
                                    ) : (
                                      getScheduleServices().map((service, serviceIndex) => (
                                        <div key={serviceIndex} className="space-y-2 p-2 bg-[#0b1e34] rounded relative">
                                          <button
                                            onClick={() => removeSchedulingService(serviceIndex)}
                                            className="absolute top-1 right-1 sm:top-2 sm:right-2 text-red-400 hover:text-red-300 text-sm"
                                            disabled={getScheduleServices().length <= 1}
                                            title="Eliminar servicio"
                                          >
                                            ×
                                          </button>
                                          
                                          <div className="space-y-2">
                                            <input
                                              type="text"
                                              value={service.serviceType}
                                              onChange={(e) => updateSchedulingService(serviceIndex, 'serviceType', e.target.value)}
                                              placeholder="Tipo de servicio, máximo 24 caracteres (ej: Corte caballero)"
                                              className="w-full p-1.5 sm:p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#B7C2D6] text-xs sm:text-sm"
                                              maxLength={24}
                                            />
                                            <div className="flex justify-between items-center mt-1">
                                              <div className="text-xs text-[#90e2f8]">
                                                {service.serviceType?.length || 0}/24 caracteres
                                              </div>
                                              {serviceErrors[serviceIndex] && (
                                                <div className="text-red-400 text-xs">
                                                  {serviceErrors[serviceIndex]}
                                                </div>
                                              )}
                                            </div>
                                            
                                            <input
                                              type="text"
                                              value={service.price || ''}
                                              onChange={(e) => updateSchedulingService(serviceIndex, 'price', e.target.value)}
                                              placeholder="Precio (ej: $150)"
                                              className="w-full p-1.5 sm:p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#B7C2D6] text-xs sm:text-sm"
                                            />
                                            
                                            <div className="space-y-1">
                                              <label className="text-[#90e2f8] text-xs sm:text-sm">Recomendaciones:</label>
                                              {(service.recommendations || []).map((recommendation, recIndex) => (
                                                <div key={recIndex} className="flex gap-2 items-center">
                                                  <input
                                                    type="text"
                                                    value={recommendation}
                                                    onChange={(e) => updateRecommendation(serviceIndex, recIndex, e.target.value)}
                                                    placeholder="Recomendación (ej: Llegar 15 minutos antes)"
                                                    className="flex-1 p-1 bg-[#012f78] border border-[#3ea0c9] rounded text-[#B7C2D6] text-xs sm:text-sm"
                                                  />
                                                  <button
                                                    onClick={() => removeRecommendation(serviceIndex, recIndex)}
                                                    className="text-red-400 hover:text-red-300 text-xs sm:text-sm"
                                                    disabled={(service.recommendations || []).length <= 1}
                                                    title="Eliminar recomendación"
                                                  >
                                                    ×
                                                  </button>
                                                </div>
                                              ))}
                                              <button
                                                onClick={() => addRecommendation(serviceIndex)}
                                                className="bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] px-2 py-1 rounded text-xs sm:text-sm"
                                              >
                                                + Añadir recomendación
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                    
                                    <button
                                      onClick={addSchedulingService}
                                      className="bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] px-2 py-1 rounded text-xs sm:text-sm"
                                    >
                                      + Agregar servicio
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Editor */}
                  {activeTab === 'formulario' && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-semibold text-[#B7C2D6]">Campos del Formulario</h3>
                        <button
                          onClick={addFormField}
                          disabled={formFieldsEdit.length >= 6}
                          className="bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] px-2 py-1 sm:px-3 sm:py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                        >
                          + Añadir Campo
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-[#90e2f8]">Máximo 6 campos de formulario</p>
                      <p className="text-xs sm:text-sm text-[#B7C2D6]">
                        Configura los campos que aparecerán en los formularios que completarán los usuarios.
                        Los campos se generan automáticamente con keys basadas en su tipo y etiqueta.
                      </p>
                      <p className="text-xs sm:text-sm text-[#B7C2D6]">
                        Tipos de campos disponibles:
                      </p>
                      <ul className="text-xs sm:text-sm text-[#B7C2D6] list-disc list-inside space-y-1">
                        <li><strong>Texto</strong>: Para nombres, descripciones y texto libre</li>
                        <li><strong>Teléfono</strong>: Optimizado para números telefónicos</li>
                        <li><strong>Email</strong>: Validación automática de correos electrónicos</li>
                        <li><strong>Fecha</strong>: Selector de fechas con formato adecuado</li>
                        <li><strong>Selección</strong>: Lista desplegable de opciones</li>
                        <li><strong>Texto Largo</strong>: Para mensajes extensos o comentarios</li>
                      </ul>
                      <p className="text-xs sm:text-sm text-[#90e2f8]">
                        <strong>Nota sobre "Necesario para modificar":</strong> Solo un campo puede estar marcado como "Necesario para modificar".
                        Este campo se utilizará para identificar al usuario cuando quiera modificar o cancelar una cita.
                      </p>
                      
                      {formFieldsEdit.length === 0 ? (
                        <p className="text-[#B7C2D6] text-xs sm:text-sm">No hay campos de formulario configurados.</p>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {formFieldsEdit.map((field, index) => (
                            <div key={field.key} className="bg-[#0b1e34] p-3 sm:p-4 rounded border border-[#3ea0c9]">
                              <div className="flex justify-between items-start mb-2 sm:mb-3">
                                <span className="text-[#90e2f8] text-xs sm:text-sm">Campo {index + 1}</span>
                                <button
                                  onClick={() => removeFormField(field.key)}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  ×
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
                                <select
                                  value={field.type}
                                  onChange={(e) => updateFormField(field.key, 'type', e.target.value)}
                                  className="p-1.5 sm:p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none text-xs sm:text-sm"
                                >
                                  <option value="text">Texto</option>
                                  <option value="tel">Teléfono</option>
                                  <option value="email">Email</option>
                                  <option value="date">Fecha de nacimiento</option>
                                  <option value="select">Selección</option>
                                  <option value="textarea">Texto Largo</option>
                                </select>
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateFormField(field.key, 'required', e.target.checked)}
                                    className="mr-2"
                                  />
                                  <span className="text-[#B7C2D6] text-xs sm:text-sm">Requerido</span>
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={field.toModified}
                                    onChange={(e) => updateFormField(field.key, 'toModified', e.target.checked)}
                                    className="mr-2"
                                  />
                                  <span className="text-[#B7C2D6] text-xs sm:text-sm">Necesario para modificar</span>
                                </div>
                              </div>
                              <div className="space-y-2 mt-2 sm:mt-3">
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => updateFormField(field.key, 'label', e.target.value)}
                                  placeholder="Etiqueta del campo, máximo 40 caracteres"
                                  className="w-full p-1.5 sm:p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none text-xs sm:text-sm"
                                  maxLength={40}
                                />
                                <div className="flex justify-between items-center mt-1">
                                  <div className="text-xs text-[#90e2f8]">
                                    {field.label?.length || 0}/40 caracteres
                                  </div>
                                  {formFieldErrors[field.key] && (
                                    <div className="text-red-400 text-xs">
                                      {formFieldErrors[field.key]}
                                    </div>
                                  )}
                                </div>
                                <div className="w-full p-1.5 sm:p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#90e2f8] text-xs sm:text-sm">
                                  Key: {field.key}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preview */}
                  {activeTab === 'preview' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-[#B7C2D6]">Vista Previa del Bot</h3>
                      <p className="text-sm text-[#B7C2D6]">
                        Esta es una simulación de cómo se verá tu bot en WhatsApp. La vista previa muestra:
                      </p>
                      <ul className="text-sm text-[#B7C2D6] list-disc list-inside space-y-1 mb-4">
                        <li>El mensaje de saludo inicial</li>
                        <li>Las opciones del menú como botones de respuesta rápida</li>
                        <li>Previsualizaciones de tablas, listas y ubicaciones</li>
                        <li>Formularios con los campos configurados</li>
                        <li>Confirmaciones de citas y otros mensajes</li>
                      </ul>
                      <p className="text-sm text-[#90e2f8]">
                        Nota: Esta es solo una simulación visual. El comportamiento real puede variar ligeramente en WhatsApp.
                      </p>
                      
                      {/* WhatsApp Chat Simulation */}
                      <div className="bg-[#111b21] rounded-lg border border-[#3ea0c9] p-4 max-w-md mx-auto">
                        {/* WhatsApp Header */}
                        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[#3a4046]">
                          <div className="w-12 h-12 bg-[#25d366] rounded-full flex items-center justify-center">
                            <span className="text-white text-xl">🤖</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">{user.businessName}</h4>
                            <p className="text-[#8696a0] text-sm">Bot de WhatsApp • En línea</p>
                          </div>
                          <div className="text-[#8696a0]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 20.664a9.163 9.163 0 0 1-6.521-2.702.977.977 0 0 1 0-1.381.977.977 0 0 1 1.381 0 7.269 7.269 0 0 0 10.28 0 .977.977 0 0 1 1.381 0 .977.977 0 0 1 0 1.381A9.163 9.163 0 0 1 12 20.664zm7.965-6.112a.977.977 0 0 1-.69-1.67 5.689 5.689 0 0 0 0-8.055.977.977 0 0 1 0-1.382.977.977 0 0 1 1.381 0 7.644 7.644 0 0 1 0 10.82.977.977 0 0 1-.691.287zm-15.93 0a.977.977 0 0 1-.691-.287 7.644 7.644 0 0 1 0-10.82.977.977 0 0 1 1.381 0 .977.977 0 0 1 0 1.382 5.689 5.689 0 0 0 0 8.055.977.977 0 0 1 0 1.381.977.977 0 0 1-.69.287z"/>
                            </svg>
                          </div>
                        </div>

                        {/* Chat Messages Container */}
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {/* Greeting Message */}
                          <div className="flex justify-start">
                            <div className="bg-[#202c33] rounded-lg p-3 max-w-xs">
                              <p className="text-white text-sm">{greetingEdit}</p>
                              <p className="text-[#8696a0] text-xs mt-1 text-right">12:00 PM</p>
                            </div>
                          </div>

                          {/* Menu Options as Quick Reply Buttons */}
                          {menuItemsEdit.length > 0 && (
                            <div className="flex justify-start">
                              <div className="bg-[#202c33] rounded-lg p-3 max-w-xs">
                                <p className="text-white text-sm mb-2">Selecciona una opción:</p>
                                <div className="space-y-2">
                                  {menuItemsEdit.map((item) => (
                                    <div key={item.id} className="bg-[#2a3942] rounded p-2 cursor-pointer hover:bg-[#34444d] transition-colors">
                                      <p className="text-white text-sm font-medium">📌 {item.label}</p>
                                      {item.type !== 'action' && (
                                        <p className="text-[#8696a0] text-xs">({item.type})</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <p className="text-[#8696a0] text-xs mt-2 text-right">12:00 PM</p>
                              </div>
                            </div>
                          )}

                          {/* Preview of different content types */}
                          {menuItemsEdit.map((item) => {
                            if (item.type === 'table' && item.meta?.table) {
                              return (
                                <div key={item.id} className="flex justify-start">
                                  <div className="bg-[#202c33] rounded-lg p-3 max-w-xs">
                                    <p className="text-white text-sm font-medium mb-2">{item.label}</p>
                                    <div className="bg-[#2a3942] rounded p-2">
                                      <table className="w-full text-white text-xs">
                                        <thead>
                                          <tr className="border-b border-[#3a4046]">
                                            {item.meta.table.columns.map((col, index) => (
                                              <th key={index} className="text-left p-1 font-medium">{col}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {item.meta.table.rows.slice(0, 3).map((row, rowIndex) => (
                                            <tr key={rowIndex} className="border-b border-[#3a4046] last:border-b-0">
                                              {row.map((cell, cellIndex) => (
                                                <td key={cellIndex} className="p-1 text-[#8696a0]">{cell}</td>
                                              ))}
                                            </tr>
                                          ))}
                                          {item.meta.table.rows.length > 3 && (
                                            <tr>
                                              <td colSpan={item.meta.table.columns.length} className="p-1 text-[#8696a0] text-center">
                                                +{item.meta.table.rows.length - 3} más...
                                              </td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                    <p className="text-[#8696a0] text-xs mt-2 text-right">12:00 PM</p>
                                  </div>
                                </div>
                              );
                            }

                            if (item.type === 'list' && item.meta?.list) {
                              return (
                                <div key={item.id} className="flex justify-start">
                                  <div className="bg-[#202c33] rounded-lg p-3 max-w-xs">
                                    <p className="text-white text-sm font-medium mb-2">{item.label}</p>
                                    <div className="space-y-1">
                                      {item.meta.list.options.slice(0, 5).map((option, index) => (
                                        <div key={index} className="bg-[#2a3942] rounded p-2 cursor-pointer hover:bg-[#34444d] transition-colors">
                                          <p className="text-white text-sm">{(index + 1)}. {option}</p>
                                        </div>
                                      ))}
                                      {item.meta.list.options.length > 5 && (
                                        <p className="text-[#8696a0] text-xs text-center">
                                          +{item.meta.list.options.length - 5} opciones más...
                                        </p>
                                      )}
                                    </div>
                                    <p className="text-[#8696a0] text-xs mt-2 text-right">12:00 PM</p>
                                  </div>
                                </div>
                              );
                            }

                            if (item.type === 'location' && item.meta?.location) {
                              return (
                                <div key={item.id} className="flex justify-start">
                                  <div className="bg-[#202c33] rounded-lg p-3 max-w-xs">
                                    <p className="text-white text-sm font-medium mb-2">{item.label}</p>
                                    <div className="bg-[#2a3942] rounded p-2">
                                      <div className="flex items-start space-x-2">
                                        <span className="text-red-500">📍</span>
                                        <div>
                                          <p className="text-white text-sm">{item.meta.location.address}</p>
                                          <p className="text-[#8696a0] text-xs">Abrir en Google Maps</p>
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-[#8696a0] text-xs mt-2 text-right">12:00 PM</p>
                                  </div>
                                </div>
                              );
                            }

                            if (item.type === 'action' && item.actionKey === 'schedule' && item.meta?.services) {
                              const services = item.meta.services;
                              return (
                                <div key={item.id} className="flex justify-start">
                                  <div className="bg-[#202c33] rounded-lg p-3 max-w-xs">
                                    <p className="text-white text-sm font-medium mb-2">{item.label}</p>
                                    {services.length === 1 ? (
                                      <div className="bg-[#2a3942] rounded p-3">
                                        <p className="text-white text-sm font-medium">{services[0].serviceType}</p>
                                        {services[0].price && (
                                          <p className="text-green-400 text-sm">Precio: {services[0].price}</p>
                                        )}
                                        {services[0].recommendations && services[0].recommendations.length > 0 && (
                                          <div className="mt-2">
                                            <p className="text-[#8696a0] text-xs font-medium">Recomendaciones:</p>
                                            {services[0].recommendations.map((rec, recIndex) => (
                                              <p key={recIndex} className="text-[#8696a0] text-xs">• {rec}</p>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <p className="text-white text-sm">Selecciona un servicio:</p>
                                        {services.slice(0, 3).map((service, serviceIndex) => (
                                          <div key={serviceIndex} className="bg-[#2a3942] rounded p-2 cursor-pointer hover:bg-[#34444d] transition-colors">
                                            <p className="text-white text-sm font-medium">{service.serviceType}</p>
                                            {service.price && (
                                              <p className="text-green-400 text-xs">Precio: {service.price}</p>
                                            )}
                                          </div>
                                        ))}
                                        {services.length > 3 && (
                                          <p className="text-[#8696a0] text-xs text-center">
                                            +{services.length - 3} servicios más...
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    <p className="text-[#8696a0] text-xs mt-2 text-right">12:00 PM</p>
                                  </div>
                                </div>
                              );
                            }

                            return null;
                          })}

                          {/* Form Preview */}
                          {formFieldsEdit.length > 0 && (
                            <div className="flex justify-start">
                              <div className="bg-[#202c33] rounded-lg p-3 max-w-xs">
                                <p className="text-white text-sm font-medium mb-2">Por favor completa la información:</p>
                                <div className="space-y-3">
                                  {formFieldsEdit.map((field) => (
                                    <div key={field.key} className="bg-[#2a3942] rounded p-2">
                                      <label className="block text-white text-sm mb-1">
                                        {field.label} {field.required && <span className="text-red-400">*</span>}
                                      </label>
                                      {field.type === 'textarea' ? (
                                        <textarea
                                          placeholder={`Ingrese ${field.label.toLowerCase()}`}
                                          className="w-full p-2 bg-[#111b21] border border-[#3a4046] rounded text-white text-sm focus:outline-none focus:border-[#25d366]"
                                          rows={2}
                                        />
                                      ) : field.type === 'select' ? (
                                        <select className="w-full p-2 bg-[#111b21] border border-[#3a4046] rounded text-white text-sm focus:outline-none focus:border-[#25d366]">
                                          <option>Seleccione una opción</option>
                                          <option>Opción 1</option>
                                          <option>Opción 2</option>
                                        </select>
                                      ) : (
                                        <input
                                          type={field.type}
                                          placeholder={`Ingrese ${field.label.toLowerCase()}`}
                                          className="w-full p-2 bg-[#111b21] border border-[#3a4046] rounded text-white text-sm focus:outline-none focus:border-[#25d366]"
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 flex justify-end">
                                  <button className="bg-[#25d366] text-white px-4 py-1 rounded text-sm hover:bg-[#20bd5a] transition-colors">
                                    Enviar
                                  </button>
                                </div>
                                <p className="text-[#8696a0] text-xs mt-2 text-right">12:00 PM</p>
                              </div>
                            </div>
                          )}

                          {/* User message example */}
                          <div className="flex justify-end">
                            <div className="bg-[#005c4b] rounded-lg p-3 max-w-xs">
                              <p className="text-white text-sm">Hola, me interesa agendar una cita</p>
                              <p className="text-[#8696a0] text-xs mt-1 text-right">12:01 PM</p>
                            </div>
                          </div>

                          {/* Confirmation message */}
                          <div className="flex justify-start">
                            <div className="bg-[#202c33] rounded-lg p-3 max-w-xs">
                              <p className="text-white text-sm">¡Perfecto! Tu cita ha sido confirmada.</p>
                              <p className="text-[#8696a0] text-xs mt-2 text-right">12:02 PM</p>
                            </div>
                          </div>
                        </div>

                        {/* Input area */}
                        <div className="mt-4 flex items-center space-x-2 pt-3 border-t border-[#3a4046]">
                          <div className="flex-1 bg-[#2a3942] rounded-full p-2">
                            <input
                              type="text"
                              placeholder="Escribe un mensaje..."
                              className="w-full bg-transparent text-white text-sm outline-none px-2"
                            />
                          </div>
                          <button className="bg-[#25d366] p-2 rounded-full">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Configuration Summary */}
                      <div className="bg-[#0b1e34] rounded-lg border border-[#3ea0c9] p-4">
                        <h4 className="text-[#B7C2D6] font-semibold mb-3">Resumen de Configuración</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-[#90e2f8] text-sm font-medium mb-2">Opciones del Menú</h5>
                            <div className="space-y-1">
                              {menuItemsEdit.map((item, index) => (
                                <div key={item.id} className="text-[#B7C2D6] text-sm">
                                  <span className="font-medium">{index + 1}. {item.label}</span>
                                  <span className="text-[#90e2f8] ml-2">({item.type})</span>
                                  {item.meta && Object.keys(item.meta).length > 0 && (
                                    <span className="text-green-400 ml-2">✓ Configurado</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="text-[#90e2f8] text-sm font-medium mb-2">Campos del Formulario</h5>
                            <div className="space-y-1">
                              {formFieldsEdit.map((field, index) => (
                                <div key={field.key} className="text-[#B7C2D6] text-sm">
                                  <span className="font-medium">{index + 1}. {field.label}</span>
                                  <span className="text-[#90e2f8] ml-2">({field.type})</span>
                                  {field.required && (
                                    <span className="text-red-400 ml-2">Requerido</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Services Summary */}
                        {getScheduleServices().length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-[#90e2f8] text-sm font-medium mb-2">Servicios de Agendamiento</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {getScheduleServices().map((service, index) => (
                                <div key={index} className="bg-[#012f78] p-2 rounded text-sm">
                                  <p className="text-[#B7C2D6] font-medium">{service.serviceType}</p>
                                  {service.price && (
                                    <p className="text-green-400">Precio: {service.price}</p>
                                  )}
                                  {service.recommendations && service.recommendations.length > 0 && (
                                    <p className="text-[#90e2f8] text-xs">
                                      {service.recommendations.length} recomendación(es)
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="mt-6 sm:mt-8 flex justify-end">
                    <button
                      onClick={saveBotSettings}
                      disabled={saving}
                      className="bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] px-4 py-1.5 sm:px-6 sm:py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import type { TabKey } from '@/components/dashboard/NavTabs';

export interface TourStep {
  id: string;
  tab: TabKey;
  adminSection?: 'operadores' | 'campos' | 'alertas';
  target: string | null;
  title: string;
  description: string;
  adminOnly?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'intro',
    tab: 'registrar',
    target: null,
    title: 'Bienvenido a Control de Estacionamiento',
    description:
      'Este es un recorrido rápido por las funciones del sistema. Podés volver a abrirlo cuando quieras desde el botón de ayuda en la barra superior.',
  },
  {
    id: 'registrar',
    tab: 'registrar',
    target: '[data-tour="registrar-form"]',
    title: 'Registrar entrada',
    description:
      'Completá la placa y el tipo de vehículo para registrar un ingreso. Los campos marcados "(opcional)" no son obligatorios. Al confirmar, el vehículo pasa a la lista de "Dentro".',
  },
  {
    id: 'registrar-frecuentes',
    tab: 'registrar',
    target: '[data-tour="registrar-frecuentes"]',
    title: '¿Es un vehículo frecuente?',
    description:
      'Buscá por placa o nombre para traer los datos de una visita anterior y registrar la entrada en un toque, sin volver a tipear todo.',
  },
  {
    id: 'dentro-buscar',
    tab: 'dentro',
    target: '[data-tour="dentro-buscar"]',
    title: 'Buscar un vehículo dentro',
    description: 'Escribí la placa para encontrar rápido un vehículo entre todos los que están dentro del estacionamiento.',
  },
  {
    id: 'dentro-salida',
    tab: 'dentro',
    target: '[data-tour="dentro-salida"]',
    title: 'Registrar salida',
    description:
      'Cada tarjeta muestra hace cuánto entró el vehículo. Si pasó el tiempo límite configurado en Admin se marca "Atención". Tocá "Registrar salida" para confirmar el egreso.',
  },
  {
    id: 'frecuentes-lista',
    tab: 'frecuentes',
    target: '[data-tour="frecuentes-lista"]',
    title: 'Vehículos frecuentes',
    description:
      'Una patente aparece acá a partir de su segunda visita. Tocá una tarjeta para ver su historial de movimientos o editar sus datos.',
  },
  {
    id: 'historial-filtros',
    tab: 'historial',
    target: '[data-tour="historial-filtros"]',
    title: 'Filtrar el historial',
    description:
      'Buscá por placa o tipo de vehículo, o abrí "Filtros" para acotar por rango de fechas y horario del día.',
  },
  {
    id: 'historial-lista',
    tab: 'historial',
    target: '[data-tour="historial-lista"]',
    title: 'Historial de registros',
    description:
      'Los registros se agrupan por día. Si hay muchos, tocá "Cargar más" para ir viendo el resto sin sobrecargar la pantalla.',
  },
  {
    id: 'historial-pdf',
    tab: 'historial',
    target: '[data-tour="historial-pdf"]',
    title: 'Exportar a PDF',
    description: 'Descargá el historial de un día puntual como PDF, listo para imprimir o compartir.',
  },
  {
    id: 'estadisticas',
    tab: 'estadisticas',
    target: '[data-tour="estadisticas-filtros"]',
    title: 'Estadísticas',
    description:
      'Actividad, ocupación y tendencias del estacionamiento con gráficos animados. Filtrá por rango de fechas, tipo de vehículo u operador — todos los gráficos se actualizan juntos.',
  },
  {
    id: 'usuarios',
    tab: 'usuarios',
    target: '[data-tour="usuarios-list"]',
    title: 'Usuarios',
    description: 'Acá ves a todos los operadores del sistema y si están en turno o no en este momento.',
  },
  {
    id: 'admin-operadores',
    tab: 'admin',
    adminSection: 'operadores',
    target: '[data-tour="admin-operadores"]',
    title: 'Administrar operadores',
    description: 'Como administrador podés crear, editar o eliminar operadores desde acá.',
    adminOnly: true,
  },
  {
    id: 'admin-campos',
    tab: 'admin',
    adminSection: 'campos',
    target: '[data-tour="admin-campos"]',
    title: 'Campos del formulario',
    description:
      'Agregá campos personalizados al formulario de registro, o arrastrá cualquier campo para cambiar su orden. Los campos fijos (placa, tipo) no se pueden eliminar.',
    adminOnly: true,
  },
  {
    id: 'admin-alertas',
    tab: 'admin',
    adminSection: 'alertas',
    target: '[data-tour="admin-alertas"]',
    title: 'Alerta de tiempo dentro',
    description:
      'Configurá cuántos minutos puede estar un vehículo dentro antes de marcarse "Atención" en la pestaña Dentro. Se aplica para todos los operadores.',
    adminOnly: true,
  },
];

// Playmaker — sección semanal de perfiles (A6, sale el jueves 5 nov 2026).
//
// Nombre, logotipo, patrocinio y marco viven aquí: el nombre final de la
// sección todavía puede cambiar, y cambiarlo debe ser editar este archivo, no
// buscar el texto en cinco componentes. La ruta (/playmaker) es lo único que
// no cambia con el nombre; si cambiara, se agrega una redirección en
// next.config.ts.

export const PLAYMAKER = {
  /** Nombre visible de la sección. */
  name: 'Playmaker',
  /** Bajada de la portada de sección. */
  tagline: 'Cada jueves, una persona que mueve el negocio del deporte en México y Latinoamérica.',
  path: '/playmaker',
  /**
   * Logotipo de la sección (SVG o PNG en /public). null = el nombre en
   * tipografía de la casa, que es lo que se ve hasta que llegue el archivo.
   */
  logo: null as string | null,

  sponsor: {
    name: 'Range Rover',
    label: 'Presentado por',
    /**
     * Logotipo del patrocinador en /public. Se muestra SIEMPRE en monocromo
     * (filtro CSS), así que basta un archivo. null = nombre en texto.
     */
    logo: null as string | null,
    /** Al pie de cada perfil. */
    disclaimer:
      'La selección es decisión exclusiva de la redacción de Playbook; Range Rover no participa en ella.',
  },

  /**
   * El marco distintivo del retrato (lo entrega Majo): PNG transparente del
   * mismo formato que el retrato (4:5), que se monta encima de la foto en la
   * página y en las imágenes para compartir. null = el marco provisional en
   * CSS (doble filete verde).
   */
  frame: null as string | null,
} as const;

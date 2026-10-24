/**
 * @sdd
 * [Objetivo]: Configuracion de entorno de produccion para despliegue en Render.com.
 * [I/O]: Expone constante environment con apiUrl apuntando a https://sendaseven.onrender.com/api.
 * [Edge Cases]: Protocolo HTTPS estricto para prevenir bloqueos por Mixed Content en navegadores modernos.
 */
export const environment = {
  production: true,
  apiUrl: 'https://sendaseven.onrender.com/api',
};

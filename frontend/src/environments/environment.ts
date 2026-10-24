/**
 * @sdd
 * [Objetivo]: Configuracion de entorno predeterminada para la aplicacion Angular Standalone.
 * [I/O]: Expone constante environment con apiUrl oficial en Render.com y flag de produccion.
 * [Edge Cases]: Apunta por defecto a https://sendaseven.onrender.com/api asegurando HTTPS.
 */
export const environment = {
  production: true,
  apiUrl: 'https://sendaseven.onrender.com/api',
};

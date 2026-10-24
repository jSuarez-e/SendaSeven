/**
 * @sdd
 * [Objetivo]: Configuracion de entorno de desarrollo local para pruebas con backend local.
 * [I/O]: Expone constante environment con apiUrl apuntando a http://localhost:3000/api y flag production false.
 * [Edge Cases]: Permite desarrollo desconectado o pruebas locales contra contenedor docker.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};

/**
 * @sdd
 * [Objetivo]: Punto de arranque del backend NestJS. Configura ValidationPipe global y documentacion OpenAPI/Swagger.
 * [I/O]: Inicializa NestFactory sobre AppModule; escucha en PORT (predeterminado 3000); expone Swagger en /api/docs.
 * [Edge Cases]: Whitelist y transformacion estricta en ValidationPipe para evitar inyeccion de campos no tipados.
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

/**
 * Inicializa y levanta el servidor NestJS configurando Swagger y pipes globales.
 * @returns Promesa resuelta tras el inicio del servidor.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API de Votacion de Rutas Turisticas - SendaSeven')
    .setDescription(
      'Motor transaccional para votacion atomica en lote y consulta anonima de cupos.',
    )
    .setVersion('1.0.0')
    .addTag('Auth')
    .addTag('Routes')
    .addTag('Votes')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
await bootstrap();

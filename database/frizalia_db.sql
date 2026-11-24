-- MySQL dump 10.13  Distrib 8.4.13, for Win64 (x86_64)
--
-- Host: localhost    Database: frizalia_db
-- ------------------------------------------------------
-- Server version	8.4.13

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `frizalia_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `frizalia_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `frizalia_db`;

--
-- Table structure for table `cajas`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cajas` (
  `id_caja` int NOT NULL AUTO_INCREMENT,
  `id_usuario_apertura` int NOT NULL,
  `id_usuario_cierre` int DEFAULT NULL,
  `fecha_apertura` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cierre` datetime DEFAULT NULL,
  `fondo_inicial` decimal(10,2) NOT NULL,
  `monto_esperado` decimal(10,2) DEFAULT NULL,
  `monto_real` decimal(10,2) DEFAULT NULL,
  `diferencia` decimal(10,2) DEFAULT NULL,
  `estado` enum('ABIERTA','CERRADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ABIERTA',
  `observaciones` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_caja`),
  KEY `fk_cajas_usuario_apertura` (`id_usuario_apertura`),
  KEY `fk_cajas_usuario_cierre` (`id_usuario_cierre`),
  CONSTRAINT `fk_cajas_usuario_apertura` FOREIGN KEY (`id_usuario_apertura`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `fk_cajas_usuario_cierre` FOREIGN KEY (`id_usuario_cierre`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `chk_cajas_fondo_inicial` CHECK ((`fondo_inicial` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categorias`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activa` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detalle_solicitud`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_solicitud` (
  `id_detalle` int NOT NULL AUTO_INCREMENT,
  `id_solicitud` int NOT NULL,
  `id_producto` int NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) GENERATED ALWAYS AS ((`cantidad` * `precio_unitario`)) STORED,
  PRIMARY KEY (`id_detalle`),
  KEY `fk_detalle_solicitud` (`id_solicitud`),
  KEY `fk_detalle_producto` (`id_producto`),
  CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `fk_detalle_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitudes` (`id_solicitud`),
  CONSTRAINT `chk_detalle_cantidad` CHECK ((`cantidad` > 0)),
  CONSTRAINT `chk_detalle_precio` CHECK ((`precio_unitario` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detalle_venta`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_venta` (
  `id_detalle_venta` int NOT NULL AUTO_INCREMENT,
  `id_venta` int NOT NULL,
  `id_producto` int NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_detalle_venta`),
  UNIQUE KEY `uq_detalle_venta_producto` (`id_venta`,`id_producto`),
  KEY `fk_detalle_venta_producto` (`id_producto`),
  CONSTRAINT `fk_detalle_venta_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `fk_detalle_venta_venta` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`),
  CONSTRAINT `chk_detalle_venta_cantidad` CHECK ((`cantidad` > 0)),
  CONSTRAINT `chk_detalle_venta_precio` CHECK ((`precio_unitario` >= 0)),
  CONSTRAINT `chk_detalle_venta_subtotal` CHECK ((`subtotal` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movimientos_caja`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_caja` (
  `id_movimiento_caja` int NOT NULL AUTO_INCREMENT,
  `id_caja` int NOT NULL,
  `id_usuario` int NOT NULL,
  `id_venta` int DEFAULT NULL,
  `tipo` enum('ENTRADA','SALIDA') COLLATE utf8mb4_unicode_ci NOT NULL,
  `concepto` enum('VENTA','OTRO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OTRO',
  `monto` decimal(10,2) NOT NULL,
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_movimiento` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_movimiento_caja`),
  UNIQUE KEY `uq_mov_caja_venta` (`id_venta`),
  KEY `fk_mov_caja_caja` (`id_caja`),
  KEY `fk_mov_caja_usuario` (`id_usuario`),
  CONSTRAINT `fk_mov_caja_caja` FOREIGN KEY (`id_caja`) REFERENCES `cajas` (`id_caja`),
  CONSTRAINT `fk_mov_caja_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `fk_mov_caja_venta` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`),
  CONSTRAINT `chk_mov_caja_concepto` CHECK ((((`concepto` = _utf8mb4'VENTA') and (`tipo` = _utf8mb4'ENTRADA') and (`id_venta` is not null)) or ((`concepto` = _utf8mb4'OTRO') and (`id_venta` is null)))),
  CONSTRAINT `chk_mov_caja_monto` CHECK ((`monto` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movimientos_inventario`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_inventario` (
  `id_movimiento` int NOT NULL AUTO_INCREMENT,
  `id_producto` int NOT NULL,
  `id_usuario` int NOT NULL,
  `id_solicitud` int DEFAULT NULL,
  `tipo` enum('ENTRADA','SALIDA','AJUSTE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL,
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_movimiento` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_movimiento`),
  KEY `fk_movimiento_producto` (`id_producto`),
  KEY `fk_movimiento_usuario` (`id_usuario`),
  KEY `fk_movimiento_solicitud` (`id_solicitud`),
  CONSTRAINT `fk_movimiento_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `fk_movimiento_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitudes` (`id_solicitud`),
  CONSTRAINT `fk_movimiento_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `chk_movimiento_cantidad` CHECK ((`cantidad` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `productos`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id_producto` int NOT NULL AUTO_INCREMENT,
  `id_categoria` int NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `presentacion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `precio` decimal(10,2) NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `stock_minimo` int NOT NULL DEFAULT '10',
  `imagen_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disponible` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_producto`),
  KEY `fk_producto_categoria` (`id_categoria`),
  CONSTRAINT `fk_producto_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`),
  CONSTRAINT `chk_producto_precio` CHECK ((`precio` >= 0)),
  CONSTRAINT `chk_producto_stock` CHECK ((`stock` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `solicitudes`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes` (
  `id_solicitud` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `folio` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('PENDIENTE','ACEPTADA','EN_PREPARACION','LISTA','ENTREGADA','RECHAZADA','CANCELADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `minutos_llegada` int NOT NULL,
  `fecha_recogida_estimada` datetime DEFAULT NULL,
  `motivo_rechazo` text COLLATE utf8mb4_unicode_ci,
  `motivo_cancelacion` text COLLATE utf8mb4_unicode_ci,
  `estado_cancelacion` enum('NINGUNA','SOLICITADA','APROBADA','RECHAZADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NINGUNA',
  `fecha_solicitud` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_solicitud`),
  UNIQUE KEY `folio` (`folio`),
  KEY `fk_solicitud_usuario` (`id_usuario`),
  CONSTRAINT `fk_solicitud_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `chk_minutos_llegada` CHECK ((`minutos_llegada` > 0)),
  CONSTRAINT `chk_solicitud_total` CHECK ((`total` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol` enum('CLIENTE','EMPLEADO','ADMINISTRADOR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CLIENTE',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ventas`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `id_venta` int NOT NULL AUTO_INCREMENT,
  `id_caja` int NOT NULL,
  `id_usuario` int NOT NULL,
  `id_solicitud` int DEFAULT NULL,
  `folio` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `metodo_pago` enum('EFECTIVO','TARJETA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EFECTIVO',
  `monto_recibido` decimal(10,2) NOT NULL,
  `cambio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `fecha_venta` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_venta`),
  UNIQUE KEY `folio` (`folio`),
  UNIQUE KEY `uq_ventas_solicitud` (`id_solicitud`),
  KEY `fk_ventas_caja` (`id_caja`),
  KEY `fk_ventas_usuario` (`id_usuario`),
  CONSTRAINT `fk_ventas_caja` FOREIGN KEY (`id_caja`) REFERENCES `cajas` (`id_caja`),
  CONSTRAINT `fk_ventas_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitudes` (`id_solicitud`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_ventas_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `chk_ventas_cambio` CHECK ((`cambio` >= 0)),
  CONSTRAINT `chk_ventas_monto_recibido` CHECK ((`monto_recibido` >= 0)),
  CONSTRAINT `chk_ventas_total` CHECK ((`total` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
-- Categorias iniciales para una instalacion nueva.
INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`, `activa`) VALUES
  (1, 'Paletas', 'Paletas de agua y de leche', 1),
  (2, 'Helados', 'Helados de diferentes sabores', 1),
  (3, 'Nieves', 'Nieves de frutas y sabores naturales', 1),
  (4, 'Pasteles', 'Pasteles fríos y helados', 1),
  (5, 'Bebidas', 'Bebidas frías y refrescantes', 1),
  (6, 'Otros', 'Otros productos de la nevería', 1);

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-24 17:46:48

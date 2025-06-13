-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 12-06-2025 a las 00:09:08
-- Versión del servidor: 10.4.24-MariaDB
-- Versión de PHP: 8.1.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Base de datos: `sistema_gestion`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alquiler_auto`
--

CREATE TABLE `alquiler_auto` (
  `ID_alquiler_auto` int(11) NOT NULL,
  `marca` varchar(50) NOT NULL,
  `modelo` varchar(50) NOT NULL,
  `patente` varchar(10) NOT NULL,
  `ubicacion_devolucion` varchar(100) DEFAULT NULL,
  `ubicacion_alquiler` varchar(100) DEFAULT NULL,
  `fecha_devolucion` date DEFAULT NULL,
  `fecha_alquiler` date NOT NULL,
  `precio_total` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `alquiler_auto`
--

INSERT INTO `alquiler_auto` (`ID_alquiler_auto`, `marca`, `modelo`, `patente`, `ubicacion_devolucion`, `ubicacion_alquiler`, `fecha_devolucion`, `fecha_alquiler`, `precio_total`) VALUES
(1, 'Toyota', 'Corolla', 'ABC123', 'Aeropuerto Ezeiza', 'Aeropuerto Ezeiza', '2024-07-23', '2024-07-16', '35000.00'),
(2, 'Ford', 'Focus', 'DEF456', 'Aeropuerto Jorge Newbery', 'Hotel Plaza', '2024-07-25', '2024-07-20', '28000.00'),
(3, 'Chevrolet', 'Cruze', 'GHI789', 'Centro Ciudad', 'Centro Ciudad', '2024-08-07', '2024-08-01', '32000.00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `delivery`
--

CREATE TABLE `delivery` (
  `Delivery_ID` int(11) NOT NULL,
  `estado` enum('preparando','en_camino','entregado','cancelado') DEFAULT 'preparando',
  `fecha_estimada` datetime DEFAULT NULL,
  `direccion_entrega` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_pedido`
--

CREATE TABLE `detalle_pedido` (
  `ID_detalle` int(11) NOT NULL,
  `ID_pedido` int(11) NOT NULL,
  `ID_producto_ser` int(11) DEFAULT NULL,
  `tipo_producto_ser` enum('vuelo','hotel','auto','paquete') NOT NULL,
  `cantidad` int(11) DEFAULT 1,
  `precio_unitario` decimal(10,2) DEFAULT NULL,
  `descuento` decimal(5,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Disparadores `detalle_pedido`
--
DELIMITER $$
CREATE TRIGGER `actualizar_total_pedido` AFTER INSERT ON `detalle_pedido` FOR EACH ROW BEGIN
    UPDATE Pedido 
    SET total = (
        SELECT SUM(cantidad * precio_unitario * (1 - descuento/100))
        FROM Detalle_pedido 
        WHERE ID_pedido = NEW.ID_pedido
    )
    WHERE ID_pedido = NEW.ID_pedido;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_de_pedido`
--

CREATE TABLE `historial_de_pedido` (
  `ID_historial_pe` int(11) NOT NULL,
  `ID_usuario` int(11) NOT NULL,
  `ID_pedido` int(11) NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `hotel`
--

CREATE TABLE `hotel` (
  `ID_hotel` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `ciudad` varchar(50) NOT NULL,
  `pais` varchar(50) NOT NULL,
  `direccion` varchar(150) DEFAULT NULL,
  `categoria_estrellas` int(11) DEFAULT NULL CHECK (`categoria_estrellas` >= 1 and `categoria_estrellas` <= 5),
  `precio_noche_base` decimal(8,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `hotel`
--

INSERT INTO `hotel` (`ID_hotel`, `nombre`, `ciudad`, `pais`, `direccion`, `categoria_estrellas`, `precio_noche_base`) VALUES
(1, 'Hotel Plaza', 'Buenos Aires', 'Argentina', 'Av. Corrientes 1234', 4, '15000.00'),
(2, 'Hotel Continental', 'Madrid', 'España', 'Gran Vía 456', 5, '25000.00'),
(3, 'Hotel Beach Resort', 'Cancún', 'México', 'Zona Hotelera 789', 4, '18000.00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paquete`
--

CREATE TABLE `paquete` (
  `ID_paquete_comp` int(11) NOT NULL,
  `ID_paquete` int(11) NOT NULL,
  `tipo_componente` enum('vuelo','hotel','auto','actividad') NOT NULL,
  `componente_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `paquete`
--

INSERT INTO `paquete` (`ID_paquete_comp`, `ID_paquete`, `tipo_componente`, `componente_id`) VALUES
(1, 1, 'vuelo', 1),
(2, 1, 'hotel', 2),
(3, 1, 'auto', 1),
(4, 2, 'vuelo', 3),
(5, 2, 'hotel', 3),
(6, 3, 'hotel', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paquete_componente`
--

CREATE TABLE `paquete_componente` (
  `ID_paquete` int(11) NOT NULL,
  `nombre_paquete` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio_base` decimal(10,2) DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `paquete_componente`
--

INSERT INTO `paquete_componente` (`ID_paquete`, `nombre_paquete`, `descripcion`, `precio_base`, `fecha_inicio`, `fecha_fin`) VALUES
(1, 'Escapada a Europa', 'Paquete completo con vuelo, hotel y auto', '150000.00', '2024-07-15', '2024-07-30'),
(2, 'Vacaciones en el Caribe', 'Paquete todo incluido a Cancún', '120000.00', '2024-08-10', '2024-08-20'),
(3, 'City Tour Buenos Aires', 'Paquete local con hotel y actividades', '45000.00', '2024-06-01', '2024-06-05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido`
--

CREATE TABLE `pedido` (
  `ID_pedido` int(11) NOT NULL,
  `ID_usuario` int(11) NOT NULL,
  `fecha_pedido` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('pendiente','confirmado','cancelado','completado') DEFAULT 'pendiente',
  `total` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Disparadores `pedido`
--
DELIMITER $$
CREATE TRIGGER `registrar_historial_pedido` AFTER INSERT ON `pedido` FOR EACH ROW BEGIN
    INSERT INTO Historial_de_pedido (ID_usuario, ID_pedido, tipo)
    VALUES (NEW.ID_usuario, NEW.ID_pedido, 'Pedido creado');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `ID_usuario` int(11) NOT NULL,
  `nombre_usuario` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contrasenia` varchar(255) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`ID_usuario`, `nombre_usuario`, `email`, `contrasenia`, `nombre`, `apellido`, `telefono`, `fecha_registro`) VALUES
(1, 'admin', 'admin@sistema.com', '$2y$10$example_hash', 'Administrador', 'Sistema', '+5491234567890', '2025-06-11 22:05:11'),
(2, 'usuario1', 'user1@email.com', '$2y$10$example_hash', 'Juan', 'Pérez', '+5491234567891', '2025-06-11 22:05:11'),
(3, 'usuario2', 'user2@email.com', '$2y$10$example_hash', 'María', 'González', '+5491234567892', '2025-06-11 22:05:11');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_inventario`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_inventario` (
`tipo` varchar(7)
,`id` int(11)
,`descripcion` varchar(205)
,`precio` decimal(10,2)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_pedidos_completa`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_pedidos_completa` (
`ID_pedido` int(11)
,`nombre_usuario` varchar(50)
,`nombre` varchar(50)
,`apellido` varchar(50)
,`email` varchar(100)
,`fecha_pedido` timestamp
,`estado` enum('pendiente','confirmado','cancelado','completado')
,`total` decimal(12,2)
,`cantidad_items` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vuelo`
--

CREATE TABLE `vuelo` (
  `ID_vuelo` int(11) NOT NULL,
  `numero_vuelo` varchar(20) NOT NULL,
  `aerolinea` varchar(50) NOT NULL,
  `ciudad_origen` varchar(50) NOT NULL,
  `ciudad_destino` varchar(50) NOT NULL,
  `fecha_salida` datetime NOT NULL,
  `fecha_llegada` datetime NOT NULL,
  `duracion_vuelo` time DEFAULT NULL,
  `precio_base` decimal(8,2) DEFAULT NULL,
  `clase_vuelo` enum('economica','business','primera') DEFAULT 'economica'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `vuelo`
--

INSERT INTO `vuelo` (`ID_vuelo`, `numero_vuelo`, `aerolinea`, `ciudad_origen`, `ciudad_destino`, `fecha_salida`, `fecha_llegada`, `duracion_vuelo`, `precio_base`, `clase_vuelo`) VALUES
(1, 'AA1001', 'Aerolíneas Argentinas', 'Buenos Aires', 'Madrid', '2024-07-15 10:30:00', '2024-07-16 06:45:00', '12:15:00', '85000.00', 'economica'),
(2, 'IB2002', 'Iberia', 'Madrid', 'Buenos Aires', '2024-07-30 14:20:00', '2024-07-31 05:30:00', '11:10:00', '87000.00', 'economica'),
(3, 'AM3003', 'Aeroméxico', 'Buenos Aires', 'Cancún', '2024-08-10 08:15:00', '2024-08-10 15:45:00', '09:30:00', '65000.00', 'economica');

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_inventario`
--
DROP TABLE IF EXISTS `vista_inventario`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_inventario`  AS SELECT 'Vuelo' AS `tipo`, `vuelo`.`ID_vuelo` AS `id`, concat(`vuelo`.`numero_vuelo`,' - ',`vuelo`.`ciudad_origen`,' a ',`vuelo`.`ciudad_destino`) AS `descripcion`, `vuelo`.`precio_base` AS `precio` FROM `vuelo` union all select 'Hotel' AS `tipo`,`hotel`.`ID_hotel` AS `id`,concat(`hotel`.`nombre`,' - ',`hotel`.`ciudad`,', ',`hotel`.`pais`) AS `descripcion`,`hotel`.`precio_noche_base` AS `precio` from `hotel` union all select 'Auto' AS `tipo`,`alquiler_auto`.`ID_alquiler_auto` AS `id`,concat(`alquiler_auto`.`marca`,' ',`alquiler_auto`.`modelo`,' - ',`alquiler_auto`.`patente`) AS `descripcion`,`alquiler_auto`.`precio_total` AS `precio` from `alquiler_auto` union all select 'Paquete' AS `tipo`,`paquete_componente`.`ID_paquete` AS `id`,`paquete_componente`.`nombre_paquete` AS `descripcion`,`paquete_componente`.`precio_base` AS `precio` from `paquete_componente`  ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_pedidos_completa`
--
DROP TABLE IF EXISTS `vista_pedidos_completa`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_pedidos_completa`  AS SELECT `p`.`ID_pedido` AS `ID_pedido`, `u`.`nombre_usuario` AS `nombre_usuario`, `u`.`nombre` AS `nombre`, `u`.`apellido` AS `apellido`, `u`.`email` AS `email`, `p`.`fecha_pedido` AS `fecha_pedido`, `p`.`estado` AS `estado`, `p`.`total` AS `total`, count(`dp`.`ID_detalle`) AS `cantidad_items` FROM ((`pedido` `p` join `usuario` `u` on(`p`.`ID_usuario` = `u`.`ID_usuario`)) left join `detalle_pedido` `dp` on(`p`.`ID_pedido` = `dp`.`ID_pedido`)) GROUP BY `p`.`ID_pedido`, `u`.`nombre_usuario`, `u`.`nombre`, `u`.`apellido`, `u`.`email`, `p`.`fecha_pedido`, `p`.`estado`, `p`.`total``total`  ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alquiler_auto`
--
ALTER TABLE `alquiler_auto`
  ADD PRIMARY KEY (`ID_alquiler_auto`),
  ADD UNIQUE KEY `patente` (`patente`);

--
-- Indices de la tabla `delivery`
--
ALTER TABLE `delivery`
  ADD PRIMARY KEY (`Delivery_ID`);

--
-- Indices de la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  ADD PRIMARY KEY (`ID_detalle`),
  ADD KEY `idx_detalle_pedido` (`ID_pedido`);

--
-- Indices de la tabla `historial_de_pedido`
--
ALTER TABLE `historial_de_pedido`
  ADD PRIMARY KEY (`ID_historial_pe`),
  ADD KEY `ID_usuario` (`ID_usuario`),
  ADD KEY `ID_pedido` (`ID_pedido`);

--
-- Indices de la tabla `hotel`
--
ALTER TABLE `hotel`
  ADD PRIMARY KEY (`ID_hotel`),
  ADD KEY `idx_hotel_ciudad` (`ciudad`);

--
-- Indices de la tabla `paquete`
--
ALTER TABLE `paquete`
  ADD PRIMARY KEY (`ID_paquete_comp`),
  ADD KEY `ID_paquete` (`ID_paquete`);

--
-- Indices de la tabla `paquete_componente`
--
ALTER TABLE `paquete_componente`
  ADD PRIMARY KEY (`ID_paquete`);

--
-- Indices de la tabla `pedido`
--
ALTER TABLE `pedido`
  ADD PRIMARY KEY (`ID_pedido`),
  ADD KEY `idx_pedido_usuario` (`ID_usuario`),
  ADD KEY `idx_pedido_fecha` (`fecha_pedido`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`ID_usuario`),
  ADD UNIQUE KEY `nombre_usuario` (`nombre_usuario`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_usuario_email` (`email`);

--
-- Indices de la tabla `vuelo`
--
ALTER TABLE `vuelo`
  ADD PRIMARY KEY (`ID_vuelo`),
  ADD KEY `idx_vuelo_fecha` (`fecha_salida`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `alquiler_auto`
--
ALTER TABLE `alquiler_auto`
  MODIFY `ID_alquiler_auto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `delivery`
--
ALTER TABLE `delivery`
  MODIFY `Delivery_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  MODIFY `ID_detalle` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `historial_de_pedido`
--
ALTER TABLE `historial_de_pedido`
  MODIFY `ID_historial_pe` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `hotel`
--
ALTER TABLE `hotel`
  MODIFY `ID_hotel` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `paquete`
--
ALTER TABLE `paquete`
  MODIFY `ID_paquete_comp` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `pedido`
--
ALTER TABLE `pedido`
  MODIFY `ID_pedido` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `ID_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `vuelo`
--
ALTER TABLE `vuelo`
  MODIFY `ID_vuelo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  ADD CONSTRAINT `fk_detalle_pedido` FOREIGN KEY (`ID_pedido`) REFERENCES `pedido` (`ID_pedido`) ON DELETE CASCADE;

--
-- Filtros para la tabla `historial_de_pedido`
--
ALTER TABLE `historial_de_pedido`
  ADD CONSTRAINT `historial_de_pedido_ibfk_1` FOREIGN KEY (`ID_usuario`) REFERENCES `usuario` (`ID_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `historial_de_pedido_ibfk_2` FOREIGN KEY (`ID_pedido`) REFERENCES `pedido` (`ID_pedido`) ON DELETE CASCADE;

--
-- Filtros para la tabla `paquete`
--
ALTER TABLE `paquete`
  ADD CONSTRAINT `paquete_ibfk_1` FOREIGN KEY (`ID_paquete`) REFERENCES `paquete_componente` (`ID_paquete`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pedido`
--
ALTER TABLE `pedido`
  ADD CONSTRAINT `pedido_ibfk_1` FOREIGN KEY (`ID_usuario`) REFERENCES `usuario` (`ID_usuario`) ON DELETE CASCADE;
COMMIT;


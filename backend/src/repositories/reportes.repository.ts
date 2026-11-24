import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { pool } from "../config/database.js";
import type {
  PeriodoReporte,
  ReporteVentas,
  ReporteInventario,
  ReporteCaja,
  ReporteSolicitudes,
  ResumenReporteVentas,
  VentaDiariaReporte,
  ProductoVendidoReporte,
  VentaCategoriaReporte,
  VentaDetalleReporte,
  ResumenReporteInventario,
  ProductoInventarioReporte,
  MovimientoInventarioReporte,
  ResumenReporteCaja,
  CajaDetalleReporte,
  MovimientoCajaReporte,
  ResumenReporteSolicitudes,
  SolicitudEstadoReporte,
  SolicitudDetalleReporte,
} from "../types/reportes.js";

// CONSULTAS DE SOLO LECTURA CON UNA VISTA CONSISTENTE DE LOS DATOS
async function consultar<T>(
  conexion: PoolConnection,
  sql: string,
  parametros: string[] = [],
): Promise<T[]> {
  const [filas] = await conexion.execute<(RowDataPacket & T)[]>(
    sql,
    parametros,
  );
  return filas;
}

async function consultarResumen<T>(
  conexion: PoolConnection,
  sql: string,
  parametros: string[] = [],
): Promise<T> {
  const [fila] = await consultar<T>(conexion, sql, parametros);
  if (!fila) throw new Error("No se pudo obtener el resumen del reporte");
  return fila;
}

async function conLectura<T>(
  operacion: (conexion: PoolConnection) => Promise<T>,
): Promise<T> {
  const conexion = await pool.getConnection();
  try {
    await conexion.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await conexion.query(
      "START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY",
    );
    const resultado = await operacion(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

function parametrosPeriodo(periodo: PeriodoReporte): string[] {
  return [periodo.fecha_inicio, periodo.fecha_fin];
}

// VENTAS: FECHA DE COBRO, NO FECHA DE SOLICITUD
export async function consultarReporteVentas(
  periodo: PeriodoReporte,
): Promise<ReporteVentas> {
  return conLectura(async (conexion) => {
    const params = parametrosPeriodo(periodo);
    const filtro =
      "v.fecha_venta >= ? AND v.fecha_venta < DATE_ADD(?, INTERVAL 1 DAY)";
    const resumen = await consultarResumen<ResumenReporteVentas>(
      conexion,
      `
      SELECT COUNT(*) AS total_ventas,
        CAST(COALESCE(SUM(v.total), 0.00) AS CHAR) AS ingresos_totales,
        CAST(CAST(COALESCE(AVG(v.total), 0) AS DECIMAL(20,2)) AS CHAR) AS ticket_promedio,
        CAST(COALESCE(SUM(d.unidades), 0) AS SIGNED) AS unidades_vendidas,
        CAST(COALESCE(SUM(v.id_solicitud IS NULL), 0) AS SIGNED) AS ventas_presenciales,
        CAST(COALESCE(SUM(v.id_solicitud IS NOT NULL), 0) AS SIGNED) AS ventas_solicitudes
      FROM ventas v
      LEFT JOIN (SELECT id_venta, SUM(cantidad) AS unidades FROM detalle_venta GROUP BY id_venta) d
        ON d.id_venta = v.id_venta
      WHERE ${filtro}`,
      params,
    );
    const ventas_diarias = await consultar<VentaDiariaReporte>(
      conexion,
      `
      SELECT DATE_FORMAT(v.fecha_venta, '%Y-%m-%d') AS fecha,
        COUNT(*) AS cantidad_ventas, CAST(SUM(v.total) AS CHAR) AS total
      FROM ventas v WHERE ${filtro}
      GROUP BY DATE_FORMAT(v.fecha_venta, '%Y-%m-%d') ORDER BY fecha`,
      params,
    );
    const productos_mas_vendidos = await consultar<ProductoVendidoReporte>(
      conexion,
      `
      SELECT p.id_producto, p.nombre, p.presentacion, c.nombre AS categoria,
        CAST(SUM(d.cantidad) AS SIGNED) AS unidades_vendidas,
        CAST(SUM(d.subtotal) AS CHAR) AS ingresos
      FROM detalle_venta d JOIN ventas v ON v.id_venta = d.id_venta
      JOIN productos p ON p.id_producto = d.id_producto
      JOIN categorias c ON c.id_categoria = p.id_categoria
      WHERE ${filtro}
      GROUP BY p.id_producto, p.nombre, p.presentacion, c.nombre
      ORDER BY unidades_vendidas DESC, p.id_producto`,
      params,
    );
    const ventas_por_categoria = await consultar<VentaCategoriaReporte>(
      conexion,
      `
      SELECT c.id_categoria, c.nombre AS categoria,
        CAST(SUM(d.cantidad) AS SIGNED) AS unidades_vendidas,
        CAST(SUM(d.subtotal) AS CHAR) AS ingresos
      FROM detalle_venta d JOIN ventas v ON v.id_venta = d.id_venta
      JOIN productos p ON p.id_producto = d.id_producto
      JOIN categorias c ON c.id_categoria = p.id_categoria
      WHERE ${filtro} GROUP BY c.id_categoria, c.nombre
      ORDER BY SUM(d.subtotal) DESC, c.id_categoria`,
      params,
    );
    const ventas = await consultar<VentaDetalleReporte>(
      conexion,
      `
      SELECT v.id_venta, v.id_caja, v.id_solicitud, v.folio, u.nombre AS vendedor,
        IF(v.id_solicitud IS NULL, 'PRESENCIAL', 'SOLICITUD') AS origen,
        v.metodo_pago, CAST(v.total AS CHAR) AS total,
        CAST(v.monto_recibido AS CHAR) AS monto_recibido, CAST(v.cambio AS CHAR) AS cambio,
        DATE_FORMAT(v.fecha_venta, '%Y-%m-%d %H:%i:%s') AS fecha_venta
      FROM ventas v JOIN usuarios u ON u.id_usuario = v.id_usuario
      WHERE ${filtro} ORDER BY v.fecha_venta DESC, v.id_venta DESC`,
      params,
    );
    return {
      periodo,
      resumen,
      ventas_diarias,
      productos_mas_vendidos,
      ventas_por_categoria,
      ventas,
    };
  });
}

// INVENTARIO: EXISTENCIAS ACTUALES Y MOVIMIENTOS DEL PERIODO
export async function consultarReporteInventario(
  periodo: PeriodoReporte,
): Promise<ReporteInventario> {
  return conLectura(async (conexion) => {
    const params = parametrosPeriodo(periodo);
    const existencias = await consultarResumen<
      Omit<
        ResumenReporteInventario,
        "total_entradas" | "total_salidas" | "total_ajustes"
      >
    >(
      conexion,
      `
      SELECT COUNT(*) AS total_productos,
        CAST(COALESCE(SUM(disponible = 1), 0) AS SIGNED) AS productos_activos,
        CAST(COALESCE(SUM(disponible <> 1), 0) AS SIGNED) AS productos_inactivos,
        CAST(COALESCE(SUM(disponible = 1 AND stock > 0 AND stock <= stock_minimo), 0) AS SIGNED) AS productos_stock_bajo,
        CAST(COALESCE(SUM(disponible = 1 AND stock = 0), 0) AS SIGNED) AS productos_agotados,
        CAST(COALESCE(SUM(IF(disponible = 1, stock, 0)), 0) AS SIGNED) AS unidades_disponibles,
        CAST(COALESCE(SUM(IF(disponible = 1, stock * precio, 0)), 0.00) AS CHAR) AS valor_inventario_precio_venta
      FROM productos`,
    );
    const filtro =
      "m.fecha_movimiento >= ? AND m.fecha_movimiento < DATE_ADD(?, INTERVAL 1 DAY)";
    const totales = await consultarResumen<
      Pick<
        ResumenReporteInventario,
        "total_entradas" | "total_salidas" | "total_ajustes"
      >
    >(
      conexion,
      `
      SELECT CAST(COALESCE(SUM(IF(m.tipo = 'ENTRADA', m.cantidad, 0)), 0) AS SIGNED) AS total_entradas,
        CAST(COALESCE(SUM(IF(m.tipo = 'SALIDA', m.cantidad, 0)), 0) AS SIGNED) AS total_salidas,
        CAST(COALESCE(SUM(m.tipo = 'AJUSTE'), 0) AS SIGNED) AS total_ajustes
      FROM movimientos_inventario m WHERE ${filtro}`,
      params,
    );
    const filas = await consultar<
      Omit<ProductoInventarioReporte, "disponible"> & { disponible: number }
    >(
      conexion,
      `
      SELECT p.id_producto, p.nombre, p.presentacion, c.nombre AS categoria,
        CAST(p.precio AS CHAR) AS precio, p.stock, p.stock_minimo, p.disponible,
        CASE WHEN p.stock = 0 THEN 'AGOTADO' WHEN p.stock <= p.stock_minimo THEN 'BAJO' ELSE 'NORMAL' END AS estado_stock,
        CAST(p.stock * p.precio AS CHAR) AS valor_precio_venta
      FROM productos p JOIN categorias c ON c.id_categoria = p.id_categoria
      ORDER BY p.disponible DESC, p.stock ASC, p.id_producto`,
    );
    const productos = filas.map((p) => ({
      ...p,
      disponible: Number(p.disponible) === 1,
    }));
    const movimientos = await consultar<MovimientoInventarioReporte>(
      conexion,
      `
      SELECT m.id_movimiento, m.id_producto, m.id_solicitud, p.nombre AS producto,
        u.nombre AS usuario, m.tipo, m.cantidad, m.motivo,
        DATE_FORMAT(m.fecha_movimiento, '%Y-%m-%d %H:%i:%s') AS fecha_movimiento
      FROM movimientos_inventario m JOIN productos p ON p.id_producto = m.id_producto
      JOIN usuarios u ON u.id_usuario = m.id_usuario
      WHERE ${filtro} ORDER BY m.fecha_movimiento DESC, m.id_movimiento DESC`,
      params,
    );
    const { fecha_consulta } = await consultarResumen<{
      fecha_consulta: string;
    }>(
      conexion,
      "SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') AS fecha_consulta",
    );
    return {
      periodo,
      fecha_consulta,
      resumen: { ...existencias, ...totales },
      productos,
      movimientos,
    };
  });
}

// CAJA: FLUJO DEL PERIODO Y SESIONES QUE COINCIDEN CON EL PERIODO
export async function consultarReporteCaja(
  periodo: PeriodoReporte,
): Promise<ReporteCaja> {
  return conLectura(async (conexion) => {
    const params = parametrosPeriodo(periodo);
    const filtroCaja =
      "(c.fecha_cierre IS NULL OR c.fecha_cierre >= ?) AND c.fecha_apertura < DATE_ADD(?, INTERVAL 1 DAY)";
    const filtroMovimiento =
      "m.fecha_movimiento >= ? AND m.fecha_movimiento < DATE_ADD(?, INTERVAL 1 DAY)";
    const sesiones = await consultarResumen<
      Pick<
        ResumenReporteCaja,
        "total_cajas" | "cajas_abiertas" | "cajas_cerradas"
      >
    >(
      conexion,
      `
      SELECT COUNT(*) AS total_cajas,
        CAST(COALESCE(SUM(c.estado = 'ABIERTA'), 0) AS SIGNED) AS cajas_abiertas,
        CAST(COALESCE(SUM(c.estado = 'CERRADA'), 0) AS SIGNED) AS cajas_cerradas
      FROM cajas c WHERE ${filtroCaja}`,
      params,
    );
    const flujo = await consultarResumen<
      Pick<
        ResumenReporteCaja,
        | "ingresos_por_ventas"
        | "otras_entradas"
        | "total_entradas"
        | "total_salidas"
        | "flujo_neto"
      >
    >(
      conexion,
      `
      SELECT CAST(COALESCE(SUM(IF(m.tipo = 'ENTRADA' AND m.concepto = 'VENTA', m.monto, 0)), 0.00) AS CHAR) AS ingresos_por_ventas,
        CAST(COALESCE(SUM(IF(m.tipo = 'ENTRADA' AND m.concepto = 'OTRO', m.monto, 0)), 0.00) AS CHAR) AS otras_entradas,
        CAST(COALESCE(SUM(IF(m.tipo = 'ENTRADA', m.monto, 0)), 0.00) AS CHAR) AS total_entradas,
        CAST(COALESCE(SUM(IF(m.tipo = 'SALIDA', m.monto, 0)), 0.00) AS CHAR) AS total_salidas,
        CAST(COALESCE(SUM(IF(m.tipo = 'ENTRADA', m.monto, -m.monto)), 0.00) AS CHAR) AS flujo_neto
      FROM movimientos_caja m WHERE ${filtroMovimiento}`,
      params,
    );
    const diferencias = await consultarResumen<
      Pick<ResumenReporteCaja, "total_faltantes" | "total_sobrantes">
    >(
      conexion,
      `
      SELECT CAST(COALESCE(SUM(IF(c.diferencia < 0, -c.diferencia, 0)), 0.00) AS CHAR) AS total_faltantes,
        CAST(COALESCE(SUM(IF(c.diferencia > 0, c.diferencia, 0)), 0.00) AS CHAR) AS total_sobrantes
      FROM cajas c WHERE c.estado = 'CERRADA' AND c.fecha_cierre >= ?
        AND c.fecha_cierre < DATE_ADD(?, INTERVAL 1 DAY)`,
      params,
    );
    const cajas = await consultar<CajaDetalleReporte>(
      conexion,
      `
      SELECT c.id_caja, ua.nombre AS usuario_apertura, uc.nombre AS usuario_cierre,
        DATE_FORMAT(c.fecha_apertura, '%Y-%m-%d %H:%i:%s') AS fecha_apertura,
        DATE_FORMAT(c.fecha_cierre, '%Y-%m-%d %H:%i:%s') AS fecha_cierre, c.estado,
        CAST(c.fondo_inicial AS CHAR) AS fondo_inicial,
        CAST(COALESCE(m.entradas, 0.00) AS CHAR) AS total_entradas,
        CAST(COALESCE(m.salidas, 0.00) AS CHAR) AS total_salidas,
        CAST(COALESCE(c.monto_esperado, c.fondo_inicial + COALESCE(m.entradas, 0) - COALESCE(m.salidas, 0)) AS CHAR) AS monto_esperado,
        CAST(c.monto_real AS CHAR) AS monto_real, CAST(c.diferencia AS CHAR) AS diferencia, c.observaciones
      FROM cajas c JOIN usuarios ua ON ua.id_usuario = c.id_usuario_apertura
      LEFT JOIN usuarios uc ON uc.id_usuario = c.id_usuario_cierre
      LEFT JOIN (SELECT id_caja, SUM(IF(tipo = 'ENTRADA', monto, 0)) AS entradas,
        SUM(IF(tipo = 'SALIDA', monto, 0)) AS salidas FROM movimientos_caja GROUP BY id_caja) m ON m.id_caja = c.id_caja
      WHERE ${filtroCaja} ORDER BY c.fecha_apertura DESC, c.id_caja DESC`,
      params,
    );
    const movimientos = await consultar<MovimientoCajaReporte>(
      conexion,
      `
      SELECT m.id_movimiento_caja, m.id_caja, m.id_venta, u.nombre AS usuario,
        m.tipo, m.concepto, CAST(m.monto AS CHAR) AS monto, m.motivo,
        DATE_FORMAT(m.fecha_movimiento, '%Y-%m-%d %H:%i:%s') AS fecha_movimiento
      FROM movimientos_caja m JOIN usuarios u ON u.id_usuario = m.id_usuario
      WHERE ${filtroMovimiento} ORDER BY m.fecha_movimiento DESC, m.id_movimiento_caja DESC`,
      params,
    );
    return {
      periodo,
      resumen: { ...sesiones, ...flujo, ...diferencias },
      cajas,
      movimientos,
    };
  });
}

// SOLICITUDES: PEDIDOS CREADOS EN EL PERIODO Y SU ESTADO ACTUAL
export async function consultarReporteSolicitudes(
  periodo: PeriodoReporte,
): Promise<ReporteSolicitudes> {
  return conLectura(async (conexion) => {
    const params = parametrosPeriodo(periodo);
    const filtro =
      "s.fecha_solicitud >= ? AND s.fecha_solicitud < DATE_ADD(?, INTERVAL 1 DAY)";
    const resumen = await consultarResumen<ResumenReporteSolicitudes>(
      conexion,
      `
      SELECT COUNT(*) AS total_solicitudes,
        CAST(COALESCE(SUM(s.estado = 'PENDIENTE'), 0) AS SIGNED) AS pendientes,
        CAST(COALESCE(SUM(s.estado = 'ACEPTADA'), 0) AS SIGNED) AS aceptadas,
        CAST(COALESCE(SUM(s.estado = 'EN_PREPARACION'), 0) AS SIGNED) AS en_preparacion,
        CAST(COALESCE(SUM(s.estado = 'LISTA'), 0) AS SIGNED) AS listas,
        CAST(COALESCE(SUM(s.estado = 'ENTREGADA'), 0) AS SIGNED) AS entregadas,
        CAST(COALESCE(SUM(s.estado = 'RECHAZADA'), 0) AS SIGNED) AS rechazadas,
        CAST(COALESCE(SUM(s.estado = 'CANCELADA'), 0) AS SIGNED) AS canceladas,
        CAST(COALESCE(SUM(s.estado_cancelacion = 'SOLICITADA'), 0) AS SIGNED) AS cancelaciones_pendientes,
        COUNT(v.id_venta) AS solicitudes_cobradas,
        CAST(COALESCE(SUM(v.total), 0.00) AS CHAR) AS ingresos_solicitudes
      FROM solicitudes s LEFT JOIN ventas v ON v.id_solicitud = s.id_solicitud
      WHERE ${filtro}`,
      params,
    );
    const solicitudes_por_estado = await consultar<SolicitudEstadoReporte>(
      conexion,
      `
      SELECT s.estado, COUNT(*) AS cantidad FROM solicitudes s
      WHERE ${filtro} GROUP BY s.estado ORDER BY s.estado`,
      params,
    );
    const solicitudes = await consultar<SolicitudDetalleReporte>(
      conexion,
      `
      SELECT s.id_solicitud, v.id_venta, s.folio, u.nombre AS cliente, s.estado,
        s.estado_cancelacion, CAST(s.total AS CHAR) AS total, CAST(v.total AS CHAR) AS monto_cobrado,
        DATE_FORMAT(s.fecha_solicitud, '%Y-%m-%d %H:%i:%s') AS fecha_solicitud,
        DATE_FORMAT(s.fecha_recogida_estimada, '%Y-%m-%d %H:%i:%s') AS fecha_recogida_estimada,
        DATE_FORMAT(s.fecha_actualizacion, '%Y-%m-%d %H:%i:%s') AS fecha_actualizacion,
        s.motivo_rechazo, s.motivo_cancelacion
      FROM solicitudes s JOIN usuarios u ON u.id_usuario = s.id_usuario
      LEFT JOIN ventas v ON v.id_solicitud = s.id_solicitud
      WHERE ${filtro} ORDER BY s.fecha_solicitud DESC, s.id_solicitud DESC`,
      params,
    );
    return { periodo, resumen, solicitudes_por_estado, solicitudes };
  });
}

# MechanicApp — Guía de Usuario

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Primeros Pasos](#2-primeros-pasos)
3. [Panel de Control (Dashboard)](#3-panel-de-control-dashboard)
4. [Gestión de Clientes](#4-gestión-de-clientes)
5. [Gestión de Vehículos](#5-gestión-de-vehículos)
6. [Gestión de Mecánicos](#6-gestión-de-mecánicos)
7. [Inventario](#7-inventario)
8. [Órdenes de Reparación](#8-órdenes-de-reparación)
9. [Pagos](#9-pagos)
10. [Monedas](#10-monedas)
11. [Gestión de Usuarios](#11-gestión-de-usuarios)
12. [Configuración](#12-configuración)
13. [Suscripción](#13-suscripción)
14. [Roles y Permisos](#14-roles-y-permisos)

---

## 1. Introducción

**MechanicApp** es un sistema de gestión de talleres mecánicos basado en la web. Permite administrar clientes, vehículos, mecánicos, inventario (repuestos, productos y servicios), órdenes de reparación, pagos y facturación multi-moneda — todo desde una sola aplicación.

### Características Principales

- Registro de clientes y vehículos
- Seguimiento del ciclo de vida de órdenes (Pendiente → En Progreso → Completada)
- Inventario de Repuestos, Productos y Servicios con control automático de stock
- Soporte multi-moneda con conversión de tipo de cambio
- Fotos adjuntas a órdenes de reparación
- Generación de facturas para órdenes y pagos
- Control de acceso basado en roles (Admin, Supervisor, Mecánico)
- Interfaz bilingüe (Inglés / Español)
- Gestión de suscripción vía Stripe

---

## 2. Primeros Pasos

### 2.1 Iniciar Sesión

1. Abra la aplicación en su navegador.
2. Ingrese su **Usuario** y **Contraseña**.
3. Haga clic en **Iniciar Sesión**.

> La cuenta de administrador predeterminada se crea durante la instalación. Contacte a su administrador del sistema para obtener las credenciales.

### 2.2 Navegación de la Aplicación

Después de iniciar sesión, verá el **menú lateral** a la izquierda con las siguientes secciones (según su rol):

| Elemento del Menú | Ruta             | Descripción                             |
| ----------------- | ---------------- | --------------------------------------- |
| Dashboard         | `/dashboard`     | Resumen general y estadísticas          |
| Clientes          | `/customers`     | Administrar registros de clientes       |
| Autos             | `/cars`          | Administrar vehículos, marcas y modelos |
| Mecánicos         | `/mechanics`     | Administrar registros de mecánicos      |
| Inventario        | `/inventory`     | Repuestos, Productos y Servicios        |
| Órdenes           | `/repair-orders` | Crear y gestionar órdenes de trabajo    |
| Pagos             | `/payments`      | Registrar y rastrear pagos              |
| Monedas           | `/currencies`    | Configurar tipos de cambio              |
| Usuarios          | `/users`         | Administrar cuentas (solo Admin)        |
| Configuración     | `/settings`      | Marca y configuración de la app         |

### 2.3 Cambiar Idioma

La aplicación soporta **Inglés** y **Español**. Use el selector de idioma en la interfaz para cambiar entre ellos.

---

## 3. Panel de Control (Dashboard)

El Dashboard proporciona una vista en tiempo real de la actividad de su taller.

### Métricas Principales

| Métrica             | Descripción                            |
| ------------------- | -------------------------------------- |
| Total de Clientes   | Número de clientes registrados         |
| Total de Vehículos  | Número de vehículos registrados        |
| Total de Mecánicos  | Número de mecánicos activos            |
| Total de Órdenes    | Total de órdenes de reparación creadas |
| Órdenes Pendientes  | Órdenes esperando ser iniciadas        |
| Órdenes en Progreso | Órdenes en las que se está trabajando  |
| Órdenes Completadas | Órdenes de reparación terminadas       |
| Ingresos Totales    | Suma de todos los costos de órdenes    |
| Total Pagado        | Suma de todos los pagos registrados    |

### Órdenes Recientes

Una lista rápida de las 5 órdenes de reparación más recientes, mostrando el vehículo, mecánico, estado y costo.

> **Nota:** Los mecánicos solo ven sus propias órdenes asignadas y estadísticas.

---

## 4. Gestión de Clientes

### 4.1 Ver Clientes

Navegue a **Clientes** para ver una lista de todos los clientes registrados, ordenados alfabéticamente por apellido.

### 4.2 Agregar un Cliente

1. Haga clic en **Agregar Cliente**.
2. Complete los campos requeridos:
   - **Nombre** (requerido)
   - **Apellido** (requerido)
   - **Teléfono** (requerido)
   - **Email** (opcional)
   - **Dirección** (opcional)
3. Haga clic en **Guardar**.

### 4.3 Detalle del Cliente

Haga clic en un cliente para ver su página de detalle, que muestra:

- Información del cliente
- Vehículos que pertenecen a este cliente
- Enlace rápido para agregar un nuevo vehículo para este cliente

### 4.4 Editar / Eliminar un Cliente

- Haga clic en el botón **Editar** para modificar la información del cliente.
- Haga clic en **Eliminar** para remover un cliente. Los vehículos vinculados tendrán su referencia de cliente eliminada (no se borran los vehículos).

---

## 5. Gestión de Vehículos

Los vehículos están organizados en una jerarquía de tres niveles: **Marca → Modelo → Vehículo**.

### 5.1 Marcas de Autos

Navegue a **Autos > Marcas** para administrar fabricantes de vehículos.

- **Agregar Marca:** Ingrese el nombre de la marca y el país de origen.
- Las marcas se usan como catálogo para organizar los modelos.

### 5.2 Modelos de Autos

Navegue a **Autos > Modelos** para administrar nombres de modelos por marca.

- **Agregar Modelo:** Seleccione una marca e ingrese el nombre del modelo (ej: Toyota → Camry).
- Los modelos se pueden filtrar por marca.

### 5.3 Vehículos (Detalle de Autos)

Navegue a **Autos** para ver todos los vehículos registrados.

#### Agregar un Vehículo

1. Haga clic en **Agregar Vehículo**.
2. Complete los campos:
   - **Marca / Modelo** (requerido) — seleccione del catálogo
   - **Cliente** (opcional) — vincular a un cliente existente
   - **VIN** (opcional, único) — Número de Identificación del Vehículo
   - **Año** (requerido)
   - **Tipo de Combustible** (requerido) — Gasolina, Diésel, Híbrido, Eléctrico, etc.
   - **Tipo de Vehículo** (requerido) — Sedán, SUV, Camioneta, Coupé, etc.
   - **Transmisión** (requerido) — Automática, Manual, CVT, etc.
   - **Placa** (opcional)
   - **Kilometraje** (opcional)
3. Haga clic en **Guardar**.

#### Ver Vehículos por Cliente

Desde la página de Detalle del Cliente, puede ver todos los vehículos que pertenecen a ese cliente.

---

## 6. Gestión de Mecánicos

Navegue a **Mecánicos** para administrar el personal de su taller.

### 6.1 Agregar un Mecánico

1. Haga clic en **Agregar Mecánico**.
2. Complete:
   - **Nombre** (requerido)
   - **Apellido** (requerido)
   - **Especialidad** (opcional) — ej: Reparación de Motor, Frenos, Eléctrica
   - **Fecha de Contratación** (opcional)
   - **Activo** (predeterminado: Sí)
3. Haga clic en **Guardar**.

### 6.2 Vincular un Mecánico a una Cuenta de Usuario

Cuando un registro de mecánico está vinculado a una cuenta de usuario (con rol `mecánico`), ese usuario solo verá las órdenes de reparación asignadas a él.

Para vincular:

1. Primero cree la cuenta de usuario en **Usuarios** con el rol `mecánico`.
2. Edite el registro del mecánico y seleccione el usuario asociado del menú desplegable.

---

## 7. Inventario

El módulo de Inventario tiene tres sub-secciones: **Repuestos**, **Productos** y **Servicios**.

### 7.1 Repuestos

Los repuestos son componentes utilizados en reparaciones (ej: filtros de aceite, pastillas de freno, baterías).

| Campo           | Descripción                           |
| --------------- | ------------------------------------- |
| Nombre          | Nombre del repuesto                   |
| Número de Parte | Código identificador único            |
| Categoría       | Clasificación (Filtros, Frenos, etc.) |
| Cantidad        | Nivel de stock actual                 |
| Stock Mínimo    | Umbral de alerta                      |
| Costo Unitario  | Precio de compra                      |
| Precio de Venta | Precio al cliente                     |
| Proveedor       | Nombre del proveedor                  |
| Ubicación       | Ubicación de almacenamiento (ej: A-1) |
| Moneda          | Moneda del precio                     |

> **Control automático de stock:** Cuando se agrega un repuesto a una orden de reparación, su cantidad se decrementa automáticamente. Cuando se remueve de una orden, el stock se restaura.

### 7.2 Productos

Los productos son artículos consumibles vendidos a clientes (ej: aceite de motor, líquido de frenos, productos de limpieza).

| Campo           | Descripción               |
| --------------- | ------------------------- |
| Nombre          | Nombre del producto       |
| SKU             | Código de Unidad de Stock |
| Categoría       | Clasificación             |
| Descripción     | Descripción del producto  |
| Cantidad        | Nivel de stock actual     |
| Stock Mínimo    | Umbral de alerta          |
| Costo Unitario  | Precio de compra          |
| Precio de Venta | Precio al cliente         |
| Marca           | Marca del producto        |
| Moneda          | Moneda del precio         |

> **Control automático de stock:** Igual que los repuestos — el stock se ajusta cuando se agregan/remueven productos de las órdenes de reparación.

### 7.3 Servicios

Los servicios son ítems de mano de obra ofrecidos por el taller (ej: cambio de aceite, inspección de frenos, diagnóstico).

| Campo           | Descripción              |
| --------------- | ------------------------ |
| Nombre          | Nombre del servicio      |
| Categoría       | Clasificación            |
| Descripción     | Descripción del servicio |
| Precio Base     | Cargo estándar           |
| Horas Estimadas | Duración esperada        |
| Activo          | Si el servicio se ofrece |
| Moneda          | Moneda del precio        |

> Los servicios **no** afectan los niveles de inventario.

---

## 8. Órdenes de Reparación

Las órdenes de reparación son el núcleo de MechanicApp. Cada orden representa un trabajo realizado en un vehículo por un mecánico.

### 8.1 Ciclo de Vida de la Orden

```
Pendiente  →  En Progreso  →  Completada
                              ↘ Cancelada
```

| Estado      | Significado                                            |
| ----------- | ------------------------------------------------------ |
| Pendiente   | Orden creada, trabajo aún no iniciado                  |
| En Progreso | El mecánico está trabajando activamente en el vehículo |
| Completada  | Trabajo terminado                                      |
| Cancelada   | La orden fue cancelada                                 |

### 8.2 Crear una Orden de Reparación

1. Navegue a **Órdenes** y haga clic en **Agregar Orden**.
2. Seleccione:
   - **Vehículo** (opcional) — el auto que se está reparando
   - **Mecánico** (opcional) — técnico asignado
   - **Estado** — predeterminado a Pendiente
   - **Notas** — cualquier observación
3. Haga clic en **Guardar**.

> Los **usuarios mecánicos** se asignan automáticamente como el mecánico de las órdenes que crean.

### 8.3 Página de Detalle de la Orden

La página de detalle de la orden es donde se realiza la mayor parte del trabajo. Desde aquí puede:

#### Agregar Servicios

1. Haga clic en **Agregar Servicio**.
2. Seleccione un servicio del catálogo.
3. Establezca la cantidad y precio unitario (se llena automáticamente del catálogo).
4. El total de la orden se recalcula automáticamente.

#### Agregar Repuestos

1. Haga clic en **Agregar Repuesto**.
2. Seleccione un repuesto del inventario.
3. Establezca la cantidad y precio unitario.
4. El stock se **decrementa automáticamente**.
5. El total de la orden se recalcula.

#### Agregar Productos

1. Haga clic en **Agregar Producto**.
2. Seleccione un producto del inventario.
3. Establezca la cantidad y precio unitario.
4. El stock se **decrementa automáticamente**.
5. El total de la orden se recalcula.

#### Adjuntar Fotos

1. Haga clic en **Agregar Foto**.
2. Suba una imagen JPG/JPEG (máximo 5 MB).
3. Agregue una descripción opcional.
4. Las fotos se almacenan en el directorio `orders/{orderId}/`.

> Las fotos pueden usarse para documentar la condición del vehículo antes, durante y después de la reparación.

#### Generar Factura

Haga clic en el botón **Factura** para ver una factura imprimible de la orden, mostrando todos los servicios, repuestos, productos y totales.

### 8.4 Remover Ítems

Cuando remueve un repuesto o producto de una orden:

- El **stock se restaura automáticamente**.
- El **total de la orden se recalcula**.

---

## 9. Pagos

### 9.1 Registrar un Pago

1. Navegue a **Pagos** y haga clic en **Agregar Pago**.
2. Complete:
   - **Cliente** (opcional)
   - **Órdenes de Reparación** — seleccione una o más órdenes a pagar
   - **Monto** — monto total del pago
   - **Método de Pago** — Efectivo, Tarjeta de Crédito, Tarjeta de Débito, Transferencia, Cheque u Otro
   - **Número de Referencia** (opcional) — ID de transacción
   - **Moneda** — moneda del pago
   - **Notas** (opcional)
3. Haga clic en **Guardar**.

### 9.2 Pagos Multi-Moneda

Si el pago se realiza en una moneda diferente a la predeterminada del taller:

- El sistema convierte automáticamente el monto usando el tipo de cambio configurado.
- Se almacenan tanto el **monto/moneda original** como el **monto convertido**.

### 9.3 Pagos Multi-Orden

Un solo pago puede distribuirse entre múltiples órdenes de reparación. El sistema distribuye automáticamente el monto de manera equitativa entre las órdenes seleccionadas.

### 9.4 Ver Pagos

- Desde la lista de **Pagos**, vea todos los pagos registrados.
- Desde el detalle de una **Orden de Reparación**, vea los pagos vinculados a esa orden específica.
- El **Total Pagado** se rastrea por orden.

### 9.5 Factura de Pago

Haga clic en el botón **Factura** en un pago para generar un recibo imprimible.

---

## 10. Monedas

Navegue a **Monedas** para administrar el sistema multi-moneda.

### 10.1 Moneda Predeterminada

Una moneda debe establecerse como **predeterminada**. Esta es la moneda base para todos los cálculos. No se puede eliminar.

### 10.2 Tipos de Cambio

Establezca tipos de cambio relativos a la moneda predeterminada. Por ejemplo, si su moneda predeterminada es el Colón Costarricense (CRC):

| Moneda | Tasa  | Significado           |
| ------ | ----- | --------------------- |
| CRC    | 1.0   | Predeterminada (base) |
| USD    | 459.0 | 1 USD = 459 CRC       |
| EUR    | 503.0 | 1 EUR = 503 CRC       |

### 10.3 Agregar una Moneda

1. Haga clic en **Agregar Moneda**.
2. Ingrese: Código (3 letras), Nombre, Símbolo, Tipo de Cambio, Estado activo.
3. Haga clic en **Guardar**.

---

## 11. Gestión de Usuarios

> Disponible solo para roles **Admin** y **Super Admin**.

### 11.1 Crear un Usuario

1. Navegue a **Usuarios** y haga clic en **Agregar Usuario**.
2. Complete:
   - **Nombre de Usuario** (requerido, único)
   - **Contraseña** (requerido)
   - **Nombre Completo** (requerido)
   - **Email** (requerido)
   - **Rol** — Admin, Supervisor o Mecánico
   - **Activo** — habilitar/deshabilitar la cuenta
3. Haga clic en **Guardar**.

### 11.2 Editar un Usuario

- Puede actualizar cualquier campo. La contraseña solo se cambia si ingresa una nueva.
- **No puede eliminar su propia cuenta**.

### 11.3 Descripción de Roles

| Rol         | Acceso                                                      |
| ----------- | ----------------------------------------------------------- |
| Super Admin | Acceso total, gestión de suscripción, ve todos los usuarios |
| Admin       | Acceso total, no puede ver cuentas de super-admin           |
| Supervisor  | Clientes, vehículos, inventario, mecánicos, órdenes, pagos  |
| Mecánico    | Solo sus propias órdenes de reparación asignadas            |

---

## 12. Configuración

> Disponible solo para roles **Admin** y **Super Admin**.

Navegue a **Configuración** para configurar la marca e información de su taller.

| Configuración    | Descripción                                       |
| ---------------- | ------------------------------------------------- |
| Nombre de la App | Nombre de su taller (se muestra en encabezado)    |
| Logo             | Suba un logo (PNG, JPG, SVG, ICO, WebP; máx 2 MB) |
| Favicon          | Suba un favicon para la pestaña del navegador     |
| Dirección        | Dirección del taller                              |
| Teléfono         | Número de contacto                                |
| WhatsApp         | Número de contacto de WhatsApp                    |
| Email            | Correo electrónico de contacto                    |

### Limpieza de Fotos

Configure la limpieza automática de fotos antiguas de órdenes de reparación:

- **Días de Limpieza** — eliminar fotos con más de esta cantidad de días (0 = deshabilitado).
- Ejecute la limpieza manualmente desde la página de configuración.

---

## 13. Suscripción

MechanicApp utiliza un modelo de suscripción. Cuando la suscripción expira, todo el acceso a la API se bloquea excepto inicio de sesión, configuración y gestión de suscripción.

### Para Administradores

- Verifique el estado de la suscripción desde la página de **Suscripción**.
- Renueve a través del enlace de pago de Stripe configurado.
- El **Super Admin** puede activar manualmente una suscripción.

### Estados de Suscripción

| Estado    | Significado                                 |
| --------- | ------------------------------------------- |
| Activa    | Acceso completo a todas las funcionalidades |
| Inactiva  | Acceso bloqueado, se requiere renovación    |
| Cancelada | La suscripción fue cancelada                |
| Expirada  | El período de suscripción ha terminado      |

---

## 14. Roles y Permisos

### Matriz de Permisos

| Funcionalidad          | Admin | Supervisor |  Mecánico   |
| ---------------------- | :---: | :--------: | :---------: |
| Dashboard              |  ✅   |     ✅     | ✅ (propio) |
| Clientes               |  ✅   |     ✅     |     ❌      |
| Vehículos              |  ✅   |     ✅     |     ❌      |
| Marcas/Modelos         |  ✅   |     ✅     |     ❌      |
| Mecánicos              |  ✅   |     ✅     |     ❌      |
| Inventario (todo)      |  ✅   |     ✅     |     ❌      |
| Órdenes de Reparación  |  ✅   |     ✅     | ✅ (propio) |
| Pagos                  |  ✅   |     ✅     |     ❌      |
| Monedas                |  ✅   |     ❌     |     ❌      |
| Usuarios               |  ✅   |     ✅     |     ❌      |
| Configuración          |  ✅   |     ❌     |     ❌      |
| Gestión de Suscripción |  ✅   |     ❌     |     ❌      |

---

## Consejos Rápidos

- **Búsqueda y filtros** están disponibles en la mayoría de las páginas de listados.
- Las **páginas de factura** son amigables para impresión — use la función de Imprimir de su navegador (Ctrl+P / Cmd+P).
- **Alertas de stock** — Monitoree la columna de Stock Mínimo en Repuestos y Productos para evitar quedarse sin existencias.
- El campo **VIN** es único — dos vehículos no pueden tener el mismo VIN.
- Siempre **complete o cancele** las órdenes antiguas para mantener las métricas de su dashboard precisas.

---

_MechanicApp — Gestión de Talleres Simplificada._

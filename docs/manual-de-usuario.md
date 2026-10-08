# Manual de usuario — Clínica Alex

Sistema de gestión de agenda, pacientes, pagos y liquidación diaria de
The Prevention Therapy Center.

> **Borrador para revisión.** Este manual describe cómo funciona la
> aplicación hoy. Está escrito en español y por rol: busque la parte que
> corresponde a su usuario.

## Índice

1. [Qué es y quién usa qué](#1-qué-es-y-quién-usa-qué)
2. [Ingresar al sistema](#2-ingresar-al-sistema)
3. [Conceptos básicos](#3-conceptos-básicos)
4. [Guía para la secretaria](#4-guía-para-la-secretaria)
5. [Guía para el administrador](#5-guía-para-el-administrador)
6. [Guía para el profesional](#6-guía-para-el-profesional)
7. [Preguntas frecuentes y problemas comunes](#7-preguntas-frecuentes-y-problemas-comunes)

---

## 1. Qué es y quién usa qué

La aplicación reemplaza el cuaderno de agenda de la clínica. Se abre desde
el navegador (computadora o celular) y todo lo que antes se anotaba a mano
—turnos, asistencia, pagos, bloqueos de horario— se registra ahí, con el
cálculo automático de la liquidación de cada profesional.

Hay tres tipos de usuario, y cada uno ve cosas distintas:

| Rol | Qué puede hacer |
|---|---|
| **Secretaria** | Todo el trabajo del día a día: agenda, profesionales, pacientes, pacientes fijos, lista de espera, pagos, liquidación y reporte mensual. También puede crear cuentas de **profesional**. |
| **Administrador** | Todo lo de la secretaria, más: crear y bloquear usuarios, configuración, historial de acciones y exportar datos. |
| **Profesional** | Solo mira su propia agenda y su propia liquidación. No puede modificar nada. |

Menú lateral según el rol:

- **Secretaria:** Agenda · Profesionales · Pacientes · Pacientes fijos · Lista de espera · Pagos · Liquidación · Reporte mensual · Usuarios
- **Administrador:** lo anterior + Historial de acciones · Exportar datos · Configuración
- **Profesional:** Mi Agenda · Mi Liquidación

En el celular el menú aparece como una barra en la parte de arriba.

---

## 2. Ingresar al sistema

1. Escriba su **Usuario** y su **Contraseña**.
2. Presione **Ingresar**.

Para salir, use **Salir** (abajo en el menú lateral; en el celular, a la
derecha de la barra superior).

### Si olvidó su contraseña

1. En la pantalla de ingreso presione **¿Olvidó su contraseña?**
2. Escriba su **Usuario** y presione **Enviar e-mail de recuperación**.
3. Revise el correo asociado a su cuenta (mire también la carpeta de spam) y
   siga el enlace para crear una contraseña nueva.

Por seguridad, el sistema muestra siempre el mismo mensaje, exista o no el
usuario escrito.

### Mensajes de error al ingresar

| Mensaje | Qué significa |
|---|---|
| *Usuario o contraseña inválidos* | Algún dato está mal escrito. Revise mayúsculas y minúsculas del usuario. |
| *El usuario no tiene una cuenta registrada en el sistema* | La cuenta existe pero no fue configurada. Avise al administrador. |
| *Usuario deshabilitado* | Su acceso fue bloqueado. Consulte con el administrador. |

---

## 3. Conceptos básicos

### Sesión (turno)
Cada turno agendado es una **sesión**. Dura **60 minutos** por defecto; también
se puede registrar una **sesión doble de 120 minutos**. El sistema no deja
agendar dos sesiones que se pisen en el mismo profesional.

Una sesión puede empezar a **cualquier hora**, en múltiplos de 5 minutos
(por ejemplo 08:00, 08:30 o 09:15). La grilla muestra las filas cada 30 minutos,
pero la sesión aparece exactamente desde su hora de inicio.

### Estado de la sesión

| Estado | Cuándo usarlo |
|---|---|
| **Agendado** | El turno está reservado, todavía no ocurrió. Es el estado inicial. |
| **Asistió** | El paciente vino. **Solo estas sesiones cuentan para la liquidación.** |
| **Canceló — avisó** | El paciente avisó con anticipación que no viene. **Libera el horario.** |
| **No asistió — sin aviso** | El paciente faltó y no avisó. **Libera el horario.** |

Las sesiones *Canceló* y *No asistió* **dejan el horario libre** para agendar a
otro paciente, y su registro **se conserva** en el historial del paciente.

### Forma de pago

**Efectivo**, **Transferencia**, **Cheque** o **Pendiente** (el paciente todavía
no pagó). Se registra junto con el **monto en Gs**.

Algo clave: una sesión **Asistió** con pago **Pendiente** **igual cuenta para la
liquidación del profesional**. Una cosa es la sesión realizada y otra el dinero
cobrado ese día. La deuda del paciente queda registrada y se marca como pagada
después (ver [Pagos pendientes](#pagos)).

### Paciente fijo
Un paciente que viene siempre el mismo día y a la misma hora con el mismo
profesional. Se registra **una vez** y el sistema crea el turno solo cada semana.

### Bloqueo
Un horario que **no se puede usar** para un profesional (almuerzo, retiro
anticipado, ausencia temporal, etc.).

### Reemplazo
Cuando un profesional falta un día y otro lo cubre. Afecta **solo a ese día**; no
cambia el horario habitual de nadie.

### Guaraníes
Todos los montos están en **Gs** (guaraníes). Escriba solo números, sin puntos
(por ejemplo `200000`).

---

## 4. Guía para la secretaria

### Agenda

Es la pantalla principal. Muestra **un día**, con una columna por cada
profesional que trabaja ese día de la semana, y filas cada 30 minutos.

**Moverse entre días:** **← Anterior**, **Hoy**, **Siguiente →**. El título de
arriba muestra la fecha que está mirando.

**Cómo leer la grilla:**

- **Disponible** — horario libre; haga clic para agendar. Si en ese horario hubo
  una sesión cancelada o una falta sin aviso, debajo de *Disponible* aparece una
  línea chica con el estado y el nombre (por ejemplo *Canceló — avisó: Julio
  Medina*), y un botón **✎** para editar ese registro.
- **Casilla con el nombre del paciente** — sesión agendada. El color indica el
  estado (verde: asistió; tono neutro: agendado; amarillo: canceló; rojo: no asistió).
- **Bloqueado** — horario bloqueado (se muestra el motivo si lo hay).
- **Casilla rayada/gris** — fuera del horario de ese profesional.
- *"· reemplazo de …"* en una sesión — la atiende un profesional distinto del habitual.

#### Agendar una sesión

1. Haga clic en una casilla **Disponible**.
2. Escriba el nombre del **Paciente** y elíjalo de la lista que aparece. Si el
   paciente no existe todavía, créelo antes en **Pacientes**.
3. Revise el **Horario** y la **Duración** (60 o 120 min).
4. Deje el **Estado** en *Agendado*.
5. Presione **Guardar**.

Si el horario choca con otra sesión o con un bloqueo, el sistema avisa y no guarda.

Si hay gente en la **lista de espera** que encaja con ese profesional, día y
horario, aparece arriba la sección **De la lista de espera** con botones para
elegirla en un clic (ver [Lista de espera](#lista-de-espera)).

#### Marcar asistencia y registrar el pago

1. Haga clic sobre la sesión.
2. Cambie el **Estado** (*Asistió*, *Canceló — avisó* o *No asistió — sin aviso*).
3. Si el paciente asistió, elija la forma de **Pago** y escriba el **Monto (Gs)**.
   Si todavía no pagó, elija **Pendiente** y deje el monto que debe.
4. Presione **Guardar**.

#### Cancelaciones y faltas

Cuando un paciente **avisa que no viene**, o **falta sin avisar**:

1. Haga clic sobre la sesión.
2. Cambie el **Estado** a **Canceló — avisó** o **No asistió — sin aviso**.
3. Presione **Guardar**.

El horario queda **libre al instante**: en la grilla pasa a mostrarse como
**Disponible**, con una línea chica que recuerda quién canceló. Si otro paciente
toma ese turno, simplemente haga clic en el horario y agéndelo con normalidad.

El registro de la cancelación o de la falta **no se pierde**: queda en el
historial del paciente aunque otro paciente use el horario después. Si el horario
fue ocupado por otra sesión, la cancelada deja de verse en la grilla (pero sigue
en el historial).

Para corregir una sesión cancelada (por ejemplo, el paciente finalmente vino),
haga clic en el botón **✎** de la casilla *Disponible* y cambie el estado. Si el
horario ya fue ocupado por otro paciente, la sesión cancelada ya no se ve en la
grilla y no se puede reactivar desde ahí.

#### Eliminar una sesión por error

Haga clic sobre la sesión → **Eliminar** → confirme. El horario queda disponible y
la sesión **desaparece también del historial del paciente**. Úselo solo cuando la
sesión se cargó por error; para una cancelación real, use el estado *Canceló —
avisó*.

#### Bloquear un horario

1. Presione **+ Bloquear horario** (arriba a la derecha).
2. Elija el **Profesional**, el **Inicio** y el **Fin**, y opcionalmente un **Motivo**
   (por ejemplo *Almuerzo* o *Retiro*).
3. Presione **Bloquear**.

El sistema **no deja bloquear** un horario donde ya hay una sesión agendada o
realizada: primero cancele, elimine o transfiera esa sesión. Las sesiones
canceladas no molestan.

Para **quitar un bloqueo**, haga clic sobre la casilla *Bloqueado* y confirme.

#### Cuando un profesional falta (reemplazo)

1. Presione **+ Profesional ausente**.
2. Elija **Quién va a faltar**, el **Motivo** (opcional) y, si alguien lo cubre, el
   **Reemplazo**.
3. Presione **Confirmar ausencia**.

Qué pasa después:

- La columna del profesional ausente **desaparece** de la grilla ese día.
- Si eligió un reemplazo, aparece su columna usando el horario del ausente.
- Arriba aparece un **aviso** con cada paciente que estaba agendado con el
  ausente (las sesiones ya canceladas no aparecen). **Para cada uno decida por separado:**
  - **Transferir** a un profesional (puede ser el reemplazo u otro).
  - **Cancelar sesión.**
  - Dejarlo en *— mantener pendiente —* si todavía no se decidió (por ejemplo,
    el paciente prefiere esperar a que el profesional vuelva).
- **Deshacer ausencia** vuelve todo a la normalidad, pero **no mueve de vuelta**
  a los pacientes que ya fueron transferidos.

Las sesiones transferidas muestran *"reemplazo de …"* y el sistema guarda quién
era el profesional habitual y quién atendió de verdad (importante para la
liquidación).

#### Imprimir la agenda del día

Presione **🖶 Imprimir**. Se abre la ventana de impresión del navegador, con la
agenda en hoja horizontal y sin los menús. Para obtener un PDF, elija
**Guardar como PDF** como impresora.

#### Pacientes fijos en la agenda

Al abrir un día, el sistema **crea solo** los turnos de los pacientes fijos que
corresponden a ese día de la semana. No se duplican si vuelve a abrir el mismo
día, y no se crea el turno si el horario ya está ocupado por otra cosa.

---

### Profesionales

Aquí se cargan los profesionales de la clínica, su horario semanal y los valores
que usa la liquidación.

**Crear un profesional:** **+ Nuevo profesional** y complete:

- **Nombre**.
- **Activo** (desmarque si ya no trabaja; deja de aparecer en la agenda).
- **Valor por sesión (Gs)** — lo que se cobra por cada hora.
- **Costo de sala/día (Gs)** — lo que se descuenta por usar la sala ese día.
- **Tasa por sesión (Gs)** — la tasa que se descuenta por cada sesión.
- **Horario semanal habitual** — marque los días que trabaja y escriba hora de
  inicio, hora de fin y **Sala** de cada día.

Al lado de cada día aparece un indicador como **7/8 salas**: cuántos
profesionales activos ya trabajan ese día contra el límite configurado. Si pasa
del límite se pone **rojo**, pero igual puede guardar (es solo un aviso).

Con los botones de la lista puede **Editar** o **Eliminar**. Eliminar un
profesional **no borra** las sesiones ya registradas.

### Pacientes

Cada paciente tiene una ficha permanente. Use el buscador (por nombre o
teléfono) para encontrarlo.

**Crear un paciente:** **+ Nuevo paciente** y complete:

- **Nombre completo** y **Teléfono**.
- **Perfiles de facturación** — nombre o razón social y **RUC** para la factura.
  El paciente y quien paga la factura pueden ser personas distintas, y se puede
  cargar **más de un perfil**. Marque uno como **Predeterminado**.
- **Observaciones**.

Botones de cada paciente:

- **Historial** — todas sus sesiones, de cualquier fecha: cuántas fueron en
  total, cuántas realizadas, con profesional, estado y pago. Si hay pagos
  pendientes, ahí mismo puede marcarlos como pagados.
- **Editar** y **Eliminar** (eliminar la ficha no borra sus sesiones).

### Pacientes fijos

Para quien viene siempre el mismo día y hora.

**Crear un paciente fijo:** **+ Nuevo paciente fijo**, elija el **Paciente**, el
**Día de la semana**, el **Horario**, el **Profesional** y la fecha en que
**Empieza**. La lista de profesionales muestra **solo los que trabajan ese día y
a esa hora**; si no hay ninguno, el sistema lo avisa.

**Cambios de un solo día (excepciones):** si el profesional habitual no está o el
paciente no puede venir una semana, **no modifique la regla**. Use **+ Excepción**
y elija la fecha y qué pasa ese día:

- **No viene** (no se crea sesión ese día).
- **Atiende con otro profesional.**
- **Cambia de horario.**

A la semana siguiente todo vuelve solo a la regla habitual. Las excepciones se ven
y se pueden quitar desde el enlace **“N excepción(es)”** de la fila.

**Cuando el paciente deja de venir:** presione **Finalizar** (queda con la fecha
de cierre; el historial no se pierde). **Reactivar** lo vuelve a activar.
**Eliminar** borra la regla por completo (no se puede deshacer; use **Finalizar**
salvo que la regla se haya cargado por error).

### Lista de espera

Para registrar a quien no consiguió horario. **No reserva ningún turno**: solo
guarda su interés.

**Agregar:** **+ Agregar a la lista** → paciente, **Preferencia de horario**
(*Mañana*, *Tarde* —desde las 12:00— o *Cualquier horario*), **Profesional
preferido** y **Días preferidos** (si no marca ninguno, sirve cualquier día), más
una observación.

**Usarla:** cuando se libera un horario y agenda una sesión nueva en la
[Agenda](#agenda), el sistema le sugiere a quienes encajan. Elija a la persona,
guarde la sesión y esa entrada pasa sola a **Convertido en sesión**.

También puede **Descartar** una entrada (se puede **Reactivar** después) o
**Eliminar**.

### Pagos

La sección **Pagos** muestra **todos los pagos pendientes de cualquier fecha**,
con el total adeudado.

Para cobrar uno: elija la forma de pago (*Efectivo*, *Transferencia* o *Cheque*),
confirme el monto y presione **Marcar pagado**. Desaparece de la lista.

### Liquidación

Calcula lo que le corresponde recibir a cada profesional por día. Navegue con
**← Anterior / Hoy / Siguiente →**.

Solo aparecen los profesionales con **al menos una sesión *Asistió*** ese día.
La cuenta es:

```
sesiones realizadas  ×  valor por sesión       = bruto
− costo de sala
− (sesiones × tasa por sesión)
− ajustes manuales                              = a recibir
```

Una **sesión doble de 120 min cuenta como 2 sesiones**. La liquidación es de
quien **realmente atendió** (si hubo reemplazo, es del reemplazo).

**Ajustes manuales** (almuerzo, deuda con la oficina, etc.): botón **Ajustes** →
escriba el **Concepto** y el **Monto** → **+ Agregar ajuste** → **Guardar ajustes**.
Se descuentan del total.

**Cerrar:**

- **Cerrar** (en la fila) cierra a un profesional.
- **Cerrar liquidación del día** cierra a todos de una vez.

Mientras está **Abierta**, los números se recalculan solos (si corrige una
asistencia, el valor cambia). Al **Cerrar**, los valores **quedan fijos**: aunque
después se edite la agenda de ese día, la liquidación cerrada no cambia. Si
necesita corregir algo, use **Reabrir**.

### Reporte mensual

Elija el mes. Muestra, por profesional, la suma de todas las liquidaciones
**cerradas** de ese mes (sesiones, bruto, sala, tasas, ajustes y a recibir) y el
total del mes.

Si algún día del mes todavía tiene la liquidación **abierta**, un aviso amarillo
lo indica y ese día **no entra en la suma**: el total no es definitivo hasta que
se cierren todos.

### Crear la cuenta de un profesional (Usuarios)

Para que un profesional pueda ver su agenda y su liquidación, necesita su propia
cuenta. **Primero debe estar cargado en Profesionales.** Luego:

1. Entre a **Usuarios**.
2. Complete **Usuario** (lo que va a escribir para ingresar), **E-mail** (a donde
   le llegará la recuperación de contraseña) y **Contraseña inicial** (mínimo 6
   caracteres).
3. En **Vincular al profesional**, elija a cuál profesional corresponde.
4. Presione **Crear usuario**.

Entregue al profesional su usuario y su contraseña inicial. La secretaria solo
puede crear cuentas de profesional; no ve la lista de otros usuarios.

---

## 5. Guía para el administrador

El administrador hace todo lo descrito en la guía de la secretaria, y además lo
siguiente.

### Usuarios

Muestra la lista de todas las cuentas, con su rol y estado.

**Crear un usuario:** **+ Nuevo usuario**, con los mismos datos de arriba, más el
**Rol**: *Administrador*, *Secretaria* o *Profesional* (si es profesional, hay que
vincularlo a un profesional cargado).

**Bloquear / Desbloquear:** quita o devuelve el acceso de una persona **al
instante**, aunque tenga la sesión abierta. Es lo que corresponde, por ejemplo,
cuando una secretaria deja de trabajar en la clínica.

**Eliminar:** quita el acceso de la persona al sistema.

> Eliminar un usuario **quita su acceso**, pero el registro de la cuenta en el
> servicio de autenticación (Firebase) sigue existiendo. Eso no le da acceso a
> nada, y lo puede limpiar el programador si hace falta.

No puede bloquear ni eliminar **su propia** cuenta.

### Configuración

Define **cuántas salas** hay disponibles en cada día de la semana. Por defecto:
8, y 9 los miércoles. Es un **límite de referencia**: sirve para que, al cargar
el horario de un profesional, aparezca el aviso de cuántas salas hay ocupadas, pero
no impide guardar si se pasa. Al lado de cada día se ve cuántos profesionales
están programados.

### Historial de acciones

Registro de **quién hizo qué y cuándo**. Muestra las últimas 300 acciones, con
filtro por tipo (*Sesiones*, *Pagos*, *Liquidaciones*, *Usuarios*,
*Exportaciones*) y buscador por usuario o texto. Ejemplos de lo que anota:

- *Creó la sesión de Juan Medina con Alicia (08:00, 25/08/2026)*
- *Cerró la liquidación de Alicia (25/08/2026): 8 sesión(es), a recibir 676.000 Gs*
- *Bloqueó al usuario Sec1*

Se registra: crear, editar y eliminar sesiones (también las generadas
automáticamente de pacientes fijos); marcar pagos como pagados; ajustes, cierre y
reapertura de liquidaciones; crear, bloquear, desbloquear y eliminar usuarios; y
las exportaciones de datos.

> Este registro lo genera la propia aplicación. Sirve para aclarar dudas del día
> a día entre secretaria y administración. No registra, por ejemplo, la edición de
> fichas de pacientes o profesionales.

### Exportar datos

Descarga archivos **CSV** para abrir en Excel, útiles como respaldo y para
análisis propios (por ejemplo, el total facturado en el año):

- **Pacientes** — lista completa con teléfono y datos de facturación.
- **Sesiones** — de un período (**Desde / Hasta**).
- **Liquidaciones** — de un período; solo las ya **cerradas**.

Los montos salen como números enteros para poder sumarlos directamente. Cada
exportación queda anotada en el Historial de acciones.

---

## 6. Guía para el profesional

Al ingresar verá un menú con solo dos opciones. Todo es de **solo lectura**: no
puede modificar nada y no ve información de otros profesionales ni de la lista de
pacientes.

### Mi Agenda

Muestra sus sesiones del día: **horario, paciente, estado y forma de pago**.
Cambie de día con **← Anterior**, **Hoy** y **Siguiente →**.

### Mi Liquidación

Muestra su liquidación del día: sesiones, bruto, descuentos (sala, tasas y
ajustes) y **A recibir**. **Solo se muestra cuando la secretaria ya la cerró**, porque
recién ahí los valores son definitivos.

Mientras la liquidación está abierta, aparece el aviso *“La liquidación de este
día todavía está abierta”*.

Si aparece *“Liquidación todavía no disponible para este día”*, significa que la
secretaria aún no la trabajó. Consulte con ella.

---

## 7. Preguntas frecuentes y problemas comunes

**No encuentro a un paciente al agendar.**
Probablemente todavía no está cargado. Créelo en **Pacientes** y vuelva a la
agenda.

**El sistema dice que el horario tiene conflicto.**
Ya existe una sesión (agendada o realizada) o un bloqueo en ese rango. Mire la
grilla. Las sesiones canceladas o con falta sin aviso **no** generan conflicto (ver
[Cancelaciones y faltas](#cancelaciones-y-faltas)).

**No puedo bloquear un horario.**
Hay una sesión agendada o realizada ahí. Cancélela (cambiando su estado),
transfiérala o, si fue un error, elimínela primero.

**Un profesional no aparece en la agenda de hoy.**
Revise que esté **Activo**, que tenga ese día marcado en su **Horario semanal
habitual** (en *Profesionales*) y que no haya sido marcado como ausente hoy.

**Un paciente fijo no aparece en la agenda.**
El turno se crea al abrir ese día. No se crea si el horario ya estaba ocupado,
si hay una excepción *No viene* para esa fecha, o si la regla está **Finalizada**.

**La liquidación de un profesional no aparece.**
Solo aparecen los que tienen al menos una sesión en estado **Asistió** ese día.

**Corregí una asistencia y la liquidación no cambió.**
Si la liquidación ya está **Cerrada**, sus valores quedan fijos. Presione
**Reabrir**, y vuelva a **Cerrar** después.

**Escribí un monto y salió mal.**
Escriba solo números, sin puntos ni comas (por ejemplo `150000`).

**Se me bloqueó la pantalla o se ve rara en el celular.**
Pruebe recargar la página. En el celular, las tablas se desplazan hacia el
costado con el dedo.

**¿Quién ve mis datos?**
Cada rol ve solo lo que le corresponde (ver la tabla del [apartado 1](#1-qué-es-y-quién-usa-qué)).
Los profesionales solo ven su propia agenda y liquidación.

/**
 * 4ESO English Lab – registro de actividad del alumnado.
 * Pega este código en tu hoja de cálculo: Extensiones → Apps Script.
 * Después: Implementar → Nueva implementación → Aplicación web
 *   - Ejecutar como: Yo
 *   - Quién tiene acceso: Cualquier usuario
 * Copia la URL que termina en /exec y pégala en site/js/config.js (sheetUrl).
 */

var HOJA = 'Registro';
var CABECERA = ['Fecha', 'Alumno/a', 'Clase', 'Actividad', 'Unidad', 'Detalle', 'Nivel', 'Nota (%)', 'Aciertos', 'XP total'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var datos = JSON.parse(e.postData.contents);
    var filas = (datos.rows || []).slice(0, 50).map(function (r) {
      return [
        r.time ? new Date(r.time) : new Date(),
        limpiar(r.student), limpiar(r.group), limpiar(r.activity), limpiar(r.unit),
        limpiar(r.detail), limpiar(r.level),
        r.score === '' || r.score == null ? '' : Number(r.score),
        limpiar(r.correct), r.xp == null ? '' : Number(r.xp)
      ];
    });
    if (filas.length) {
      var hoja = obtenerHoja();
      hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, CABECERA.length).setValues(filas);
    }
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  } finally {
    lock.releaseLock();
  }
}

// Para comprobar que la URL funciona: ábrela en el navegador.
function doGet() {
  return ContentService.createTextOutput('El registro de 4ESO English Lab está funcionando.');
}

function obtenerHoja() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(HOJA);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA, 0);
    hoja.appendRow(CABECERA);
    hoja.getRange(1, 1, 1, CABECERA.length).setFontWeight('bold').setBackground('#1c2a3a').setFontColor('#ffffff');
    hoja.setFrozenRows(1);
    hoja.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
    hoja.setColumnWidth(2, 180); hoja.setColumnWidth(5, 180); hoja.setColumnWidth(6, 280);
  }
  return hoja;
}

// Evita que un texto escrito por un alumno se interprete como fórmula.
function limpiar(v) {
  var s = String(v == null ? '' : v).slice(0, 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

// Menú en la hoja para crear la pestaña de resumen por alumno.
function onOpen() {
  SpreadsheetApp.getUi().createMenu('4ESO English Lab')
    .addItem('Crear / actualizar resumen por alumno', 'crearResumen')
    .addToUi();
}

function crearResumen() {
  obtenerHoja();
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName('Resumen') || libro.insertSheet('Resumen');
  hoja.clear();
  hoja.getRange('A1').setFormula(
    "=QUERY(Registro!A:J,\"select C, B, count(D), avg(H), max(J), max(A) where B is not null " +
    "group by C, B order by C, B label count(D) 'Actividades', avg(H) 'Nota media (%)', max(J) 'XP', max(A) 'Última actividad'\",1)"
  );
  hoja.getRange('F:F').setNumberFormat('dd/mm/yyyy hh:mm');
  hoja.getRange('D:D').setNumberFormat('0');
  hoja.getRange(1, 1, 1, 6).setFontWeight('bold');
  hoja.setFrozenRows(1);
  SpreadsheetApp.getUi().alert('Resumen creado. Se actualiza solo cuando llegan nuevas actividades.');
}

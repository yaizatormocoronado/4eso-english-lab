# Cómo recibir el registro del alumnado en Google Sheets

Lo montas una sola vez (unos 10 minutos). Usa preferiblemente la **cuenta de Google del colegio**.

## 1. Crea la hoja

1. Ve a [sheets.new](https://sheets.new) y crea una hoja nueva. Llámala, por ejemplo, **Registro 4ESO English Lab**.

## 2. Pega el script

1. En la hoja: **Extensiones → Apps Script**.
2. Borra lo que aparece y pega todo el contenido del archivo `Codigo.gs` (está en esta misma carpeta).
3. Pulsa el icono de **Guardar** (disquete).
4. **Importante:** comprueba que arriba, en el desplegable de funciones, aparecen `doPost`, `doGet`, `crearResumen`… Si solo aparece `myFunction`, el código no se ha pegado o no se ha guardado.

## 3. Publícalo como aplicación web

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. En el engranaje de "Seleccionar tipo", elige **Aplicación web**.
3. Rellena:
   - **Ejecutar como:** Yo (tu cuenta)
   - **Quién tiene acceso:** Cualquier usuario
4. Pulsa **Implementar**. Google te pedirá permiso para que el script use tu hoja: pulsa **Autorizar acceso**, elige tu cuenta y acepta. (Si aparece "Google no ha verificado esta aplicación", pulsa *Configuración avanzada → Ir a … (no seguro)*: es tu propio script).
5. Copia la **URL de la aplicación web** (termina en `/exec`).

Para comprobarla, pégala en el navegador: debe aparecer *"El registro de 4ESO English Lab está funcionando."*

> **Si aparece "Función de script no encontrada: doGet"**: la implementación se hizo antes de guardar el código. Guarda el script (disquete) y ve a **Implementar → Gestionar implementaciones → ✏️ Editar → Versión: Nueva versión → Implementar**. La URL no cambia.

## 4. Conecta la web

1. Abre el archivo `site/js/config.js`.
2. Pega la URL entre las comillas de `sheetUrl`:

   ```js
   sheetUrl: "https://script.google.com/macros/s/XXXXXXXX/exec",
   ```

3. Las clases que puede elegir el alumnado son 4ºA, 4ºB y 4ºC (`classes`). Cámbialas ahí si algún año son otras.
4. Vuelve a subir la carpeta `site` a tu alojamiento (Netlify, GitHub Pages…).

## Qué verás en la hoja

Cada fila es una actividad terminada:

| Fecha | Alumno/a | Clase | Actividad | Unidad | Detalle | Nivel | Nota (%) | Aciertos | XP total |
|---|---|---|---|---|---|---|---|---|---|

Actividades que se registran:

- **Sign in**: el alumno entra por primera vez (nombre y apellidos + clase) o cambia sus datos.
- **Grammar exercise**: tema gramatical, nivel, nota y aciertos.
- **Vocabulary practice**: grupo de palabras, nota y cuántas palabras de la unidad domina ya.
- **Presentation**: ha visto una presentación hasta la última diapositiva.
- **Worksheet download**: ha descargado una ficha en PDF.

Al recargar la hoja verás un menú nuevo, **4ESO English Lab → Crear / actualizar resumen por alumno**. Crea una pestaña **Resumen** con, para cada alumno: clase, número de actividades, nota media, XP y fecha de la última actividad. Se actualiza sola.

## Bueno saber

- Si un alumno no tiene internet en ese momento, sus resultados se guardan en su navegador y se envían en cuanto vuelve a conectarse.
- No hay contraseñas: un alumno podría escribir el nombre de otro. Para seguimiento de clase suele bastar.
- Si cambias el código del script, tienes que hacer **Implementar → Gestionar implementaciones → Editar → Nueva versión** para que se aplique (la URL no cambia).
- Protección de datos: solo se guardan nombre y apellidos, clase y resultados. Es recomendable informar al alumnado y a las familias, y usar la cuenta del centro.

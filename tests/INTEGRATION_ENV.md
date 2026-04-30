Guía rápida: configurar variables de entorno seguras para tests de integración

Objetivo
- Proveer `TEST_USER_TOKEN`, `TEST_USER_ID` y `TEST_ALLOW_PAYMENTS` para ejecutar tests de integración reales sin guardar secretos en el repositorio.

Métodos recomendados (seguro y sin subir nada)

1) Variable de sesión (recomendado)
- Abre una terminal y usa el script correspondiente:
  - PowerShell (dot-source):

```powershell
. .\scripts\set-test-env.ps1
```
  - Bash (source):

```bash
source ./scripts/set-test-env.sh
```

- Los scripts pedirán el token (oculto), el user id y si permite pagos. Las variables se establecerán sólo en la sesión actual de shell y NO se escriben en disco.

2) Archivo `.env` local y excluirlo localmente (opcional)
- Si prefieres un archivo, crea `./.env.test.local` con las variables:

```
TEST_USER_TOKEN=eyJ...yourtoken...
TEST_USER_ID=uid123
TEST_ALLOW_PAYMENTS=true
```

- Para evitar subirlo, añade `/.env.test.local` a tu archivo local de exclusiones de git (no trackeado por el repositorio):

```powershell
# agrega la ruta al exclude local (Windows / PowerShell)
Add-Content -Path .git\info\exclude -Value "/.env.test.local"
```

o en bash:

```bash
printf "/.env.test.local\n" >> .git/info/exclude
```

Nota: `git/info/exclude` es local y NO se comparte al remoto.

3) CI / Pipelines
- Para CI, guarda `TEST_USER_TOKEN` como secret del pipeline (GitHub Actions, GitLab, etc.) y pásala a la ejecución de tests.

Comandos útiles

PowerShell - temporales y ejecutar integraciones:

```powershell
. .\scripts\set-test-env.ps1
# ahora, en la misma sesión:
npx jest --runInBand tests/integration -i
```

Bash:

```bash
source ./scripts/set-test-env.sh
npx jest --runInBand tests/integration -i
```

Obtener un token desde el backend (ejemplo local)

```powershell
# ejemplo: pedir token al endpoint de login
$resp = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method Post -ContentType 'application/json' -Body '{"email":"test@example.com","password":"password"}'
# revisa $resp para ver dónde está el token (p.ej. $resp.token)
$env:TEST_USER_TOKEN = $resp.token
$env:TEST_USER_ID = $resp.user.uid
```

Buenas prácticas
- Nunca pegues tokens en mensajes públicos ni los subas al repo.
- Usa los scripts interactivos para evitar ficheros con secretos.
- Para borrarlos en la sesión:
  - PowerShell: `Remove-Item Env:\TEST_USER_TOKEN; Remove-Item Env:\TEST_USER_ID; Remove-Item Env:\TEST_ALLOW_PAYMENTS`
  - Bash: `unset TEST_USER_TOKEN TEST_USER_ID TEST_ALLOW_PAYMENTS`

Si quieres, puedo (1) ejecutar las pruebas de integración aquí si me facilitas el `TEST_USER_TOKEN` y `TEST_USER_ID` (no recomendado vía chat), o (2) ejecutarlas localmente si las cargas en tu shell y me dices que proceda.
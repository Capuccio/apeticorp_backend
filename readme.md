# Apeticorp Backend

El Backend de Apeticorp está programando con JavaScript (NodeJs y ExpressJS)

## Instalación

Cuando se descargue el proyecto, deberá entrar a la carpeta y correr el siguiente comando:

```bash
npm install
```

Así el gestor de paquete de Node (npm) comenzará la instalaciónde las dependencias.

## Base de Datos

Hay que crear la Base de Datos en el Gestor ([MariaDB](https://downloads.mariadb.org/) o [MySQL](https://www.mysql.com/downloads/)) con el siguiente código:

```sql
CREATE DATABASE apeticorp;
```

Después importar el archivo _SQL_ con el nombre de **apeticorp.sql** que está dentro del proyecto.

También hay que inicializar el servicio de MongoDB con _mongod.exe_ en caso de estar en Windows, en Linux sería en el Bash:

```bash
sudo systemctl start mongodb
```

## Run

Una vez se hayan instalado las dependencias con _npm install_ podremos hacer funcionar el Backend con el siguiente comando:

```
npm start
```

Ahora el Backend estaría inicializado y funcionando.

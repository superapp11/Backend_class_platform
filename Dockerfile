# Usa la imagen oficial de Node.js como base
FROM node:20.11.0

# Crea un directorio de trabajo
WORKDIR /usr/src/app

# Copia el package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de la aplicación
COPY . .

# Expone el puerto 3050
EXPOSE 3050

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
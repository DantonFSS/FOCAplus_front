# FOCAplus Frontend

Aplicação frontend do FOCAplus, uma plataforma de gestão de estudos e cursos.

## 🚀 Acesso

A aplicação está disponível em produção em: **https://foc-aplus-front.vercel.app/**

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Expo CLI (para desenvolvimento mobile)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd FOCAplus_front
```

2. Instale as dependências:
```bash
npm install
```

## ▶️ Como Executar

### Desenvolvimento Web

```bash
npm start
```

Ou para executar especificamente na web:

```bash
npx expo start --web
```

### Desenvolvimento Mobile

```bash
npx expo start
```

Depois escaneie o QR code com o app Expo Go (Android) ou a câmera (iOS).

## 📱 Plataformas Suportadas

- Web
- iOS
- Android

## 🏗️ Estrutura do Projeto

```
src/
├── api/           # Serviços de API
├── components/    # Componentes reutilizáveis
├── contexts/      # Contextos React (Auth, etc)
├── screens/       # Telas da aplicação
├── theme/          # Configurações de tema
└── utils/          # Funções utilitárias
```

## 🔧 Tecnologias Utilizadas

- React Native
- Expo
- TypeScript
- React Navigation
- Axios

## 📝 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run web` - Executa na web
- `npm run android` - Executa no Android
- `npm run ios` - Executa no iOS

## 🌐 API Backend

A aplicação se conecta ao backend em `http://localhost:8080/api/v1` por padrão. Para produção, configure a variável de ambiente apropriada.

## 📄 Licença

Este projeto é privado e proprietário.


# clinicaAlex

Sistema de gestão para The Prevention Therapy Center: agenda diária,
pacientes, pagamentos, pacientes fixos, reemplazos e liquidação diária.

## Documentação

- [`docs/especificacao-original.pdf`](docs/especificacao-original.pdf) — especificação funcional original.
- [`docs/arquitetura-app-clinica.md`](docs/arquitetura-app-clinica.md) — arquitetura, modelo de dados (Firestore) e roadmap de fases.

## Status

Fase 1 em andamento: modelo de dados no Firestore + CRUD de
Profissionais e Pacientes (com perfis de facturación) implementados.
Ainda falta: Auth/login da secretária e deploy das regras/índices num
projeto Firebase real.

## Stack

React + TypeScript (Vite) + Firebase (Firestore, Auth, Cloud Functions).

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do seu projeto Firebase
npm run dev
```

Para publicar as regras de segurança do Firestore (`firestore.rules`) e
os índices, use o Firebase CLI (`firebase deploy --only firestore`)
depois de rodar `firebase init` apontando para o projeto criado no
Console.

## Estrutura

```
src/
  firebase/        # inicialização do app Firebase (usa .env)
  shared/firestore/ # helpers genéricos de CRUD/subscribe
  types/            # tipos de domínio (Professional, Patient, ...)
  modules/
    professionals/  # listagem + formulário de profissionais
    patients/       # listagem + formulário de pacientes
```

# Arquitetura Hexagonal em TypeScript

API de cadastro e autenticação de usuários usada para exercitar ports & adapters:
o núcleo de negócio não importa Express, Prisma nem `jsonwebtoken`, e a suíte de
testes roda sem banco.

## Rodando

```bash
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"   # JWT_SECRET
npm install
npx prisma migrate deploy
npm run dev
```

Com Docker:

```bash
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))") docker compose up --build
```

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe com recarga automática |
| `npm run build` | Compila para `dist/` |
| `npm start` | Executa o build |
| `npm test` | Roda a suíte |
| `npm run typecheck` | Verifica tipos sem emitir |

## Endpoints

| Método | Rota | Autenticação |
| --- | --- | --- |
| `GET` | `/health` | não |
| `POST` | `/users` | não |
| `GET` | `/users` | Bearer |
| `GET` | `/users?email=` | Bearer |
| `POST` | `/auth/login` | não |

```bash
curl -X POST localhost:3000/users \
  -H 'content-type: application/json' \
  -d '{"name":"Esdras","email":"esdras@example.com","password":"senha-forte-123"}'

TOKEN=$(curl -s -X POST localhost:3000/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"esdras@example.com","password":"senha-forte-123"}' | jq -r .token)

curl localhost:3000/users -H "authorization: Bearer $TOKEN"
```

## Estrutura

```
src/
  core/                     regras de negócio, sem dependência externa
    entities/               UserEntity, Email, PlainPassword
    exceptions/             DomainError e suas especializações
    ports/                  interfaces que o núcleo exige do mundo
    use-cases/              CreateUser, FindAll, FindByEmail, Login
  infrastructure/
    config/                 leitura e validação do ambiente
    adapters/
      api/express/          rotas, controllers, middlewares, apresentação
      database/prisma/      implementação de IUserRepositoryPort
      security/             scrypt e JWT
      system/               relógio e geração de id
  composition/              onde as implementações concretas são escolhidas
  main.ts
tests/
  support/                  repositório em memória e dublês das portas
```

A dependência aponta sempre para dentro. `core/` não conhece ninguém; os
adaptadores conhecem o `core/`; `composition/container.ts` é o único arquivo que
conhece as duas pontas.

## Decisões

**Erro de domínio carrega código, não status HTTP.** `DomainError` expõe
`VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT` ou `UNAUTHORIZED`. A tradução para
400/404/409/401 mora em `protocols/httpErrorMap.ts`, dentro do adaptador. Trocar
HTTP por outro transporte não obriga a mexer em caso de uso.

**Senha tem salt por usuário.** `ScryptPasswordHasher` gera 16 bytes aleatórios
por hash e grava os parâmetros de custo no próprio registro
(`scrypt$N$r$p$salt$hash`), o que permite endurecer o custo depois sem invalidar
as senhas existentes. Hash malformado no banco devolve `false`, não exceção.

**Login não diz qual metade errou.** E-mail inexistente, senha errada e payload
malformado produzem a mesma resposta. Quando o usuário não existe, o verify roda
contra `hashThatNeverMatches()` para o tempo de resposta não denunciar quais
e-mails estão cadastrados.

**Resposta é montada por allowlist.** `userPresenter` escolhe campo a campo o que
sai. Coluna nova no schema não vaza por esquecimento.

**A validação acontece em dois lugares, de propósito.** Zod barra payload
malformado na borda; `Email` e `PlainPassword` garantem as invariantes dentro do
domínio. Quem chama o caso de uso direto, sem passar por HTTP, continua protegido.

**Testes não sobem banco.** Os casos de uso dependem de `IUserRepositoryPort`, e
a suíte injeta `InMemoryUserRepository`. O teste de API sobe o Express de verdade
em porta efêmera com o mesmo repositório em memória.

## Licença

MIT.

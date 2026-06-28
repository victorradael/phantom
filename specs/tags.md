# Implementação de Tags para Links (Offline-First)

## 1. Objetivo Principal
Implementar um sistema de tags para links e um filtro baseado nelas, suportando a arquitetura offline-first (Electron Store) com sincronização para um servidor externo (FastAPI + PostgreSQL). O objetivo é que o usuário possa organizar seus links localmente e não perca/corrompa o estado quando conectar a um servidor de sync.

## 2. Especificações e Regras de Negócio
- **Criação Livre:** As tags são de texto livre (digitadas livremente).
- **Lógica do Filtro (AND):** Se o usuário pesquisar por `javascript` e `tutorial`, retornam apenas links com ambas as tags.
- **Limites:** Máximo de **3 tags por link**.
- **Gerenciamento de Tags:** É preciso ter um CRUD mínimo para as tags, operando localmente e refletindo remotamente no sync.
- **Offline-first:** O aplicativo funciona principalmente offline usando `electron-store`. Portanto, as tags e os filtros devem funcionar perfeitamente sem internet.
- **Sincronização:** Quando configurado um servidor de Sync (Backend), o estado das tags dos links deve ser sincronizado.

## 3. Arquitetura e Estado (Local vs Servidor)

### 3.1. Estado Offline (Local - Electron Store)
Como o Electron Store salva em JSON, podemos adotar duas abordagens:
- **Recomendação para Local:** Armazenar uma lista global de tags no store (ex: chave `tags: [{ id, name }]`) e nos links referenciar por IDs (`tag_ids: [id1, id2]`), ou simplesmente embutir no próprio link `tags: ["nome1", "nome2"]` e extrair as tags únicas sob demanda (já que não teremos autocomplete agora, a segunda é mais simples, mas a primeira permite "gerenciamento"). A spec exige "gerenciamento das tags", então o mais seguro é **normalizar** também localmente:
  - `store.get('tags')` -> Array de objetos tag (ex: `{ uuid, name, updated_at }`).
  - O Link no `store.get('links')` passa a ter um array de `tag_uuids` (limite 3).
- **Filtro Local:** A filtragem acontece no Frontend (React), interceptando a lista de links que vem do `window.api.getLinks()` e aplicando um `Array.filter` com lógica AND comparando os UUIDs de tags do link com as tags ativas do filtro.

### 3.2. Sincronização (Sync)
Ao rodar o Pull/Push de Sync (`/sync`), o payload precisa trafegar as tags.
- Quando o Electron manda o workspace e os links para o `/sync` (Backend), ele deve enviar a estrutura de tags.
- O Backend resolve conflitos através do `updated_at` (ou `lastSynced`).

### 3.3. Servidor Externo (Backend Postgres)
- **Tabelas:**
  - `tags`: `id`, `uuid`, `name`, `workspace_id`, `created_at`, `updated_at`.
  - `link_tags`: `link_uuid`, `tag_uuid` (junção).
- **API (FastAPI):**
  - A rota de `POST /sync` e `PUT /sync/link/{uuid}` precisam aceitar a lista de `tags` (ou `tag_uuids`).
  - O backend se encarrega de ler o payload, dar upsert nas tags na tabela `tags` e refazer a junção na tabela `link_tags`.

## 4. Entradas e Saídas (Sincronização)
- **Payload do Sync de Link (`payload.tags`)**:
  ```json
  {
    "uuid": "...",
    "url": "...",
    "tags": [
      { "uuid": "uuid1", "name": "javascript" },
      { "uuid": "uuid2", "name": "tutorial" }
    ]
  }
  ```
- O Backend processa e salva nas tabelas normalizadas do PostgreSQL.

## 5. Restrições (Anti-objetivos)
- **NÃO** fazer autocompletar no frontend agora.
- **NÃO** passar de 3 tags por link. O formulário deve travar e o `save-links` (local) e `/sync` (remoto) devem rejeitar a operação.
- **NÃO** fazer a persistência depender exclusivamente do Backend. A lógica core de CRUD de tags **deve** ocorrer no `electron-store` via `ipcRenderer` primeiro, e depois replicar pro backend no background/sync.

## 6. Etapas (Step-by-step)

### Etapa 1: Persistência Local (Electron + React)
- Criar a chave `tags` no `electron-store`.
- Atualizar os schemas locais / métodos do `main.js` para suportar criar, editar e excluir tags (`save-tags`, `get-tags`, `delete-tag`).
- Atualizar as operações locais de Link para aceitar uma lista de tags associadas (com limite max 3).

### Etapa 2: Interface e Lógica de Filtragem (React)
- Atualizar o formulário do Link para incluir até 3 tags livres. Se a tag for nova, criar localmente; se já existir, apenas referenciar.
- Implementar o filtro na tela principal com a lógica AND na memória (`Array.prototype.filter` na lista de links do frontend).

### Etapa 3: Preparo do Backend (FastAPI / Postgres)
- Criar migration do Alembic adicionando `tags` e `link_tags`.
- Criar os models SQLAlchemy para tag e a associação.

### Etapa 4: Atualização do Sincronizador
- Alterar os schemas de Sync (Pydantic `LinkSyncData`, `LinkUpdateData`) para aceitar dados das Tags.
- Atualizar os Handlers de `sync-workspace` e `update-synced-link` no `main.js` do Electron para anexar as tags atreladas a cada link quando for disparar o fetch para o backend.
- No Backend, ao receber o payload, processar as tags (Upsert), vincular as tabelas e limpar tags antigas que foram desvinculadas no frontend (Substituição total das tags de um link a cada sync de update).
